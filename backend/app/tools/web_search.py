"""Public web search + page retrieval. No API key required (DuckDuckGo HTML endpoint).

Only publicly accessible content is retrieved, and the real source URL is always
preserved so the Analysis and Verification agents can cite it.
"""

from __future__ import annotations

import asyncio
import re
from dataclasses import dataclass
from urllib.parse import parse_qs, unquote, urlparse

import httpx
from bs4 import BeautifulSoup

from app.core.config import get_settings
from app.core.errors import WebResearchError
from app.core.logging import get_logger

logger = get_logger(__name__)

_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0 Safari/537.36"
)
_SEARCH_ENDPOINTS = (
    "https://html.duckduckgo.com/html/",
    "https://lite.duckduckgo.com/lite/",
)


@dataclass
class SearchHit:
    title: str
    url: str
    snippet: str = ""
    text: str = ""


async def search(query: str, limit: int | None = None) -> list[SearchHit]:
    settings = get_settings()
    limit = limit or settings.web_search_results
    last_error: Exception | None = None

    for endpoint in _SEARCH_ENDPOINTS:
        try:
            async with httpx.AsyncClient(
                timeout=settings.web_fetch_timeout_seconds,
                follow_redirects=True,
                headers={"User-Agent": _UA},
            ) as client:
                resp = await client.post(endpoint, data={"q": query})
                resp.raise_for_status()
                hits = _parse_results(resp.text, limit)
                if hits:
                    return hits
        except Exception as exc:  # noqa: BLE001 - try the next endpoint
            last_error = exc
            logger.warning("Search endpoint %s failed: %s", endpoint, exc)

    if last_error is not None:
        raise WebResearchError(
            f"Web search is currently unavailable for '{query}': {last_error}"
        )
    return []


def _parse_results(html: str, limit: int) -> list[SearchHit]:
    soup = BeautifulSoup(html, "lxml")
    hits: list[SearchHit] = []
    seen: set[str] = set()

    for anchor in soup.select("a.result__a, a.result-link, h2 a"):
        href = anchor.get("href") or ""
        url = _clean_url(href)
        if not url or url in seen:
            continue
        snippet = ""
        container = anchor.find_parent(["div", "tr", "table"])
        if container:
            node = container.select_one(".result__snippet, .result-snippet")
            if node:
                snippet = node.get_text(" ", strip=True)
        seen.add(url)
        hits.append(
            SearchHit(title=anchor.get_text(" ", strip=True) or url, url=url, snippet=snippet)
        )
        if len(hits) >= limit:
            break
    return hits


def _clean_url(href: str) -> str:
    if not href:
        return ""
    if href.startswith("//"):
        href = "https:" + href
    parsed = urlparse(href)
    if parsed.path.startswith("/l/") or "duckduckgo.com/l/" in href:
        target = parse_qs(parsed.query).get("uddg")
        if target:
            href = unquote(target[0])
            parsed = urlparse(href)
    if parsed.scheme not in ("http", "https"):
        return ""
    if "duckduckgo.com" in parsed.netloc:
        return ""
    return href


async def fetch_page(url: str) -> str:
    """Fetch a public page and return readable plain text ('' when unavailable)."""
    settings = get_settings()
    try:
        async with httpx.AsyncClient(
            timeout=settings.web_fetch_timeout_seconds,
            follow_redirects=True,
            headers={"User-Agent": _UA},
        ) as client:
            resp = await client.get(url)
            if resp.status_code >= 400:
                logger.info("Skipping %s (HTTP %s)", url, resp.status_code)
                return ""
            content_type = resp.headers.get("content-type", "")
            if "html" not in content_type and "text" not in content_type:
                return ""
            return _html_to_text(resp.text)[: settings.web_max_chars_per_page]
    except Exception as exc:  # noqa: BLE001 - unavailable pages are skipped, not fatal
        logger.info("Skipping %s (%s)", url, exc)
        return ""


def _html_to_text(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "noscript", "nav", "footer", "header", "form"]):
        tag.decompose()
    text = soup.get_text("\n", strip=True)
    return re.sub(r"\n{3,}", "\n\n", text)


async def research(query: str, limit: int | None = None) -> list[SearchHit]:
    """Search then fetch each result's text in parallel."""
    hits = await search(query, limit)
    if not hits:
        return []
    texts = await asyncio.gather(*(fetch_page(h.url) for h in hits))
    for hit, text in zip(hits, texts):
        hit.text = text or hit.snippet
    return [h for h in hits if h.text]
