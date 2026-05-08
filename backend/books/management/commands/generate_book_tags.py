import json
import time
from django.core.management.base import BaseCommand
from django.db.models import Count
from groq import Groq
from django.conf import settings
from books.models import Book, BookShelfTag
from books.groq_utils import PROMPT_TEMPLATE


class Command(BaseCommand):
    help = "Generate AI mood tags for books without shelf tags using Groq"

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Only process this many books (useful for testing)",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=10,
            help="Number of books to send per Groq call (default: 10)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Print tags without saving to DB",
        )

    def handle(self, *args, **options):
        limit = options["limit"]
        batch_size = options["batch_size"]
        dry_run = options["dry_run"]

        client = Groq(api_key=settings.GROQ_API_KEY)

        # Only process books with no shelf tags and a description
        queryset = (Book.objects
            .annotate(tag_count=Count("shelf_tags"))
            .filter(tag_count=0)
            .exclude(description="")
            .order_by("-rating_count"))

        if limit:
            queryset = queryset[:limit]

        books = list(queryset)
        total = len(books)
        self.stdout.write(f"Found {total} books to process.\n")

        created_total = 0
        failed = 0

        # Process in batches
        for i in range(0, total, batch_size):
            batch = books[i:i + batch_size]
            self.stdout.write(f"Processing batch {i // batch_size + 1} ({len(batch)} books)...")

            # Build the books block for this batch
            entries = []
            for b in batch:
                genres = ", ".join(b.genres[:4]) if b.genres else "unknown"
                desc = b.description[:300].replace("\n", " ")
                entries.append(
                    f"TITLE: {b.title}\n"
                    f"AUTHOR: {', '.join(b.authors[:2])}\n"
                    f"GENRES: {genres}\n"
                    f"AVG RATING: {b.avg_rating}/5\n"
                    f"DESCRIPTION: {desc}"
                )

            books_block = "\n\n---\n\n".join(entries)
            prompt = PROMPT_TEMPLATE.format(books_block=books_block)

            try:
                response = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                )
                data = json.loads(response.choices[0].message.content)
                results = data.get("books", [])

                # Build a lookup by title for matching
                book_map = {b.title.lower(): b for b in batch}

                for result in results:
                    title = result.get("title", "")
                    # tags is a dict: {emotional_tone: [], pacing_style: [], themes: []}
                    # flatten all values into a single list
                    tags_dict = result.get("tags", {})
                    if isinstance(tags_dict, dict):
                        all_tags = (
                            tags_dict.get("emotional_tone", [])
                            + tags_dict.get("pacing_style", [])
                            + tags_dict.get("themes", [])
                        )
                    else:
                        all_tags = tags_dict  # fallback if Groq returns a flat list

                    reasoning = result.get("reasoning", "")
                    confidence = result.get("confidence", "")
                    book = book_map.get(title.lower())

                    if not book:
                        self.stdout.write(self.style.WARNING(f"  No match for: {title}"))
                        continue

                    if dry_run:
                        self.stdout.write(f"\n  {book.title} [{confidence}]:")
                        self.stdout.write(f"    {reasoning}")
                        for tag in all_tags:
                            self.stdout.write(f"    - {tag}")
                        continue

                    batch_created = 0
                    for tag in all_tags:
                        tag = tag.strip().lower()
                        if not tag:
                            continue
                        _, created = BookShelfTag.objects.get_or_create(
                            book=book,
                            tag=tag,
                            defaults={"mention_count": 0},
                        )
                        if created:
                            batch_created += 1

                    created_total += batch_created
                    self.stdout.write(
                        self.style.SUCCESS(f"  {book.title} — {batch_created} tags saved")
                    )

            except Exception as e:
                failed += 1
                self.stdout.write(self.style.ERROR(f"  Batch failed: {e}"))

            # Small delay between batches to avoid rate limiting
            if i + batch_size < total:
                time.sleep(1)

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. Tags created: {created_total} | Batches failed: {failed}"
            )
        )