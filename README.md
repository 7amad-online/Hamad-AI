# Hamad AI

Hamad AI is a lightweight, local-first Python assistant starter. It runs
without external packages or API keys and gives you a clean place to connect
the AI model, tools, and product behavior you want next.

## Run

```bash
python3 -m hamad_ai
```

You can also run it after installing the project:

```bash
python3 -m pip install -e .
hamad-ai
```

## Available commands

- `/help` — show the available commands
- `/about` — learn about the starter
- `/time` — show the current local time
- `/clear` — clear the terminal
- `/quit` or `/exit` — close the assistant

## Project layout

```text
hamad_ai/
  assistant.py  # response logic and extension point for a model provider
  cli.py        # terminal interface
pyproject.toml  # Python project metadata and executable entry point
```

## Next step

The main integration point is `Assistant.respond` in
`hamad_ai/assistant.py`. Add your preferred model provider there while keeping
the CLI unchanged.