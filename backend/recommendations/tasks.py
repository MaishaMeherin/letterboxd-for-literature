from celery import shared_task

@shared_task
def generate_recommendations_task(book_list: str) -> list:
    from recommendations.groq import get_recommendations
    return get_recommendations(book_list)