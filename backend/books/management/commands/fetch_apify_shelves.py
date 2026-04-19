import json
import os

from apify_client import ApifyClient
from django.core.management.base import BaseCommand

from books.models import Book, BookShelfTag


class Command(BaseCommand):
    help = "Fetch shelf tags for specific books via Apify Goodreads scraper"

    def add_arguments(self, parser):
        parser.add_argument(
            "--goodreads-ids",
            nargs="+",
            type=str,
            help="Space-separated list of Goodreads book IDs",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Print raw Apify output without saving to DB",
        )

    def handle(self, *args, **options):
        token = os.getenv("APIFY_API_TOKEN")
        if not token:
            self.stdout.write(self.style.ERROR("APIFY_API_TOKEN not set."))
            return

        goodreads_ids = options["goodreads_ids"]
        dry_run = options["dry_run"]

        if not goodreads_ids:
            self.stdout.write(self.style.ERROR("Provide at least one --goodreads-ids value."))
            return

        # Build Goodreads /shelves URLs from IDs
        start_urls = [
            f"https://www.goodreads.com/book/show/{gid}/shelves"
            for gid in goodreads_ids
        ]

        self.stdout.write(f"Sending {len(start_urls)} URLs to Apify...\n")

        client = ApifyClient(token)

        run_input = {
            "startUrls": start_urls,
            "includeReviews": False,
            "proxy": {
                "useApifyProxy": True,
                "apifyProxyGroups": ["RESIDENTIAL"],
            },
        }

        run = client.actor("epctex/goodreads-scraper").call(run_input=run_input)

        items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
        self.stdout.write(f"Apify returned {len(items)} item(s).\n")

        for item in items:
            book_id = str(item.get("bookId", ""))
            title = item.get("title", "unknown")

            self.stdout.write(f"\n{'='*60}")
            self.stdout.write(f"Book: {title} (bookId={book_id})")
            self.stdout.write(f"{'='*60}")

            if dry_run:
                # Print every field so we can inspect the raw schema
                self.stdout.write(json.dumps(item, indent=2, default=str))
                continue

            # --- Save shelf tags to DB ---
            # Check what field contains shelf data
            shelves = (
                item.get("shelves")          # guide says this
                or item.get("popular_shelves")  # UCSD format
                or item.get("genres")        # fallback
                or []
            )

            if not book_id:
                self.stdout.write(self.style.WARNING("  No bookId, skipping."))
                continue

            try:
                book = Book.objects.get(goodreads_id=book_id)
            except Book.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"  Book {book_id} not in DB, skipping."))
                continue

            if not shelves:
                self.stdout.write(self.style.WARNING(f"  No shelf data found for {title}."))
                self.stdout.write(f"  Available fields: {list(item.keys())}")
                continue

            created_count = 0
            for shelf in shelves:
                # Handle both dict format {"name": ..., "count": ...} and plain string
                if isinstance(shelf, dict):
                    name = shelf.get("name", "").strip().lower()
                    count = int(shelf.get("count", 1))
                else:
                    name = str(shelf).strip().lower()
                    count = 1

                if not name:
                    continue

                _, created = BookShelfTag.objects.get_or_create(
                    book=book,
                    tag=name,
                    defaults={"mention_count": count},
                )
                if created:
                    created_count += 1

            self.stdout.write(
                self.style.SUCCESS(f"  Saved {created_count} new tags for {title}")
            )

        self.stdout.write(self.style.SUCCESS("\nDone."))
