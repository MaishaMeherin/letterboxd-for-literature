from django.core.management.base import BaseCommand
from django.db.models import Count, Max


class Command(BaseCommand):
    help = "Delete duplicate book editions, keeping the one with the highest rating_count per title. Skips books with user data attached."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Report what would be deleted without actually deleting anything",
        )

    def handle(self, *args, **options):
        from books.models import Book

        dry_run = options["dry_run"]

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN — nothing will be deleted.\n"))

        # Find all titles that have more than one book record
        duplicate_titles = (
            Book.objects
            .values("title")
            .annotate(count=Count("id"))
            .filter(count__gt=1)
            .values_list("title", flat=True)
        )

        total_titles = len(duplicate_titles)
        self.stdout.write(f"Found {total_titles} titles with duplicate editions.\n")

        deleted_total = 0
        skipped_total = 0

        for title in duplicate_titles:
            editions = list(
                Book.objects
                .filter(title=title)
                .order_by("-rating_count", "-avg_rating")
            )

            # The first edition is the keeper (highest rating_count)
            keeper = editions[0]
            duplicates = editions[1:]

            for book in duplicates:
                has_logs = book.reading_logs.exists()
                has_reviews = book.reviews.exists()
                has_shelf_tags = book.shelf_tags.exists()

                if has_logs or has_reviews or has_shelf_tags:
                    skipped_total += 1
                    if dry_run:
                        reasons = []
                        if has_logs:
                            reasons.append("reading logs")
                        if has_reviews:
                            reasons.append("reviews")
                        if has_shelf_tags:
                            reasons.append("shelf tags")
                        self.stdout.write(
                            f"  SKIP  [{', '.join(reasons)}]  {title!r}  goodreads_id={book.goodreads_id}"
                        )
                    continue

                deleted_total += 1
                if dry_run:
                    self.stdout.write(
                        f"  DEL   {title!r}  goodreads_id={book.goodreads_id}  rating_count={book.rating_count}"
                    )
                else:
                    book.delete()

        action = "Would delete" if dry_run else "Deleted"
        self.stdout.write(
            self.style.SUCCESS(
                f"\n{action}: {deleted_total} duplicate editions | Skipped (has user data): {skipped_total}"
            )
        )