import requests
import time
from django.core.management.base import BaseCommand
from books.models import Book


SPECIFIC_BOOKS = [
    # Your reading list
    "Everything I Know About Love",
    "All About Love",
    "A Psalm for the Wild-Built",
    "Babel",
    "Great Big Beautiful Life",
    "Klara and the Sun",
    "Heaven Mieko Kawakami",
    "Six of Crows",
    "The Hunger Games",
    "On Earth We're Briefly Gorgeous",
    "Kim Jiyoung Born 1988",
    "I Want to Die but I Want to Eat Ttoekbokki",
    "The Strength in Our Scars",
    "Convenience Store Woman",
    "The Score Elle Kennedy",
    "Forty Rules of Love",
    "Once Upon a Broken Heart",
    "The Da Vinci Code",
    "Funny Story Emily Henry",
    "Happy Place Emily Henry",
    "Verity Colleen Hoover",
    # Suguru Miaki books
    "Three Days of Happiness Suguru Miaki",
    "Parasite in Love Suguru Miaki",
    "Pain Pain Go Away Suguru Miaki",
    "Starting Over Suguru Miaki",
    "I Sold My Life for Ten Thousand Yen Per Year Vol 1",
    "I Sold My Life for Ten Thousand Yen Per Year Vol 2",
    "I Sold My Life for Ten Thousand Yen Per Year Vol 3",
    "Your Story Suguru Miaki",
    "I Had That Same Dream Again Suguru Miaki",
    "At Night I Become a Monster Suguru Miaki",
    "I'm in Love and It's the End of the World Suguru Miaki",
    "Azure and Claude Suguru Miaki",
    # Similar books you'd probably love
    "The Midnight Library",
    "Normal People",
    "My Year of Rest and Relaxation",
    "Pachinko",
    "The Vegetarian Han Kang",
    "Human Acts Han Kang",
    "Crying in H Mart",
    "The House in the Cerulean Sea",
    "Before the Coffee Gets Cold",
    "Breasts and Eggs Mieko Kawakami",
    "Circe Madeline Miller",
    "The Song of Achilles",
    "Little Fires Everywhere",
    "Earthlings Sayaka Murata",
    "Where the Crawdads Sing",
    "Beach Read Emily Henry",
    "Book Lovers Emily Henry",
    "People We Meet on Vacation",
    "The Love Hypothesis",
    "It Ends with Us",
    "November 9 Colleen Hoover",
    "Ugly Love Colleen Hoover",
    "Reminders of Him Colleen Hoover",
    "The Seven Husbands of Evelyn Hugo",
    "Daisy Jones and the Six",
    "Malibu Rising",
    "Tomorrow and Tomorrow and Tomorrow",
    "Lessons in Chemistry",
    "Anxious People Fredrik Backman",
    "A Man Called Ove",
    "The Alchemist Paulo Coelho",
    "Norwegian Wood Haruki Murakami",
    "Kafka on the Shore",
    "1Q84 Murakami",
    "Colorless Tsukuru Tazaki",
    "No Longer Human Osamu Dazai",
    "The Setting Sun Osamu Dazai",
    "Never Let Me Go Kazuo Ishiguro",
    "The Remains of the Day",
    "Crooked Kingdom Leigh Bardugo",
    "Shadow and Bone",
    "King of Scars",
    "The Poppy War",
    "The Name of the Wind",
    "Piranesi Susanna Clarke",
    "The Night Circus",
    "The Invisible Life of Addie LaRue",
    "The Priory of the Orange Tree",
    "Fourth Wing",
    "A Court of Thorns and Roses",
    "A Little Life Hanya Yanagihara",
    "Educated Tara Westover",
    "Becoming Michelle Obama",
    "The Glass Castle",
    "When Breath Becomes Air",
    "The Body Keeps the Score",
    "Milk and Honey Rupi Kaur",
    "The Sun and Her Flowers",
    "Home Body Rupi Kaur",
    "Salt Fat Acid Heat",
    "Atomic Habits",
    "The Subtle Art of Not Giving a Fck",
]

GENRE_MAP = {
    "romance": ["The Score", "Happy Place", "Beach Read", "Book Lovers", "People We Meet",
                 "Love Hypothesis", "Funny Story", "It Ends with Us", "Ugly Love",
                 "November 9", "Reminders of Him", "Once Upon a Broken Heart"],
    "literary fiction": ["On Earth", "Normal People", "My Year of Rest", "A Little Life",
                         "Tomorrow and Tomorrow", "Lessons in Chemistry", "Little Fires",
                         "Where the Crawdads", "Seven Husbands", "Daisy Jones", "Malibu Rising"],
    "asian literature": ["Kim Jiyoung", "Convenience Store", "Pachinko", "Vegetarian",
                         "Human Acts", "Crying in H Mart", "Heaven", "Breasts and Eggs",
                         "Earthlings", "Before the Coffee", "Norwegian Wood", "Kafka on the Shore",
                         "1Q84", "Colorless Tsukuru", "No Longer Human", "Setting Sun",
                         "Never Let Me", "Remains of the Day", "Klara", "Ttoekbokki",
                         "Three Days of Happiness", "I Had That Same Dream", "At Night I Become",
                         "Suguru Miaki", "Parasite in Love", "Pain Pain Go Away",
                         "Starting Over", "Sold My Life", "Your Story", "Azure and Claude",
                         "End of the World"],
    "fantasy": ["Six of Crows", "Crooked Kingdom", "Shadow and Bone", "King of Scars",
                "Poppy War", "Name of the Wind", "Piranesi", "Night Circus",
                "Addie LaRue", "Priory", "Fourth Wing", "Court of Thorns",
                "Circe", "Song of Achilles", "Babel", "Hunger Games"],
    "sci-fi": ["Klara and the Sun", "Psalm for the Wild", "Midnight Library",
               "House in the Cerulean Sea"],
    "self-help": ["Atomic Habits", "Subtle Art", "Strength in Our Scars",
                  "Body Keeps the Score", "Alchemist"],
    "poetry": ["Milk and Honey", "Sun and Her Flowers", "Home Body"],
    "memoir": ["Educated", "Becoming", "Glass Castle", "When Breath Becomes Air",
               "Everything I Know About Love"],
    "philosophy": ["All About Love", "Forty Rules of Love", "Anxious People", "Man Called Ove"],
    "thriller": ["Da Vinci Code", "Verity"],
    "non-fiction": ["Salt Fat Acid Heat"],
}


def get_genres(title):
    genres = []
    for genre, keywords in GENRE_MAP.items():
        for keyword in keywords:
            if keyword.lower() in title.lower():
                genres.append(genre.title())
                break
    return genres if genres else ["Fiction"]


class Command(BaseCommand):
    help = 'Seed the database with curated books from Open Library'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=len(SPECIFIC_BOOKS),
                            help='Number of books to seed')

    def handle(self, *args, **options):
        target = min(options['count'], len(SPECIFIC_BOOKS))
        created = 0
        skipped = 0

        for title_query in SPECIFIC_BOOKS[:target]:
            if Book.objects.filter(title__icontains=title_query.split()[0]).exists():
                # Simple duplicate check
                pass

            self.stdout.write(f'Searching: "{title_query}"...')

            try:
                url = 'https://openlibrary.org/search.json'
                params = {'q': title_query, 'limit': 1, 'fields': 'key,title,author_name,cover_i,number_of_pages_median,publisher,first_publish_year,isbn,subject'}
                resp = requests.get(url, params=params, timeout=15)
                resp.raise_for_status()
                data = resp.json()

                docs = data.get('docs', [])
                if not docs:
                    self.stdout.write(self.style.WARNING(f'  Not found: "{title_query}"'))
                    continue

                doc = docs[0]
                title = doc.get('title', title_query)

                # Skip if already exists
                if Book.objects.filter(title__iexact=title).exists():
                    self.stdout.write(f'  Already exists: "{title}"')
                    skipped += 1
                    continue

                authors = doc.get('author_name', [])
                cover_id = doc.get('cover_i')
                cover_url = f'https://covers.openlibrary.org/b/id/{cover_id}-L.jpg' if cover_id else None
                page_count = doc.get('number_of_pages_median')
                publishers = doc.get('publisher', [])
                publisher = publishers[0] if publishers else ''
                publish_year = doc.get('first_publish_year', '')
                isbns = doc.get('isbn', [])
                isbn_13 = None
                isbn_10 = None
                for isbn in isbns:
                    if len(isbn) == 13 and not isbn_13:
                        isbn_13 = isbn
                    elif len(isbn) == 10 and not isbn_10:
                        isbn_10 = isbn
                    if isbn_13 and isbn_10:
                        break

                # Get description from works API
                description = ''
                work_key = doc.get('key', '')
                if work_key:
                    try:
                        work_url = f'https://openlibrary.org{work_key}.json'
                        work_resp = requests.get(work_url, timeout=10)
                        work_data = work_resp.json()
                        desc = work_data.get('description', '')
                        if isinstance(desc, dict):
                            description = desc.get('value', '')
                        elif isinstance(desc, str):
                            description = desc
                    except Exception:
                        pass

                genres = get_genres(title_query)

                # Get subjects from Open Library as additional genres
                subjects = doc.get('subject', [])[:5]
                for subj in subjects:
                    clean = subj.strip().title()
                    if clean and clean not in genres and len(clean) < 30:
                        genres.append(clean)
                        if len(genres) >= 4:
                            break

                Book.objects.create(
                    title=title,
                    authors=authors,
                    isbn_10=isbn_10,
                    isbn_13=isbn_13,
                    cover_url=cover_url,
                    page_count=page_count,
                    publisher=publisher,
                    publish_date=str(publish_year),
                    description=description[:2000] if description else '',
                    genres=genres,
                )
                created += 1
                self.stdout.write(self.style.SUCCESS(
                    f'  [{created}] {title} by {", ".join(authors[:2])}'
                ))

            except Exception as e:
                self.stdout.write(self.style.WARNING(f'  Error: {e}'))

            time.sleep(1)  # Rate limit

        self.stdout.write(self.style.SUCCESS(
            f'\nDone! Created {created} books, skipped {skipped} duplicates.'
        ))