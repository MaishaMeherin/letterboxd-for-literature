import { useState, useEffect } from "react";
import { Rate } from "antd";
import api from "../api";
import BookLogModal from "../components/BookLogModal";

function Home() {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getBooks();
  }, []);

  const getBooks = async () => {
    try {
      const res = await api.get("/api/v1/books/");
      setBooks(res.data.results || res.data);
    } catch (error) {
      console.log(error.response?.data ?? error.message);
    }
  };

  const filteredBooks = books.filter((book) => {
    const query = searchQuery.toLowerCase();
    return (
      book.title.toLowerCase().includes(query) ||
      book.authors?.join(", ").toLowerCase().includes(query) ||
      book.genres?.join(", ").toLowerCase().includes(query)
    );
  });

  const handleModalClose = (refresh) => {
    setSelectedBook(null); // close the modal
    if (refresh) getBooks(); // refetch books if something changed
  };

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      <h2>Browse Books</h2>
      <input
        type="text"
        placeholder="Search by title, author, or genre..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 12px",
          marginBottom: "16px",
          borderRadius: "4px",
          border: "1px solid #444",
          backgroundColor: "#1a1a1a",
          color: "#fff",
          fontSize: "14px",
        }}
      />

      <p style={{ color: "#888", marginBottom: 16 }}>
        {filteredBooks.length} books
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        {filteredBooks.map((book) => (
          <div
            key={book.id}
            onClick={() => setSelectedBook(book)}
            style={{
              width: 200,
              backgroundColor: "#1e1e1e",
              borderRadius: 8,
              overflow: "hidden",
              border: "1px solid #333",
            }}
          >
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                style={{ width: "100%", height: 280, objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: 280,
                  backgroundColor: "#2a2a2a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 12,
                  textAlign: "center",
                  color: "#888",
                }}
              >
                {book.title}
              </div>
            )}

            <div style={{ padding: "12px" }}>
              <h4
                style={{
                  margin: 0,
                  color: "#fff",
                  fontSize: 14,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {book.title}
              </h4>
              <p
                style={{
                  margin: "4px 0 8px",
                  color: "#888",
                  fontSize: 12,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {book.authors?.join(", ") || "Unknown author"}
              </p>

              {book.rating_count > 0 ? (
                <Rate
                  disabled
                  value={Number(book.avg_rating)}
                  allowHalf
                  style={{ fontSize: 12 }}
                />
              ) : (
                <span style={{ color: "#666", fontSize: 11 }}>
                  Not yet rated
                </span>
              )}
            </div>
          </div>
        ))}

        {filteredBooks.length === 0 && (
          <p style={{ color: "#888" }}>No books found.</p>
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

export default Home;
