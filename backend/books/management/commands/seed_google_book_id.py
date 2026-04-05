import requests
import time
from django.core.management.base import BaseCommand
from django.conf import settings
from books.models import Book

GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes"


class Command(BaseCommand):
    help = "Fetch Google Books IDs for books missing them"

    def handle(self, *args, **options):
        books = Book.objects.filter(google_books_id__isnull=True) | Book.objects.filter(google_books_id='')
        total = books.count()
        self.stdout.write(f"Found {total} books without Google Books ID\n")

        updated = 0
        skipped = 0

        for book in books:
            # Build search query: "title by author"
            author = book.authors[0] if book.authors else ""
            query = f"{book.title} {author}".strip()

            try:
                resp = requests.get(GOOGLE_BOOKS_API, params={
                    "q": query,
                    "maxResults": 1,
                    "key": settings.GOOGLE_BOOKS_API_KEY,
                }, timeout=10)

                if resp.status_code != 200:
                    self.stdout.write(self.style.WARNING(f"  API error ({resp.status_code}): {book.title}"))
                    skipped += 1
                    time.sleep(1)
                    continue

                items = resp.json().get("items", [])
                if not items:
                    self.stdout.write(f"  Not found: {book.title}")
                    skipped += 1
                    time.sleep(0.5)
                    continue

                volume = items[0]
                google_id = volume.get("id")

                book.google_books_id = google_id

                # Also fill in missing description if empty
                if not book.description:
                    desc = volume.get("volumeInfo", {}).get("description", "")
                    if desc:
                        book.description = desc[:2000]

                book.save(update_fields=["google_books_id", "description"])
                updated += 1

                if updated % 10 == 0:
                    self.stdout.write(self.style.SUCCESS(f"  Progress: {updated}/{total}"))

                time.sleep(0.5)

            except Exception as e:
                self.stdout.write(self.style.WARNING(f"  Error for '{book.title}': {e}"))
                skipped += 1

        self.stdout.write(self.style.SUCCESS(
            f"\nDone! Updated: {updated} | Skipped: {skipped}"
        ))