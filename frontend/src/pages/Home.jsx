import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Rate } from "antd";
import api from "../api";
import Navbar from "../components/Navbar";
import BookLogModal from "../components/BookLogModal";
import { useAuthStore, useBookStore } from "../store";

/* ── Book Card ── */
function BookCard({ book, onClick, onNavigate }) {
  return (
    <div
      style={{
        minWidth: 160,
        maxWidth: 160,
        flexShrink: 0,
        transition: "transform 0.25s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {/* Cover + menu button */}
      <div
        onClick={() => onNavigate(book.id)}
        style={{ position: "relative", cursor: "pointer" }}
      >
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            style={{
              width: 160,
              height: 240,
              objectFit: "cover",
              borderRadius: 6,
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: 160,
              height: 240,
              backgroundColor: "#1e1e1e",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 12,
              textAlign: "center",
              color: "#666",
              fontSize: 12,
              border: "1px solid #2a2a2a",
            }}
          >
            {book.title}
          </div>
        )}

        {/* ··· button on top right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "none",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            letterSpacing: 1,
            backdropFilter: "blur(4px)",
          }}
        >
          ···
        </button>
      </div>

      {/* Book info */}
      <div style={{ padding: "8px 2px 0" }}>
        <p
          onClick={() => onNavigate(book.id)}
          style={{
            margin: 0,
            color: "#e0e0e0",
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            cursor: "pointer",
          }}
        >
          {book.title}
        </p>
        <p
          style={{
            margin: "2px 0 4px",
            color: "#777",
            fontSize: 11,
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
            style={{ fontSize: 10 }}
          />
        ) : (
          <span style={{ color: "#555", fontSize: 10 }}>Not yet rated</span>
        )}
      </div>
    </div>
  );
}

/* ── Horizontal Scroll Row ── */
function BookRow({ title, books, onNavigate, onBookClick }) {
  const scrollRef = useRef(null);

  if (!books || books.length === 0) return null;

  const scroll = (direction) => {
    if (scrollRef.current) {
      const amount = direction === "left" ? -500 : 500;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <div style={{ marginBottom: 40 }}>
      <h3
        style={{
          color: "#fff",
          fontSize: 20,
          fontWeight: 700,
          margin: "0 0 14px 4px",
          letterSpacing: 0.3,
        }}
      >
        {title}
      </h3>

      <div style={{ position: "relative" }}>
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          style={{
            position: "absolute",
            left: -16,
            top: "50%",
            transform: "translateY(-70%)",
            zIndex: 10,
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "none",
            backgroundColor: "rgba(0,0,0,0.7)",
            color: "#fff",
            fontSize: 18,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ‹
        </button>

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          style={{
            display: "flex",
            gap: 14,
            overflowX: "auto",
            paddingBottom: 8,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onClick={() => onBookClick(book)}
              onNavigate={onNavigate}
            />
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          style={{
            position: "absolute",
            right: -16,
            top: "50%",
            transform: "translateY(-70%)",
            zIndex: 10,
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "none",
            backgroundColor: "rgba(0,0,0,0.7)",
            color: "#fff",
            fontSize: 18,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ›
        </button>
      </div>
    </div>
  );
}

function Home() {
  const { books, setBooks, selectedBook, setSelectedBook } = useBookStore();
  const { username, setUsername } = useAuthStore();

  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [recent, setRecent] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    getUser();
  }, []);

  //debounced search, waits for 400ms after user stops typing
  useEffect(() => {
    //if search bar empty don't make api call
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(
          `/api/v1/books/?search=${encodeURIComponent(searchQuery)}`,
        );

        const data = res.data.results || res.data;

        setSearchResults(data);
      } catch (error) {
        console.log(error);
      }
      setSearching(false);
    }, 400);

    //useEffect can return a cleanup, with each keystroke cleanup is called first to cancel the previous timer.
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const [trendingRes, popularRes, topRatedRes, recentRes] =
        await Promise.all([
          api.get("/api/v1/books/trending/"),
          api.get("/api/v1/books/popular/"),
          api.get("/api/v1/books/top-rated/"),
          api.get("/api/v1/books/recent/"),
        ]);

      setTrending(trendingRes.data.results || trendingRes.data);
      setPopular(popularRes.data.results || popularRes.data);
      setTopRated(topRatedRes.data.results || topRatedRes.data);
      setRecent(recentRes.data.results || recentRes.data);
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  // const getBooks = async () => {
  //   try {
  //     let allBooks = [];
  //     let url = "/api/v1/books/";
  //     while (url) {
  //       const res = await api.get(url);
  //       const data = res.data;
  //       allBooks = allBooks.concat(data.results || data);
  //       // data.next is an absolute URL; extract just the path+query for the api instance
  //       if (data.next) {
  //         const nextUrl = new URL(data.next);
  //         url = nextUrl.pathname + nextUrl.search;
  //       } else {
  //         url = null;
  //       }
  //     }
  //     setBooks(allBooks);
  //   } catch (error) {
  //     console.log(error.response?.data ?? error.message);
  //   }
  // };

  const getUser = async () => {
    try {
      const res = await api.get("/api/v1/users/me/");
      setUsername(res.data.username);
    } catch (error) {
      console.log(error);
    }
  };

  // const filteredBooks = books.filter((book) => {
  //   const query = searchQuery.toLowerCase();
  //   return (
  //     book.title.toLowerCase().includes(query) ||
  //     book.authors?.join(", ").toLowerCase().includes(query) ||
  //     book.genres?.join(", ").toLowerCase().includes(query)
  //   );
  // });

  // const handleModalClose = (refresh) => {
  //   setSelectedBook(null); // close the modal
  //   if (refresh) getBooks(); // refetch books if something changed
  // };

  const navigate = useNavigate();

  const goToBookPage = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#666",
          fontSize: 16,
        }}
      >
        Loading...
      </div>
    );
  }
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0a0a0a",
        color: "#fff",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px" }}>
        <Navbar />

        {/* Search bar */}
        <div style={{ padding: "20px 0 8px" }}>
          <input
            type="text"
            placeholder="Search books by title, author, or genre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              maxWidth: 520,
              padding: "12px 18px",
              borderRadius: 8,
              border: "1px solid #2a2a2a",
              backgroundColor: "#141414",
              color: "#fff",
              fontSize: 14,
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#444")}
            onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
          />
        </div>

        {/* Search results */}
        {searchQuery.trim() ? (
          <div style={{ paddingTop: 12, paddingBottom: 40 }}>
            <h3 style={{ color: "#aaa", fontSize: 16, marginBottom: 16 }}>
              {searching
                ? "Searching..."
                : `Results for "${searchQuery}" (${searchResults.length})`}
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
              {searchResults.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onClick={() => setSelectedBook(book)}
                  onNavigate={goToBookPage}
                />
              ))}
              {!searching && searchResults.length === 0 && (
                <p style={{ color: "#555" }}>No books found.</p>
              )}
            </div>
          </div>
        ) : (
          /* Category rows */
          <div style={{ paddingTop: 20 }}>
            <BookRow
              title="🔥 Trending This Week"
              books={trending}
              onNavigate={goToBookPage}
              onBookClick={setSelectedBook}
            />
            <BookRow
              title="⭐ Top Rated"
              books={topRated}
              onNavigate={goToBookPage}
              onBookClick={setSelectedBook}
            />
            <BookRow
              title="📚 Popular on PageTurner"
              books={popular}
              onNavigate={goToBookPage}
              onBookClick={setSelectedBook}
            />
            <BookRow
              title="🆕 Recently Added"
              books={recent}
              onNavigate={goToBookPage}
              onBookClick={setSelectedBook}
            />

            {trending.length === 0 &&
              topRated.length === 0 &&
              popular.length === 0 &&
              recent.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px 0",
                    color: "#555",
                  }}
                >
                  <p style={{ fontSize: 18, marginBottom: 8 }}>
                    No books to show yet
                  </p>
                  <p style={{ fontSize: 13 }}>
                    Start by adding books, writing reviews, and logging your
                    reading activity.
                  </p>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Book Log Modal */}
      <BookLogModal
        book={selectedBook}
        open={!!selectedBook}
        onClose={(refresh) => {
          setSelectedBook(null);
          if (refresh) fetchCategories();
        }}
      />
    </div>
  );
}

export default Home;
