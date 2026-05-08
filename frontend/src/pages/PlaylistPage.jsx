import { useState, useEffect } from "react";
import api from "../api";
import { useParams, useNavigate } from "react-router-dom";
import { useBookStore, usePlaylistStore } from "../store";
import Navbar from "../components/Navbar";
import { initiateSpotifyAuth } from "../utils/spotify";

function PlaylistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playlist, setPlaylist } = usePlaylistStore();
  const { book, setBook } = useBookStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchPlaylist();
  }, [id]);

  const fetchPlaylist = async () => {
    setLoading(true);
    try {
      const [bookRes, playlistRes] = await Promise.all([
        api.get(`/api/v1/books/${id}`),
        api.get(`/api/v1/book/${id}/playlist/`),
      ]);
      setBook(bookRes.data);
      setPlaylist(playlistRes.data.results || playlistRes.data);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <p className="text-stone-400 text-sm tracking-wide">Building your playlist...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <p className="text-stone-400 text-sm">Book not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Back */}
        <button
          onClick={() => navigate(`/book/${id}/`)}
          className="text-sm text-stone-400 hover:text-stone-700 transition-colors mb-8 flex items-center gap-1"
        >
          ← Back to book
        </button>

        {/* Hero */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 mb-8 flex gap-6 items-start">
          <div className="relative shrink-0">
            {/* Decorative circle behind cover */}
            <div className="absolute -top-2 -left-2 w-32 h-44 rounded-2xl bg-emerald-50" />
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="relative w-28 h-40 object-cover rounded-xl shadow-md"
              />
            ) : (
              <div className="relative w-28 h-40 rounded-xl bg-stone-100 shadow-md flex items-center justify-center">
                <span className="text-stone-300 text-3xl">♪</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <p className="text-xs uppercase tracking-widest text-emerald-700 mb-2 font-medium">
              Reading Playlist
            </p>
            <h1 className="font-serif text-2xl text-stone-900 leading-snug mb-1">
              {book.title}
            </h1>
            <p className="text-sm text-stone-500 mb-4">
              {book.authors?.join(", ")}
            </p>

            {/* Genre pills */}
            {book.genres?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {book.genres.slice(0, 5).map((g) => (
                  <span
                    key={g}
                    className="px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs border border-stone-200"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Save to Spotify */}
            {playlist.length > 0 && (
              <button
                onClick={() => initiateSpotifyAuth(id)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1DB954] text-white text-sm font-medium hover:bg-[#1aa34a] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                Save to Spotify
              </button>
            )}
          </div>
        </div>

        {/* Empty state */}
        {playlist.length === 0 && (
          <div className="text-center py-16">
            <p className="font-serif text-lg text-stone-400 mb-2">No playlist yet</p>
            <p className="text-sm text-stone-400 mb-6">
              Go back and click "Generate Playlist" to create one.
            </p>
            <button
              onClick={() => navigate(`/book/${id}/`)}
              className="px-6 py-2.5 rounded-full bg-stone-900 text-[#FAF8F4] text-sm font-medium hover:bg-emerald-800 transition-colors"
            >
              Go back
            </button>
          </div>
        )}

        {/* Song list */}
        {playlist.length > 0 && (
          <>
            {/* Section header */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xs uppercase tracking-widest text-stone-400 font-medium">
                Your Reading Soundtrack
              </span>
              <div className="flex-1 h-px bg-stone-200" />
              <span className="text-xs text-stone-400">{playlist.length} tracks</span>
            </div>

            <div className="space-y-3">
              {playlist.map((song, index) => (
                <div
                  key={song.id}
                  className="bg-white rounded-2xl border border-stone-100 shadow-sm px-5 py-4 flex gap-4 items-start hover:shadow-md transition-shadow group"
                >
                  {/* Track number */}
                  <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </div>

                  {/* Song info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-0.5">
                      <p className="font-semibold text-stone-900 text-base leading-snug">
                        {song.song}
                      </p>
                      <a
                        href={`https://open.spotify.com/search/${encodeURIComponent(`${song.song} ${song.artist}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-700 hover:underline shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Search ↗
                      </a>
                    </div>
                    <p className="text-sm text-stone-500 mb-2">
                      {song.artist}
                    </p>
                    {song.reason && (
                      <div className="border-l-2 border-emerald-200 pl-3">
                        <p className="text-xs text-stone-400 leading-relaxed italic">
                          "{song.reason}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default PlaylistPage;