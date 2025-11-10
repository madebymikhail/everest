# Everest Local AI Service

Everest is a local AI service that provides:

- LLaMA-based text generation using `.gguf` models
- Configurable model and inference parameters
- Human-like typing automation via PyAutoGUI
- A lightweight FastAPI server for Electron or other clients

---

## Features

- **List available models** and select which to use
- **Generate text** with optional streaming
- **Edit configuration** at runtime
- **Automate typing** to any application
- **Graceful shutdown** of the service

---

## Installation

### Requirements

- Python 3.11+
- Poetry for dependency management
- Windows/macOS/Linux

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/everest-server.git
cd everest-server
````

2. Install dependencies with Poetry:

```bash
poetry install
```

3. Run the server:

```bash
poetry run everest
```

> The server runs by default at `http://127.0.0.1:39245`.

---

## Configuration

Default configuration is stored in:

```
<user_config_dir>/everest/config.json
```

You can update configuration at runtime using the `/edit_config` route. Example configuration options:

```json
{
  "model_dir": "C:/Models",
  "n_ctx": 2048,
  "n_threads": 8,
  "temperature": 0.7
}
```

---

## API Routes

### 1. Health Check

| Route     | Method | Input | Output                                     | Description                                            |
| --------- | ------ | ----- | ------------------------------------------ | ------------------------------------------------------ |
| `/health` | GET    | None  | `{ "status": "ok", "model_loaded": bool }` | Checks if the service is running and a model is loaded |

---

### 2. Models Management

| Route          | Method | Input | Output                                        | Description                    |
| -------------- | ------ | ----- | --------------------------------------------- | ------------------------------ |
| `/models_list` | GET    | None  | `{ "models": [...], "current_model": "..." }` | Lists available `.gguf` models |

---

### 3. Text Generation (LLaMA)

| Route     | Method | Input                                                             | Output                                        | Description                             |
| --------- | ------ | ----------------------------------------------------------------- | --------------------------------------------- | --------------------------------------- |
| `/prompt` | POST   | `{ "model": "string", "prompt": "string", "stream": true/false }` | JSON `{ "response": "..." }` or streamed text | Generates text with the specified model |

---

### 4. Configuration Management

| Route          | Method | Input                                                          | Output                                     | Description                              |
| -------------- | ------ | -------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------- |
| `/config`      | GET    | None                                                           | `{ "config": {...} }`                      | Returns current configuration            |
| `/edit_config` | POST   | Arbitrary JSON, e.g., `{ "model_dir": "...", "n_threads": 6 }` | `{ "status": "updated", "config": {...} }` | Updates configuration values dynamically |

---

### 5. Typing Automation

| Route            | Method | Input                                                  | Output                     | Description                               |
| ---------------- | ------ | ------------------------------------------------------ | -------------------------- | ----------------------------------------- |
| `/type`          | POST   | `{ "text": "string", "base_delay": float (optional) }` | `{ "status": "started" }`  | Starts typing text in a background thread |
| `/cancel_typing` | POST   | None                                                   | `{ "status": "stopping" }` | Stops the ongoing typing routine          |
| `/typing_status` | GET    | None                                                   | `{ "typing": true/false }` | Checks if typing is currently active      |

---

### 6. Shutdown

| Route       | Method | Input | Output                          | Description                      |
| ----------- | ------ | ----- | ------------------------------- | -------------------------------- |
| `/shutdown` | POST   | None  | `{ "status": "shutting down" }` | Gracefully shuts down the server |

---

## Example Usage

### Listing models:

```bash
curl http://127.0.0.1:39245/models_list
```

### Generate text:

```bash
curl -X POST http://127.0.0.1:39245/prompt \
  -H "Content-Type: application/json" \
  -d '{"model": "mistral.gguf", "prompt": "Hello world!", "stream": false}'
```

### Automate typing:

```bash
curl -X POST http://127.0.0.1:39245/type \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world!", "base_delay": 0.02}'
```

Cancel typing:

```bash
curl -X POST http://127.0.0.1:39245/cancel_typing
```

---

## Notes

* Make sure `pyautogui` has accessibility permissions on macOS.
* Only **one typing routine** can run at a time.
* `.gguf` models must be placed in the configured `model_dir`.
* For production deployment, consider using a **PyInstaller build** to package the server into a single executable.