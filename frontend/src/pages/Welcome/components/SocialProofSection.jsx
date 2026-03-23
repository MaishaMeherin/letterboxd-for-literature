const quotes = [
  {
    quote: "This book didn't just hurt. It stayed.",
    sub: "Logged after finishing A Little Life",
    user: "maya_reads",
    avatar: "M",
    avatarColor: "bg-rose-100 text-rose-700",
  },
  {
    quote: "I didn't like it. But I can't forget it.",
    sub: "On Blood Meridian, 2 years later",
    user: "theo.pages",
    avatar: "T",
    avatarColor: "bg-amber-100 text-amber-700",
  },
  {
    quote: "It made me call my mother. Just to hear her voice.",
    sub: "After finishing Pachinko",
    user: "sunyi_",
    avatar: "S",
    avatarColor: "bg-emerald-100 text-emerald-700",
  },
  {
    quote: "I wanted to re-read it immediately. I was afraid to.",
    sub: "First entry on Never Let Me Go",
    user: "rook.lit",
    avatar: "R",
    avatarColor: "bg-indigo-100 text-indigo-700",
  },
];

export default function SocialProofSection() {
  return (
    <section id="community" className="bg-[#FAF8F4] py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-14 max-w-xl">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 mb-4 font-medium">
            Real reflections
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-stone-900 leading-tight">
            What readers actually write.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {quotes.map((q) => (
            <div
              key={q.user}
              className="bg-white rounded-2xl p-7 border border-stone-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between gap-6 cursor-default"
            >
              <p className="font-serif text-stone-800 text-base leading-relaxed italic">
                "{q.quote}"
              </p>
              <div>
                <p className="text-xs text-stone-400 mb-3 leading-relaxed">{q.sub}</p>
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${q.avatarColor}`}>
                    {q.avatar}
                  </div>
                  <span className="text-xs text-stone-500">@{q.user}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}