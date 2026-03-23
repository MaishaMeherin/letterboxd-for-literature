const floatingBooks = [
  {
    title: "The Remains of the Day",
    author: "Kazuo Ishiguro",
    color: "bg-stone-200",
    mood: "Melancholic",
    rating: "★★★★★",
    rotate: "-rotate-3",
    offset: "translate-y-2",
  },
  {
    title: "Never Let Me Go",
    author: "Kazuo Ishiguro",
    color: "bg-emerald-100",
    mood: "Haunting",
    rating: "★★★★★",
    rotate: "rotate-2",
    offset: "-translate-y-3",
  },
  {
    title: "A Little Life",
    author: "Hanya Yanagihara",
    color: "bg-amber-50",
    mood: "Devastating",
    rating: "★★★★★",
    rotate: "-rotate-1",
    offset: "translate-y-1",
  },
];

export default function HeroSection() {
  return (
    <section className="min-h-screen bg-[#FAF8F4] pt-16 flex items-center">
      <div className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* LEFT CONTENT */}
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 mb-6 font-medium">
            A reading journal for people who feel
          </p>

          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-stone-900 leading-[1.1] mb-8">
            Every book leaves a version of you behind.
          </h1>

          <p className="text-stone-500 text-lg leading-relaxed mb-10 max-w-md">
            Track what you read. Reflect on what it meant. Discover people who feel stories the way you do.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            
            <a
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-stone-900 text-[#FAF8F4] px-8 py-4 rounded-full text-sm tracking-wide hover:bg-emerald-800 transition-colors duration-200"
            >
              Start Your Reading Journal
            </a>

            <a
              href="#community"
              className="inline-flex items-center justify-center gap-2 border border-stone-300 text-stone-700 px-8 py-4 rounded-full text-sm tracking-wide hover:border-stone-500 hover:text-stone-900 transition-colors duration-200"
            >
              Explore the Community
            </a>
          </div>

          <p className="mt-8 text-xs text-stone-400 tracking-wide">
            Joined by <span className="text-stone-600">12,400+</span> readers who log more than just stars
          </p>
        </div>

        {/* RIGHT VISUAL */}
        <div className="relative h-80 lg:h-[480px] flex items-center justify-center">
          
          <div className="absolute w-64 h-64 rounded-full bg-emerald-100/40 blur-3xl top-10 right-10" />
          <div className="absolute w-48 h-48 rounded-full bg-amber-100/40 blur-2xl bottom-10 left-10" />

          {floatingBooks.map((book, i) => (
            <div
              key={book.title}
              className={`absolute w-52 bg-white rounded-2xl shadow-md border border-stone-100 p-5 
                ${book.rotate} ${book.offset} 
                hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default`}
              style={{
                zIndex: floatingBooks.length - i, // FIXED layering
                left: `${10 + i * 20}%`,
              }}
            >
              <div className={`w-full h-1.5 rounded-full ${book.color} mb-4`} />

              <p className="font-serif text-sm text-stone-900 leading-snug mb-1">
                {book.title}
              </p>

              <p className="text-xs text-stone-400 mb-3">
                {book.author}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                  {book.mood}
                </span>

                <span className="text-xs text-amber-500">
                  {book.rating}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}