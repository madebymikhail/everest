import os
from fastapi import APIRouter
from everest_server.model_manager import list_models, current_model_path

router = APIRouter()

@router.get("/models_list")
def models_list():
    return {
        "models": list_models(),
        "current_model": os.path.basename(current_model_path) if current_model_path else None
    }
