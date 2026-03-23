import nltk
from nltk.sentiment import SentimentIntensityAnalyzer

nltk.download('vader_lexicon', quiet=True)

_sia = None

def _get_sia():
    global _sia
    if _sia is None:
        _sia = SentimentIntensityAnalyzer()
    return _sia


def analyze_sentiment(text: str) -> str:
    if not text or not text.strip():
        return None
    
    sia = _get_sia()
    compound = sia.polarity_scores(text)['compound']
    
    if compound >= 0.05:
        return 'positive'
    
    elif compound <= -0.05:
        return 'negative'
    
    else:
        return 'neutral'