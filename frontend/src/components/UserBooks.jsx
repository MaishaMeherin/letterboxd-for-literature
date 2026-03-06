import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import BookLogModal from "../components/BookLogModal";

function UserBooks() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get("/api/v1/logs/");
      setLogs(res.data.results || res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = (refresh) => {
    setSelectedBook(null);
    if (refresh) fetchLogs();
  };

  return (
    <div style={{ display: "flex", backgroundColor: "#0f0f0f", minHeight: "100vh" }}>
      {/* Left sidebar */}
      <div style={{ width: 220, minWidth: 220, padding: "32px 24px", borderRight: "1px solid #1e1e1e" }}>
        <button
          onClick={() => navigate("/user/me")}
          style={{ background: "none", border: "none", color: "#888", fontSize: 14, cursor: "pointer", marginBottom: 32, padding: 0 }}
        >
          ← Back
        </button>
        <h2 style={{ color: "#fff", margin: "0 0 8px" }}>My Books</h2>
        <p style={{ color: "#555", fontSize: 13, margin: 0 }}>{logs.length} logged</p>
      </div>

      {/* Right content */}
      <div style={{ flex: 1, padding: "32px 32px" }}>
        {loading ? (
          <p style={{ color: "#555" }}>Loading...</p>
        ) : logs.length === 0 ? (
          <p style={{ color: "#888" }}>No books logged yet.</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {logs.map((log) => {
              const book = log.book_detail;
              if (!book) return null;
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedBook(book)}
                  style={{
                    width: 160,
                    backgroundColor: "#1e1e1e",
                    borderRadius: 8,
                    overflow: "hidden",
                    border: "1px solid #333",
                    cursor: "pointer",
                  }}
                >
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      style={{ width: "100%", height: 220, objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{
                      width: "100%", height: 220, backgroundColor: "#2a2a2a",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: 12, textAlign: "center", color: "#888",
                    }}>
                      {book.title}
                    </div>
                  )}
                  <div style={{ padding: "10px 12px" }}>
                    <p style={{ margin: 0, color: "#fff", fontSize: 13, fontWeight: 500,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {book.title}
                    </p>
                    <p style={{ margin: "4px 0 0", color: "#666", fontSize: 11,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {book.authors?.join(", ")}
                    </p>
                    <span style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {log.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
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

export default UserBooks;
