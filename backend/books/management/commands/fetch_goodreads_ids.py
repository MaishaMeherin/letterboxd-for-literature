import time
import random
import re
import requests
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand
from books.models import Book

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml",
}


def search_goodreads_id(title, authors):
    author = authors[0] if authors else ""
    query = f"{title} {author}".strip()
    url = f"https://www.goodreads.com/search?q={requests.utils.quote(query)}"

    time.sleep(random.uniform(3, 7))
    response = requests.get(url, headers=HEADERS, timeout=15)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    # first result is in a <tr> with class bookTitle
    first_result = soup.find("a", class_="bookTitle")
    if not first_result:
        return None, None

    href = first_result.get("href", "")
    # href looks like /book/show/2429135-the-road
    match = re.search(r"/book/show/(\d+)", href)
    if not match:
        return None, None

    goodreads_id = match.group(1)
    goodreads_url = f"https://www.goodreads.com{href}"
    return goodreads_id, goodreads_url


class Command(BaseCommand):
    help = "Search Goodreads for each book and save its goodreads_id"

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Only process this many books (optional)",
        )

    def handle(self, *args, **options):
        limit = options["limit"]

        queryset = Book.objects.filter(
            goodreads_id__isnull=True,
        ).exclude(goodreads_id="")

        # also catch empty string
        queryset = Book.objects.filter(
            goodreads_id__isnull=True
        ) | Book.objects.filter(goodreads_id="")

        if limit:
            queryset = queryset[:limit]

        total = queryset.count()
        if total == 0:
            self.stdout.write("All books already have a Goodreads ID.")
            return

        self.stdout.write(f"Searching Goodreads for {total} books...\n")
        found = 0
        not_found = 0

        for book in queryset:
            try:
                goodreads_id, goodreads_url = search_goodreads_id(
                    book.title, book.authors
                )
                if goodreads_id:
                    book.goodreads_id = goodreads_id
                    book.goodreads_url = goodreads_url
                    book.save(update_fields=["goodreads_id", "goodreads_url"])
                    self.stdout.write(
                        self.style.SUCCESS(f"  Found: {book.title} →  {goodreads_id}")
                    )
                    found += 1
                else:
                    self.stdout.write(
                        self.style.WARNING(f"  Not found: {book.title}")
                    )
                    not_found += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"  Error on '{book.title}': {e}")
                )
                not_found += 1

        self.stdout.write(f"\nDone. Found: {found} | Not found: {not_found}")