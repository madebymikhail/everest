import uvicorn
from fastapi import FastAPI
from everest_server.routes import health, models, prompt, config, typer, shutdown

app = FastAPI(title="Everest Local AI Service")

# Register routers
app.include_router(health.router)
app.include_router(models.router)
app.include_router(prompt.router)
app.include_router(config.router)
app.include_router(typer.router)
app.include_router(shutdown.router)

def run_app():
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=39245,
        log_level="info",
        access_log=False,  # disable access log
        # force console logging to stdout
        log_config=None
    )

if __name__ == "__main__":
    run_app()