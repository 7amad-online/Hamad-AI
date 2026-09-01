"""Core response logic for the Hamad AI starter assistant."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Callable


@dataclass(frozen=True)
class Response:
    """A response displayed by the command-line interface."""

    text: str
    should_exit: bool = False


class Assistant:
    """A dependency-free assistant with a small command surface.

    This local-first implementation is intentionally easy to extend. A future
    model provider can be connected behind ``respond`` without changing the
    terminal interface.
    """

    _COMMANDS: dict[str, str] = {
        "/help": "Show available commands.",
        "/about": "Learn what Hamad AI is.",
        "/time": "Show the current local time.",
        "/clear": "Clear the terminal.",
        "/quit": "Exit Hamad AI.",
        "/exit": "Exit Hamad AI.",
    }

    def __init__(self, now: Callable[[], datetime] | None = None) -> None:
        self._now = now or datetime.now

    def respond(self, message: str) -> Response:
        """Return a response for one user message."""
        clean_message = message.strip()
        command = clean_message.lower()

        if not clean_message:
            return Response("Tell me what you would like to work on.")

        if command in {"/quit", "/exit"}:
            return Response("Goodbye. Thanks for using Hamad AI.", should_exit=True)

        if command == "/help":
            return Response(self.help_text())

        if command == "/about":
            return Response(
                "Hamad AI is a local-first assistant starter project. "
                "It is ready for you to connect to the AI model or tools "
                "that fit your product."
            )

        if command == "/time":
            return Response(f"Your local time is {self._now().strftime('%Y-%m-%d %H:%M:%S')}.")

        if command == "/clear":
            return Response("\033[2J\033[H")

        if command.startswith("/"):
            return Response(
                f"I do not know the command {clean_message!r}. "
                "Type /help to see what I can do."
            )

        return Response(self._reply_to_message(clean_message))

    def help_text(self) -> str:
        """Return the command list in a stable, readable format."""
        lines = ["Available commands:"]
        lines.extend(f"  {command:<8} {description}" for command, description in self._COMMANDS.items())
        lines.append("")
        lines.append("Anything else is treated as a message for Hamad AI.")
        return "\n".join(lines)

    @staticmethod
    def _reply_to_message(message: str) -> str:
        """Provide a helpful local response before a model is connected."""
        lowered = message.casefold()

        if any(greeting in lowered.split() for greeting in ("hello", "hi", "hey", "salam")):
            return "Hello. I am Hamad AI. What would you like to build today?"

        if "thank" in lowered:
            return "You are welcome."

        return (
            "I am ready for that. This starter is running locally; "
            "connect your preferred AI model in Assistant.respond to turn "
            "messages into full AI responses."
        )