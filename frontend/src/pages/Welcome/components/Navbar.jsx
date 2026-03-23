import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAF8F4]/90 backdrop-blur-sm border-b border-stone-200/60">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <span className="font-serif text-xl text-stone-900 tracking-tight">
            page<span className="text-emerald-700">turner</span>
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          <a href="#explore" className="text-sm text-stone-500 hover:text-stone-900 transition-colors duration-200 tracking-wide">
            Explore
          </a>
          <a href="#lists" className="text-sm text-stone-500 hover:text-stone-900 transition-colors duration-200 tracking-wide">
            Lists
          </a>
          <a href="#community" className="text-sm text-stone-500 hover:text-stone-900 transition-colors duration-200 tracking-wide">
            Community
          </a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <a href="/login" className="text-sm text-stone-600 hover:text-stone-900 transition-colors duration-200">
            Sign in
          </a>
          <a   
            href="/register"
            className="text-sm bg-stone-900 text-[#FAF8F4] px-5 py-2.5 rounded-full hover:bg-emerald-800 transition-colors duration-200 tracking-wide"
          >
            Start Your Journal
          </a>
        </div>

        <button
          className="md:hidden text-stone-700"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <div className="w-6 flex flex-col gap-1.5">
            <span className={`block h-px bg-stone-700 transition-all duration-200 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block h-px bg-stone-700 transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-px bg-stone-700 transition-all duration-200 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </div>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-[#FAF8F4] px-6 py-4 flex flex-col gap-4">
          <a href="#explore" className="text-sm text-stone-600">Explore</a>
          <a href="#lists" className="text-sm text-stone-600">Lists</a>
          <a href="#community" className="text-sm text-stone-600">Community</a>
          <a href="/register" className="text-sm bg-stone-900 text-[#FAF8F4] px-5 py-2.5 rounded-full text-center">
            Start Your Journal
          </a>
        </div>
      )}
    </nav>
  );
}