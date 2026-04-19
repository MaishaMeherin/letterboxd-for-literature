import ast
import csv
from pathlib import Path

from django.core.management.base import BaseCommand

from books.models import Book


def _parse_list_field(raw, fallback=None):
    """
    The CSV stores list fields as Python list literals e.g. "['Fantasy', 'Young Adult']".
    ast.literal_eval safely converts that string into an actual Python list.
    If parsing fails (empty string, malformed), return the fallback.
    """
    if not raw or not raw.strip():
        return fallback if fallback is not None else []
    try:
        result = ast.literal_eval(raw)
        return result if isinstance(result, list) else fallback
    except (ValueError, SyntaxError):
        return fallback if fallback is not None else []


def _parse_page_count(raw):
    """
    num_pages is stored as "['652']". Parse the list and take the first element.
    """
    items = _parse_list_field(raw)
    if not items:
        return None
    try:
        return int(items[0])
    except (ValueError, TypeError):
        return None


def _parse_publish_date(raw):
    """
    publication_info is stored as "['First published July 16, 2005']".
    We strip the 'First published ' prefix and return the date string.
    """
    items = _parse_list_field(raw)
    if not items:
        return ""
    date_str = items[0].strip()
    for prefix in ("First published ", "Published "):
        if date_str.startswith(prefix):
            date_str = date_str[len(prefix):]
    return date_str[:20]  # Book.publish_date is max 20 chars


class Command(BaseCommand):
    help = "Seed the Book model from the Kaggle Goodreads Book_Details.csv dataset"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            required=True,
            help="Path to Book_Details.csv e.g. ../archive/Book_Details.csv",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Only process this many rows (useful for testing)",
        )
        parser.add_argument(
            "--offset",
            type=int,
            default=0,
            help="Skip this many rows before starting (for batched imports)",
        )

    def handle(self, *args, **options):
        file_path = Path(options["file"])
        limit = options["limit"]
        offset = options["offset"]

        if not file_path.exists():
            self.stdout.write(self.style.ERROR(f"File not found: {file_path}"))
            return

        created_count = 0
        updated_count = 0
        skipped_count = 0
        processed = 0

        with open(file_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)

            for row_index, row in enumerate(reader):

                # --offset: skip rows before the offset index
                if row_index < offset:
                    continue

                # --limit: stop after processing N rows
                if limit is not None and processed >= limit:
                    break

                try:
                    goodreads_id = row.get("book_id", "").strip()
                    title = row.get("book_title", "").strip()

                    # Both are required — skip if missing
                    if not goodreads_id or not title:
                        skipped_count += 1
                        continue

                    author = row.get("author", "").strip()
                    cover_url = row.get("cover_image_uri", "").strip() or None
                    description = row.get("book_details", "").strip()
                    genres = _parse_list_field(row.get("genres", ""))
                    page_count = _parse_page_count(row.get("num_pages", ""))
                    publish_date = _parse_publish_date(row.get("publication_info", ""))
                    goodreads_url = f"https://www.goodreads.com/book/show/{goodreads_id}"

                    try:
                        avg_rating = float(row.get("average_rating") or 0)
                    except ValueError:
                        avg_rating = 0

                    try:
                        rating_count = int(row.get("num_ratings") or 0)
                    except ValueError:
                        rating_count = 0

                    _, is_created = Book.objects.update_or_create(
                        goodreads_id=goodreads_id,
                        defaults={
                            "title": title,
                            "authors": [author] if author else [],
                            "cover_url": cover_url,
                            "description": description,
                            "genres": genres,
                            "page_count": page_count,
                            "publish_date": publish_date,
                            "goodreads_url": goodreads_url,
                            "avg_rating": avg_rating,
                            "rating_count": rating_count,
                        },
                    )

                    if is_created:
                        created_count += 1
                        self.stdout.write(f"  Created: {title}")
                    else:
                        updated_count += 1
                        self.stdout.write(f"  Updated: {title}")

                except Exception as e:
                    skipped_count += 1
                    self.stdout.write(
                        self.style.ERROR(f"  Error on row {row_index}: {e}")
                    )

                processed += 1

                if processed % 100 == 0:
                    self.stdout.write(
                        self.style.WARNING(f"--- {processed} rows processed ---")
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. Created: {created_count} | Updated: {updated_count} | Skipped: {skipped_count}"
            )
        )
