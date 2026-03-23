import { useState, useEffect } from "react";
import api from "../api";
import { useParams, useNavigate } from "react-router-dom";
import { useBookStore, usePlaylistStore } from "../store";

function PlaylistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playlist, setPlaylist } = usePlaylistStore();
  const { book, setBook } = useBookStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPlaylist();
    }
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
    return <p style={{ padding: 40, color: "#888" }}>Loading playlist...</p>;
  }

  if (!book) {
    return <p style={{ padding: 40, color: "#888" }}>Book not found.</p>;
  }

  return (
    <div>
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#0f0f0f",
          padding: "32px",
          maxWidth: 800,
          margin: "0 auto",
        }}
      >
        {/* Back button */}
        <button
          onClick={() => navigate(`/book/${id}/`)}
          style={{
            background: "none",
            border: "none",
            color: "#888",
            fontSize: 13,
            cursor: "pointer",
            marginBottom: 24,
            padding: 0,
          }}
        >
          ← Back to Book
        </button>

        {/* Header */}
        <div style={{ display: "flex", gap: 20, marginBottom: 32 }}>
          {book.cover_url && (
            <img
              src={book.cover_url}
              alt={book.title}
              style={{
                width: 80,
                height: 120,
                objectFit: "cover",
                borderRadius: 6,
              }}
            />
          )}
          <div>
            <p style={{ color: "#888", fontSize: 13, margin: "0 0 4px" }}>
              🎵 Playlist for
            </p>
            <h2 style={{ color: "#fff", margin: "0 0 4px", fontSize: 22 }}>
              {book.title}
            </h2>
            <p style={{ color: "#666", margin: 0, fontSize: 13 }}>
              {book.authors?.join(", ")} · {playlist.length} songs
            </p>
          </div>
        </div>

        {/* Song list */}
        {playlist.length === 0 ? (
          <p style={{ color: "#666" }}>
            No playlist generated yet. Go back and click "Generate Playlist".
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {playlist.map((song, index) => (
              <div
                key={song.id}
                style={{
                  display: "flex",
                  gap: 16,
                  padding: "16px 20px",
                  backgroundColor: "#1a1a1a",
                  borderRadius: 10,
                  border: "1px solid #2a2a2a",
                  alignItems: "flex-start",
                }}
              >
                {/* Track number */}
                <span
                  style={{
                    color: "#444",
                    fontSize: 18,
                    fontWeight: 700,
                    minWidth: 28,
                    textAlign: "right",
                    paddingTop: 2,
                  }}
                >
                  {index + 1}
                </span>

                {/* Song info */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                        color: "#fff",
                        fontSize: 15,
                        fontWeight: 600,
                      }}
                    >
                      {song.song}
                    </h4>
                    <span
                      style={{
                        color: "#888",
                        fontSize: 13,
                        flexShrink: 0,
                        marginLeft: 12,
                      }}
                    >
                      {song.artist}
                    </span>
                  </div>
                  {song.reason && (
                    <p
                      style={{
                        margin: "6px 0 0",
                        color: "#bcb6b6ff",
                        fontSize: 12,
                        lineHeight: 1.5,
                        fontStyle: "italic",
                      }}
                    >
                      "{song.reason}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Generate more button */}
        {playlist.length > 0 && (
          <button
            style={{
              width: "100%",
              marginTop: 24,
              padding: "14px",
              backgroundColor: "transparent",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor:  "pointer",
            }}
          >
            Generate more songs
          </button>
        )}
      </div>
    </div>
  );
}

export default PlaylistPage;
