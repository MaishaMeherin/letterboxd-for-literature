import { useState, useEffect } from "react";
import api from "../api";
import { useParams, useNavigate } from "react-router-dom";
import { Rate } from "antd";
import { ACCESS_TOKEN } from "../constants";
import {
  useBookStore,
  useReviewFormStore,
  useLogFormStore,
  usePlaylistStore,
} from "../store";
import Navbar from "../components/Navbar";

function BookPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { book, setBook, reviews, setReviews } = useBookStore();
  const {
    reviewText,
    setReviewText,
    rating,
    setRating,
    containsSpoilers,
    setContainsSpoilers,
    existingReview,
    setExistingReview,
  } = useReviewFormStore();

  useLogFormStore();
  const { playlist, setPlaylist } = usePlaylistStore();

  const [comments, setComments] = useState([]);
  const [openReviewCommentId, setReviewCommentId] = useState(null);
  const [shelfTags, setShelfTags] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [commentTexts, setCommentTexts] = useState({});

  const totalReviews = reviews.length || 1;
  const positiveCount = reviews.filter(
    (r) => r.sentiment === "positive",
  ).length;
  const neutralCount = reviews.filter((r) => r.sentiment === "neutral").length;
  const negativeCount = reviews.filter(
    (r) => r.sentiment === "negative",
  ).length;

  const sum = reviews.reduce((acc, r) => acc + parseFloat(r.rating || 0), 0);
  const averageRating =
    reviews.length > 0 ? (sum / reviews.length).toFixed(2) : 0;

  const sentimentRows = [
    {
      label: "Positive",
      emoji: "😊",
      color: "bg-emerald-400",
      percent: Math.round((positiveCount / totalReviews) * 100),
    },
    {
      label: "Neutral",
      emoji: "😐",
      color: "bg-amber-400",
      percent: Math.round((neutralCount / totalReviews) * 100),
    },
    {
      label: "Sad",
      emoji: "😢",
      color: "bg-blue-300",
      percent: Math.round((negativeCount / totalReviews) * 100),
    },
  ];

  useEffect(() => {
    if (id) getBookDetailsAndReviews();
  }, [id]);

  const getBookDetailsAndReviews = async () => {
    try {
      const [bookRes, reviewsRes] = await Promise.all([
        api.get(`/api/v1/books/${id}`),
        api.get(`/api/v1/reviews/?book=${id}`),
      ]);
      setBook(bookRes.data.results || bookRes.data);
      const fetchedReviews = reviewsRes.data.results || reviewsRes.data;
      setReviews(fetchedReviews);

      try {
        const tagsRes = await api.get(`/api/v1/books/${id}/shelf-tags/`);
        setShelfTags(tagsRes.data || []);
      } catch (_) {
        // endpoint not yet available — section stays hidden
      }

      const token = localStorage.getItem(ACCESS_TOKEN);
      if (token) {
        const tokenPayload = JSON.parse(atob(token.split(".")[1]));
        const myReview = fetchedReviews.find(
          (r) => r.user === tokenPayload?.user_id,
        );
        if (myReview) {
          setExistingReview(myReview);
          setRating(parseFloat(myReview.rating));
          setReviewText(myReview.text || "");
          setContainsSpoilers(myReview.contains_spoilers);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getPlaylist = async () => {
    try {
      const res = await api.get(`/api/v1/book/${id}/playlist/`);
      setPlaylist(res.data.results || res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handlePostReview = async () => {
    try {
      if (rating > 0) {
        await api.post(
          "/api/v1/reviews/",
          {
            book: book.id,
            rating,
            text: reviewText,
            contains_spoilers: containsSpoilers,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN)}`,
            },
          },
        );
        getBookDetailsAndReviews();
        setRating(0);
        setReviewText("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeleteReview = async () => {
    if (!existingReview) return;

    try {
      await api.delete(`/api/v1/reviews/${existingReview.id}`);
      setExistingReview(null);
      setRating(0);
      setReviewText("");
      setIsEditing(false);
      getBookDetailsAndReviews();
    } catch (error) {
      console.log(error);
    }
  };

  const handleUpdateReview = async () => {
    if (!existingReview || rating === 0) return;
    try {
      await api.patch(`/api/v1/reviews/${existingReview.id}/`, {
        rating,
        text: reviewText,
        contains_spoilers: containsSpoilers,
      });
      setIsEditing(false);
      getBookDetailsAndReviews();
    } catch (error) {
      console.log(error);
    }
  };

  const handleLike = async (reviewId) => {
    try {
      const res = await api.post(`/api/v1/reviews/${reviewId}/like/`);
      setReviews(
        reviews.map((r) =>
          r.id === reviewId
            ? { ...r, like_count: res.data.like_count, liked_by_user: res.data.liked }
            : r,
        ),
      );
    } catch (error) {
      console.log(error);
    }
  };

  const getCommentsReview = async (reviewId) => {
    try {
      const res = await api.get(`/api/v1/reviews/${reviewId}/comment/`);
      setComments((prev) => ({
        ...prev,
        [reviewId]: res.data.results || res.data,
      }));
    } catch (error) {
      console.log(error);
    }
  };

  const handleComment = async (reviewId) => {
    const text = commentTexts[reviewId] || "";
    if (!text.trim()) return;

    try {
      await api.post(`/api/v1/reviews/${reviewId}/comment/`, {
        review: reviewId,
        comment_text: text,
      });
      getCommentsReview(reviewId);
      setCommentTexts((prev) => ({ ...prev, [reviewId]: "" }));
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* ── Book Header ── */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 mb-6 flex gap-6">
          {book?.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-28 h-40 object-cover rounded-xl shadow-md shrink-0"
            />
          ) : (
            <div className="w-28 h-40 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 text-xs font-medium shrink-0">
              No Cover
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-2xl text-stone-900 leading-snug mb-1">
              {book?.title || "Book Title"}
            </h1>
            <p className="text-sm text-stone-500 mb-3">
              {book?.authors?.join(", ") || "Author"}
            </p>

            <div className="flex items-center gap-2 mb-4">
              <Rate
                allowHalf
                value={parseFloat(averageRating)}
                disabled
                style={{ fontSize: 14, color: "#f59e0b" }}
              />
              <span className="text-sm font-semibold text-stone-800">
                {averageRating}
              </span>
              <span className="text-xs text-stone-400">
                · {reviews.length} reviews
              </span>
            </div>

            <p className="text-sm text-stone-500 leading-relaxed line-clamp-4">
              {book?.description || "No description available."}
            </p>
          </div>
        </div>

        {/* ── Genre Tags ── */}
        {book?.genres?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {book.genres.map((g, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-xs font-medium border border-stone-200 text-stone-600 bg-white"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {/* ── Vibes & Moods ── */}
        {shelfTags.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-6">
            <p className="text-xs uppercase tracking-widest text-stone-400 font-medium mb-3">
              Vibes &amp; Moods
            </p>
            <div className="flex flex-wrap gap-2">
              {shelfTags.map((t) =>
                t.mention_count > 0 ? (
                  <span
                    key={t.tag}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium"
                  >
                    {t.tag}
                    <span className="text-emerald-500 text-[10px] font-normal">
                      {t.mention_count}
                    </span>
                  </span>
                ) : (
                  <span
                    key={t.tag}
                    className="px-3 py-1 rounded-full bg-stone-50 text-stone-500 border border-dashed border-stone-300 text-xs"
                  >
                    {t.tag}
                  </span>
                ),
              )}
            </div>
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={async () => {
              if (playlist.length > 0) {
                navigate(`/book/${id}/playlist`);
              } else {
                await getPlaylist();
                navigate(`/book/${id}/playlist`);
              }
            }}
            className="flex-1 h-11 rounded-full bg-stone-900 text-[#FAF8F4] text-sm font-medium tracking-wide hover:bg-emerald-800 transition-colors"
          >
            {playlist.length > 0 ? "View Playlist" : "Generate Playlist"}
          </button>
          <button
            onClick={() => navigate(`/book/${id}/preview`)}
            className="flex-1 h-11 rounded-full border border-stone-300 text-stone-700 text-sm font-medium tracking-wide hover:border-stone-500 hover:text-stone-900 transition-colors"
          >
            Read Preview
          </button>
        </div>

        {/* ── Sentiment Chart ── */}
        <div className="bg-emerald-900 rounded-2xl p-6 mb-6">
          <p className="text-xs uppercase tracking-widest text-emerald-300 mb-4 font-medium">
            Reader Sentiment
          </p>
          <div className="space-y-3">
            {sentimentRows.map(({ label, emoji, color, percent }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-2xl w-8">{emoji}</span>
                <div className="flex-1 h-5 bg-emerald-950 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-500`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-xs text-emerald-300 w-8 text-right">
                  {percent}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Rate & Review ── */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 mb-6">
          <h2 className="font-serif text-lg text-stone-900 mb-4">Your Review</h2>

          {existingReview && !isEditing ? (
            /* Show existing review with edit/delete options */
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Rate
                  allowHalf
                  value={parseFloat(existingReview.rating)}
                  disabled
                  style={{ fontSize: 16, color: "#f59e0b" }}
                />
                <span className="text-sm text-stone-500">{existingReview.rating} stars</span>
              </div>
              {existingReview.text && (
                <p className="text-sm text-stone-600 leading-relaxed mb-4">{existingReview.text}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2 rounded-full text-sm border border-stone-300 text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={handleDeleteReview}
                  className="px-5 py-2 rounded-full text-sm border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            /* Write or edit form */
            <div>
              <div className="flex justify-center mb-4">
                <Rate
                  allowHalf
                  value={rating}
                  onChange={setRating}
                  style={{ fontSize: 28, color: rating > 0 ? "#f59e0b" : "#d6d3d1" }}
                />
              </div>
              <textarea
                placeholder="Write a review..."
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 placeholder-stone-400 resize-none focus:outline-none focus:border-stone-400 transition-colors"
              />
              <div className="flex items-center justify-between mt-3">
                <label className="flex items-center gap-2 text-xs text-stone-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={containsSpoilers}
                    onChange={(e) => setContainsSpoilers(e.target.checked)}
                    className="rounded"
                  />
                  Contains spoilers
                </label>
                <div className="flex gap-2">
                  {isEditing && (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-5 py-2 rounded-full text-sm border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={isEditing ? handleUpdateReview : handlePostReview}
                    disabled={rating === 0}
                    className="px-6 py-2 rounded-full bg-stone-900 text-[#FAF8F4] text-sm font-medium hover:bg-emerald-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isEditing ? "Update Review" : "Post Review"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Community Reviews ── */}
        <h2 className="font-serif text-lg text-stone-900 mb-4">
          Community Reviews
        </h2>

        {reviews.length === 0 && (
          <p className="text-sm text-stone-400 text-center py-10">
            No reviews yet. Be the first to write one.
          </p>
        )}

        <div className="space-y-5">
          {reviews.map((review) => {
            const sentimentColor = {
              positive: "bg-emerald-50 text-emerald-700 border-emerald-200",
              neutral:  "bg-amber-50 text-amber-700 border-amber-200",
              negative: "bg-blue-50 text-blue-700 border-blue-200",
            }[review.sentiment] || "";

            return (
              <div key={review.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">

                {/* ── Review header: avatar, name, stars, date, sentiment ── */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-stone-200 text-stone-600 text-sm font-semibold flex items-center justify-center shrink-0">
                      {(review.username?.[0] || "U").toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-800">{review.username}</p>
                      <div className="flex items-center gap-1.5">
                        <Rate allowHalf value={parseFloat(review.rating)} disabled style={{ fontSize: 11, color: "#f59e0b" }} />
                        <span className="text-xs text-stone-400">{review.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {review.sentiment && sentimentColor && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${sentimentColor}`}>
                        {review.sentiment}
                      </span>
                    )}
                    <span className="text-[10px] text-stone-400">
                      {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* ── Spoiler warning ── */}
                {review.contains_spoilers && (
                  <p className="text-[10px] text-amber-600 font-medium mb-2 uppercase tracking-wider">⚠ Contains spoilers</p>
                )}

                {/* ── Review text ── */}
                <p className="text-sm text-stone-600 leading-relaxed mb-4">
                  {review.text || <span className="text-stone-300 italic">No written review.</span>}
                </p>

                {/* ── Like + Comment actions ── */}
                <div className="flex items-center gap-4 pt-3 border-t border-stone-50">
                  <button
                    onClick={() => handleLike(review.id)}
                    className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                      review.liked_by_user ? "text-rose-500" : "text-stone-400 hover:text-rose-400"
                    }`}
                  >
                    {review.liked_by_user ? "♥" : "♡"} {review.like_count ?? 0}
                  </button>
                  <button
                    onClick={() => {
                      const isOpening = openReviewCommentId !== review.id;
                      setReviewCommentId(isOpening ? review.id : null);
                      if (isOpening) getCommentsReview(review.id);
                    }}
                    className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-emerald-700 transition-colors font-medium"
                  >
                    💬 {review.comment_count ?? 0}
                  </button>
                </div>

                {/* ── Comment input (shown when that review's toggle is open) ── */}
                {openReviewCommentId === review.id && (
                  <div className="mt-4">
                    <textarea
                      value={commentTexts[review.id] || ""}
                      onChange={(e) => setCommentTexts((prev) => ({ ...prev, [review.id]: e.target.value }))}
                      placeholder="Write a comment..."
                      rows={2}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-700 placeholder-stone-400 resize-none focus:outline-none focus:border-stone-400 transition-colors"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => setReviewCommentId(null)}
                        className="px-4 py-1.5 rounded-full text-xs text-stone-500 border border-stone-200 hover:bg-stone-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleComment(review.id)}
                        className="px-4 py-1.5 rounded-full text-xs bg-stone-900 text-[#FAF8F4] hover:bg-emerald-800 transition-colors"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Existing comments ── */}
                {(comments[review.id] || []).length > 0 && (
                  <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
                    {(comments[review.id] || []).map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-stone-100 text-stone-500 text-xs font-semibold flex items-center justify-center shrink-0">
                          {(c.username?.[0] || "U").toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-stone-700">{c.username}</p>
                          <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{c.comment_text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            );
          })}
        </div>

        <div className="pb-16" />
      </div>
    </div>
  );
}

export default BookPage;
