const features = [
  {
    icon: "📖",
    title: "Log Your Reading Life",
    description:
      "Every book you've finished, abandoned, or lived inside. Build the archive of who you've been as a reader.",
    accent: "border-emerald-200",
  },
  {
    icon: "✍️",
    title: "Write What You Felt",
    description:
      "Not just stars and summaries. Write raw, honest, emotional reflections that belong to you.",
    accent: "border-amber-200",
  },
  {
    icon: "🔍",
    title: "Discover Like-Minded Readers",
    description:
      "Find people who wept at the same chapter, who felt the same ache three years later.",
    accent: "border-stone-300",
  },
  {
    icon: "🌙",
    title: "Explore by Mood",
    description:
      "Not genre. Not rating. Mood. Find what to read when you need something devastating, hopeful, or quietly strange.",
    accent: "border-rose-200",
  },
];

export default function FeaturesSection() {
  return (
    <section id="explore" className="bg-white py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-16 max-w-xl">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 mb-4 font-medium">
            What you get
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-stone-900 leading-tight">
            Built for readers who take it personally.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className={`group p-7 rounded-2xl border-t-2 ${f.accent} bg-[#FAF8F4] hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-default`}
            >
              <div className="text-2xl mb-5">{f.icon}</div>
              <h3 className="font-serif text-lg text-stone-900 mb-3 leading-snug">
                {f.title}
              </h3>
              <p className="text-sm text-stone-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}