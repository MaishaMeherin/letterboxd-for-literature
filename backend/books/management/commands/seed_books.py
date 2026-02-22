import requests
import time
from django.core.management.base import BaseCommand
from books.models import Book


SUBJECTS = [
    'feminism',
    'fiction',
    'fantasy',
    'romance',
    'science_fiction',
    'mystery',
    'thriller',
    'horror',
    'poetry',
    'biography',
    'self_help',
    'philosophy',
    'psychology',
    'history',
    'classic_literature',
]


class Command(BaseCommand):
    help = 'Seed the database with books from Open Library'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=100, help='Number of books to seed')

    def handle(self, *args, **options):
        target = options['count']
        created_count = 0
        books_per_subject = (target // len(SUBJECTS)) + 1

        for subject in SUBJECTS:
            if created_count >= target:
                break

            self.stdout.write(f'Fetching "{subject}" books...')

            try:
                url = f'https://openlibrary.org/subjects/{subject}.json?limit={books_per_subject}'
                response = requests.get(url, timeout=15)
                response.raise_for_status()
                data = response.json()
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'  Failed to fetch {subject}: {e}'))
                continue

            for work in data.get('works', []):
                if created_count >= target:
                    break

                title = work.get('title', '').strip()
                if not title:
                    continue

                # Skip if already exists
                if Book.objects.filter(title=title).exists():
                    continue

                # Get authors
                authors = [a.get('name', '') for a in work.get('authors', [])]

                # Get cover URL
                cover_id = work.get('cover_id')
                cover_url = f'https://covers.openlibrary.org/b/id/{cover_id}-L.jpg' if cover_id else None

                # Get Open Library key
                ol_key = work.get('key', '')  # e.g. /works/OL123W
                ol_id = ol_key.split('/')[-1] if ol_key else None

                # Fetch detailed info for page count and description
                page_count = None
                description = ''
                isbn_13 = None
                isbn_10 = None
                publisher = ''
                publish_date = ''

                if ol_id:
                    try:
                        detail_url = f'https://openlibrary.org/works/{ol_id}.json'
                        detail_resp = requests.get(detail_url, timeout=10)
                        detail_data = detail_resp.json()

                        desc = detail_data.get('description', '')
                        if isinstance(desc, dict):
                            description = desc.get('value', '')
                        elif isinstance(desc, str):
                            description = desc

                        # Try to get an edition for ISBN and page count
                        edition_key = work.get('cover_edition_key')
                        if edition_key:
                            ed_url = f'https://openlibrary.org/books/{edition_key}.json'
                            ed_resp = requests.get(ed_url, timeout=10)
                            ed_data = ed_resp.json()

                            page_count = ed_data.get('number_of_pages')
                            isbns_13 = ed_data.get('isbn_13', [])
                            isbns_10 = ed_data.get('isbn_10', [])
                            isbn_13 = isbns_13[0] if isbns_13 else None
                            isbn_10 = isbns_10[0] if isbns_10 else None
                            publishers = ed_data.get('publishers', [])
                            publisher = publishers[0] if publishers else ''
                            publish_date = ed_data.get('publish_date', '')

                    except Exception:
                        pass

                try:
                    Book.objects.create(
                        title=title,
                        authors=authors,
                        isbn_10=isbn_10,
                        isbn_13=isbn_13,
                        cover_url=cover_url,
                        page_count=page_count,
                        publisher=publisher,
                        publish_date=publish_date,
                        description=description[:2000] if description else '',
                        genres=[subject.replace('_', ' ').title()],
                    )
                    created_count += 1
                    self.stdout.write(f'  [{created_count}/{target}] {title}')
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'  Skipped "{title}": {e}'))

                # Be respectful of rate limits
                time.sleep(0.5)

        self.stdout.write(self.style.SUCCESS(f'\nDone! Created {created_count} books.'))