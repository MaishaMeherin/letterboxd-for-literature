import html
import json
import logging
import re
import time

from apify_client import ApifyClient
from celery import shared_task
from django.conf import settings
from groq import Groq

from books.models import Book, BookShelfTag
from books.groq_utils import PROMPT_TEMPLATE

logger = logging.getLogger(__name__)


GENRE_URLS = {
    "Fiction": "https://www.goodreads.com/genres/new_releases/fiction",
    "Romance": "https://www.goodreads.com/genres/new_releases/romance",
    "Thriller": "https://www.goodreads.com/genres/new_releases/thriller",
    "Fantasy": "https://www.goodreads.com/genres/new_releases/fantasy",
    "Mystery": "https://www.goodreads.com/genres/new_releases/mystery",
    "Science Fiction": "https://www.goodreads.com/genres/new_releases/science-fiction",
    "Historical Fiction": "https://www.goodreads.com/genres/new_releases/historical-fiction",
    "Young Adult": "https://www.goodreads.com/genres/new_releases/young-adult",
    "Memoir": "https://www.goodreads.com/genres/new_releases/memoir",
    "Literary Fiction": "https://www.goodreads.com/genres/new_releases/literary-fiction",
}


def _strip_html(text):
    text = re.sub(r"<[^>]+>", " ", text or "")
    text = html.unescape(text)
    return " ".join(text.split())


def _map_apify_item(item, genre):
    title = (item.get("title") or "").strip()
    if not title:
        return None

    raw_isbn = str(item.get("ISBN") or "").strip()
    isbn_13 = raw_isbn if len(raw_isbn) == 13 else None
    isbn_10 = raw_isbn if len(raw_isbn) == 10 else None

    try:
        page_count = int(item.get("numberOfPages") or 0) or None
    except (ValueError, TypeError):
        page_count = None

    try:
        avg_rating = float(item.get("rating") or 0)
    except (ValueError, TypeError):
        avg_rating = 0

    try:
        rating_count = int(item.get("numberOfRatings") or 0)
    except (ValueError, TypeError):
        rating_count = 0

    return {
        "title": title,
        "authors": [item["authorName"]] if item.get("authorName") else [],
        "goodreads_id": str(item.get("bookId") or "").strip() or None,
        "goodreads_url": item.get("url") or "",
        "cover_url": item.get("image") or None,
        "isbn_13": isbn_13,
        "isbn_10": isbn_10,
        "page_count": page_count,
        "publish_date": item.get("firstPublishedDate") or "",
        "publisher": item.get("publishedBy") or "",
        "description": _strip_html(item.get("description"))[:2000],
        "genres": [genre],
        "avg_rating": avg_rating,
        "rating_count": rating_count,
    }


@shared_task
def fetch_new_releases():
    client = ApifyClient(settings.APIFY_API_TOKEN)

    created = 0
    skipped = 0
    new_book_ids = []

    for genre, url in GENRE_URLS.items():
        try:
            run = client.actor("sk1JsDmbderUw0J79").call(                  
                run_input={                                                
                    "startUrls": [url],
                    "maxItems": 30,                                        
                    "proxy": {
                        "useApifyProxy": True,
                    },                                                     
                }
            )

            items = client.dataset(run["defaultDatasetId"]).iterate_items()

            for item in items:
                fields = _map_apify_item(item, genre)
                if not fields:
                    continue

                if (
                    fields["goodreads_id"]
                    and Book.objects.filter(
                        goodreads_id=fields["goodreads_id"]
                    ).exists()
                ):
                    skipped += 1
                    continue

                if (
                    fields["isbn_13"]
                    and Book.objects.filter(
                        isbn_13=fields["isbn_13"]
                    ).exists()
                ):
                    skipped += 1
                    continue

                if (
                    fields["isbn_10"]
                    and Book.objects.filter(
                        isbn_10=fields["isbn_10"]
                    ).exists()
                ):
                    skipped += 1
                    continue

                if Book.objects.filter(
                    title__iexact=fields["title"]
                ).exists():
                    skipped += 1
                    continue

                book = Book.objects.create(**fields)
                new_book_ids.append(str(book.id))
                created += 1

                logger.info("New release added: %s", fields["title"])

        except Exception:
            logger.exception(
                "Error fetching new releases for genre '%s'", genre
            )

        time.sleep(3)

    logger.info(
        "fetch_new_releases done — created: %d, skipped: %d",
        created,
        skipped,
    )

    if new_book_ids:
        tag_new_books.delay(new_book_ids)

    return {"created": created, "skipped": skipped}


@shared_task
def tag_new_books(book_ids):
    client = Groq(api_key=settings.GROQ_API_KEY)
    books = list(Book.objects.filter(id__in=book_ids))

    if not books:
        logger.warning("tag_new_books called with no matching books")
        return

    tagged = 0
    failed_batches = 0
    batch_size = 10

    for i in range(0, len(books), batch_size):
        batch = books[i:i + batch_size]

        entries = []
        for b in batch:
            genres = ", ".join(b.genres[:4]) if b.genres else "unknown"
            desc = (b.description or "")[:300].replace("\n", " ")
            entries.append(
                f"TITLE: {b.title}\n"
                f"AUTHOR: {', '.join(b.authors[:2])}\n"
                f"GENRES: {genres}\n"
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
            book_map = {b.title.lower(): b for b in batch}

            for result in data.get("books", []):
                title = result.get("title", "")
                tags_dict = result.get("tags", {})
                all_tags = (
                    tags_dict.get("emotional_tone", [])
                    + tags_dict.get("pacing_style", [])
                    + tags_dict.get("themes", [])
                )
                book = book_map.get(title.lower())
                if not book:
                    continue
                for tag in all_tags:
                    tag = tag.strip().lower()
                    if tag:
                        BookShelfTag.objects.get_or_create(
                            book=book,
                            tag=tag,
                            defaults={"mention_count": 0},
                        )
                tagged += 1
                logger.info("Tagged: %s", book.title)

        except Exception:
            failed_batches += 1
            logger.exception("Groq tagging failed for batch starting at index %d", i)

        if i + batch_size < len(books):
            time.sleep(2.5)

    logger.info("tag_new_books done — tagged: %d books, failed batches: %d", tagged, failed_batches)


@shared_task
def tag_untagged_books_daily():
    from django.db.models import Count
    untagged = list(
        Book.objects
        .annotate(tag_count=Count("shelf_tags"))
        .filter(tag_count=0)
        .exclude(description="")
        .values_list("id", flat=True)[:200]
    )
    if not untagged:
        logger.info("tag_untagged_books_daily: no untagged books remaining")
        return
    logger.info("tag_untagged_books_daily: queuing %d books", len(untagged))
    tag_new_books.delay([str(i) for i in untagged])


AWARD_LISTS = {
    "Best Books Ever": [
        "https://www.goodreads.com/list/show/1",
    ],
}


@shared_task(time_limit=86400)
def fetch_award_books():
    client = ApifyClient(settings.APIFY_API_TOKEN)
    created = 0
    updated = 0
    new_book_ids = []

    for category, urls in AWARD_LISTS.items():
        for url in urls:
            try:
                logger.info("fetch_award_books: scraping %s (%s)", url, category)
                run = client.actor("sk1JsDmbderUw0J79").call(run_input={
                    "startUrls": [url],
                    "maxItems": 15000,
                    "proxy": {"useApifyProxy": True},
                })

                for item in client.dataset(run["defaultDatasetId"]).iterate_items():
                    fields = _map_apify_item(item, category)
                    if not fields:
                        continue

                    existing = None
                    if fields["goodreads_id"]:
                        existing = Book.objects.filter(goodreads_id=fields["goodreads_id"]).first()
                    if not existing and fields["isbn_13"]:
                        existing = Book.objects.filter(isbn_13=fields["isbn_13"]).first()
                    if not existing and fields["isbn_10"]:
                        existing = Book.objects.filter(isbn_10=fields["isbn_10"]).first()
                    if not existing:
                        existing = Book.objects.filter(title__iexact=fields["title"]).first()

                    if existing:
                        genres = list(existing.genres or [])
                        if category not in genres:
                            genres.append(category)
                            existing.genres = genres
                            existing.save(update_fields=["genres"])
                            updated += 1
                    else:
                        book = Book.objects.create(**fields)
                        new_book_ids.append(str(book.id))
                        created += 1
                        logger.info("Award book added: %s", fields["title"])

            except Exception:
                logger.exception("fetch_award_books: error scraping %s", url)

            time.sleep(3)

    logger.info("fetch_award_books done — created: %d, updated: %d", created, updated)

    if new_book_ids:
        tag_new_books.delay(new_book_ids)

    return {"created": created, "updated": updated}
