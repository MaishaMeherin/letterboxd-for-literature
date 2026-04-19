import { useState, useEffect } from "react";
import api from "../api";
import { useLogFormStore } from "../store";

function BookLogModal({ book, open, onClose }) {
  const {
    status, setStatus,
    dateStarted, setDateStarted,
    dateFinished, setDateFinished,
    currentPage, setCurrentPage,
    notes, setNotes,
    existingLog, setExistingLog,
  } = useLogFormStore();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (book && open) fetchExistingLog();
  }, [book, open]);

  const fetchExistingLog = async () => {
    try {
      const res = await api.get("/api/v1/logs/");
      const logs = res.data.results || res.data;
      const log = logs.find((l) => l.book === book.id);
      if (log) {
        setExistingLog(log);
        setStatus(log.status);
        setDateStarted(log.date_started || "");
        setDateFinished(log.date_finished || "");
        setCurrentPage(log.current_page || 0);
        setNotes(log.notes || "");
      } else {
        resetForm();
      }
    } catch {
      resetForm();
    }
  };

  const resetForm = () => {
    setExistingLog(null);
    setStatus("want_to_read");
    setDateStarted("");
    setDateFinished("");
    setCurrentPage(0);
    setNotes("");
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        book: book.id,
        status,
        date_started: dateStarted || null,
        date_finished: dateFinished || null,
        current_page: currentPage,
        notes,
      };
      if (existingLog) {
        await api.patch(`/api/v1/logs/${existingLog.id}/`, payload);
      } else {
        await api.post("/api/v1/logs/", payload);
      }
      onClose(true);
    } catch {
      alert("Failed to save log");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!existingLog) return;
    setLoading(true);
    try {
      await api.delete(`/api/v1/logs/${existingLog.id}/`);
      onClose(true);
    } catch {
      alert("Failed to delete log");
    }
    setLoading(false);
  };

  if (!book || !open) return null;

  const progress = book.page_count
    ? Math.min(Math.round((currentPage / book.page_count) * 100), 100)
    : 0;

  const STATUS_LABELS = {
    want_to_read: "Want to Read",
    reading: "Currently Reading",
    completed: "Completed",
    did_not_finish: "Did Not Finish",
    on_hold: "On Hold",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
        onClick={() => onClose(false)}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Close button */}
        <button
          onClick={() => onClose(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center text-sm transition-colors z-10"
        >
          ✕
        </button>

        {/* Book header */}
        <div className="p-6 pb-4 flex gap-5">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-24 h-36 object-cover rounded-xl shadow-md shrink-0"
            />
          ) : (
            <div className="w-24 h-36 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 text-xs text-center px-2 shrink-0">
              No Cover
            </div>
          )}
          <div className="flex-1 min-w-0 pt-1">
            <p className="text-xs uppercase tracking-widest text-emerald-700 font-medium mb-1">
              Reading Log
            </p>
            <h2 className="font-serif text-xl text-stone-900 leading-snug mb-1">
              {book.title}
            </h2>
            <p className="text-sm text-stone-500 mb-2">
              {book.authors?.join(", ") || "Unknown author"}
            </p>
            {book.page_count > 0 && (
              <p className="text-xs text-stone-400 mb-3">{book.page_count} pages</p>
            )}
            {book.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {book.genres.slice(0, 4).map((g) => (
                  <span
                    key={g}
                    className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 text-[11px] border border-stone-200"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-6 border-t border-stone-100" />

        {/* Form */}
        <div className="p-6 space-y-4">

          {/* Status */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-400 font-medium mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-emerald-400 transition-colors"
            >
              <option value="want_to_read">Want to Read</option>
              <option value="reading">Currently Reading</option>
              <option value="completed">Completed</option>
              <option value="did_not_finish">Did Not Finish</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs uppercase tracking-widest text-stone-400 font-medium">
                Current Page
              </label>
              {book.page_count > 0 && (
                <span className="text-xs text-stone-400">
                  {progress}% complete
                </span>
              )}
            </div>
            <input
              type="number"
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              min={0}
              max={book.page_count || 99999}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-emerald-400 transition-colors"
            />
            {book.page_count > 0 && (
              <div className="mt-2 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-400 font-medium mb-1.5">
                Date Started
              </label>
              <input
                type="date"
                value={dateStarted}
                onChange={(e) => setDateStarted(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-400 font-medium mb-1.5">
                Date Finished
              </label>
              <input
                type="date"
                value={dateFinished}
                onChange={(e) => setDateFinished(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-400 font-medium mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any thoughts, quotes, or reminders..."
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 placeholder-stone-400 resize-none focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <div>
            {existingLog && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 rounded-full text-sm text-red-500 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-40"
              >
                Remove Log
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onClose(false)}
              className="px-5 py-2 rounded-full text-sm text-stone-500 border border-stone-200 hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-5 py-2 rounded-full text-sm bg-stone-900 text-[#FAF8F4] hover:bg-emerald-800 transition-colors disabled:opacity-40"
            >
              {loading ? "Saving..." : existingLog ? "Update Log" : "Log This Book"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default BookLogModal;