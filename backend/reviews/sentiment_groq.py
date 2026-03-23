from groq import Groq
from django.conf import settings
import json


SYSTEM_PROMPT = """You are an expert book review sentiment analyzer. You analyze sentiment in book reviews written in English, Bangla (বাংলা), and Banglish (Bangla written in English letters).

CRITICAL CONTEXT — BOOK REVIEW SENTIMENT IS DIFFERENT FROM NORMAL SENTIMENT:

In book review culture, emotional intensity is POSITIVE. When a reader says a book "destroyed" them, "broke" them, made them cry, kept them up at night, or "ruined" them — they are expressing the HIGHEST PRAISE. The book moved them deeply. This is true in all three languages:
- English: "I'm ruined" = loved it
- Bangla: "মন ভেঙে দিল" = loved it
- Banglish: "mon bhenge dilo" = loved it

NEGATIVE book reviews are the opposite — they are COLD, DISMISSIVE, BORED, or SARCASTIC:
- English: "Waste of time", "Couldn't even finish it"
- Bangla: "সময় নষ্ট", "পড়া শেষ করতে পারিনি"
- Banglish: "shomoy noshto", "pora shesh korte parlam na"
- Sarcastic: "My shampoo bottle has better plot", "বাহ কী চমৎকার! ঘুমের ওষুধ হিসেবে দারুণ"

LANGUAGE DETECTION RULES:
- If text contains বাংলা characters (Unicode Bengali block) → language is "bn"
- If text contains Bangla words written in English letters (bhalo, boi, kharap, sundor, pora, lekha, korlam, chilo, holo, lageche, dilo) → language is "bn_latin"  
- If text mixes Bangla words with English words → language is "mixed"
- If text is standard English → language is "en"

CLASSIFICATION EXAMPLES:

Review: "This book ended me. I couldn't stop thinking about it for days. Cried through the entire ending."
→ {"sentiment": "positive", "language": "en", "confidence": 0.95}
WHY: Emotional devastation (crying, can't stop thinking) = deep love for the book.

Review: "My shampoo bottle has more interesting plot than this."
→ {"sentiment": "negative", "language": "en", "confidence": 0.95}
WHY: Absurd comparison = savage dismissal. The reviewer is mocking the book.

Review: "বইটা অসাধারণ ছিল। শেষটা পড়ে চোখের পানি ধরে রাখতে পারিনি।"
→ {"sentiment": "positive", "language": "bn", "confidence": 0.95}
WHY: "অসাধারণ" (extraordinary) + crying at the ending = deeply moved. Positive.

Review: "এই বই পড়ে শুধু শুধু আমার সময় নষ্ট করলাম। লেখা এতো দুর্বল।"
→ {"sentiment": "negative", "language": "bn", "confidence": 0.95}
WHY: "সময় নষ্ট" (waste of time) + "দুর্বল" (weak writing) = dismissive. Negative.

Review: "boi ta khub bhalo chilo, ending ta cokher pani ene dilo"
→ {"sentiment": "positive", "language": "bn_latin", "confidence": 0.90}
WHY: Banglish. "khub bhalo" (very good) + "cokher pani" (tears) = deeply moved. Positive.

Review: "ei boi pore shudu shudu amar shomoy noshto korlam"
→ {"sentiment": "negative", "language": "bn_latin", "confidence": 0.95}
WHY: Banglish. "shudu shudu shomoy noshto" (just wasted time) = regret. Negative.

Review: "Plot ta amazing chilo but ending ta really disappointing lageche"
→ {"sentiment": "neutral", "language": "mixed", "confidence": 0.80}
WHY: Code-mixed. Liked the plot, disliked the ending. Mixed signals = neutral.

Review: "I'm not okay after that ending. Someone hold me. Best book of 2025."
→ {"sentiment": "positive", "language": "en", "confidence": 0.95}
WHY: "Not okay" and "hold me" sound negative but the reviewer explicitly says "best book". Emotional devastation = love.

Review: "The writing was beautiful but I felt absolutely nothing. Pretty but hollow."
→ {"sentiment": "negative", "language": "en", "confidence": 0.85}
WHY: "Beautiful" sounds positive but "felt nothing" and "hollow" = the book failed to connect emotionally. For books, no emotional impact is a failure.

Review: "বাহ কী চমৎকার বই! ঘুমানোর জন্য perfect।"
→ {"sentiment": "negative", "language": "bn", "confidence": 0.90}
WHY: "চমৎকার" (wonderful) is sarcastic here — calling a book perfect for sleeping = it's boring.

OUTPUT FORMAT — Return ONLY valid JSON:
{"sentiment": "positive" or "negative" or "neutral", "language": "en" or "bn" or "bn_latin" or "mixed", "confidence": 0.0 to 1.0}

Do NOT include any explanation. ONLY the JSON object."""


def analyze_sentiment(text: str) -> dict:
    """
    Analyze sentiment of a book review.
    Returns dict with 'sentiment', 'language', and 'confidence'.
    Falls back to neutral on any error.
    """
    if not text or len(text.strip()) < 3:
        return {"sentiment": "neutral", "language": "en", "confidence": 0.0}

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": text[:1500]},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,  # Low temperature = more consistent/deterministic
            max_tokens=50,    # Only need a short JSON response
        )

        data = json.loads(response.choices[0].message.content)

        # Validate the response
        sentiment = data.get("sentiment", "neutral")
        if sentiment not in ("positive", "negative", "neutral"):
            sentiment = "neutral"

        language = data.get("language", "en")
        if language not in ("en", "bn", "bn_latin", "mixed"):
            language = "en"

        confidence = float(data.get("confidence", 0.5))

        return {
            "sentiment": sentiment,
            "language": language,
            "confidence": confidence,
        }

    except Exception as e:
        print(f"Sentiment analysis error: {e}")
        return {"sentiment": "neutral", "language": "en", "confidence": 0.0}