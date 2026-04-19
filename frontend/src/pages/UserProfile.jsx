import { useState, useEffect } from "react";
import { Rate } from "antd";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import BookLogModal from "../components/BookLogModal";
import Navbar from "../components/Navbar";

function UserProfile() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [logs, setLogs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("books");
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => { fetchProfileData(); }, []);

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
      setReviews(tokenPayload ? allReviews.filter((r) => r.user === tokenPayload.user_id) : []);
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
  const tbrLogs       = logs.filter((l) => l.status === "want_to_read");

  const stats = [
    { label: "Books",           count: completedLogs.length, section: "books" },
    { label: "Diary",           count: logs.length,          section: "diary" },
    { label: "Reviews",         count: reviews.length,       section: "reviews" },
    { label: "To Be Read",      count: tbrLogs.length,       section: "tbr" },
    { label: "Recommendations", count: "", section: "recommendations" },
  ];

  const sectionLogs = { books: completedLogs, diary: logs, tbr: tbrLogs };

  const sectionTitle = {
    books: "Books Read",
    diary: "Reading Diary",
    reviews: "My Reviews",
    tbr: "To Be Read",
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10 flex gap-10">

        {/* ── Sidebar ── */}
        <aside className="w-52 shrink-0">

          {/* Avatar */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-full bg-stone-900 text-[#FAF8F4] text-2xl font-semibold flex items-center justify-center mb-3">
              {username ? username[0].toUpperCase() : "?"}
            </div>
            <p className="text-sm font-medium text-stone-800">{username}</p>
            <p className="text-xs text-stone-400 mt-0.5">Reader</p>
          </div>

          {/* Nav */}
          {loading ? (
            <p className="text-xs text-stone-400">Loading...</p>
          ) : (
            <nav className="space-y-1">
              {stats.map(({ label, count, section }) => (
                <button
                  key={section}
                  onClick={() => section === "recommendations" ? navigate("/recommendations") : setActiveSection(section)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    activeSection === section
                      ? "bg-stone-900 text-[#FAF8F4] font-medium"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  <span>{label}</span>
                  <span className={`text-xs ${activeSection === section ? "text-stone-400" : "text-stone-400"}`}>
                    {count}
                  </span>
                </button>
              ))}
            </nav>
          )}
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0">
          {activeSection && (
            <h2 className="font-serif text-2xl text-stone-900 mb-6">
              {sectionTitle[activeSection]}
            </h2>
          )}

          {/* Books / Diary / TBR */}
          {activeSection && activeSection !== "reviews" && activeSection !== "recommendations" && (
            <>
              {sectionLogs[activeSection].length === 0 ? (
                <div className="text-center py-20">
                  <p className="font-serif text-lg text-stone-400 mb-1">Nothing here yet</p>
                  <p className="text-sm text-stone-400">Start logging books to see them here.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {sectionLogs[activeSection].map((log) => {
                    const book = log.book_detail;
                    if (!book) return null;
                    return (
                      <div
                        key={log.id}
                        onClick={() => setSelectedBook(book)}
                        className="w-36 cursor-pointer group"
                        style={{ transition: "transform 0.2s ease" }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                      >
                        {book.cover_url ? (
                          <img
                            src={book.cover_url}
                            alt={book.title}
                            className="w-36 h-52 object-cover rounded-xl shadow-sm group-hover:shadow-md transition-shadow"
                          />
                        ) : (
                          <div className="w-36 h-52 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center p-3 text-center text-stone-400 text-xs">
                            {book.title}
                          </div>
                        )}
                        <div className="pt-2 px-0.5">
                          <p className="text-sm font-medium text-stone-800 truncate">{book.title}</p>
                          <p className="text-xs text-stone-400 truncate mt-0.5">{book.authors?.join(", ")}</p>
                          <span className="text-xs text-stone-300 uppercase tracking-wide">
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

          {/* Reviews */}
          {activeSection === "reviews" && (
            <>
              {reviews.length === 0 ? (
                <div className="text-center py-20">
                  <p className="font-serif text-lg text-stone-400 mb-1">No reviews yet</p>
                  <p className="text-sm text-stone-400">Review a book to see it here.</p>
                </div>
              ) : (
                <div className="space-y-4 max-w-2xl">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white rounded-2xl border border-stone-100 shadow-sm px-5 py-4"
                    >
                      <p
                        className="font-medium text-stone-900 text-sm mb-1 cursor-pointer hover:text-emerald-700 transition-colors"
                        onClick={() => navigate(`/book/${review.book}/`)}
                      >
                        {review.book_title}
                      </p>
                      <Rate disabled allowHalf value={parseFloat(review.rating)} style={{ fontSize: 12, color: "#f59e0b" }} />
                      {review.text && (
                        <p className="text-sm text-stone-500 mt-2 leading-relaxed">{review.text}</p>
                      )}
                      {review.contains_spoilers && (
                        <span className="text-xs text-red-400 block mt-2">⚠ Contains spoilers</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <BookLogModal book={selectedBook} open={!!selectedBook} onClose={handleModalClose} />
    </div>
  );
}

export default UserProfile;