from groq import Groq
from django.conf import settings
import json

def get_recommendations(book_list: str) -> list:
    client = Groq(api_key=settings.GROQ_API_KEY)
    prompt = f"""You are a book recommendation engine. Based on the following books a user has read,
recommend exactly 10 books they would enjoy but have NOT already read.

Books already read:
{book_list}

Return ONLY valid JSON in this exact format (no extra text):
{{"recommendations": [{{"title": "...", "author": "...", "genre": "...", "reason": "..."}}]}}"""
    
    try:
        response = client.chat.completions.create(
            model = "llama-3.3-70b-versatile",
            messages = [{"role": "user", "content": prompt}],
            response_format = {"type": "json_object"},
        )
        data = json.loads(response.choices[0].message.content)
        return data.get("recommendations", [])
        
    except Exception as e:
        print(f"Groq error: {e}")
        return []

