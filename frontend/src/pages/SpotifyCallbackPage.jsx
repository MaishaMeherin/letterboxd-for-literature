import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { exchangeCodeForToken, createSpotifyPlaylist } from "../utils/spotify";

function SpotifyCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("working"); // "working" | "success" | "error"
  const [progress, setProgress] = useState("Authorizing with Spotify…");
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const bookId =
        params.get("state") || sessionStorage.getItem("spotify_book_id");
      const error = params.get("error");

      if (error) {
        setErrorMsg(
          error === "access_denied"
            ? "You declined Spotify access."
            : `Spotify error: ${error}`,
        );
        setStatus("error");
        return;
      }

      if (!code) {
        setErrorMsg("No authorization code received from Spotify.");
        setStatus("error");
        return;
      }

      try {
        const token = await exchangeCodeForToken(code);

        setProgress("Loading your playlist…");
        const [bookRes, playlistRes] = await Promise.all([
          api.get(`/api/v1/books/${bookId}/`),
          api.get(`/api/v1/book/${bookId}/playlist/`),
        ]);

        const book = bookRes.data;
        const songs = playlistRes.data.results || playlistRes.data;

        if (!songs.length) {
          setErrorMsg("No playlist found for this book. Generate one first.");
          setStatus("error");
          return;
        }

        const outcome = await createSpotifyPlaylist(
          token,
          book.title,
          book.authors?.[0] || "",
          songs,
          (msg) => setProgress(msg),
        );

        sessionStorage.removeItem("spotify_book_id");
        setResult({ ...outcome, bookId, bookTitle: book.title });
        setStatus("success");
      } catch (err) {
        console.error(err);
        setErrorMsg(err.message || "Something went wrong. Please try again.");
        setStatus("error");
      }
    };

    run();
  }, []);

  if (status === "working") {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-10 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-[#1DB954]/10 flex items-center justify-center mx-auto mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#1DB954">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
          </div>
          <p className="font-serif text-lg text-stone-900 mb-2">
            Creating your playlist
          </p>
          <p className="text-stone-400 text-sm leading-relaxed">{progress}</p>
          <div className="mt-6 flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#1DB954] animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-10 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-[#1DB954]/10 flex items-center justify-center mx-auto mb-5">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1DB954"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <p className="font-serif text-xl text-stone-900 mb-1">
            Playlist saved!
          </p>
          <p className="text-stone-400 text-sm mb-1">
            {result.tracksAdded} of {result.total} tracks added to Spotify.
          </p>

          {result.tracksNotFound.length > 0 && (
            <div className="mt-3 mb-4 text-left bg-stone-50 rounded-xl p-3">
              <p className="text-xs text-stone-500 font-medium mb-1.5">
                {result.tracksNotFound.length} track
                {result.tracksNotFound.length > 1 ? "s" : ""} not found on
                Spotify:
              </p>
              <ul className="space-y-0.5">
                {result.tracksNotFound.map((t) => (
                  <li key={t} className="text-xs text-stone-400">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3 mt-5">
            <a
              href={result.playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1DB954] text-white text-sm font-medium hover:bg-[#1aa34a] transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              Open in Spotify ↗
            </a>
            <button
              onClick={() => navigate(`/book/${result.bookId}/playlist`)}
              className="px-5 py-2.5 rounded-full border border-stone-200 text-stone-600 text-sm hover:bg-stone-50 transition-colors"
            >
              Back to playlist
            </button>
          </div>
        </div>
      </div>
    );
  }

  // error state
  return (
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-10 max-w-sm w-full text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <p className="font-serif text-lg text-stone-900 mb-2">
          Something went wrong
        </p>
        <p className="text-stone-400 text-sm leading-relaxed mb-6">
          {errorMsg}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-full bg-stone-900 text-[#FAF8F4] text-sm font-medium hover:bg-emerald-800 transition-colors"
        >
          Go back
        </button>
      </div>
    </div>
  );
}

export default SpotifyCallbackPage;
