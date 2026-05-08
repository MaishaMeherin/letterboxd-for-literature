import requests
import time
from django.core.management.base import BaseCommand
from books.models import Book

GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes"

CATEGORIES = [
    # Trending & Popular
    ("bestseller fiction 2025", 40),
    ("bestseller nonfiction 2025", 40),
    ("booktok popular", 30),
    ("most popular books 2024", 30),
    ("viral books tiktok", 30),

    # Literary Fiction
    ("literary fiction", 40),
    ("contemporary literary fiction", 30),
    ("modern literary fiction", 30),

    # Romance
    ("contemporary romance novels", 40),
    ("romance bestseller", 30),

    # Fantasy & Sci-Fi
    ("fantasy novels popular", 40),
    ("science fiction novels", 40),
    ("dystopian fiction", 30),

    # Thriller & Mystery
    ("thriller mystery bestseller", 40),
    ("psychological thriller", 30),
    ("horror novels", 30),

    # Asian Literature
    ("japanese literature novels", 40),
    ("korean literature novels", 30),
    ("south asian literature", 30),
    ("haruki murakami", 20),
    ("han kang novels", 15),

    # Classics
    ("classic literature novels", 40),
    ("modern classics 20th century", 30),
    ("russian literature classics", 20),
    ("british classic novels", 20),
    ("american classic novels", 20),

    # Non-Fiction
    ("memoir autobiography bestseller", 30),
    ("self help popular books", 30),
    ("popular psychology books", 20),
    ("philosophy popular books", 20),
    ("feminism books popular", 20),

    # Poetry
    ("contemporary poetry collection", 20),
    ("poetry bestseller", 20),

    # Award Winners
    ("booker prize winner novel", 30),
    ("pulitzer prize fiction", 30),
    ("national book award fiction", 20),

    # Young Adult
    ("young adult fiction popular", 30),
    ("YA fantasy bestseller", 30),
]


def fetch_books_from_google(query, max_results=40):
    books = []
    for start in range(0, max_results, 40):
        batch_size = min(40, max_results - start)
        try:
            resp = requests.get(GOOGLE_BOOKS_API, params={
                "q": query,
                "maxResults": batch_size,
                "startIndex": start,
                "orderBy": "relevance",
                "printType": "books",
                "langRestrict": "en",
            }, timeout=15)

            if resp.status_code != 200:
                continue

            data = resp.json()
            items = data.get("items", [])
            books.extend(items)
            time.sleep(1)

        except Exception as e:
            print(f"  Error fetching: {e}")

    return books


def normalize_google_book(item):
    info = item.get("volumeInfo", {})

    title = info.get("title", "").strip()
    if not title:
        return None

    authors = info.get("authors", [])

    # Get cover — upgrade to larger size and https
    images = info.get("imageLinks", {})
    cover_url = images.get("thumbnail") or images.get("smallThumbnail")
    if cover_url:
        cover_url = cover_url.replace("http://", "https://")
        cover_url = cover_url.replace("zoom=1", "zoom=2")

    # Get ISBNs
    isbn_13 = None
    isbn_10 = None
    for identifier in info.get("industryIdentifiers", []):
        if identifier["type"] == "ISBN_13":
            isbn_13 = identifier["identifier"]
        elif identifier["type"] == "ISBN_10":
            isbn_10 = identifier["identifier"]

    # Get genres from categories — split "Fiction / Literary" into ["Fiction", "Literary"]
    categories = info.get("categories", [])
    genres = []
    for cat in categories:
        parts = [p.strip() for p in cat.split("/")]
        genres.extend(parts)
    # Remove duplicates, keep max 5
    genres = list(dict.fromkeys(genres))[:5]

    return {
        "title": title,
        "authors": authors,
        "isbn_13": isbn_13,
        "isbn_10": isbn_10,
        "cover_url": cover_url,
        "page_count": info.get("pageCount"),
        "publisher": info.get("publisher", ""),
        "publish_date": info.get("publishedDate", ""),
        "description": (info.get("description") or "")[:2000],
        "genres": genres if genres else ["Fiction"],
        "google_books_id": item.get("id"),
    }



class Command(BaseCommand):
    help = "Seed books from Google Books API across multiple categories"

    def add_arguments(self, parser):
        parser.add_argument("--target", type=int, default=1000)

    def handle(self, *args, **options):
        target = options["target"]
        created = 0
        skipped = 0

        # Load existing titles for duplicate check
        seen_titles = set(
            t.lower() for t in Book.objects.values_list("title", flat=True)
        )

        for category, count in CATEGORIES:
            if created >= target:
                break

            self.stdout.write(f'\nFetching: "{category}" ({count} books)...')
            items = fetch_books_from_google(category, max_results=count)
            self.stdout.write(f"  Got {len(items)} results from API")

            for item in items:
                if created >= target:
                    break

                book_data = normalize_google_book(item)
                if not book_data:
                    continue

                title = book_data["title"]

                # Skip if title already exists
                if title.lower() in seen_titles:
                    skipped += 1
                    continue

                # Skip if ISBN already exists
                try:
                    if book_data["isbn_13"] and Book.objects.filter(isbn_13=book_data["isbn_13"]).exists():
                        skipped += 1
                        continue
                    if book_data["isbn_10"] and Book.objects.filter(isbn_10=book_data["isbn_10"]).exists():
                        skipped += 1
                        continue

                    Book.objects.create(**book_data)
                    seen_titles.add(title.lower())
                    created += 1

                    if created % 50 == 0:
                        self.stdout.write(self.style.SUCCESS(
                            f"  Progress: {created}/{target} books created"
                        ))

                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"  Skipped '{title}': {e}"))
                    skipped += 1

        self.stdout.write(self.style.SUCCESS(
            f"\nDone! Created {created} books, skipped {skipped} duplicates."
        ))