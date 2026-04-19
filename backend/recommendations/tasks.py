from celery import shared_task
import requests
from django.conf import settings


@shared_task
def generate_recommendations_task(user_id):
    from django.contrib.auth import get_user_model
    from logs.models import ReadingLog
    from reviews.models import Review
    from books.models import Book
    from .models import Recommendations
    from .groq import get_recommendations

    User = get_user_model()

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return

    logs = ReadingLog.objects.filter(user=user, status="completed").select_related("book")

    if not logs.exists():
        return

    user_reviews = Review.objects.filter(user=user).values("book_id", "rating")
    rating_map = {str(r["book_id"]): r["rating"] for r in user_reviews}

    books_read = []
    for log in logs:
        book = log.book
        genres = ", ".join(book.genres) if book.genres else "unknown"
        rating = rating_map.get(str(book.id))
        rating_str = f"{rating} stars" if rating else "unrated"
        books_read.append(
            f'- "{book.title}" by {", ".join(book.authors)} '
            f"(genres: {genres}, user rating: {rating_str})"
        )

    currently_reading = ReadingLog.objects.filter(
        user=user, status="currently_reading"
    ).select_related("book")

    books_in_progress = []
    for log in currently_reading:
        book = log.book
        genres = ", ".join(book.genres) if book.genres else "unknown"
        books_in_progress.append(
            f'- "{book.title}" by {", ".join(book.authors)} (genres: {genres})'
        )

    recommendations = get_recommendations(
        "\n".join(books_read),
        "\n".join(books_in_progress),
    )

    for rec in recommendations:
        try:
            # Step 1: check if book already exists in DB — use its cover directly
            book_obj = Book.objects.filter(
                title__iexact=rec["title"],
                authors__icontains=rec["author"],
            ).first()

            if book_obj and book_obj.cover_url:
                rec["cover_url"] = book_obj.cover_url
                rec["book_id"] = book_obj.id
                continue

            # Step 2: fetch from Google Books API (authenticated to avoid rate limits)
            resp = requests.get(
                "https://www.googleapis.com/books/v1/volumes",
                params={
                    "q": f"{rec['title']} {rec['author']}",
                    "maxResults": 1,
                    "key": settings.GOOGLE_BOOKS_API_KEY,
                },
                timeout=10,
            )
            items = resp.json().get("items", [])

            if items:
                item = items[0]
                volume_info = item.get("volumeInfo", {})
                image_links = volume_info.get("imageLinks", {})
                cover = (image_links.get("thumbnail") or image_links.get("smallThumbnail") or "").replace("http://", "https://")
                google_books_id = item.get("id", "")

                rec["cover_url"] = cover

                # Exact match on google_books_id if DB lookup above missed it
                if not book_obj and google_books_id:
                    book_obj = Book.objects.filter(google_books_id=google_books_id).first()

                if book_obj:
                    # Enrich the existing record with any data it was missing
                    updated = False
                    if google_books_id and not book_obj.google_books_id:
                        book_obj.google_books_id = google_books_id
                        updated = True
                    if cover and not book_obj.cover_url:
                        book_obj.cover_url = cover
                        updated = True
                    if updated:
                        book_obj.save()
                    rec["book_id"] = book_obj.id
                else:
                    rec["book_id"] = None
            else:
                rec["cover_url"] = book_obj.cover_url if book_obj else ""
                rec["book_id"] = book_obj.id if book_obj else None

        except Exception:
            rec["cover_url"] = ""
            rec["book_id"] = None

    if recommendations:
        Recommendations.objects.filter(user=user).delete()
        Recommendations.objects.bulk_create([
            Recommendations(user=user, book_id=item.pop("book_id", None), **item)
            for item in recommendations
        ])