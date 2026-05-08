import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";

const TIER_LABELS = {
  comfort: "Comfort Picks",
  discovery: "Discovery Picks",
  adventurous: "Adventurous Picks",
};

const TIER_DESCRIPTIONS = {
  comfort: "Books like your highest-rated reads. Safe bets you're almost certain to love.",
  discovery: "Shares what you love, with something new. A step outside, not a leap.",
  adventurous: "A genuine stretch — different form, same emotional core.",
};

const TIER_ORDER = ["comfort", "discovery", "adventurous"];

const TIER_BADGE = {
  comfort: "bg-emerald-100 text-emerald-700",
  discovery: "bg-amber-100 text-amber-700",
  adventurous: "bg-stone-100 text-stone-600",
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / (86400 * 7))}w ago`;
}

function SkeletonCard() {
  return (
    <div className="w-40 shrink-0 animate-pulse">
      <div className="w-40 h-60 rounded-xl bg-stone-200" />
      <div className="pt-2 space-y-1.5">
        <div className="h-3 bg-stone-200 rounded w-3/4" />
        <div className="h-2.5 bg-stone-200 rounded w-1/2" />
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="mb-12">
      <div className="mb-4">
        <div className="h-5 bg-stone-200 rounded w-36 animate-pulse" />
        <div className="h-3 bg-stone-100 rounded w-64 mt-2 animate-pulse" />
      </div>
      <div className="flex gap-4 overflow-x-hidden pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

function RecCard({ rec, openReason, onToggleReason }) {
  const navigate = useNavigate();
  const clickable = !!rec.book;

  return (
    <div
      className="w-40 shrink-0 group"
      style={{ transition: "transform 0.2s ease" }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      <div className="relative">
        {rec.cover_url ? (
          <img
            src={rec.cover_url}
            alt={rec.title}
            onClick={() => clickable && navigate(`/book/${rec.book}/`)}
            className={`w-40 h-60 object-cover rounded-xl shadow-sm group-hover:shadow-md transition-shadow ${clickable ? "cursor-pointer" : ""}`}
          />
        ) : (
          <div
            onClick={() => clickable && navigate(`/book/${rec.book}/`)}
            className={`w-40 h-60 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center p-3 text-center text-stone-400 text-xs font-medium ${clickable ? "cursor-pointer" : ""}`}
          >
            {rec.title}
          </div>
        )}

        <span
          className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${TIER_BADGE[rec.tier]}`}
        >
          {TIER_LABELS[rec.tier]?.split(" ")[0]}
        </span>

        {rec.reason && (
          <button
            onClick={() => onToggleReason(rec.id)}
            className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors"
          >
            ⓘ
          </button>
        )}
      </div>

      <div className="pt-2 px-0.5">
        <p
          onClick={() => clickable && navigate(`/book/${rec.book}/`)}
          className={`text-sm font-semibold text-stone-800 truncate transition-colors ${clickable ? "hover:text-emerald-700 cursor-pointer" : ""}`}
        >
          {rec.title}
        </p>
        <p className="text-xs text-stone-400 truncate mt-0.5">{rec.author}</p>
        {rec.genre && (
          <span className="inline-block mt-1.5 px-2 py-0.5 bg-stone-100 rounded-full text-[10px] text-stone-500">
            {rec.genre}
          </span>
        )}
        {openReason === rec.id && rec.reason && (
          <p className="text-stone-500 text-xs mt-2 leading-relaxed">{rec.reason}</p>
        )}
      </div>
    </div>
  );
}

function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openReason, setOpenReason] = useState(null);
  const navigate = useNavigate();
  const timeoutRef = useRef(null);

  const poll = async () => {
    try {
      const res = await api.get("/api/v1/recommendations/");
      if (res.status === 202) {
        timeoutRef.current = setTimeout(poll, 5000);
      } else {
        setRecommendations(res.data);
        setLoading(false);
        setRefreshing(false);
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    poll();
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    clearTimeout(timeoutRef.current);
    try {
      await api.post("/api/v1/recommendations/refresh/");
    } catch (e) {
      console.log(e);
      setRefreshing(false);
      return;
    }
    poll();
  };

  const grouped = TIER_ORDER.reduce((acc, tier) => {
    acc[tier] = recommendations.filter((r) => r.tier === tier);
    return acc;
  }, {});

  const handleToggleReason = (id) => {
    setOpenReason((prev) => (prev === id ? null : id));
  };

  const updatedAt = recommendations[0]?.created_at;

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="font-serif text-3xl text-stone-900">Recommended for You</h1>
            <p className="text-stone-500 text-sm mt-1">
              Curated from your reading history
              {updatedAt && !loading && (
                <span className="text-stone-400"> · Updated {timeAgo(updatedAt)}</span>
              )}
            </p>
          </div>
          {!loading && recommendations.length > 0 && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 rounded-full border border-stone-300 text-stone-600 text-sm hover:border-stone-400 hover:text-stone-900 transition-colors disabled:opacity-50 shrink-0"
            >
              {refreshing ? "Regenerating…" : "Regenerate"}
            </button>
          )}
        </div>

        {/* Skeleton — initial load only */}
        {loading && (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}

        {/* Empty state */}
        {!loading && recommendations.length === 0 && (
          <div className="flex items-center justify-center py-24">
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-12 text-center max-w-sm">
              <p className="font-serif text-xl text-stone-800 mb-2">Nothing to recommend yet</p>
              <p className="text-stone-400 text-sm leading-relaxed mb-6">
                Log and rate at least a few books — then we'll find your next read.
              </p>
              <button
                onClick={() => navigate("/")}
                className="px-5 py-2.5 rounded-full bg-stone-900 text-[#FAF8F4] text-sm hover:bg-emerald-800 transition-colors"
              >
                Browse books →
              </button>
            </div>
          </div>
        )}

        {/* Tier rows */}
        {!loading &&
          TIER_ORDER.map((tier) => {
            const recs = grouped[tier];
            if (!recs.length) return null;
            return (
              <div key={tier} className="mb-12">
                <div className="mb-4">
                  <h2 className="font-serif text-xl text-stone-900">{TIER_LABELS[tier]}</h2>
                  <p className="text-stone-400 text-xs mt-1">{TIER_DESCRIPTIONS[tier]}</p>
                </div>
                <div
                  className="flex gap-4 overflow-x-auto pb-2"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {recs.map((rec) => (
                    <RecCard
                      key={rec.id}
                      rec={rec}
                      openReason={openReason}
                      onToggleReason={handleToggleReason}
                    />
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default RecommendationsPage;