import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";

function BookPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [googleBooksId, setGoogleBooksId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [embedError, setEmbedError] = useState(null);
  const viewerRef = useRef(null);
  const isMountedRef = useRef(true);
  const renderAttemptsRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setApiError(null);
    setEmbedError(null);

    const fetchData = async () => {
      try {
        const [bookRes, previewRes] = await Promise.all([
          api.get(`/api/v1/books/${id}/`),
          api.get(`/api/v1/books/${id}/preview/`),
        ]);
        if (!isMountedRef.current) return;
        setBook(bookRes.data);
        setGoogleBooksId(previewRes.data.google_books_id);
      } catch (err) {
        if (!isMountedRef.current) return;
        setApiError("Preview not available for this book.");
      }
      if (isMountedRef.current) setLoading(false);
    };

    fetchData();
  }, [id]);

  const renderViewer = useCallback((volumeId) => {
    if (renderAttemptsRef.current > 20) {
      if (isMountedRef.current) setEmbedError("Viewer took too long to initialize.");
      return;
    }
    if (!viewerRef.current) {
      renderAttemptsRef.current += 1;
      setTimeout(() => renderViewer(volumeId), 300);
      return;
    }
    viewerRef.current.innerHTML = "";
    renderAttemptsRef.current = 0;
    const viewer = new window.google.books.DefaultViewer(viewerRef.current);
    viewer.load(volumeId, () => {
      if (isMountedRef.current) setEmbedError("This book's preview is not available for embedding.");
    });
  }, []);

  const waitForGoogleAndLoad = useCallback((volumeId, attempts = 0) => {
    if (!isMountedRef.current) return;
    if (!window.google?.books) {
      if (attempts > 30) {
        if (isMountedRef.current) setEmbedError("Google Books SDK failed to load.");
        return;
      }
      setTimeout(() => waitForGoogleAndLoad(volumeId, attempts + 1), 300);
      return;
    }
    if (window.google.books.DefaultViewer) {
      renderViewer(volumeId);
    } else {
      window.google.books.load();
      window.google.books.setOnLoadCallback(() => {
        if (isMountedRef.current) renderViewer(volumeId);
      });
    }
  }, [renderViewer]);

  const loadGoogleBooksScript = useCallback((volumeId) => {
    if (!document.getElementById("google-books-script")) {
      const script = document.createElement("script");
      script.id = "google-books-script";
      script.src = "https://www.google.com/books/jsapi.js";
      script.onload = () => {
        if (isMountedRef.current) waitForGoogleAndLoad(volumeId);
      };
      document.body.appendChild(script);
    } else {
      waitForGoogleAndLoad(volumeId);
    }
  }, [waitForGoogleAndLoad]);

  useEffect(() => {
    if (!googleBooksId) return;
    renderAttemptsRef.current = 0;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled && isMountedRef.current) loadGoogleBooksScript(googleBooksId);
    }, 100);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [googleBooksId, loadGoogleBooksScript]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <p className="text-stone-400 text-sm">Loading preview...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(`/book/${id}`)}
            className="text-sm text-stone-400 hover:text-stone-700 transition-colors"
          >
            ← Back to {book?.title || "Book"}
          </button>

          {googleBooksId && (
            <a
              href={`https://books.google.com/books?id=${googleBooksId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              Open in Google Books ↗
            </a>
          )}
        </div>

        {/* Book info strip */}
        <div className="flex items-center gap-4 mb-8">
          {book?.cover_url && (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-12 h-18 object-cover rounded-lg shadow-sm"
              style={{ height: "4.5rem" }}
            />
          )}
          <div>
            <h1 className="font-serif text-xl text-stone-900">{book?.title}</h1>
            <p className="text-sm text-stone-400 mt-0.5">
              {Array.isArray(book?.authors)
                ? book.authors.join(", ")
                : book?.authors || "Unknown author"}
            </p>
          </div>
        </div>

        {/* API error */}
        {apiError && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-8 py-12 text-center">
            <p className="text-stone-400 text-sm">{apiError}</p>
          </div>
        )}

        {/* Embed error */}
        {embedError && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-8 py-12 text-center">
            <p className="text-stone-400 text-sm mb-4">{embedError}</p>
            {googleBooksId && (
              <a
                href={`https://books.google.com/books?id=${googleBooksId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-emerald-700 underline hover:text-emerald-800 transition-colors"
              >
                Try reading on Google Books directly
              </a>
            )}
          </div>
        )}

        {/* Viewer */}
        {!apiError && (
          <div
            ref={viewerRef}
            className="w-full rounded-2xl border border-stone-100 shadow-sm overflow-hidden bg-white"
            style={{
              height: "75vh",
              display: embedError ? "none" : "block",
            }}
          />
        )}
      </div>
    </div>
  );
}

export default BookPreviewPage;