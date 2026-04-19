import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#FAF8F4]/90 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="font-serif text-xl text-stone-900 tracking-wide hover:text-emerald-800 transition-colors"
        >
          PageTurner
        </button>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-8">
          <button
            onClick={() => navigate("/")}
            className={`text-sm tracking-wide transition-colors ${
              isActive("/")
                ? "text-emerald-700 font-medium"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            Home
          </button>
          <button
            onClick={() => navigate("/user/me")}
            className={`text-sm tracking-wide transition-colors ${
              isActive("/user/me")
                ? "text-emerald-700 font-medium"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            My Profile
          </button>
          <button
            onClick={() => navigate("/recommendations")}
            className={`text-sm tracking-wide transition-colors ${
              isActive("/recommendations")
                ? "text-emerald-700 font-medium"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            For You
          </button>
        </nav>

        {/* Avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="w-9 h-9 rounded-full bg-stone-900 text-[#FAF8F4] text-sm font-semibold flex items-center justify-center hover:bg-emerald-800 transition-colors"
          >
            M
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-lg border border-stone-100 py-1 z-50">
              <button
                onClick={() => { navigate("/user/me"); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
              >
                View Profile
              </button>
              <div className="border-t border-stone-100 my-1" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

export default Navbar;