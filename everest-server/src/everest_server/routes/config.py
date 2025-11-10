import os
from fastapi import APIRouter, Request, HTTPException
from everest_server.config_loader import load_config, save_config, get_config_dir

router = APIRouter()

@router.get("/config")
def get_config():
    """Return the current configuration."""
    cfg = load_config()
    return {"config": cfg}

@router.post("/edit_config")
async def edit_config(request: Request):
    """
    Update configuration values.

    Example body:
    {
        "model_dir": "C:/Users/Mikhail/Documents/GGUFs",
        "n_threads": 6,
        "n_ctx": 4096
    }

    - Any key can be updated.
    - Directories will be created if they don't exist.
    """
    body = await request.json()

    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Expected JSON object")

    config = load_config()

    for key, value in body.items():
        # if user changed model_dir, validate and create folder
        if key == "model_dir":
            if not isinstance(value, str):
                raise HTTPException(status_code=400, detail="model_dir must be a string")
            os.makedirs(value, exist_ok=True)
        config[key] = value

    save_config(config)
    return {"status": "updated", "config": config}
