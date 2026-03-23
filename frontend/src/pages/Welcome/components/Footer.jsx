export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400 py-14">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          <div>
            <p className="font-serif text-xl text-stone-100 mb-3">
              page<span className="text-emerald-400">turner</span>
            </p>
            <p className="text-sm leading-relaxed text-stone-500 max-w-xs">
              A reading journal for people who feel deeply about books — not just those who track them.
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-stone-600 mb-4">Navigate</p>
            <div className="flex flex-col gap-3">
              <a href="#explore" className="text-sm hover:text-stone-200 transition-colors duration-150">Explore</a>
              <a href="#community" className="text-sm hover:text-stone-200 transition-colors duration-150">Community</a>
              <a href="/register" className="text-sm hover:text-stone-200 transition-colors duration-150">Start Reading</a>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-stone-600 mb-4">More</p>
            <div className="flex flex-col gap-3">
              <a href="/about" className="text-sm hover:text-stone-200 transition-colors duration-150">About</a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="text-sm hover:text-stone-200 transition-colors duration-150">
                GitHub
              </a>
              <a href="mailto:hello@pageturner.app" className="text-sm hover:text-stone-200 transition-colors duration-150">
                Contact
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-600">© {new Date().getFullYear()} PageTurner. Made for readers.</p>
          <p className="text-xs text-stone-700 italic font-serif">
            "A reader lives a thousand lives before he dies."
          </p>
        </div>
      </div>
    </footer>
  );
}