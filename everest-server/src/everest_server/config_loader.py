import os, json, platform

def get_config_dir():
    system = platform.system()
    
    if system == "Windows":
        return os.path.join(os.getenv("APPDATA"), "Everest")
    elif system == "Darwin":
        return os.path.expanduser("~/Library/Application Support/Everest")
    else:
        return os.path.expanduser("~/.config/everest")

def get_config_path():
    os.makedirs(get_config_dir(), exist_ok=True)
    return os.path.join(get_config_dir(), "config.json")

def load_config():
    path = get_config_path()

    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)

    return {}  # empty default config

def save_config(cfg):
    path = get_config_path()

    with open(path, "w") as f:
        json.dump(cfg, f, indent=2)
