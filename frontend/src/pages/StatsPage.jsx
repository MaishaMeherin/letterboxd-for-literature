import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from "recharts";
import api from "../api";
import Navbar from "../components/Navbar";

const COLORS = [
  "#047857", "#065f46", "#6ee7b7", "#a7f3d0",
  "#d1fae5", "#f59e0b", "#78716c",
];

const MOOD_COLOR = "#047857";
const DECADE_COLOR = "#047857";

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 flex flex-col gap-1">
      <p className="text-stone-400 text-xs tracking-wide uppercase">{label}</p>
      <p className="font-serif text-4xl text-stone-900">{value}</p>
      {sub && <p className="text-stone-400 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function SectionHeading({ title, sub }) {
  return (
    <div className="mb-5">
      <h2 className="font-serif text-xl text-stone-900">{title}</h2>
      {sub && <p className="text-stone-400 text-xs mt-1">{sub}</p>}
    </div>
  );
}

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-stone-100 rounded-xl shadow-sm px-3 py-2 text-xs text-stone-700">
      <span className="font-medium">{payload[0].name}</span> — {payload[0].value}
    </div>
  );
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-stone-100 rounded-xl shadow-sm px-3 py-2 text-xs text-stone-700">
      <span className="font-medium">{label}</span>: {payload[0].value}
    </div>
  );
};

function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/v1/stats/")
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F4]">
        <Navbar />
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-stone-200 rounded w-48" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 bg-stone-200 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats || stats.insufficient_data) {
    return (
      <div className="min-h-screen bg-[#FAF8F4]">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-12 text-center max-w-sm">
            <p className="font-serif text-xl text-stone-800 mb-2">Your journey is just beginning</p>
            <p className="text-stone-400 text-sm leading-relaxed mb-6">
              Finish at least 3 books to unlock your reading stats.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-5 py-2.5 rounded-full bg-stone-900 text-[#FAF8F4] text-sm hover:bg-emerald-800 transition-colors"
            >
              Browse books →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { hero, genres, moods, pace, top_books, page_vibe, personality, diversity } = stats;

  const fictionPct = diversity.fiction_ratio != null
    ? Math.round(diversity.fiction_ratio * 100)
    : null;

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">

        {/* ── Page header ── */}
        <div>
          <h1 className="font-serif text-3xl text-stone-900">Your Reading Journey</h1>
          <p className="text-stone-400 text-sm mt-1">Everything you've read, reflected back.</p>
        </div>

        {/* ── Hero numbers ── */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Books finished" value={hero.books_completed} />
            <StatCard
              label="Pages read"
              value={hero.pages_read > 0 ? hero.pages_read.toLocaleString() : "—"}
            />
            <StatCard
              label="Avg rating"
              value={hero.avg_rating > 0 ? `${hero.avg_rating} ★` : "—"}
            />
            <StatCard
              label="This month"
              value={hero.books_this_month}
              sub="books completed"
            />
          </div>
        </section>

        {/* ── Reading personality ── */}
        <section>
          <SectionHeading title="Your Reading Personality" />
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <span className="text-2xl">📖</span>
            </div>
            <div>
              <p className="font-serif text-2xl text-stone-900 mb-1">{personality.archetype}</p>
              <p className="text-stone-500 text-sm leading-relaxed max-w-xl">{personality.description}</p>
            </div>
          </div>
        </section>

        {/* ── Genre + Mood ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Genre donut */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
            <SectionHeading title="Genre Breakdown" />
            {genres.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={genres}
                      dataKey="count"
                      nameKey="genre"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {genres.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2">
                  {genres.map((g, i) => (
                    <span key={g.genre} className="flex items-center gap-1.5 text-xs text-stone-500">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      {g.genre}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-stone-400 text-sm">Not enough genre data yet.</p>
            )}
          </div>

          {/* Mood bar */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
            <SectionHeading title="Mood of Your Reads" sub="Weighted by your ratings" />
            {moods.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={moods}
                  layout="vertical"
                  margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="tag" tick={{ fontSize: 12, fill: "#57534e" }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#f5f5f4" }} />
                  <Bar dataKey="score" fill={MOOD_COLOR} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-stone-400 text-sm">No mood data yet — log more books with shelf tags.</p>
            )}
          </div>
        </section>

        {/* ── Reading pace ── */}
        <section>
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
            <SectionHeading title="Reading Pace" sub="Books completed per month, last 12 months" />
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={pace} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id="paceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#047857" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#047857" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "#a8a29e" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#a8a29e" }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ stroke: "#d6d3d1" }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#047857"
                  strokeWidth={2}
                  fill="url(#paceGrad)"
                  dot={{ r: 3, fill: "#047857", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ── Top books ── */}
        {top_books.length > 0 && (
          <section>
            <SectionHeading title="Your Highest Rated" />
            <div className="flex gap-6 flex-wrap">
              {top_books.map((book) => (
                <div
                  key={book.book_id}
                  onClick={() => navigate(`/book/${book.book_id}/`)}
                  className="flex gap-4 bg-white rounded-2xl border border-stone-100 shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow flex-1 min-w-[200px] max-w-[300px]"
                >
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-14 h-20 object-cover rounded-lg shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-20 bg-stone-100 rounded-lg shrink-0 flex items-center justify-center">
                      <span className="text-stone-300 text-xs text-center px-1">{book.title}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-serif text-stone-900 text-sm font-medium leading-tight line-clamp-2">{book.title}</p>
                    <p className="text-stone-400 text-xs mt-1 truncate">{book.author}</p>
                    <p className="text-emerald-700 text-sm font-medium mt-2">{book.rating} ★</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Page vibe + Decades ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Page vibe */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 flex flex-col justify-between">
            <SectionHeading title="Your Page Count Vibe" />
            <div>
              {page_vibe.avg_pages ? (
                <>
                  <p className="font-serif text-5xl text-stone-900">{page_vibe.avg_pages.toLocaleString()}</p>
                  <p className="text-stone-400 text-xs mt-1">avg pages per book</p>
                  <p className="text-stone-600 text-sm mt-4 font-medium">{page_vibe.label}</p>
                </>
              ) : (
                <p className="text-stone-400 text-sm">{page_vibe.label}</p>
              )}
            </div>
            {fictionPct != null && (
              <div className="mt-6">
                <p className="text-stone-400 text-xs mb-2 tracking-wide uppercase">Fiction / Non-fiction</p>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-emerald-600 rounded-full"
                    style={{ width: `${fictionPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-stone-400 mt-1">
                  <span>{fictionPct}% fiction</span>
                  <span>{100 - fictionPct}% non-fiction</span>
                </div>
              </div>
            )}
          </div>

          {/* Decades */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
            <SectionHeading title="Publication Decades" sub="When your books were written" />
            {diversity.decades.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={diversity.decades}
                  margin={{ left: 0, right: 8, top: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                  <XAxis dataKey="decade" tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#f5f5f4" }} />
                  <Bar dataKey="count" fill={DECADE_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-stone-400 text-sm">No publication date data available.</p>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

export default StatsPage;