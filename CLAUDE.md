# Context
The user has an SRS for "PageTurner" (a Letterboxd-for-books platform) and wants to know what to work on next based on it.

## Current State vs SRS Gap Analysis

### ✅ Already Implemented
| SRS Section | Feature | Status |
|---|---|---|
| 4.1 Auth | Register, login, JWT, profile get/update | Complete |
| 4.2 Books | Full CRUD, cover/ISBN/genres/metadata | Complete |
| 4.3 Reading Log | Status, progress %, dates, notes, CRUD | Complete |
| Frontend | Home (book grid), Login, Register, BookLogModal | Partial |

### ❌ Not Yet Implemented (SRS "Must" requirements)
1. **Review & Rating System** (Section 4.4) — described as *"the centrepiece of the MVP"*
   - `reviews/` app exists but is empty (no model, views, serializers, urls)
   - FR-REV-01: Review model (rating 1–5 half-stars, text 10k chars, spoiler flag)
   - FR-REV-06: Edit/delete own reviews
   - FR-REV-07: Aggregate rating recomputed and denormalized on Book model
   - FR-REV-08: Reviews shown on book detail page and user profile

2. **Bookshelves** (Section 4.5)
   - `shelves/` app exists but is empty
   - FR-SHELF-01: 3 default shelves auto-created on registration
   - FR-SHELF-03: Reading log status change → auto-add to default shelf
   - FR-SHELF-05: Shelf display as card grid

3. **User Profiles** (Section 4.1 / FR-PROF)
   - FR-PROF-02: Reading stats (total books, pages, avg rating, books this year)
   - FR-PROF-04: Public profile at `/user/{username}`

4. **Infrastructure** (Section 3 / 8) — Not started
   - PostgreSQL (currently SQLite)
   - Redis (for caching)
   - Docker Compose (all services)
   - FastAPI service (book search/autocomplete/ingestion)
   - Celery task queue

### Missing API Endpoints (SRS Section 6.2)
- `POST /api/v1/auth/logout/` — blacklist refresh token
- `GET /api/v1/users/{username}/` — public profile + stats
- `GET /api/v1/users/{username}/reviews/`
- `GET /api/v1/users/{username}/shelves/`
- `GET /api/v1/books/{id}/reviews/`
- All `/api/v1/reviews/` endpoints
- All `/api/v1/shelves/` endpoints

---

## Recommended Next Step: Review & Rating System

**Why first:**
- Explicitly called the "centrepiece" of the MVP in the SRS
- Backend stub (`reviews/`) already exists
- Builds directly on the completed reading log (reviews link to log entries)
- Unblocks the book detail page and user profile features

**What to build:**

### Backend (`backend/reviews/`)
1. **Model** (`reviews/models.py`)
   - `Review`: user (FK), book (FK), reading_log (FK nullable), rating (DecimalField 1.0–5.0, step 0.5), text (TextField 10000), contains_spoilers (bool), like_count (int), created_at, updated_at
   - Signal: on save/delete → recompute `book.avg_rating` and `book.rating_count`

2. **Serializer** (`reviews/serializers.py`)
   - `ReviewSerializer` with nested user display name + book title
   - Validate rating is in 0.5 increments between 1.0–5.0

3. **Views** (`reviews/views.py`)
   - `ReviewViewSet` (ModelViewSet)
     - List: public global feed sorted by recency
     - Create: JWT required, auto-set user
     - Retrieve: public
     - Update/Delete: JWT + owner only
   - `ReviewLikeView` — POST/DELETE `/reviews/{id}/like/`

4. **URLs** (`reviews/urls.py`)
   - Router for CRUD + custom like action

5. **Wire into** `config/urls.py`

### Frontend
- Add "Write a Review" section to `BookLogModal.jsx`
  - Star rating (half-star), review text, spoiler toggle
  - POST to `/api/v1/reviews/`
- Show existing reviews on book detail (below log section in modal or new page)

### Files to create/modify
| File | Action |
|---|---|
| `backend/reviews/models.py` | Create Review model + rating signal |
| `backend/reviews/serializers.py` | Create ReviewSerializer |
| `backend/reviews/views.py` | Create ReviewViewSet + LikeView |
| `backend/reviews/urls.py` | Create router + URL patterns |
| `backend/config/urls.py` | Add reviews URLs |
| `frontend/src/components/BookLogModal.jsx` | Add review form + display |

---

## After Reviews: Bookshelves → Profiles → Infrastructure

The logical sequence after reviews:
1. **Bookshelves** (shelves app) — default shelves, auto-population from logs
2. **Public profiles** — `/user/{username}` with stats, reviews, shelves
3. **Infrastructure upgrade** — Docker Compose, PostgreSQL, Redis, FastAPI search

---

## Verification
- Run backend: `cd backend && uv run python manage.py runserver`
- Test review CRUD via curl or DRF browsable API at `http://127.0.0.1:8000/api/v1/reviews/`
- Verify `book.avg_rating` updates after review create/update/delete
- Run frontend: `cd frontend && yarn dev` → open a book → write a review in modal
