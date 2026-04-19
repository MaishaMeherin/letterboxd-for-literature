# Goodreads scraper + NLP pipeline — session context

## What we are building
A Goodreads scraping and NLP pipeline that seeds BookShelfTag and CommunitySong
data into the database so Groq can generate accurate, data-driven playlists.

## Actual current state (verified by reading files)

### Done (already in codebase)
- Book model exists at backend/books/models.py with fields:
  id, google_books_id, title, authors, isbn_10, isbn_13, cover_url,
  page_count, publisher, publish_date, description, genres,
  avg_rating, rating_count, created_at
- Celery app exists at backend/config/celery.py — fully wired up
- Celery broker = Redis, result backend = django-db (django-celery-results)
- admin.py registers Book only
- 2 migrations exist (0001_initial, 0002_book_google_books_id)
- No tasks.py, no scraper.py anywhere in books/

### NOT done — needs to be built from scratch
- [x] goodreads_id, goodreads_url, scraped, scraped_at fields on Book model (Step 2) — done, migrated
- [x] BookShelfTag model (Step 1) — done, migrated
- [x] CommunitySong model (Step 1) — done, migrated
- [x] books/scraper.py — rewritten to parse Apollo state JSON from Goodreads page (Step 3) — done
  - Single scrape_goodreads() call replaces separate page1/page2 functions
  - Reviews and shelf tags both extracted from Apollo state embedded in HTML
  - shelf tags come from shelving.taggings on each Review object
  - HTML stripped from review text before NLP
- [x] books/tasks.py — Celery task (Step 4) — done, updated to use new scraper signature
- [x] books/management/commands/seed_goodreads.py (Step 5) — done
- [x] books/management/commands/fetch_goodreads_ids.py — done (153/177 books matched)
- [ ] Admin registration for BookShelfTag and CommunitySong (Step 6)

### Dependencies not yet installed
- beautifulsoup4 — not in pyproject.toml
- spacy + en_core_web_sm — not in pyproject.toml

## Build order

Step 1 — Add BookShelfTag and CommunitySong models to books/models.py
  Show exact model definitions → wait for approval → write → migrate

Step 2 — Add goodreads_id, goodreads_url, scraped, scraped_at to Book model
  Show exact fields → wait for approval → write → migrate
  (Can be combined into one migration with Step 1)

Step 3 — Build books/scraper.py
  Show full structure → wait for approval → write
  Page 1: title, author, page count, description, avg rating,
          rating distribution, genres, shelf tags
  Page 2: first 50-100 reviews, strip HTML, skip < 100 chars
  NLP: spaCy NER (PERSON, ORG) + 5 regex patterns,
       aggregate counts, discard names seen in only 1 review

Step 4 — Build books/tasks.py
  Show task structure → wait for approval → write
  Celery task: accepts book_id, checks scraped flag, calls scraper,
  saves tags + songs, sets scraped=True, rate_limit=10/h

Step 5 — Build management command seed_goodreads.py
  Show plan → wait for approval → write
  Queries scraped=False + goodreads_id not null,
  enqueues tasks with 5s delay, supports --limit

Step 6 — Admin registration
  Add BookShelfTag and CommunitySong to books/admin.py

Step 7 — Add beautifulsoup4 and spacy to pyproject.toml
  Must be approved before touching pyproject.toml

## Decisions / constraints
- Never edit a file without showing exact changes and getting a yes first
- Rate limit Celery task to 10/h — never remove
- Sleep random 3-7 seconds between every Goodreads request
- Only scrape first 50-100 reviews per book
- Discard NLP extractions mentioned in only one review
- Do not store full review text in DB
- BookMoodProfile was dropped — Groq handles mood synthesis itself

## Where to start next session
Recommendations improvement — currently on Step 1.

## Architecture decisions (locked in)
- Rating lives on Review model only — ReadingLog has no rating field
- ReadingLog = tracks reading status, progress, dates only
- Review = rating + text + spoilers (one per user per book)
- Recommendations use Review ratings as the taste signal sent to Groq

## Recommendations Improvement Plan

### Problems identified
- views.py broken — tries to access log.rating which doesn't exist on ReadingLog
- views.py bug — iterates over books_in_progress instead of currently_reading
- views.py has dead code — commented-out notes at bottom, unused imports
- Regenerates on every page visit — deletes and recreates recs every GET request
- No cover images saved in DB — frontend makes 10 Open Library calls per load
- Celery task exists but is never used — Groq call blocks the HTTP request

### Steps
- [x] Step 1 — Fix views.py: ratings from Review model, currently_reading bug, dead code removed
      Also added tier field to Recommendations model — comfort/discovery/adventurous
- [x] Step 2 — Only regenerate if reading log changed since last generation
      Compares Max(updated_at) across ReadingLog + Review against Max(created_at) on Recommendations
      Early-returns existing recs if nothing changed — skips Groq call entirely
- [x] Step 3 — Fetch and save cover_url on the Recommendations model
      cover_url field on Recommendations model, fetched from Google Books API in the Celery task
- [x] Step 4 — Move Groq call to Celery task
      views.py now non-blocking: enqueues generate_recommendations_task.apply_async with task_id=f"recs-{user_id}"
      task_id deduplication prevents queue flooding when frontend polls
      Returns stale recs immediately if they exist, or 202 {"status":"generating"} for first-time users
      Frontend polls every 5s on 202 until real recs arrive
      All Groq + cover-fetch logic lives in tasks.py

## Frontend Redesign Plan
Goal: make every page match the WelcomePage design language.

### Design system (from WelcomePage — apply everywhere)
- Background: #FAF8F4 warm off-white
- Primary text: stone-900 (#1c1917)
- Secondary text: stone-500 (#78716c)
- Accent: emerald-700 (#047857)
- Cards: white, rounded-2xl, stone-100 border, subtle shadow
- Buttons: rounded-full, stone-900 fill or outlined
- Headings: font-serif
- No inline styles — use Tailwind classes
- Remove Ant Design components progressively (Rate stars are fine to keep)

### Steps
- [x] Step 1 — Navbar.jsx — done, sticky header with logo, nav links, avatar dropdown
- [x] Step 2 — BookPage.jsx — done, full redesign with warm literary aesthetic
- [x] Step 3 — Home.jsx — done, switched from dark Netflix theme to warm light theme
- [x] Step 4 — PlaylistPage.jsx — done, redesigned with warm literary aesthetic
- [x] Step 5 — UserProfile.jsx — done, redesigned with warm literary aesthetic
- [x] Step 6 — Login/Register (Form.jsx) — done, redesigned with warm literary aesthetic
- [x] Step 7 — RecommendationsPage.jsx — done, tier groupings, cover_url from DB, polling on 202
- [x] Step 8 — BookPreviewPage.jsx — done, warm redesign with Navbar, stone/emerald colors, white rounded-2xl viewer container
- [x] Step 9 — PlaylistPage.jsx — redone: hero card with decorative emerald circle behind cover, genre pills, emerald track number badges, reason as blockquote, hover "Search ↗" Spotify link

### Rules
- Go page by page, verify in browser after each step
- Keep all existing logic and API calls — only change the visual layer
- Do not break any existing functionality

## Shelf Tags on BookPage — In Progress

### Goal
Show BookShelfTag data on each book's page so users can instantly see the emotional vibe of a book.
This also lays the groundwork for the upcoming mood-based book discovery feature.

### Why two visual styles
- Community tags (UCSD, mention_count > 0): solid emerald pill + count badge — ground truth from real readers
- AI-generated tags (Groq, mention_count = 0): dashed stone pill — useful but inferred, less authoritative
The distinction matters for mood-based filtering later (community tags will be weighted higher).

### Steps
- [ ] Step 1 — Add BookShelfTagSerializer to books/serializers.py (fields: tag, mention_count)
- [ ] Step 2 — Add shelf_tags @action to BookViewSet in books/views.py
        GET /api/v1/books/{id}/shelf-tags/ → top 30 tags ordered by mention_count desc
        Add 'shelf_tags' to get_permissions AllowAny list
- [ ] Step 3 — Update BookPage.jsx: add shelfTags state, fetch in parallel, render "Vibes & Moods" card

### Mood-based Discovery (planned, not started)
Allow users to filter/browse books by mood tag (e.g. "cozy", "dark", "slow-burn").
Will use the shelf_tags endpoint + a new filter on BookViewSet.
Community tags weighted higher than AI tags in results.

## Apify Integration — ABANDONED

Tested epctex/goodreads-scraper actor:
- Main book page: returns metadata only, no shelf/popular_shelves field
- /shelves page: actor times out — hardcoded for main book page layout only
- Verdict: this actor cannot extract shelf tags. Not worth $15/month.
- apify-client is installed but the fetch_apify_shelves.py command is unused

## AI Mood Tag Generation (Groq)

### Goal
Generate mood/vibe/trope tags for the 7,049 books with no UCSD shelf tags.
Tags stored as BookShelfTag with mention_count=0 to distinguish from community tags.

### Tag taxonomy (approved tags only — enforced in prompt)
- EMOTIONAL TONE: dark, cozy, hopeful, melancholic, haunting, uplifting, tense,
  whimsical, bittersweet, joyful, unsettling, heartbreaking, warm, bleak, dreamy,
  nostalgic, cathartic, eerie, playful, romantic, gritty, intense, rage-inducing
- PACING & STYLE: slow-burn, fast-paced, atmospheric, immersive, page-turner,
  contemplative, lyrical, plot-driven, character-driven, slow-paced
- THEMES & TROPES: coming-of-age, found-family, enemies-to-lovers, friends-to-lovers,
  second-chance-romance, chosen-one, redemption, grief, identity, survival, betrayal,
  forbidden-love, unreliable-narrator, social-commentary, mental-health, trauma,
  healing, self-discovery, family-drama, friendship, revenge, adventure,
  philosophical, power-struggle, love-triangle, twist-ending

### Management command
`books/management/commands/generate_book_tags.py`
- Processes books with tag_count=0 and non-empty description
- Batches 10 books per Groq call (llama-3.3-70b-versatile)
- tags returned as dict {emotional_tone, pacing_style, themes} — flattened before saving
- mention_count=0 flags tags as AI-generated vs UCSD community tags
- --limit, --batch-size, --dry-run args
- 1 second delay between batches

### Prompt design
- 8 calibration examples with reasoning + NOT INCLUDED explanations
- Enforces taxonomy strictly — no genre labels, no author names
- Returns confidence + one-sentence reasoning per book for auditability

### Steps
- [x] Command written and syntax verified
- [ ] Dry-run test with --limit 10
- [ ] Evaluate tag quality from dry-run
- [ ] Full run on all 7,049 uncovered books

### Run commands (from project root)
```
docker compose exec backend uv run python manage.py generate_book_tags --limit 10 --dry-run
docker compose exec backend uv run python manage.py generate_book_tags
```

### Future (pinned)
- Run Groq inference on UCSD-tagged books too, using top UCSD tags as additional context
- Add AI tags alongside UCSD tags, not replacing them (mention_count=0 distinguishes)

---

## UCSD Book Graph — Shelf Tag Enrichment

### Goal
Enrich BookShelfTag with mood/vibe tags from UCSD Book Graph datasets.
Match on goodreads_id. Files are newline-delimited JSON (one record per line).

### Schema (goodreads_books_*.json)
- `book_id` → matches our `goodreads_id`
- `popular_shelves` → list of `{"count": "159", "name": "to-read"}` → BookShelfTag

### Files downloaded
- `backend/goodreads_books_romance.json` — 335k books (done)
- More genre files to download later (fantasy, mystery, YA, history)

### Noise filtering (two layers)
1. Blocklist — skip tags matching reading status, format, ownership, year patterns
2. Min count threshold — default 2 (configurable via --min-count)

### Management command
`books/management/commands/load_ucsd_shelves.py`
- --file (required), --min-count (default 2), --limit (for testing)
- Loads all DB goodreads_ids into a Python set at startup (O(1) lookup)
- Streams file line by line — never loads full file into memory
- get_or_create per tag — safe to run multiple times / multiple genre files
- Progress every 1000 lines

### Steps
- [x] Schema inspected, noise categories identified
- [x] Command written: load_ucsd_shelves.py
- [x] Full run on all 8 genre files completed

### Final results
- Total books: 16,318
- With shelf tags: 9,269 (57%)
- Without tags: 7,049 (43%) — post-2017 books, edition mismatches, niche books
- Books without tags still use genres + description + avg_rating for Groq playlist generation

### Run command (from backend/)
```
docker compose exec backend uv run python manage.py load_ucsd_shelves --file goodreads_books_romance.json --limit 20
```

---

## Book Seeding Plan — Kaggle Goodreads Dataset

### Goal
Seed the Book model with bulk data from the Kaggle dataset:
`dk123891/books-dataset-goodreadsmay-2024` (Goodreads books scraped May 2024)
Dataset lives at `archive/` in project root. 17,410 rows. 3 files:
- `Book_Details.csv` — main file we seed from
- `books.db` — collection-level data only, not useful
- `book_reviews.db` — reviews, separate concern

### Column mapping (Book_Details.csv → Book model)
| CSV | Book field | Parsing |
|---|---|---|
| book_id | goodreads_id | string |
| book_title | title | string |
| author | authors | wrap in list |
| cover_image_uri | cover_url | string |
| book_details | description | string |
| genres | genres | ast.literal_eval |
| num_pages | page_count | ast.literal_eval → int |
| publication_info | publish_date | ast.literal_eval → strip "First published " |
| average_rating | avg_rating | float |
| num_ratings | rating_count | int |
| (constructed) | goodreads_url | https://www.goodreads.com/book/show/{book_id} |

isbn_10/isbn_13 not in dataset — left untouched.

### Steps
- [x] Step 1 — Dataset downloaded, lives at archive/ in project root
- [x] Step 2 — CSV columns inspected and mapped
- [x] Step 3 — Management command written: `books/management/commands/seed_from_csv.py`
  - update_or_create on goodreads_id (overwrites existing records)
  - ast.literal_eval for list-formatted fields
  - --file (required), --limit, --offset args
  - try/except per row, progress every 100 rows
  - skips rows missing goodreads_id or title
- [ ] Step 4 — Run with --limit 10 to test, then full run, spot-check in Django admin

### Run command (from backend/)
```
python manage.py seed_from_csv --file ../../archive/Book_Details.csv --limit 10
```

## Recommendations Interaction Plan

### Goal
Allow users to interact with recommendations: view the book page, add to TBR, dismiss.
Recommended books may not exist in the DB — handle by fetching/creating from Google Books API during task generation.

### Steps
- [x] Step 1 — Add nullable `book` FK to Recommendations model → migrated
- [x] Step 2 — Update serializer to include `book` id
- [ ] Step 3 — Update Celery task to fetch-or-create Book and populate the FK
- [ ] Step 4 — Update RecommendationsPage.jsx: "View Book" button + "Add to TBR" button + "Not for me" dismiss

### Model change
```python
book = models.ForeignKey('books.Book', null=True, blank=True, on_delete=models.SET_NULL)
```

### Task logic (after Google Books cover fetch)
- Use google_books_id from the API response
- Book.objects.get_or_create(google_books_id=..., defaults={title, authors, cover_url, genres})
- Store book.id in rec["book_id"] before bulk_create

### Frontend buttons per card
- "View Book" → navigate to /book/:book_id/ (only if book FK is set)
- "Add to TBR" → POST to existing log creation endpoint with status='want_to_read'
- "Not for me" → DELETE /api/v1/recommendations/:id/ (needs endpoint)

## Key technical decisions
- Goodreads shelf tags and reviews are JS-rendered — not accessible via plain HTML scraping
- Solution: parse Apollo state JSON blob embedded in a script tag on the book page
- All review text and per-reviewer shelf tags live inside Review: keys in the Apollo state
- scrape_goodreads(goodreads_id) returns (reviews, shelf_tags) in one request

---

## Notifications Feature Plan

### Goal
Notify users in real time when someone likes or comments on their review.
Notifications are persisted in the database so offline users see them on login.
WebSocket is the live delivery layer on top — if the user is offline, nothing extra happens at send time.

### Architecture
```
Event happens (like / comment)
    → Django Signal fires
        → Notification row saved to DB  (persistent, source of truth)
            → If recipient is online: push over WebSocket (real-time pop-up)
            → If recipient is offline: user fetches via REST on next login
```

### Decisions locked in
- Notifications live in a new `notifications` app — keeps concerns clean, easy to extend later
- `signals.py` in the `reviews` app triggers notification creation (decoupled from views)
- Django Channels + channels-redis powers WebSockets — one persistent channel per logged-in user
- `asgi.py` needs updating — currently bare HTTP only
- No fan-out: only the review owner gets notified (sender never notifies themselves)
- `is_read` flag tracks unread count — frontend shows badge on notification bell

### Known bug to fix before starting
- `backend/reviews/signals.py` line 13: `from book.models import Book` should be `from books.models import Book`

### Chunk 1 — Notification model
Create `backend/notifications/` app with a `Notification` model:
- `id` — UUID primary key
- `recipient` — ForeignKey to User (the review author)
- `sender` — ForeignKey to User (who liked/commented)
- `notification_type` — CharField, choices: `like` / `comment`
- `review` — ForeignKey to `reviews.Review`, CASCADE
- `is_read` — BooleanField, default False
- `created_at` — DateTimeField auto, ordering `-created_at`

Steps:
- [ ] Create `notifications/` app, register in INSTALLED_APPS
- [ ] Write `Notification` model in `notifications/models.py`
- [ ] Run migration

### Chunk 2 — Django Signals (trigger notification creation)
In `reviews/signals.py`, add two new receivers:
- `post_save` on `ReviewLike` → create Notification(type='like') for review owner
- `post_save` on `ReviewComment` → create Notification(type='comment') for review owner
- Guard: skip if sender == recipient (don't notify yourself)
- Also fix existing bug: `from book.models` → `from books.models`

Steps:
- [ ] Fix existing bug in signals.py
- [ ] Add `like_created` signal receiver
- [ ] Add `comment_created` signal receiver
- [ ] Verify signals are registered in `reviews/apps.py` ready() method

### Chunk 3 — REST endpoints for notifications
In `notifications/views.py`:
- `GET /api/v1/notifications/` — list all notifications for logged-in user, ordered by `-created_at`
  - Include unread count in response
- `PATCH /api/v1/notifications/{id}/read/` — mark single notification as read
- `POST /api/v1/notifications/read-all/` — mark all as read

Also add the likes list endpoint to `ReviewViewSet`:
- `GET /api/v1/reviews/{id}/likes/` — returns list of usernames who liked the review + like_count

Steps:
- [ ] Write `NotificationSerializer` in `notifications/serializers.py`
- [ ] Write `NotificationViewSet` in `notifications/views.py`
- [ ] Wire up URLs in `notifications/urls.py` and include in root `urls.py`
- [ ] Add `likes` action to `ReviewViewSet` in `reviews/views.py`

### Chunk 4 — Django Channels setup
Install `channels` and `channels-redis`. Update ASGI and settings.

- [ ] Add `channels` and `channels-redis` to `pyproject.toml`
- [ ] Update `config/asgi.py` to use `ProtocolTypeRouter` (HTTP + WebSocket)
- [ ] Add `CHANNEL_LAYERS` config to `settings.py` pointing at Redis
- [ ] Add `channels` to `INSTALLED_APPS`
- [ ] Create `notifications/consumers.py` — `NotificationConsumer` (AsyncWebsocketConsumer)
  - On connect: authenticate user from JWT in query param, add to personal channel group `notifications_{user_id}`
  - On disconnect: remove from group
  - Receives nothing from client (server-push only)
- [ ] Create `notifications/routing.py` — WebSocket URL pattern `ws/notifications/`
- [ ] Wire routing into `asgi.py`

### Chunk 5 — Real-time delivery (connect signals to WebSocket)
Update the signal receivers added in Chunk 2 to also push over WebSocket after saving to DB.

- [ ] After creating Notification row, call `async_to_sync(channel_layer.group_send)` to recipient's group
- [ ] Message payload: `{ type, sender_username, review_id, notification_id, created_at }`
- [ ] Consumer `receive` handler forwards message to WebSocket client

### Chunk 6 — Frontend
- [ ] On app load (after login): open `WebSocket ws://localhost:8000/ws/notifications/?token=<jwt>`
- [ ] On message received: show toast pop-up, increment bell badge count
- [ ] Bell icon in Navbar: fetch `GET /api/v1/notifications/` on load, show unread count badge
- [ ] Notification dropdown: list recent notifications, clicking one marks it read + navigates to review
- [ ] "Mark all read" button calls `POST /api/v1/notifications/read-all/`

### Dependencies to add (Chunk 4)
- `channels` — Django Channels for WebSocket support
- `channels-redis` — Redis channel layer backend

### Run order
Chunk 1 → Chunk 2 → Chunk 3 → Chunk 4 → Chunk 5 → Chunk 6
Each chunk is independently testable before moving to the next.

