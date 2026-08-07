"""Centralized Gemini service. Every LLM call in AgentFlow goes through here."""

from __future__ import annotations

import json
import re
from typing import Any

import httpx

from app.core.config import Settings, get_settings
from app.core.errors import ConfigurationError, LLMUnavailableError
from app.core.logging import get_logger

logger = get_logger(__name__)

_JSON_FENCE = re.compile(r"```(?:json)?\s*(.*?)```", re.DOTALL)


class GeminiService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    @property
    def configured(self) -> bool:
        return self.settings.gemini_configured

    def _require_key(self) -> str:
        key = self.settings.gemini_api_key.strip()
        if not key:
            raise ConfigurationError(
                "GEMINI_API_KEY is not configured. Set it in the backend environment "
                "before running a workflow."
            )
        return key

    async def generate(
        self,
        prompt: str,
        *,
        system: str | None = None,
        temperature: float = 0.3,
        json_mode: bool = False,
    ) -> str:
        key = self._require_key()
        url = (
            f"{self.settings.gemini_base_url}/models/"
            f"{self.settings.gemini_model}:generateContent"
        )
        body: dict[str, Any] = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": temperature},
        }
        if system:
            body["systemInstruction"] = {"parts": [{"text": system}]}
        if json_mode:
            body["generationConfig"]["responseMimeType"] = "application/json"

        try:
            async with httpx.AsyncClient(
                timeout=self.settings.gemini_timeout_seconds
            ) as client:
                resp = await client.post(
                    url, params={"key": key}, json=body,
                    headers={"Content-Type": "application/json"},
                )
        except httpx.HTTPError as exc:
            raise LLMUnavailableError(f"Could not reach the Gemini API: {exc}") from exc

        if resp.status_code == 401 or resp.status_code == 403:
            raise ConfigurationError(
                "Gemini rejected the API key (HTTP "
                f"{resp.status_code}). Check GEMINI_API_KEY."
            )
        if resp.status_code == 429:
            raise LLMUnavailableError(
                "Gemini rate limit reached. Wait a moment and retry."
            )
        if resp.status_code >= 400:
            raise LLMUnavailableError(
                f"Gemini request failed [{resp.status_code}]: {resp.text[:500]}"
            )

        payload = resp.json()
        candidates = payload.get("candidates") or []
        if not candidates:
            feedback = payload.get("promptFeedback", {})
            raise LLMUnavailableError(
                f"Gemini returned no content. Feedback: {json.dumps(feedback)[:300]}"
            )
        parts = candidates[0].get("content", {}).get("parts") or []
        text = "".join(p.get("text", "") for p in parts).strip()
        if not text:
            raise LLMUnavailableError("Gemini returned an empty response.")
        return text

    async def generate_json(
        self,
        prompt: str,
        *,
        system: str | None = None,
        temperature: float = 0.2,
    ) -> Any:
        raw = await self.generate(
            prompt, system=system, temperature=temperature, json_mode=True
        )
        return parse_json(raw)


def parse_json(raw: str) -> Any:
    """Tolerant JSON extraction — models occasionally wrap output in fences."""
    text = raw.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = _JSON_FENCE.search(text)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    start = min(
        (i for i in (text.find("{"), text.find("[")) if i != -1), default=-1
    )
    end = max(text.rfind("}"), text.rfind("]"))
    if start != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            pass
    raise LLMUnavailableError("Gemini returned a response that was not valid JSON.")


_service: GeminiService | None = None


def get_gemini_service() -> GeminiService:
    global _service
    if _service is None:
        _service = GeminiService()
    return _service
