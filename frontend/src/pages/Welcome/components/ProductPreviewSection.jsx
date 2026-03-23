function ActivityFeedCard() {
  const items = [
    { user: "maya_reads", action: "finished", book: "Demon Copperhead", time: "2h ago", mood: "Wrecked", avatar: "M", color: "bg-rose-100 text-rose-700" },
    { user: "theo.pages", action: "logged", book: "The Passenger", time: "5h ago", mood: "Tense", avatar: "T", color: "bg-amber-100 text-amber-700" },
    { user: "sunyi_", action: "reviewed", book: "Bewilderment", time: "1d ago", mood: "Tender", avatar: "S", color: "bg-emerald-100 text-emerald-700" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
        <p className="text-xs font-semibold text-stone-700 tracking-wide uppercase">Activity</p>
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
      </div>
      <div className="divide-y divide-stone-50">
        {items.map((item) => (
          <div key={item.user} className="px-5 py-4 flex items-start gap-3">
            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold ${item.color}`}>
              {item.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-stone-700">
                <span className="font-semibold">@{item.user}</span>{" "}
                <span className="text-stone-400">{item.action}</span>{" "}
                <span className="font-medium">{item.book}</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-stone-300">{item.time}</span>
                <span className="text-xs bg-stone-50 text-stone-500 border border-stone-100 px-2 py-0.5 rounded-full">
                  {item.mood}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookPageCard() {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
      <div className="bg-stone-900 px-5 py-7 flex gap-4">
        <div className="w-14 h-20 rounded-lg bg-emerald-800/70 border border-emerald-700/30 flex-shrink-0" />
        <div>
          <p className="font-serif text-stone-100 text-base leading-snug mb-1">
            The Remains of the Day
          </p>
          <p className="text-xs text-stone-400 mb-3">Kazuo Ishiguro · 1989</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className="text-amber-400 text-xs">★</span>
            ))}
          </div>
        </div>
      </div>
      <div className="px-5 py-5">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {["Melancholic", "Regret", "Duty"].map((tag) => (
            <span key={tag} className="text-xs bg-stone-50 text-stone-500 border border-stone-100 px-2.5 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <p className="text-xs text-stone-400 italic leading-relaxed">
          "It's a book about what you give up when you give yourself entirely to something. I didn't expect to cry."
        </p>
        <p className="text-xs text-stone-300 mt-3">logged by maya_reads · June 2024</p>
      </div>
    </div>
  );
}

function UserProfileCard() {
  const shelves = [
    { label: "Read", count: 142 },
    { label: "Reading", count: 3 },
    { label: "Want", count: 67 },
  ];
  const recentMoods = ["Melancholic", "Hopeful", "Devastating"];

  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
      <div className="px-5 pt-6 pb-4 flex items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
          R
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-800">@rook.lit</p>
          <p className="text-xs text-stone-400">Reader since Jan 2023</p>
        </div>
      </div>
      <div className="px-5 pb-4 grid grid-cols-3 gap-3 border-b border-stone-50">
        {shelves.map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-serif text-lg text-stone-800">{s.count}</p>
            <p className="text-xs text-stone-400">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="px-5 py-4">
        <p className="text-xs text-stone-400 mb-2.5 uppercase tracking-wide">Top moods</p>
        <div className="flex flex-wrap gap-1.5">
          {recentMoods.map((m) => (
            <span key={m} className="text-xs bg-stone-50 border border-stone-100 text-stone-500 px-2.5 py-0.5 rounded-full">
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProductPreviewSection() {
  return (
    <section className="bg-white py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-14 max-w-xl">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 mb-4 font-medium">
            The product
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-stone-900 leading-tight">
            Simple. Intimate. Yours.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActivityFeedCard />
          <BookPageCard />
          <UserProfileCard />
        </div>
      </div>
    </section>
  );
}