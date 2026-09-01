"""FastAPI application for the Hamad AI web client."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from hamad_ai.assistant import Assistant


class ChatRequest(BaseModel):
    """Payload accepted by the chat endpoint."""

    message: str = Field(min_length=1, max_length=4000)


class ChatResponse(BaseModel):
    """Payload returned by the chat endpoint."""

    reply: str
    mode: str = "local"


app = FastAPI(
    title="Hamad AI API",
    description="Local-first chat API for the Hamad AI personal assistant.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

assistant = Assistant()


def _chat_response(payload: ChatRequest) -> ChatResponse:
    response = assistant.respond(payload.message)
    return ChatResponse(reply=response.text, mode="local")


@app.get("/api/healthz")
@app.get("/healthz")
def health_check() -> dict[str, str]:
    """Report that the Hamad AI API is available."""
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    """Return a local-first assistant response."""
    return _chat_response(payload)