export default function CTASection() {
  return (
    <section className="bg-[#FAF8F4] py-24">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <div className="flex items-center gap-4 justify-center mb-10">
          <div className="h-px w-16 bg-stone-300" />
          <span className="text-stone-300 text-lg font-serif">§</span>
          <div className="h-px w-16 bg-stone-300" />
        </div>

        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-stone-900 leading-tight mb-6">
          Start documenting your reading life.
        </h2>
        <p className="text-stone-500 text-lg leading-relaxed mb-10 max-w-lg mx-auto">
          Every book you've felt something for deserves more than a star. Give it a home.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a 
            href="/register"
            className="inline-flex items-center justify-center bg-stone-900 text-[#FAF8F4] px-10 py-4 rounded-full text-sm tracking-wide hover:bg-emerald-800 transition-colors duration-200"
          >
            Join Now
          </a>
        <a
            href="/register"
            className="inline-flex items-center justify-center border border-stone-300 text-stone-700 px-10 py-4 rounded-full text-sm tracking-wide hover:border-stone-500 hover:text-stone-900 transition-colors duration-200"
          >
            Start Logging
          </a>
        </div>

        <p className="mt-8 text-xs text-stone-400">
          Free forever. No tracking. Just reading.
        </p>
      </div>
    </section>
  );
}