from groq import Groq
from django.conf import settings
import json

def get_playlist(title: str, authors: list, genres: list, description: str) -> list:
    client = Groq(api_key=settings.GROQ_API_KEY)
    authors_str = ", ".join(authors) if authors else "unknown"
    genres_str = ", ".join(genres) if genres else "unknown"
    desc_str = description[:800] if description else "No description available"

    prompt = f"""You are an expert literary music curator who deeply understands both books and music.

Your task: create the perfect 10-song reading playlist for this book.

BOOK ANALYSIS:
Title: "{title}"
Author: {authors_str}
Genres: {genres_str}
Description: {desc_str}

BEFORE selecting songs, internally analyze:
1. EMOTIONAL ARC — What emotions does the reader experience? Does it start hopeful and turn dark? Is it melancholic throughout? Does it build to catharsis?
2. THEMES — What are the core themes? (loss, identity, love, rebellion, loneliness, coming-of-age, grief, freedom, etc.)
3. SETTING & ATMOSPHERE — Is it urban or rural? Modern or historical? Warm or cold? Intimate or epic?
4. PACING — Is it slow and contemplative, or fast and intense?
5. CULTURAL CONTEXT — Does the book draw from a specific culture, language, or geography that the music should reflect?

PLAYLIST RULES:
- Songs must match the book's emotional journey, not just its topic
- Mix well-known and lesser-known tracks for depth
- Consider instrumentals if the book has quiet, reflective passages
- Match the cultural or geographical context when relevant (e.g., Japanese literature might pair with Japanese artists)
- Order the playlist like a reading session — opening mood, deepening, climax, resolution
- Each song should pair with a SPECIFIC aspect of the book, not generic vibes
- Avoid obvious or cliché picks unless they genuinely fit

Return ONLY valid JSON in this exact format:
{{"playlist": [{{"song": "...", "artist": "...", "reason": "..."}}]}}

The reason should reference a specific theme, scene, or emotion from the book — not generic descriptions like "matches the mood". Be specific."""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )

        data = json.loads(response.choices[0].message.content)
        return data.get("playlist", [])

    except Exception as e:
        print(f"Groq error: {e}")
        return []