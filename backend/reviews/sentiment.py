_pipeline = None

def _get_pipeline():
    global _pipeline
    if _pipeline is None:
        from transformers import pipeline
        _pipeline = pipeline(
            "sentiment-analysis",
            model="nlptown/bert-base-multilingual-uncased-sentiment",
            device=-1,
        )
    return _pipeline

def analyze_sentiment(text: str) -> str:
    if not text or len(text.strip()) < 3:
        return "neutral"

    pipe = _get_pipeline()
    result = pipe(text[:512])[0]

    # This model returns 1-5 stars
    stars = int(result["label"][0])

    if stars >= 4:
        return "positive"
    elif stars <= 2:
        return "negative"
    else:
        return "neutral"