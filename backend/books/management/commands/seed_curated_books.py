import requests
import time
from django.core.management.base import BaseCommand
from books.models import Book
from django.conf import settings


GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes"

# Curated book list — sourced from BookLeo, bewareofpity (YouTube), booktok trending,
# award winners, and popular literary fiction. Each entry is "title by author" for precise search.
CURATED_BOOKS = [
    # ── Booktok Trending / Viral ──
    "The Song of Achilles by Madeline Miller",
    "Circe by Madeline Miller",
    "The Seven Husbands of Evelyn Hugo by Taylor Jenkins Reid",
    "Daisy Jones and the Six by Taylor Jenkins Reid",
    "Malibu Rising by Taylor Jenkins Reid",
    "Tomorrow and Tomorrow and Tomorrow by Gabrielle Zevin",
    "Fourth Wing by Rebecca Yarros",
    "Iron Flame by Rebecca Yarros",
    "A Court of Thorns and Roses by Sarah J Maas",
    "A Court of Mist and Fury by Sarah J Maas",
    "The Love Hypothesis by Ali Hazelwood",
    "Beach Read by Emily Henry",
    "Book Lovers by Emily Henry",
    "People We Meet on Vacation by Emily Henry",
    "Funny Story by Emily Henry",
    "Lessons in Chemistry by Bonnie Garmus",
    "The Invisible Life of Addie LaRue by V E Schwab",
    "The Night Circus by Erin Morgenstern",
    "Normal People by Sally Rooney",
    "Beautiful World Where Are You by Sally Rooney",
    "Conversations with Friends by Sally Rooney",
    "Intermezzo by Sally Rooney",
    "Where the Crawdads Sing by Delia Owens",
    "It Ends with Us by Colleen Hoover",
    "Verity by Colleen Hoover",
    "Reminders of Him by Colleen Hoover",
    "The Midnight Library by Matt Haig",
    "Anxious People by Fredrik Backman",
    "A Man Called Ove by Fredrik Backman",

    # ── Literary Fiction (BookLeo / bewareofpity style) ──
    "On Earth We're Briefly Gorgeous by Ocean Vuong",
    "A Little Life by Hanya Yanagihara",
    "The Goldfinch by Donna Tartt",
    "The Secret History by Donna Tartt",
    "My Year of Rest and Relaxation by Ottessa Moshfegh",
    "Eileen by Ottessa Moshfegh",
    "Shuggie Bain by Douglas Stuart",
    "Young Mungo by Douglas Stuart",
    "Piranesi by Susanna Clarke",
    "Jonathan Strange and Mr Norrell by Susanna Clarke",
    "The Remains of the Day by Kazuo Ishiguro",
    "Never Let Me Go by Kazuo Ishiguro",
    "Klara and the Sun by Kazuo Ishiguro",
    "The Bell Jar by Sylvia Plath",
    "The Catcher in the Rye by J D Salinger",
    "The Great Gatsby by F Scott Fitzgerald",
    "To Kill a Mockingbird by Harper Lee",
    "Beloved by Toni Morrison",
    "The Bluest Eye by Toni Morrison",
    "Song of Solomon by Toni Morrison",
    "Little Fires Everywhere by Celeste Ng",
    "Everything I Never Told You by Celeste Ng",
    "Our Missing Hearts by Celeste Ng",

    # ── Stefan Zweig (bewareofpity's specialty) ──
    "Beware of Pity by Stefan Zweig",
    "The Post Office Girl by Stefan Zweig",
    "Chess Story by Stefan Zweig",
    "Letter from an Unknown Woman by Stefan Zweig",
    "The World of Yesterday by Stefan Zweig",
    "Amok by Stefan Zweig",

    # ── Japanese Literature ──
    "Norwegian Wood by Haruki Murakami",
    "Kafka on the Shore by Haruki Murakami",
    "The Wind-Up Bird Chronicle by Haruki Murakami",
    "1Q84 by Haruki Murakami",
    "Colorless Tsukuru Tazaki by Haruki Murakami",
    "No Longer Human by Osamu Dazai",
    "The Setting Sun by Osamu Dazai",
    "Convenience Store Woman by Sayaka Murata",
    "Earthlings by Sayaka Murata",
    "Before the Coffee Gets Cold by Toshikazu Kawaguchi",
    "Breasts and Eggs by Mieko Kawakami",
    "Heaven by Mieko Kawakami",
    "All the Lovers in the Night by Mieko Kawakami",
    "Strange Weather in Tokyo by Hiromi Kawakami",
    "The Travelling Cat Chronicles by Hiro Arikawa",
    "The Memory Police by Yoko Ogawa",
    "The Housekeeper and the Professor by Yoko Ogawa",
    "Kitchen by Banana Yoshimoto",
    "Goodbye Tsugumi by Banana Yoshimoto",
    "Out by Natsuo Kirino",
    "Sweet Bean Paste by Durian Sukegawa",
    "The Devotion of Suspect X by Keigo Higashino",

    # ── Korean Literature ──
    "Kim Jiyoung Born 1988 by Cho Nam-Joo",
    "The Vegetarian by Han Kang",
    "Human Acts by Han Kang",
    "The White Book by Han Kang",
    "We Do Not Part by Han Kang",
    "Pachinko by Min Jin Lee",
    "I Want to Die but I Want to Eat Ttoekbokki by Baek Sehee",
    "Crying in H Mart by Michelle Zauner",
    "Almond by Won-pyung Sohn",
    "The Hole by Hye-young Pyun",
    "Cursed Bunny by Bora Chung",
    "Please Look After Mom by Shin Kyung-sook",

    # ── Translated / World Literature ──
    "One Hundred Years of Solitude by Gabriel Garcia Marquez",
    "Love in the Time of Cholera by Gabriel Garcia Marquez",
    "The Stranger by Albert Camus",
    "The Plague by Albert Camus",
    "Crime and Punishment by Fyodor Dostoevsky",
    "The Brothers Karamazov by Fyodor Dostoevsky",
    "Notes from Underground by Fyodor Dostoevsky",
    "Anna Karenina by Leo Tolstoy",
    "The Master and Margarita by Mikhail Bulgakov",
    "The Unbearable Lightness of Being by Milan Kundera",
    "Siddhartha by Hermann Hesse",
    "Steppenwolf by Hermann Hesse",
    "The Trial by Franz Kafka",
    "Metamorphosis by Franz Kafka",
    "The Shadow of the Wind by Carlos Ruiz Zafon",
    "My Brilliant Friend by Elena Ferrante",
    "The Forty Rules of Love by Elif Shafak",
    "10 Minutes 38 Seconds in This Strange World by Elif Shafak",
    "The Island of Missing Trees by Elif Shafak",
    "The Kite Runner by Khaled Hosseini",
    "A Thousand Splendid Suns by Khaled Hosseini",
    "Persepolis by Marjane Satrapi",
    "The God of Small Things by Arundhati Roy",

    # ── Fantasy / Sci-Fi (popular + literary) ──
    "The Hunger Games by Suzanne Collins",
    "Dune by Frank Herbert",
    "The Name of the Wind by Patrick Rothfuss",
    "Six of Crows by Leigh Bardugo",
    "Crooked Kingdom by Leigh Bardugo",
    "Shadow and Bone by Leigh Bardugo",
    "The Poppy War by R F Kuang",
    "Babel by R F Kuang",
    "The Priory of the Orange Tree by Samantha Shannon",
    "The House in the Cerulean Sea by TJ Klune",
    "Under the Whispering Door by TJ Klune",
    "Project Hail Mary by Andy Weir",
    "The Martian by Andy Weir",
    "Slaughterhouse Five by Kurt Vonnegut",

    # ── Thriller / Dark Fiction ──
    "Gone Girl by Gillian Flynn",
    "Sharp Objects by Gillian Flynn",
    "The Silent Patient by Alex Michaelides",
    "Mexican Gothic by Silvia Moreno-Garcia",
    "Rebecca by Daphne du Maurier",
    "We Have Always Lived in the Castle by Shirley Jackson",
    "The Haunting of Hill House by Shirley Jackson",

    # ── Memoir / Non-Fiction ──
    "Educated by Tara Westover",
    "Becoming by Michelle Obama",
    "When Breath Becomes Air by Paul Kalanithi",
    "The Glass Castle by Jeannette Walls",
    "The Year of Magical Thinking by Joan Didion",
    "Crying in H Mart by Michelle Zauner",
    "Know My Name by Chanel Miller",
    "The Body Keeps the Score by Bessel van der Kolk",
    "Man's Search for Meaning by Viktor Frankl",
    "Atomic Habits by James Clear",
    "The Subtle Art of Not Giving a F*ck by Mark Manson",
    "Sapiens by Yuval Noah Harari",

    # ── Poetry ──
    "Milk and Honey by Rupi Kaur",
    "The Sun and Her Flowers by Rupi Kaur",
    "Home Body by Rupi Kaur",
    "The Strength in Our Scars by Bianca Sparacino",
    "Ariel by Sylvia Plath",
    "Devotions by Mary Oliver",

    # ── Philosophy / Self-Help ──
    "The Alchemist by Paulo Coelho",
    "The Prophet by Kahlil Gibran",
    "Meditations by Marcus Aurelius",
    "The Art of War by Sun Tzu",
    "All About Love by bell hooks",

    # ── South Asian Literature ──
    "A Golden Age by Tahmima Anam",
    "The Good Muslim by Tahmima Anam",
    "Brick Lane by Monica Ali",
    "The Namesake by Jhumpa Lahiri",
    "Interpreter of Maladies by Jhumpa Lahiri",
    "Agunpakhi by Hasan Azizul Huq",
    "Lalsalu by Syed Waliullah",

    # ── Recent Award Winners (2023-2025) ──
    "Demon Copperhead by Barbara Kingsolver",
    "The Covenant of Water by Abraham Verghese",
    "Orbital by Samantha Harvey",
    "James by Percival Everett",
    "The Ministry of Time by Kaliane Bradley",
    "Intermezzo by Sally Rooney",
    "Prophet Song by Paul Lynch",

    # ── Sugaru Miaki (your favorites) ──
    "Three Days of Happiness by Sugaru Miaki",
    "Parasite in Love by Sugaru Miaki",
    "Pain Pain Go Away by Sugaru Miaki",
    "Starting Over by Sugaru Miaki",
]


def search_and_create(query, command):
    """Search Google Books by exact title+author, create if not exists."""
    try:
        resp = requests.get(GOOGLE_BOOKS_API, params={
            "q": query,
            "maxResults": 1,
            "printType": "books",
            "langRestrict": "en",
            "key": settings.GOOGLE_BOOKS_API_KEY,
        }, timeout=15)

        if resp.status_code != 200:
            return None

        items = resp.json().get("items", [])
        if not items:
            return None

        item = items[0]
        info = item.get("volumeInfo", {})

        title = info.get("title", "").strip()
        if not title:
            return None

        # Check duplicate by title (case insensitive)
        if Book.objects.filter(title__iexact=title).exists():
            return "duplicate"

        authors = info.get("authors", [])

        # Get cover
        images = info.get("imageLinks", {})
        cover_url = images.get("thumbnail") or images.get("smallThumbnail")
        if cover_url:
            cover_url = cover_url.replace("http://", "https://")
            cover_url = cover_url.replace("zoom=1", "zoom=2")

        # Get ISBNs
        isbn_13 = None
        isbn_10 = None
        for ident in info.get("industryIdentifiers", []):
            if ident["type"] == "ISBN_13":
                isbn_13 = ident["identifier"]
            elif ident["type"] == "ISBN_10":
                isbn_10 = ident["identifier"]

        # Check ISBN duplicates
        if isbn_13 and Book.objects.filter(isbn_13=isbn_13).exists():
            return "duplicate"
        if isbn_10 and Book.objects.filter(isbn_10=isbn_10).exists():
            return "duplicate"

        # Get genres
        categories = info.get("categories", [])
        genres = []
        for cat in categories:
            parts = [p.strip() for p in cat.split("/")]
            genres.extend(parts)
        genres = list(dict.fromkeys(genres))[:5]

        Book.objects.create(
            title=title,
            authors=authors,
            isbn_13=isbn_13,
            isbn_10=isbn_10,
            cover_url=cover_url,
            page_count=info.get("pageCount"),
            publisher=info.get("publisher", ""),
            publish_date=info.get("publishedDate", ""),
            description=(info.get("description") or "")[:2000],
            genres=genres if genres else ["Fiction"],
            google_books_id=item.get("id"),
        )
        return title

    except Exception as e:
        command.stdout.write(command.style.WARNING(f"  Error: {e}"))
        return None


class Command(BaseCommand):
    help = "Seed curated popular books from Google Books API"

    def handle(self, *args, **options):
        created = 0
        skipped = 0
        not_found = 0

        self.stdout.write(f"Seeding {len(CURATED_BOOKS)} curated books...\n")

        for query in CURATED_BOOKS:
            result = search_and_create(query, self)

            if result == "duplicate":
                skipped += 1
                self.stdout.write(f"  ⏭  Already exists: {query}")
            elif result is None:
                not_found += 1
                self.stdout.write(self.style.WARNING(f"  ✗  Not found: {query}"))
            else:
                created += 1
                self.stdout.write(self.style.SUCCESS(f"  ✓  [{created}] {result}"))

            time.sleep(0.8)

        self.stdout.write(self.style.SUCCESS(
            f"\nDone! Created: {created} | Skipped: {skipped} | Not found: {not_found}"
        ))
