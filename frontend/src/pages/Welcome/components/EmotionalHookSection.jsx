const moodTags = [
  { label: "Lonely", color: "bg-indigo-50 text-indigo-600 border-indigo-200" },
  { label: "Hopeful", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { label: "Existential", color: "bg-stone-100 text-stone-600 border-stone-300" },
  { label: "Yearning", color: "bg-rose-50 text-rose-600 border-rose-200" },
  { label: "Tender", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { label: "Devastated", color: "bg-slate-100 text-slate-600 border-slate-300" },
  { label: "Quietly Sad", color: "bg-sky-50 text-sky-600 border-sky-200" },
  { label: "Seen", color: "bg-violet-50 text-violet-600 border-violet-200" },
];

const impactBars = [
  { label: "Emotional weight", value: 94 },
  { label: "Lingering feeling", value: 88 },
  { label: "Character attachment", value: 76 },
  { label: "Re-read likelihood", value: 62 },
];

export default function EmotionalHookSection() {
  return (
    <section className="bg-stone-900 py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400 mb-6 font-medium">
            Beyond ratings
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-stone-50 leading-tight mb-6">
            Reading is emotional data.
          </h2>
          <p className="text-stone-400 text-base leading-relaxed mb-10 max-w-md">
            Stars don't capture what a book did to you. We do. Tag your reads with the feeling that stayed. Find others who felt it too.
          </p>

          <div className="flex flex-wrap gap-2.5">
            {moodTags.map((tag) => (
              <span
                key={tag.label}
                className={`text-xs font-medium px-3.5 py-1.5 rounded-full border ${tag.color} cursor-default hover:scale-105 transition-transform duration-150`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-stone-800 rounded-2xl p-8 border border-stone-700">
          <div className="flex items-start gap-4 mb-8 pb-6 border-b border-stone-700">
            <div className="w-12 h-16 rounded bg-emerald-900/60 border border-emerald-700/40 flex-shrink-0" />
            <div>
              <p className="font-serif text-stone-100 text-base leading-snug mb-1">
                A Little Life
              </p>
              <p className="text-xs text-stone-500 mb-2">Hanya Yanagihara · 2015</p>
              <div className="flex gap-1.5 flex-wrap">
                <span className="text-xs bg-rose-900/40 text-rose-400 border border-rose-800/40 px-2.5 py-0.5 rounded-full">
                  Devastating
                </span>
                <span className="text-xs bg-violet-900/40 text-violet-400 border border-violet-800/40 px-2.5 py-0.5 rounded-full">
                  Seen
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 mb-5">
            Emotional impact score
          </p>
          <div className="space-y-4">
            {impactBars.map((bar) => (
              <div key={bar.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-stone-400">{bar.label}</span>
                  <span className="text-xs text-stone-500">{bar.value}%</span>
                </div>
                <div className="h-1.5 bg-stone-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: `${bar.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-stone-600 mt-6 italic">
            Based on 2,847 reader reflections
          </p>
        </div>
      </div>
    </section>
  );
}