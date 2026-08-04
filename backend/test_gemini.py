import asyncio
import json
from app.infrastructure.gemini_client import GeminiClient

async def test():
    client = GeminiClient()
    schema = {
        "type": "OBJECT",
        "properties": {
            "test_val": {"type": "STRING"}
        }
    }
    try:
        res = await client.generate_structured("Say hello and put it in test_val", schema)
        with open("gemini_out.json", "w") as f:
            json.dump(res, f)
    except Exception as e:
        with open("gemini_err.txt", "w") as f:
            f.write(str(e))

if __name__ == "__main__":
    asyncio.run(test())
