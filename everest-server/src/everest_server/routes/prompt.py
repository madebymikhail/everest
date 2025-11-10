import asyncio
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, StreamingResponse
from everest_server.model_manager import load_model

alpaca_prompt = """Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
{}

### Input:
{}

### Response:
"""

router = APIRouter()

async def stream_generate(llm, prompt):
    """Asynchronously stream tokens from LLaMA."""
    for chunk in llm(prompt, stream=True):
        if "choices" in chunk and len(chunk["choices"]) > 0:
            token = chunk["choices"][0]["text"]
            yield token
            await asyncio.sleep(0)


@router.post("/prompt")
async def prompt(request: Request):
    body = await request.json()
    model_name = body.get("model")
    prompt_text = body.get("prompt", "")
    stream = body.get("stream", False)

    if not model_name:
        return JSONResponse({"error": "Missing model name"}, status_code=400)

    llm = load_model(model_name)

    if stream:
        async def streamer():
            async for token in stream_generate(llm, prompt_text):
                yield token
        return StreamingResponse(streamer(), media_type="text/plain")
    else:
        result = llm(prompt_text)
        output = result["choices"][0]["text"]
        return {"response": output}

@router.post("/rewrite")
async def prompt_rewrite(request: Request):
    instruction = "Rewrite the following text as Mikhail."

    body = await request.json()

    model_name = body.get("model")
    input_text = body.get("prompt", "")

    if not model_name:
        return JSONResponse({"error": "Missing model name"}, status_code=400)

    llm = load_model(model_name)

    # Format Alpaca-style prompt
    prompt = alpaca_prompt.format(instruction, input_text)

    # Run inference (no streaming)
    try:
        result = llm(prompt, max_tokens=300, stop=["###", "</s>", "User:"])
        output = result["choices"][0]["text"].strip()
        return {"response": output}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

