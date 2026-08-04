import asyncio
from google import genai
import os
from app.config import get_settings

async def main():
    settings = get_settings()
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    models = client.models.list()
    with open("models_list.txt", "w") as f:
        for m in models:
            f.write(f"{m.name}\n")

if __name__ == "__main__":
    asyncio.run(main())
