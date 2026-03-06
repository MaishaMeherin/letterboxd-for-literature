import { useState, useEffect } from "react";
import { Avatar, Rate } from "antd";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import BookLogModal from "../components/BookLogModal";

function UserProfile() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [logs, setLogs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("books");
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      const tokenPayload = token ? JSON.parse(atob(token.split(".")[1])) : null;

      const [userRes, logsRes, reviewsRes] = await Promise.all([
        api.get("/api/v1/users/me/"),
        api.get("/api/v1/logs/"),
        api.get("/api/v1/reviews/"),
      ]);

      setUsername(userRes.data.username);

      const allLogs = logsRes.data.results || logsRes.data;
      setLogs(allLogs);

      const allReviews = reviewsRes.data.results || reviewsRes.data;
      const myReviews = tokenPayload
        ? allReviews.filter((r) => r.user === tokenPayload.user_id)
        : [];
      setReviews(myReviews);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = (refresh) => {
    setSelectedBook(null);
    if (refresh) fetchProfileData();
  };

  const completedLogs = logs.filter((l) => l.status === "completed");
  const tbrLogs = logs.filter((l) => l.status === "want_to_read");

  const stats = [
    { label: "Books", count: completedLogs.length, section: "books" },
    { label: "Diary", count: logs.length, section: "diary" },
    { label: "Reviews", count: reviews.length, section: "reviews" },
    { label: "To be Read list", count: tbrLogs.length, section: "tbr" },
  ];

  const sectionLogs = {
    books: completedLogs,
    diary: logs,
    tbr: tbrLogs,
  };

  const sectionTitle = {
    books: "Books",
    diary: "Diary",
    reviews: "Reviews",
    tbr: "To Be Read",
  };

  return (
    <div style={{ display: "flex", backgroundColor: "#0f0f0f", minHeight: "100vh" }}>
      {/* ── Left sidebar ── */}
      <div
        style={{
          width: 200,
          minWidth: 200,
          padding: "28px 20px",
          borderRight: "1px solid #1e1e1e",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none",
            border: "none",
            color: "#888",
            fontSize: 13,
            cursor: "pointer",
            marginBottom: 28,
            padding: 0,
            textAlign: "left",
          }}
        >
          ← Back
        </button>

        {/* Avatar + username */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <Avatar
            size={80}
            style={{ backgroundColor: "#1677ff", fontSize: 28, marginBottom: 10 }}
          >
            {username ? username[0].toUpperCase() : "?"}
          </Avatar>
          <p style={{ color: "#888", fontSize: 13, margin: 0 }}>{username}</p>
        </div>

        {/* Stat rows */}
        {loading ? (
          <p style={{ color: "#555", fontSize: 12 }}>Loading...</p>
        ) : (
          <div style={{ borderTop: "1px solid #2a2a2a" }}>
            {stats.map(({ label, count, section }) => (
              <div
                key={label}
                onClick={() =>
                  setActiveSection(activeSection === section ? null : section)
                }
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "13px 0",
                  borderBottom: "1px solid #2a2a2a",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    color: activeSection === section ? "#fff" : "#aaa",
                    fontWeight: activeSection === section ? 500 : 400,
                  }}
                >
                  {label}
                </span>
                <span style={{ color: "#666", fontSize: 13 }}>
                  {count} &gt;
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right content ── */}
      <div style={{ flex: 1, padding: "32px 36px", overflowY: "auto" }}>
        {!activeSection && (
          <p style={{ color: "#444", fontSize: 14, marginTop: 8 }}>
            Select a section to view.
          </p>
        )}

        {activeSection && (
          <h2 style={{ color: "#fff", margin: "0 0 24px", fontSize: 26 }}>
            {sectionTitle[activeSection]}
          </h2>
        )}

        {/* Books / Diary / TBR — book card grid */}
        {activeSection && activeSection !== "reviews" && (
          <>
            {sectionLogs[activeSection].length === 0 ? (
              <p style={{ color: "#666", fontSize: 14 }}>Nothing here yet.</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                {sectionLogs[activeSection].map((log) => {
                  const book = log.book_detail;
                  if (!book) return null;
                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedBook(book)}
                      style={{
                        width: 150,
                        backgroundColor: "#1e1e1e",
                        borderRadius: 8,
                        overflow: "hidden",
                        border: "1px solid #2a2a2a",
                        cursor: "pointer",
                      }}
                    >
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt={book.title}
                          style={{ width: "100%", height: 210, objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: 210,
                            backgroundColor: "#2a2a2a",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 10,
                            textAlign: "center",
                            color: "#888",
                            fontSize: 12,
                          }}
                        >
                          {book.title}
                        </div>
                      )}
                      <div style={{ padding: "8px 10px" }}>
                        <p
                          style={{
                            margin: 0,
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {book.title}
                        </p>
                        <p
                          style={{
                            margin: "3px 0 0",
                            color: "#666",
                            fontSize: 11,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {book.authors?.join(", ")}
                        </p>
                        <span
                          style={{
                            fontSize: 9,
                            color: "#555",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          {log.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Reviews section */}
        {activeSection === "reviews" && (
          <>
            {reviews.length === 0 ? (
              <p style={{ color: "#666", fontSize: 14 }}>No reviews yet.</p>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}
              >
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    style={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #2a2a2a",
                      borderRadius: 8,
                      padding: "16px 20px",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 6px",
                        color: "#fff",
                        fontWeight: 500,
                        fontSize: 14,
                      }}
                    >
                      {review.book_title}
                    </p>
                    <Rate
                      disabled
                      allowHalf
                      value={parseFloat(review.rating)}
                      style={{ fontSize: 13 }}
                    />
                    {review.text && (
                      <p
                        style={{
                          color: "#aaa",
                          fontSize: 13,
                          margin: "10px 0 0",
                          lineHeight: 1.6,
                        }}
                      >
                        {review.text}
                      </p>
                    )}
                    {review.contains_spoilers && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "#ff7875",
                          display: "block",
                          marginTop: 8,
                        }}
                      >
                        ⚠ Contains spoilers
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BookLogModal
        book={selectedBook}
        open={!!selectedBook}
        onClose={handleModalClose}
      />
    </div>
  );
}

export default UserProfile;
