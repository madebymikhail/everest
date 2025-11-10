from fastapi import APIRouter, Body
from everest_server.utils import typer

router = APIRouter()

@router.post("/type")
def type_route(payload: dict = Body(...)):
    text = payload.get("text", "")
    base_delay = payload.get("base_delay", 0.02)

    if not text:
        return {"error": "No text provided."}

    if typer.is_typing():
        return {"status": "busy", "message": "Typing already in progress."}

    started = typer.start_typing_thread(text, base_delay)
    return {"status": "started" if started else "error"}


@router.post("/cancel_typing")
def cancel_typing():
    if not typer.is_typing():
        return {"status": "idle", "message": "Nothing to cancel."}

    typer.stop_typing()
    return {"status": "stopping", "message": "Typing cancellation requested."}


@router.get("/typing_status")
def typing_status():
    return {"typing": typer.is_typing()}
