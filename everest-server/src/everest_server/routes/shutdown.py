import asyncio
import os
from fastapi import APIRouter, BackgroundTasks

router = APIRouter()

@router.post("/shutdown")
async def shutdown(background_tasks: BackgroundTasks):
    async def _shutdown():
        await asyncio.sleep(1)
        os._exit(0)

    background_tasks.add_task(_shutdown)
    return {"status": "shutting down"}
