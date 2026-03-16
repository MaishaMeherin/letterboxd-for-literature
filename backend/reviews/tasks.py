from celery import shared_task

@shared_task
def analyze_sentiment_task(review_id: int):
    from reviews.models import Review
    from reviews.sentiment import analyze_sentiment
    
    review = Review.objects.get(id=review_id)
    result = analyze_sentiment(review.text)
    review.sentiment = result
    review.save(update_fields=["sentiment"])
    