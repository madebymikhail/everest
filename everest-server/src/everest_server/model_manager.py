import os
from llama_cpp import Llama
from everest_server.config_loader import get_config_dir, load_config

config = load_config()
model_dir = config.get("model_dir", os.path.join(get_config_dir(), "models"))

llm_instance = None
current_model_path = None

def list_models():
    if not os.path.exists(model_dir):
        os.makedirs(model_dir, exist_ok=True)
    return [f for f in os.listdir(model_dir) if f.lower().endswith(".gguf")]


def load_model(model_name: str):
    """Load or reload a model if needed."""
    global llm_instance, current_model_path
    model_path = os.path.join(model_dir, model_name)

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found: {model_name}")

    if llm_instance and model_path == current_model_path:
        return llm_instance  # already loaded

    llm_instance = None
    current_model_path = model_path
    print(f"Loading model: {model_path}")

    llm_instance = Llama(
        model_path=model_path,
        n_ctx=2048,
        n_threads=8,
        use_mlock=False,
        embedding=False,
        verbose=False
    )
    return llm_instance
