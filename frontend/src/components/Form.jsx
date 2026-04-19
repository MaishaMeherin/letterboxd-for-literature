import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

function FormManual({ route, method }) {
  const navigate = useNavigate();
  const isLogin = method === "login";

  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.post("/api/v1/auth/login/", { username, password });
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
        navigate("/");
      } else {
        await api.post("/api/v1/auth/register/", { email, username, password });
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <button
            onClick={() => navigate("/welcome")}
            className="font-serif text-3xl text-stone-900 hover:text-emerald-800 transition-colors"
          >
            PageTurner
          </button>
          <p className="text-sm text-stone-400 mt-2">
            {isLogin ? "Welcome back" : "Start your reading journal"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-8 py-8">
          <h1 className="font-serif text-xl text-stone-900 mb-6">
            {isLogin ? "Sign in" : "Create account"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5 uppercase tracking-wide">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="yourname"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-full bg-stone-900 text-[#FAF8F4] text-sm font-medium hover:bg-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>

        {/* Switch link */}
        <p className="text-center text-sm text-stone-400 mt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => navigate(isLogin ? "/register" : "/login")}
            className="text-stone-700 font-medium hover:text-emerald-700 transition-colors"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>

      </div>
    </div>
  );
}

export default FormManual;