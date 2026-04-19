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
      className="w-40 shrink-0 cursor-pointer group"
      style={{ transition: "transform 0.2s ease" }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.transform = "translateY(-4px)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      <div className="relative" onClick={() => onNavigate(book.id)}>
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-40 h-60 object-cover rounded-xl shadow-sm group-hover:shadow-md transition-shadow"
          />
        ) : (
          <div className="w-40 h-60 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center p-3 text-center text-stone-400 text-xs font-medium">
            {book.title}
          </div>
        )}

        {/* ··· button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white text-base font-bold flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors leading-none"
        >
          ···
        </button>
      </div>

      <div className="pt-2 px-0.5">
        <p
          onClick={() => onNavigate(book.id)}
          className="text-sm font-semibold text-stone-800 truncate hover:text-emerald-700 transition-colors cursor-pointer"
        >
          {book.title}
        </p>
        <p className="text-xs text-stone-400 truncate mt-0.5">
          {book.authors?.join(", ") || "Unknown author"}
        </p>
        {book.rating_count > 0 ? (
          <Rate
            disabled
            value={Number(book.avg_rating)}
            allowHalf
            style={{ fontSize: 10, color: "#f59e0b" }}
          />
        ) : (
          <span className="text-xs text-stone-300">Not yet rated</span>
        )}
      </div>
    </div>
  );
}

/* ── Horizontal Scroll Row ── */
function BookRow({ title, books, onNavigate, onBookClick }) {
  const scrollRef = useRef(null);
  if (!books || books.length === 0) return null;

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -500 : 500,
      behavior: "smooth",
    });
  };

  return (
    <div className="mb-12">
      <h3 className="font-serif text-xl text-stone-900 mb-4">{title}</h3>
      <div className="relative">
        <button
          onClick={() => scroll("left")}
          className="absolute -left-4 top-1/2 -translate-y-8 z-10 w-8 h-8 rounded-full bg-white border border-stone-200 shadow-sm text-stone-600 text-lg flex items-center justify-center hover:bg-stone-50 transition-colors"
        >
          ‹
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
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

        <button
          onClick={() => scroll("right")}
          className="absolute -right-4 top-1/2 -translate-y-8 z-10 w-8 h-8 rounded-full bg-white border border-stone-200 shadow-sm text-stone-600 text-lg flex items-center justify-center hover:bg-stone-50 transition-colors"
        >
          ›
        </button>
      </div>
    </div>
  );
}

/* ── Home ── */
function Home() {
  const { selectedBook, setSelectedBook } = useBookStore();
  const { username, setUsername } = useAuthStore();

  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    getUser();
  }, []);

  useEffect(() => {
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
        setSearchResults(res.data.results || res.data);
      } catch (e) {
        console.log(e);
      }
      setSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const [t, p, r, re] = await Promise.all([
        api.get("/api/v1/books/trending/"),
        api.get("/api/v1/books/popular/"),
        api.get("/api/v1/books/top-rated/"),
        api.get("/api/v1/books/recent/"),
      ]);
      setTrending(t.data.results || t.data);
      setPopular(p.data.results || p.data);
      setTopRated(r.data.results || r.data);
      setRecent(re.data.results || re.data);
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  };

  const getUser = async () => {
    try {
      const res = await api.get("/api/v1/users/me/");
      setUsername(res.data.username);
    } catch (e) {
      console.log(e);
    }
  };

  const goToBook = (id) => navigate(`/book/${id}`);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <p className="text-stone-400 text-sm tracking-wide">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Greeting */}
        {username && (
          <p className="text-sm text-stone-400 mb-6 tracking-wide">
            Welcome back,{" "}
            <span className="text-stone-700 font-medium">{username}</span>
          </p>
        )}

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search by title, author, or genre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-lg px-5 py-3 rounded-full border border-stone-200 bg-white text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-colors shadow-sm"
          />
        </div>

        {/* Search results */}
        {searchQuery.trim() ? (
          <div className="pb-16">
            <p className="text-sm text-stone-400 mb-6">
              {searching
                ? "Searching..."
                : `${searchResults.length} results for "${searchQuery}"`}
            </p>
            <div className="flex flex-wrap gap-4">
              {searchResults.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onClick={() => setSelectedBook(book)}
                  onNavigate={goToBook}
                />
              ))}
              {!searching && searchResults.length === 0 && (
                <p className="text-sm text-stone-400">No books found.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="pb-16">
            <BookRow
              title="Trending This Week"
              books={trending}
              onNavigate={goToBook}
              onBookClick={setSelectedBook}
            />
            <BookRow
              title="Top Rated"
              books={topRated}
              onNavigate={goToBook}
              onBookClick={setSelectedBook}
            />
            <BookRow
              title="Popular on PageTurner"
              books={popular}
              onNavigate={goToBook}
              onBookClick={setSelectedBook}
            />
            <BookRow
              title="Recently Added"
              books={recent}
              onNavigate={goToBook}
              onBookClick={setSelectedBook}
            />

            {[trending, topRated, popular, recent].every(
              (l) => l.length === 0,
            ) && (
              <div className="text-center py-24">
                <p className="font-serif text-xl text-stone-400 mb-2">
                  Your shelf is empty
                </p>
                <p className="text-sm text-stone-400">
                  Start by adding books and writing reviews.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

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
