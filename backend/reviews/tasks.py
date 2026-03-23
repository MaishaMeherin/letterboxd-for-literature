from celery import shared_task

@shared_task(bind=True, max_retries=3)
def analyze_sentiment_task(self, review_id):
    """
    Background task: analyze sentiment of a review.
    - Receives review_id(not the object, because objects can't be serialized to json)
    - Fetches the review from database
    - Calls Groq for sentiment analysis
    - Updates the review's sentiment field
    """
    from reviews.models import Review
    from reviews.sentiment_groq import analyze_sentiment
    
    try:
        review = Review.objects.get(id=review_id)
    except Review.DoesNotExist:
        print(f"Review {review_id} not found")
        return {"status": "error", "reason": "review not found"}
    
    #call grop, this is slow, moved to background
    result = analyze_sentiment(review.text)
    
    #update review in database
    review.sentiment = result['sentiment']
    review.save(update_fields=['sentiment'])
    
    print(f"Sentiment for review {review_id}: {result['sentiment']}")
    return {
        "review_id": str(review_id),
        "sentiment": result['sentiment'],
        "language": result['language'],
        "confidence": result['confidence'],
    }