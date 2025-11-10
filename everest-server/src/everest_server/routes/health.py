from fastapi import APIRouter
from everest_server.model_manager import current_model_path

router = APIRouter()

@router.get("/health")
def health():
    return {"status": "ok", "model_loaded": current_model_path is not None}
