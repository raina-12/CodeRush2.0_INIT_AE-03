"""In-memory document store. Uploaded files are parsed once and reused by runs."""

from __future__ import annotations

import uuid
from dataclasses import dataclass

from app.core.errors import InvalidInputError


@dataclass
class StoredDocument:
    document_id: str
    filename: str
    content_type: str
    text: str


class DocumentStore:
    def __init__(self) -> None:
        self._docs: dict[str, StoredDocument] = {}

    def add(self, filename: str, content_type: str, text: str) -> StoredDocument:
        doc = StoredDocument(
            document_id=str(uuid.uuid4()),
            filename=filename,
            content_type=content_type,
            text=text,
        )
        self._docs[doc.document_id] = doc
        return doc

    def get(self, document_id: str) -> StoredDocument:
        doc = self._docs.get(document_id)
        if doc is None:
            raise InvalidInputError(
                "That uploaded document is no longer available. Please upload it again."
            )
        return doc

    def get_many(self, ids: list[str]) -> list[StoredDocument]:
        return [self.get(i) for i in ids]


_store: DocumentStore | None = None


def get_document_store() -> DocumentStore:
    global _store
    if _store is None:
        _store = DocumentStore()
    return _store
