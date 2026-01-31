from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from src.api.routes import router

app = FastAPI()

app.include_router(router)


@app.get("/health")
def health():
    return {"ok": True}
