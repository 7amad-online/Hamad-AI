"""Command-line interface for Hamad AI."""

from __future__ import annotations

import sys
from typing import TextIO

from .assistant import Assistant


def main(
    *,
    input_stream: TextIO | None = None,
    output_stream: TextIO | None = None,
) -> None:
    """Run the interactive assistant."""
    input_stream = input_stream or sys.stdin
    output_stream = output_stream or sys.stdout
    assistant = Assistant()

    print_banner(output_stream)

    while True:
        try:
            print("You > ", end="", flush=True, file=output_stream)
            message = input_stream.readline()
        except KeyboardInterrupt:
            print("\n\nGoodbye. Thanks for using Hamad AI.", file=output_stream)
            return
        except EOFError:
            print("\nGoodbye. Thanks for using Hamad AI.", file=output_stream)
            return

        if message == "":
            print("\nGoodbye. Thanks for using Hamad AI.", file=output_stream)
            return

        response = assistant.respond(message)
        if response.text:
            print(f"\nHamad AI > {response.text}", file=output_stream)

        if response.should_exit:
            return


def print_banner(output_stream: TextIO) -> None:
    """Print the initial CLI welcome message."""
    print("+" + "-" * 56 + "+", file=output_stream)
    print("|" + "Hamad AI".center(56) + "|", file=output_stream)
    print("|" + "A local-first assistant starter".center(56) + "|", file=output_stream)
    print("+" + "-" * 56 + "+", file=output_stream)
    print("Type /help for commands or /quit to exit.\n", file=output_stream)


if __name__ == "__main__":
    main()