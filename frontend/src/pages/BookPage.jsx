import { useState, useEffect } from "react";
import api from "../api";
import { useParams, useNavigate } from "react-router-dom";
import { Rate, Button, Avatar, Input, Divider } from "antd";
import { ACCESS_TOKEN } from "../constants";
import {
  useBookStore,
  useReviewFormStore,
  useLogFormStore,
  usePlaylistStore,
} from "../store";

const { TextArea } = Input;

const MOCK_REVIEWS = [
  {
    id: 1,
    username: "username",
    rating: 4,
    text: "Review",
    likes: 200,
    comments: 10,
  },
  {
    id: 2,
    username: "username",
    rating: 4,
    text: "Review",
    likes: 200,
    comments: 10,
  },
];

const card = {
  backgroundColor: "#fff",
  borderRadius: 14,
  padding: "20px 24px",
  marginBottom: 20,
  boxShadow: "0 2px 10px rgba(0,0,0,0.09)",
  border: "1px solid #e8e8e8",
};

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

  const { status, setStatus } = useLogFormStore();

  const { playlist, setPlaylist, existingPlaylist, setExistingPlaylist } =
    usePlaylistStore();

  const [loading, setLaoding] = useState(false);

  const [comments, setComments] = useState([]);
  const [openReviewCommentId, setReviewCommentId] = useState(null);
  const [commentText, setCommentText] = useState("");

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
      emoji: "😊",
      color: "#4ade80",
      percent: Math.round((positiveCount / totalReviews) * 100),
    },
    {
      emoji: "😐",
      color: "#facc15",
      percent: Math.round((neutralCount / totalReviews) * 100),
    },
    {
      emoji: "😢",
      color: "#93c5fd",
      percent: Math.round((negativeCount / totalReviews) * 100),
    },
  ];

  useEffect(() => {
    if (id) {
      setPlaylist([]);
      getBookDetailsAndReviews();
      getPlaylist();
    }
  }, [id]);

  const getBookDetailsAndReviews = async () => {
    try {
      const [bookRes, reviewsRes] = await Promise.all([
        api.get(`/api/v1/books/${id}`),
        api.get(`/api/v1/reviews/?book=${id}`),
      ]);
      setBook(bookRes.data.results || bookRes.data);

      const reviews = reviewsRes.data.results || reviewsRes.data;
      setReviews(reviews);

      const token = localStorage.getItem(ACCESS_TOKEN);
      if (token) {
        const tokenPayload = JSON.parse(atob(token.split(".")[1]));
        const myReview = reviews.find((r) => r.user === tokenPayload?.user_id);

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
      const playlistRes = await api.get(`/api/v1/book/${id}/playlist/`);
      const data = playlistRes.data.results || playlistRes.data;
      setPlaylist(data);
      console.log(data);

      // const doesPlaylistExists = data.find((p) => p.book === id);
      // if (doesPlaylistExists) {
      //   setExistingPlaylist(doesPlaylistExists);
      // }
    } catch (error) {
      console.log(error);
    }
  };

  const handlePostReview = async () => {
    try {
      if (rating > 0) {
        const reviewPayload = {
          book: book.id,
          rating,
          text: reviewText,
          contains_spoilers: containsSpoilers,
        };

        await api.post("/api/v1/reviews/", reviewPayload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN)}`,
          },
        });

        getBookDetailsAndReviews();
        setRating(0);
        setReviewText("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleLike = async (reviewId) => {
    try {
      const res = await api.post(`/api/v1/reviews/${reviewId}/like/`);

      setReviews(
        reviews.map((r) =>
          r.id === reviewId ? { ...r, like_count: res.data.like_count } : r,
        ),
      );
    } catch (error) {
      console.log(error);
    }
  };

  const getCommentsReview = async (reviewId) => {
    try {
      const commentRes = await api.get(`/api/v1/reviews/${reviewId}/comment/`);
      const data = commentRes.data.results || commentRes.data;
      console.log(data); //data comments is an object

      setComments((prev) => ({ ...prev, [reviewId]: data }));
      console.log(comments[reviewId]);
    } catch (error) {
      console.log(error);
    }
  };

  const handleComment = async (reviewId) => {
    try {
      const commentPayload = {
        review: reviewId,
        comment_text: commentText,
      };

      const res = await api.post(
        `/api/v1/reviews/${reviewId}/comment/`,
        commentPayload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN)}`,
          },
        },
      );

      getCommentsReview(reviewId);
      setReviewCommentId(reviewId);
      setCommentText("");
    } catch (error) {
      console.log(error);
    }
  };

  const displayReviews = reviews.length > 0 ? reviews : MOCK_REVIEWS;

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#f2f2f7",
        padding: "28px 32px",
        boxSizing: "border-box",
        fontFamily: "sans-serif",
      }}
    >
      {/* Book Header Card */}
      <div style={card}>
        <div style={{ display: "flex", gap: 20 }}>
          {book?.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              style={{
                width: 120,
                height: 160,
                objectFit: "cover",
                borderRadius: 10,
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            />
          ) : (
            <div
              style={{
                width: 120,
                height: 160,
                background: "linear-gradient(135deg, #d0d0d0, #b0b0b0)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#666",
                fontSize: 12,
                fontWeight: 600,
                textAlign: "center",
                flexShrink: 0,
                letterSpacing: 0.5,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              BOOK
              <br />
              COVER
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h2
              style={{
                fontWeight: 900,
                textTransform: "uppercase",
                margin: "0 0 4px",
                fontSize: 22,
                color: "#111",
                letterSpacing: 0.5,
              }}
            >
              {book?.title || "BOOK NAME"}
            </h2>
            <p
              style={{
                color: "#555",
                margin: "0 0 12px",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {book?.authors?.join(", ") || "Author name"}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
                flexWrap: "wrap",
              }}
            >
              <Rate
                allowHalf
                value={parseFloat(averageRating)}
                disabled
                style={{ fontSize: 15, color: "#f59e0b" }}
              />
              <span style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>
                {averageRating}
              </span>
              <span style={{ color: "#888", fontSize: 12 }}>
                {totalReviews} reviews
              </span>
            </div>
            <div
              style={{
                border: "1.5px solid #d0d0d0",
                borderRadius: 8,
                padding: "10px 12px",
                color: "#444",
                fontSize: 13,
                minHeight: 60,
                backgroundColor: "#fafafa",
                lineHeight: 1.5,
              }}
            >
              {book?.description || "Description"}
            </div>
          </div>
        </div>
      </div>

      {/* Generate Playlist */}
      <Button
        block
        onClick={async () => {
          if (playlist.length > 0) {
            navigate(`/book/${id}/playlist`);
          } else {
            await getPlaylist();
            navigate(`/book/${id}/playlist`);
          }
        }}
        style={{
          marginBottom: 20,
          fontWeight: 800,
          fontSize: 15,
          height: 50,
          borderRadius: 12,
          letterSpacing: 2,
          border: "2px solid #111",
          color: "#111",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        {playlist.length > 0 ? "Playlist Created " : "GENERATE PLAYLIST"}
      </Button>

      {/* Sentiment Chart */}
      <div
        style={{
          backgroundColor: "#1e5f4e",
          borderRadius: 14,
          padding: "22px 28px",
          marginBottom: 20,
          boxShadow: "0 4px 14px rgba(30,95,78,0.3)",
        }}
      >
        {sentimentRows.map(({ emoji, color, percent }) => (
          <div
            key={emoji}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 14,
            }}
          >
            <span style={{ fontSize: 32, lineHeight: 1 }}>{emoji}</span>
            <div
              style={{
                flex: 1,
                height: 24,
                backgroundColor: "#0d3d2e",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${percent}%`,
                  height: "100%",
                  backgroundColor: color,
                  borderRadius: 12,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Status + Genres */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Button
          style={{
            borderRadius: 20,
            fontWeight: 600,
            fontSize: 13,
            borderColor: "#333",
            color: "#333",
            height: 34,
          }}
        >
          Want to read &nbsp;∨
        </Button>
        {(book?.genres || []).map((g, i) => (
          <span
            key={i}
            style={{
              padding: "5px 16px",
              border: "1.5px solid #aaa",
              borderRadius: 20,
              fontSize: 13,
              color: "#333",
              fontWeight: 500,
              backgroundColor: "#fff",
            }}
          >
            {g}
          </span>
        ))}
      </div>

      {/* Rate + Write Review Card */}
      <div style={card}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <h3
            style={{
              fontWeight: 800,
              fontSize: 20,
              margin: "0 0 10px",
              color: "#111",
            }}
          >
            Rate
          </h3>
          <Rate
            allowHalf
            value={rating}
            onChange={setRating}
            style={{ fontSize: 32, color: rating > 0 ? "#f59e0b" : "#d0d0d0" }}
          />
        </div>
        <Divider style={{ margin: "16px 0", borderColor: "#e0e0e0" }} />
        <TextArea
          placeholder="Write a review..."
          rows={4}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          style={{
            borderRadius: 10,
            fontSize: 14,
            border: "1.5px solid #d0d0d0",
            resize: "none",
          }}
        />
        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}
        >
          <Button
            type="primary"
            onClick={() => handlePostReview()}
            style={{
              borderRadius: 20,
              fontWeight: 700,
              fontSize: 14,
              height: 38,
              paddingInline: 24,
              backgroundColor: "#111",
              borderColor: "#111",
            }}
          >
            {existingReview ? "Already reviewed" : "Post Review"}
          </Button>
        </div>
      </div>

      {/* Reviews Section Label */}
      <h4
        style={{
          fontWeight: 700,
          fontSize: 16,
          color: "#333",
          marginBottom: 12,
          paddingLeft: 4,
        }}
      >
        Community Reviews
      </h4>

      {/* Review Cards */}
      {displayReviews.map((review) => (
        <div
          key={review.id}
          style={{
            ...card,
            display: "flex",
            gap: 16,
            padding: "18px 20px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              minWidth: 58,
            }}
          >
            <Avatar
              size={50}
              style={{
                backgroundColor: "#c7c7cc",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              {(review.username?.[0] || "U").toUpperCase()}
            </Avatar>
            <span style={{ fontSize: 12, color: "#444", fontWeight: 600 }}>
              {review.username}
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <Rate
                allowHalf
                value={parseFloat(review.rating)}
                disabled
                style={{ fontSize: 15, color: "#f59e0b" }}
              />
              <span style={{ fontWeight: 700, fontSize: 13, color: "#222" }}>
                {review.rating} stars
              </span>
            </div>
            <div
              style={{
                border: "1.5px solid #d8d8d8",
                borderRadius: 8,
                padding: "10px 12px",
                color: "#333",
                fontSize: 13,
                marginBottom: 10,
                minHeight: 40,
                backgroundColor: "#fafafa",
                lineHeight: 1.5,
              }}
            >
              {review.text || "Review"}
            </div>
            <div
              style={{
                color: "#888",
                fontSize: 12,
                marginBottom: 10,
                fontWeight: 500,
              }}
            >
              {review.like_count ?? 0} Likes &nbsp;·&nbsp;{" "}
              {review.comments ?? 10} comments
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                size="small"
                onClick={() => handleLike(review.id)}
                style={{
                  borderRadius: 20,
                  fontSize: 12,
                  borderColor: "#bbb",
                  color: "#333",
                  fontWeight: 600,
                }}
              >
                Like
              </Button>
              <Button
                size="small"
                onClick={() => {
                  const isOpening = openReviewCommentId !== review.id;
                  setReviewCommentId(isOpening ? review.id : null);
                  setCommentText("");
                  getCommentsReview(review.id);
                }}
                style={{
                  borderRadius: 20,
                  fontSize: 12,
                  borderColor: "#bbb",
                  color: "#333",
                  fontWeight: 600,
                }}
              >
                Comment
              </Button>
            </div>

            {openReviewCommentId === review.id && (
              <div style={{ marginTop: 12 }}>
                <Input.TextArea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  rows={3}
                  style={{ borderRadius: 8, fontSize: 13, resize: "none" }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  <Button
                    size="small"
                    onClick={() => {
                      setReviewCommentId(null);
                      setCommentText("");
                    }}
                    style={{ borderRadius: 20, fontSize: 12 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => handleComment(review.id)}
                    style={{
                      borderRadius: 20,
                      fontSize: 12,
                      backgroundColor: "#111",
                      borderColor: "#111",
                    }}
                  >
                    Post Comment
                  </Button>
                </div>
              </div>
            )}

            {/* Existing comments */}
            <div style={{ marginBottom: 12 }}>
              {(comments[review.id] || []).map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    gap: 10,
                    marginBottom: 10,
                    padding: "8px 12px",
                    backgroundColor: "#fafafa",
                    borderRadius: 8,
                    border: "1px solid #e8e8e8",
                  }}
                >
                  <Avatar
                    size={28}
                    style={{ backgroundColor: "#c7c7cc", flexShrink: 0 }}
                  >
                    {(c.username?.[0] || "U").toUpperCase()}
                  </Avatar>

                  <div>
                    <span
                      style={{ fontWeight: 600, fontSize: 12, color: "#333" }}
                    >
                      {c.username}
                    </span>
                    <p
                      style={{ margin: "2px 0 0", fontSize: 13, color: "#444" }}
                    >
                      {c.comment_text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Pagination Dots */}
      <div style={{ textAlign: "center", marginTop: 8, paddingBottom: 32 }}>
        {[...Array(9)].map((_, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: i === 0 ? "#555" : "#c7c7cc",
              margin: "0 4px",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default BookPage;
