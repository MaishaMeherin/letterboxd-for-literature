from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg
from django.utils import timezone
from collections import defaultdict
import re


MOOD_TAGS = {
    "dark", "cozy", "hopeful", "melancholic", "haunting", "uplifting", "tense",
    "whimsical", "bittersweet", "joyful", "unsettling", "heartbreaking", "warm",
    "bleak", "dreamy", "nostalgic", "cathartic", "eerie", "playful", "romantic",
    "gritty", "intense", "slow-burn", "fast-paced", "atmospheric", "immersive",
    "contemplative", "lyrical", "page-turner",
}

FICTION_GENRES = {
    "fiction", "literary fiction", "fantasy", "science fiction", "mystery",
    "thriller", "romance", "horror", "historical fiction", "contemporary fiction",
    "young adult", "ya", "magical realism", "dystopian", "paranormal",
}

NONFICTION_GENRES = {
    "nonfiction", "non-fiction", "biography", "memoir", "history", "self-help",
    "true crime", "science", "psychology", "philosophy", "essays", "politics",
    "business", "travel",
}


def _derive_personality(top_genre, dominant_mood, avg_pages, rating_variance):
    genre = (top_genre or "").lower()
    mood = (dominant_mood or "").lower()

    prefix = ""
    if avg_pages and avg_pages > 500:
        prefix = "Epic "
    elif rating_variance is not None:
        if rating_variance < 0.5:
            prefix = "Devoted "
        elif rating_variance > 2.0:
            prefix = "Discerning "

    if "literary fiction" in genre or "literary" in genre:
        if mood in ("melancholic", "bleak", "haunting", "bittersweet"):
            base = "The Melancholy Maven"
            desc = "You're drawn to books that ache — stories that sit with you long after the last page."
        else:
            base = "The Literary Wanderer"
            desc = "You seek out writing that rewards slow reading and stays with you like a feeling."
    elif "fantasy" in genre:
        if mood in ("dark", "gritty", "haunting", "bleak"):
            base = "The Speculative Drifter"
            desc = "You want your fantasy to have teeth — dark, complex, morally rich."
        else:
            base = "The World-Builder"
            desc = "You love losing yourself in fully realised worlds with their own rules and histories."
    elif "science fiction" in genre or "sci-fi" in genre:
        base = "The Horizon Seeker"
        desc = "You're here for the ideas — the what-ifs and thought experiments that reframe everything."
    elif "mystery" in genre or "thriller" in genre or "crime" in genre:
        base = "The Plot Chaser"
        desc = "You need to know what happens. The puzzle, the tension, the resolution — that's your fuel."
    elif "romance" in genre:
        if mood in ("cozy", "warm", "hopeful"):
            base = "The Comfort Romantic"
            desc = "You read to feel good — and there's nothing wrong with that. You know exactly what you love."
        else:
            base = "The Slow Burn Devotee"
            desc = "You're in it for the tension. The almost-but-not-yet is your favourite sentence."
    elif "historical fiction" in genre or "history" in genre:
        base = "The Time Traveler"
        desc = "You're most alive in other centuries. History isn't the past to you — it's where you live."
    elif "horror" in genre:
        base = "The Darkness Courter"
        desc = "You know fear is just adrenaline with better writing. You read what other people can't finish."
    elif "nonfiction" in genre or "non-fiction" in genre or "biography" in genre or "memoir" in genre:
        base = "The Knowledge Seeker"
        desc = "You read to understand the world — and the people in it — more clearly."
    elif "young adult" in genre or "ya" in genre:
        base = "The Eternal Optimist"
        desc = "You gravitate toward stories of becoming — the raw, urgent energy of figuring yourself out."
    else:
        base = "The Eclectic Reader"
        desc = "You follow curiosity, not category. Your shelf tells a story no algorithm could predict."

    return {"archetype": f"{prefix}{base}", "description": desc}


class StatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from logs.models import ReadingLog
        from reviews.models import Review
        from books.models import BookShelfTag

        user = request.user
        now = timezone.now()

        completed_logs = (
            ReadingLog.objects
            .filter(user=user, status="completed")
            .select_related("book")
        )

        if completed_logs.count() < 3:
            return Response({"insufficient_data": True})

        books = [log.book for log in completed_logs]
        book_ids = [b.id for b in books]

        # ── Hero ──────────────────────────────────────────────────────────────
        pages_read = sum(b.page_count or 0 for b in books)

        user_reviews = Review.objects.filter(user=user, book_id__in=book_ids)
        avg_rating = user_reviews.aggregate(avg=Avg("rating"))["avg"] or 0

        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        books_this_month = completed_logs.filter(updated_at__gte=month_start).count()

        hero = {
            "books_completed": len(books),
            "pages_read": pages_read,
            "avg_rating": round(float(avg_rating), 1),
            "books_this_month": books_this_month,
        }

        # ── Genres ────────────────────────────────────────────────────────────
        genre_counts = defaultdict(int)
        for book in books:
            for g in (book.genres or []):
                genre_counts[g.strip().title()] += 1

        sorted_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)
        top_genres = sorted_genres[:6]
        other_count = sum(c for _, c in sorted_genres[6:])
        genres = [{"genre": g, "count": c} for g, c in top_genres]
        if other_count:
            genres.append({"genre": "Other", "count": other_count})

        # ── Moods ─────────────────────────────────────────────────────────────
        rating_map = {str(r.book_id): float(r.rating) for r in user_reviews}

        shelf_tags = (
            BookShelfTag.objects
            .filter(book_id__in=book_ids, tag__in=MOOD_TAGS)
            .values("book_id", "tag", "mention_count")
        )

        mood_scores = defaultdict(float)
        for entry in shelf_tags:
            weight = rating_map.get(str(entry["book_id"]), 3.0) / 5.0
            mood_scores[entry["tag"]] += (entry["mention_count"] or 1) * weight

        top_moods = sorted(mood_scores.items(), key=lambda x: x[1], reverse=True)[:5]
        moods = [{"tag": tag, "score": round(score, 1)} for tag, score in top_moods]

        # ── Pace (last 12 months) ─────────────────────────────────────────────
        pace_counts = defaultdict(int)
        for log in completed_logs:
            ts = log.date_finished or log.updated_at
            if hasattr(ts, "date"):
                ts = ts.date()
            if ts:
                pace_counts[ts.strftime("%Y-%m")] += 1

        pace = []
        for i in range(11, -1, -1):
            month = (now.replace(day=1) - timezone.timedelta(days=i * 30)).strftime("%Y-%m")
            pace.append({"month": month, "count": pace_counts.get(month, 0)})

        # ── Top Books ─────────────────────────────────────────────────────────
        top_reviews = (
            user_reviews
            .select_related("book")
            .order_by("-rating")[:3]
        )
        top_books = [
            {
                "title": r.book.title,
                "author": ", ".join(r.book.authors or []),
                "cover_url": r.book.cover_url or "",
                "rating": float(r.rating),
                "book_id": str(r.book.id),
            }
            for r in top_reviews
        ]

        # ── Page Vibe ─────────────────────────────────────────────────────────
        pages_with_data = [b.page_count for b in books if b.page_count]
        avg_pages = int(sum(pages_with_data) / len(pages_with_data)) if pages_with_data else None

        if avg_pages is None:
            page_vibe = {"avg_pages": None, "label": "Your books are a mystery", "tier": "unknown"}
        elif avg_pages > 500:
            page_vibe = {"avg_pages": avg_pages, "label": "You love a tome", "tier": "long"}
        elif avg_pages > 300:
            page_vibe = {"avg_pages": avg_pages, "label": "You like 'em substantial", "tier": "medium"}
        else:
            page_vibe = {"avg_pages": avg_pages, "label": "You like 'em punchy", "tier": "short"}

        # ── Personality ───────────────────────────────────────────────────────
        top_genre = sorted_genres[0][0] if sorted_genres else ""
        dominant_mood = top_moods[0][0] if top_moods else ""

        ratings_list = [float(r.rating) for r in user_reviews]
        if len(ratings_list) > 1:
            mean = sum(ratings_list) / len(ratings_list)
            variance = sum((r - mean) ** 2 for r in ratings_list) / len(ratings_list)
        else:
            variance = None

        personality = _derive_personality(top_genre, dominant_mood, avg_pages, variance)

        # ── Diversity ─────────────────────────────────────────────────────────
        decade_counts = defaultdict(int)
        fiction_count = 0
        nonfiction_count = 0

        for book in books:
            year_match = re.search(r"\b(1[0-9]{3}|20[0-2][0-9])\b", book.publish_date or "")
            if year_match:
                decade = f"{year_match.group()[:3]}0s"
                decade_counts[decade] += 1

            genres_lower = {g.lower() for g in (book.genres or [])}
            if genres_lower & FICTION_GENRES:
                fiction_count += 1
            elif genres_lower & NONFICTION_GENRES:
                nonfiction_count += 1

        sorted_decades = sorted(decade_counts.items(), key=lambda x: x[0], reverse=True)
        total_classified = fiction_count + nonfiction_count
        fiction_ratio = round(fiction_count / total_classified, 2) if total_classified else None

        diversity = {
            "decades": [{"decade": d, "count": c} for d, c in sorted_decades],
            "fiction_ratio": fiction_ratio,
        }

        return Response({
            "hero": hero,
            "genres": genres,
            "moods": moods,
            "pace": pace,
            "top_books": top_books,
            "page_vibe": page_vibe,
            "personality": personality,
            "diversity": diversity,
        })