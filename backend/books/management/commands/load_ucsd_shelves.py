import gzip
import json
from pathlib import Path

from django.core.management.base import BaseCommand

from books.models import Book, BookShelfTag

# Tags that carry no mood/vibe signal — skip these entirely
NOISE_EXACT = {
    "to-read", "currently-reading", "read", "dnf", "did-not-finish",
    "abandoned", "default", "books", "novel", "series", "audiobook",
    "ebook", "nook", "kindle", "paperback", "hardcover", "hardback",
    "owned", "own", "library", "shelf", "wishlist", "tbr", "reviewed",
    "finished", "purchased", "downloaded", "favorites", "favourites",
    "faves", "fave", "borrowed", "re-read", "fiction", "non-fiction",
}

# Tags starting with these prefixes are noise
NOISE_PREFIXES = (
    "to-read-", "read-", "own-", "owned-", "my-",
    "i-own", "i-have", "have-", "kindle-", "ebook-",
    "nook-", "audiobook-", "tbr-",
)

# Tags containing these substrings are format/platform noise
NOISE_SUBSTRINGS = (
    "kindle", "ebook", "e-book", "nook", "audiobook",
    "library", "wishlist", "scribd", "oyster", "google-drive",
    "amazon", "ibook",
)


def is_noise(name):
    # Year/numbered shelves start with a digit (e.g. "2015-reads", "1-star")
    if name and name[0].isdigit():
        return True
    if name in NOISE_EXACT:
        return True
    for prefix in NOISE_PREFIXES:
        if name.startswith(prefix):
            return True
    for sub in NOISE_SUBSTRINGS:
        if sub in name:
            return True
    return False


def open_file(path):
    """Open .json or .json.gz transparently."""
    if path.suffix == ".gz":
        return gzip.open(path, "rt", encoding="utf-8")
    return open(path, "r", encoding="utf-8")


class Command(BaseCommand):
    help = "Load BookShelfTags from a UCSD Book Graph JSON file (e.g. goodreads_books_romance.json)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            required=True,
            help="Path to the UCSD JSON or JSON.GZ file",
        )
        parser.add_argument(
            "--min-count",
            type=int,
            default=2,
            help="Minimum shelf count to include a tag (default: 2)",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Stop after matching this many books (useful for testing)",
        )

    def handle(self, *args, **options):
        file_path = Path(options["file"])
        min_count = options["min_count"]
        limit = options["limit"]

        if not file_path.exists():
            self.stdout.write(self.style.ERROR(f"File not found: {file_path}"))
            return

        # Load all our goodreads_ids into a set for fast O(1) lookup.
        # This avoids a DB query for every line in a 335k-record file.
        self.stdout.write("Loading goodreads IDs from database...")
        our_ids = set(
            Book.objects.exclude(goodreads_id__isnull=True)
            .exclude(goodreads_id="")
            .values_list("goodreads_id", flat=True)
        )
        self.stdout.write(f"Tracking {len(our_ids)} books.\n")

        lines_read = 0
        books_matched = 0
        tags_created = 0
        tags_skipped = 0

        with open_file(file_path) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue

                lines_read += 1

                if lines_read % 1000 == 0:
                    self.stdout.write(
                        self.style.WARNING(
                            f"--- {lines_read} lines read | {books_matched} books matched ---"
                        )
                    )

                try:
                    record = json.loads(line)
                except json.JSONDecodeError:
                    continue

                book_id = str(record.get("book_id", "")).strip()
                if book_id not in our_ids:
                    continue

                # We have a match — fetch the book and process its shelves
                books_matched += 1

                try:
                    book = Book.objects.get(goodreads_id=book_id)
                except Book.DoesNotExist:
                    continue

                for shelf in record.get("popular_shelves", []):
                    name = shelf.get("name", "").strip().lower()
                    try:
                        count = int(shelf.get("count", 0))
                    except (ValueError, TypeError):
                        count = 0

                    # Skip noise and low-count tags
                    if count < min_count or is_noise(name):
                        continue

                    _, created = BookShelfTag.objects.get_or_create(
                        book=book,
                        tag=name,
                        defaults={"mention_count": count},
                    )
                    if created:
                        tags_created += 1
                    else:
                        tags_skipped += 1

                self.stdout.write(
                    f"  Matched: {record.get('title', book_id)} "
                    f"({book_id}) — {tags_created} tags so far"
                )

                if limit is not None and books_matched >= limit:
                    self.stdout.write(self.style.WARNING("Limit reached, stopping."))
                    break

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. Lines read: {lines_read} | Books matched: {books_matched} "
                f"| Tags created: {tags_created} | Tags already existed: {tags_skipped}"
            )
        )
