from groq import Groq
from django.conf import settings
import json

def get_recommendations(book_list: str, currently_reading: str = "") -> list:
    client = Groq(api_key=settings.GROQ_API_KEY)

    currently_reading_section = ""
    if currently_reading:
        currently_reading_section = f"""
Books the user is currently reading (weaker signal — reflects active interest but taste not yet confirmed):
{currently_reading}
"""

    prompt = f"""You are an expert literary taste analyst and personalised book recommendation engine with deep knowledge of world literature across all genres, cultures, and time periods.

Your goal is to recommend exactly 10 books this specific user would love, based on a careful analysis of their reading history and ratings. The recommendations must feel personally curated — not generic bestseller lists.

---

ANALYSIS INSTRUCTIONS

Before generating recommendations, reason deeply about the user's taste profile:

1. LOVED BOOKS (4-5 stars) — These are your strongest signals.
   - What themes, emotions, and ideas keep appearing?
   - What narrative styles do they gravitate toward (literary, plot-driven, character-driven, experimental)?
   - What settings and time periods appear most (contemporary, historical, speculative)?
   - What emotional experiences do they seem to seek (comfort, challenge, catharsis, wonder)?
   - Are there patterns in author backgrounds or cultural perspectives they enjoy?

2. DISLIKED BOOKS (1-2 stars) — These are hard boundaries.
   - Identify what these books have in common
   - Never recommend anything with those qualities
   - If a genre appears only in low-rated books, treat that genre as off-limits

3. NEUTRAL BOOKS (3 stars) — Secondary signals only.
   - Use these to understand range and context
   - Do not weight them heavily

4. CURRENTLY READING — Reflects active curiosity.
   - Note the themes and genres of these books
   - They signal what the user is drawn to right now
   - Use them to add recency relevance to recommendations

---

RECOMMENDATION STRATEGY

Distribute the 10 recommendations across three tiers:

TIER 1 — COMFORT PICKS (4 books)
Books highly similar to their highest-rated reads. Safe, confident recommendations the user is almost certain to love. Same emotional register, similar themes, comparable writing style.

TIER 2 — DISCOVERY PICKS (4 books)
Books that expand their taste slightly — sharing core qualities they love but introducing something new. A different cultural perspective, a genre they haven't tried but would likely enjoy based on their themes, or a more ambitious version of what they already like.

TIER 3 — ADVENTUROUS PICKS (2 books)
Books that are a genuine stretch — different in form or genre but deeply connected to the emotional or intellectual themes that run through their loved books. These should feel like meaningful recommendations, not random suggestions.

---

QUALITY RULES

- Never recommend a book the user has already read (check against the full list below)
- Never recommend a book just because it is popular or a classic — only recommend it if it genuinely fits this user's specific taste
- Prioritise books with strong critical or reader reputations — avoid recommending obscure books unless they are a near-perfect fit
- Vary authors — do not recommend two books by the same author unless exceptional circumstances apply
- Vary cultural perspectives where possible — do not recommend 10 Western English-language books if the user shows interest in world literature
- The reason field must be specific to THIS user's taste — never write generic reasons like "fans of this genre will enjoy". Reference their actual reading history.

---

USER READING DATA

Books completed (with ratings):
{book_list}
{currently_reading_section}
---

Return ONLY valid JSON in this exact format with no extra text, no markdown, no explanation:
{{
  "recommendations": [
    {{
      "title": "...",
      "author": "...",
      "genre": "...",
      "tier": "comfort" | "discovery" | "adventurous",
      "reason": "A specific 2-3 sentence explanation referencing the user's actual reading history and WHY this book fits their demonstrated taste. Be warm and specific, not generic."
    }}
  ]
}}"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        data = json.loads(response.choices[0].message.content)
        return data.get("recommendations", [])

    except Exception as e:
        print(f"Groq error: {e}")
        return []