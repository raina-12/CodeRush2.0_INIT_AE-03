"""Typed application errors surfaced to the client as structured states."""


class AgentFlowError(Exception):
    """Base error. `code` is a stable machine-readable identifier."""

    code = "agentflow_error"
    http_status = 500

    def __init__(self, message: str, *, code: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        if code:
            self.code = code


class ConfigurationError(AgentFlowError):
    code = "configuration_error"
    http_status = 503


class LLMUnavailableError(AgentFlowError):
    code = "llm_unavailable"
    http_status = 502


class InvalidInputError(AgentFlowError):
    code = "invalid_input"
    http_status = 400


class DocumentParseError(AgentFlowError):
    code = "document_parse_error"
    http_status = 400


class WebResearchError(AgentFlowError):
    code = "web_research_unavailable"
    http_status = 502
