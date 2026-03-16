import { useState, useEffect } from "react";
import { ACCESS_TOKEN } from "../constants";
import api from "../api";
import { Rate } from "antd";
import BookLogModal from "../components/BookLogModal";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useBookStore, useAuthStore } from "../store";

async function fetchCover(title, author) {
  try {
    const query = `${title} ${author}`;
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`,
    );

    if (!res.ok) return null;

    const data = await res.json();

    //get the first element if docs exists
    const coverId = data.docs?.[0]?.cover_i;
    if (coverId) {
      return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
    }
  } catch (error) {
    console.log(error);
  }
  return null;
}

function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [cover, setCover] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch recommendations ONCE on mount
  useEffect(() => {
    fetchRecommendations();
  }, []);

  // Fetch covers WHEN recommendations change
  useEffect(() => {
    recommendations.forEach(async (rec, index) => {
      //avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, index * 300));
      const url = await fetchCover(rec.title, rec.author);

      //updating state inside a loop
      setCover((prev) => ({ ...prev, [rec.id]: url }));
    });
  }, [recommendations]);

  const fetchRecommendations = async () => {
    try {
      const res = await api.get("/api/v1/recommendations/");
      setRecommendations(res.data);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };
  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      <h2>Recommended for You</h2>

      {loading && <p style={{ color: "#888" }}>Loading recommendations...</p>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            style={{
              width: 200,
              backgroundColor: "#1e1e1e",
              borderRadius: 8,
              overflow: "hidden",
              border: "1px solid #333",
            }}
          >
            {cover[rec.id] ? (
              <img
                src={cover[rec.id]}
                alt={rec.title}
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
                {rec.title}
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
                {rec.title}
              </h4>
              <p
                style={{
                  margin: "4px 0",
                  color: "#888",
                  fontSize: 12,
                }}
              >
                {rec.author}
              </p>
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  backgroundColor: "#333",
                  borderRadius: 4,
                  fontSize: 10,
                  color: "#aaa",
                }}
              >
                {rec.genre}
              </span>
              {rec.reason && (
                <p
                  style={{
                    margin: "8px 0 0",
                    color: "#666",
                    fontSize: 11,
                    lineHeight: 1.4,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {rec.reason}
                </p>
              )}
            </div>
          </div>
        ))}

        {!loading && recommendations.length === 0 && (
          <p style={{ color: "#888" }}>
            Log some books to get recommendations!
          </p>
        )}
      </div>
    </div>
  );
}

export default RecommendationsPage;
