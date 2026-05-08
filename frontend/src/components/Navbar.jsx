import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotificationIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications on mount
  useEffect(() => {
    const token = localStorage.getItem('access');
    if (!token) return;

    fetch('http://localhost:8000/api/v1/notifications/', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setNotifications(data.results);
        setUnreadCount(data.unread_count);
      });
  }, []);

  // WebSocket connection for live pushes
  useEffect(() => {
    const token = localStorage.getItem('access');
    if (!token) return;

    const wsBase = import.meta.env.VITE_API_URL.replace("http://", "ws://");
    const ws = new WebSocket(`${wsBase}/ws/notifications/?token=${token}`);

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setUnreadCount(prev => prev + 1);
      setNotifications(prev => [data, ...prev]);
    };

    return () => ws.close();
  }, []);

  const handleBellClick = () => {
    setNotifOpen(prev => !prev);
    if (unreadCount > 0) {
      setUnreadCount(0);
      fetch('http://localhost:8000/api/v1/notifications/read-all/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
      });
    }
  };

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
              isActive("/") ? "text-emerald-700 font-medium" : "text-stone-500 hover:text-stone-900"
            }`}
          >
            Home
          </button>
          <button
            onClick={() => navigate("/user/me")}
            className={`text-sm tracking-wide transition-colors ${
              isActive("/user/me") ? "text-emerald-700 font-medium" : "text-stone-500 hover:text-stone-900"
            }`}
          >
            My Profile
          </button>
          <button
            onClick={() => navigate("/recommendations")}
            className={`text-sm tracking-wide transition-colors ${
              isActive("/recommendations") ? "text-emerald-700 font-medium" : "text-stone-500 hover:text-stone-900"
            }`}
          >
            For You
          </button>
          <button
            onClick={() => navigate("/stats")}
            className={`text-sm tracking-wide transition-colors ${
              isActive("/stats") ? "text-emerald-700 font-medium" : "text-stone-500 hover:text-stone-900"
            }`}
          >
            My Year
          </button>
        </nav>

        <div className="flex items-center gap-3">

          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleBellClick}
              className="relative p-2 text-stone-400 hover:text-emerald-700 transition-colors"
            >
              <NotificationIcon />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-emerald-700 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-stone-100 z-50 overflow-hidden">

                {/* Header */}
                <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                  <span className="font-serif text-sm text-stone-900">Notifications</span>
                  {unreadCount === 0 && notifications.length > 0 && (
                    <span className="text-xs text-stone-400">All caught up</span>
                  )}
                </div>

                {/* List */}
                <div className="max-h-72 overflow-y-auto divide-y divide-stone-50">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-2xl mb-2">🔔</p>
                      <p className="text-sm text-stone-400">Nothing here yet</p>
                      <p className="text-xs text-stone-300 mt-1">Likes and comments will show up here</p>
                    </div>
                  ) : (
                    notifications.slice(0, 15).map((n, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          if (n.book_id) {
                            navigate(`/book/${n.book_id}/`);
                            setNotifOpen(false);
                          }
                        }}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-stone-50 transition-colors ${n.book_id ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        {/* Icon pill */}
                        <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                          n.notification_type === 'like'
                            ? 'bg-rose-50 text-rose-400'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {n.notification_type === 'like' ? '♥' : '💬'}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-stone-700 leading-snug">
                            <span className="font-medium text-stone-900">{n.sender_username}</span>
                            {n.notification_type === 'like'
                              ? ' liked your review'
                              : ' commented on your review'}
                          </p>
                          {n.created_at && (
                            <p className="text-xs text-stone-400 mt-0.5">{timeAgo(n.created_at)}</p>
                          )}
                        </div>

                        {/* Arrow hint */}
                        {n.book_id && (
                          <span className="text-stone-300 text-xs mt-1">→</span>
                        )}
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}
          </div>

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

      </div>
    </header>
  );
}

export default Navbar;