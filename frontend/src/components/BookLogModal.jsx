import { useState, useEffect } from 'react';
import { Modal, Rate } from 'antd';
import api from '../api';

function BookLogModal({ book, open, onClose }) {
  const [status, setStatus] = useState('want_to_read');
  const [dateStarted, setDateStarted] = useState('');
  const [dateFinished, setDateFinished] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  const [existingLog, setExistingLog] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (book && open) {
      fetchExistingLog();
    }
  }, [book, open]);

  const fetchExistingLog = async () => {
    try {
      const res = await api.get('/logs/');
      const logs = res.data.results || res.data;
      const log = logs.find((l) => l.book === book.id);
      if (log) {
        setExistingLog(log);
        setStatus(log.status);
        setDateStarted(log.date_started || '');
        setDateFinished(log.date_finished || '');
        setCurrentPage(log.current_page || 0);
        setNotes(log.notes || '');
      } else {
        resetForm();
      }
    } catch {
      resetForm();
    }
  };

  const resetForm = () => {
    setExistingLog(null);
    setStatus('want_to_read');
    setDateStarted('');
    setDateFinished('');
    setCurrentPage(0);
    setNotes('');
    setRating(0);
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
        await api.patch(`/logs/${existingLog.id}/`, payload);
      } else {
        await api.post('/logs/', payload);
      }

      onClose(true); // true = refresh needed
    } catch (err) {
      alert('Failed to save log');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!existingLog) return;
    setLoading(true);
    try {
      await api.delete(`/logs/${existingLog.id}/`);
      onClose(true);
    } catch {
      alert('Failed to delete log');
    }
    setLoading(false);
  };

  if (!book) return null;

  const progress = book.page_count
    ? Math.round((currentPage / book.page_count) * 100)
    : 0;

  const labelStyle = {
    color: '#888',
    fontSize: 13,
    minWidth: 120,
  };

  const valueStyle = {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  };

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #2a2a2a',
  };

  const inputStyle = {
    padding: '6px 10px',
    borderRadius: 4,
    border: '1px solid #444',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    fontSize: 14,
    width: '100%',
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
  };

  return (
    <Modal
      open={open}
      onCancel={() => onClose(false)}
      footer={null}
      width={600}
      styles={{ content: { backgroundColor: '#141414', color: '#fff' } }}
    >
      {/* Book header */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            style={{ width: 120, height: 180, objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          <div style={{
            width: 120,
            height: 180,
            backgroundColor: '#2a2a2a',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#888',
            textAlign: 'center',
            padding: 8,
          }}>
            {book.title}
          </div>
        )}
        <div>
          <h2 style={{ margin: 0, color: '#fff' }}>{book.title}</h2>
          <p style={{ color: '#888', margin: '4px 0' }}>
            {book.authors?.join(', ') || 'Unknown author'}
          </p>
          {book.publisher && (
            <p style={{ color: '#666', fontSize: 12, margin: '2px 0' }}>
              {book.publisher} {book.publish_date && `· ${book.publish_date}`}
            </p>
          )}
          {book.page_count && (
            <p style={{ color: '#666', fontSize: 12, margin: '2px 0' }}>
              {book.page_count} pages
            </p>
          )}
          {book.genres?.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {book.genres.map((g) => (
                <span key={g} style={{
                  padding: '2px 8px',
                  backgroundColor: '#333',
                  borderRadius: 4,
                  fontSize: 11,
                  color: '#aaa',
                }}>
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {book.description && (
        <p style={{
          color: '#999',
          fontSize: 13,
          lineHeight: 1.6,
          marginBottom: 20,
          maxHeight: 100,
          overflow: 'auto',
        }}>
          {book.description}
        </p>
      )}

      {/* Reading log form — Notion style */}
      <div style={{ borderTop: '1px solid #2a2a2a' }}>

        <div style={rowStyle}>
          <span style={labelStyle}>⊙ Rating</span>
          <div style={valueStyle}>
            <Rate allowHalf value={rating} onChange={setRating} />
          </div>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>✦ Status</span>
          <div style={valueStyle}>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={selectStyle}
            >
              <option value="want_to_read">Want to Read</option>
              <option value="reading">Currently Reading</option>
              <option value="completed">Completed</option>
              <option value="did_not_finish">Did Not Finish</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}># Current Page</span>
          <div style={valueStyle}>
            <input
              type="number"
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              min={0}
              max={book.page_count || 99999}
              style={inputStyle}
            />
          </div>
        </div>

        {book.page_count > 0 && (
          <div style={rowStyle}>
            <span style={labelStyle}>∑ Progress</span>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                flex: 1,
                height: 6,
                backgroundColor: '#333',
                borderRadius: 3,
              }}>
                <div style={{
                  width: `${Math.min(progress, 100)}%`,
                  height: '100%',
                  backgroundColor: '#4CAF50',
                  borderRadius: 3,
                }} />
              </div>
              <span style={{ color: '#888', fontSize: 12 }}>{progress}%</span>
            </div>
          </div>
        )}

        <div style={rowStyle}>
          <span style={labelStyle}>▶ Date Started</span>
          <div style={valueStyle}>
            <input
              type="date"
              value={dateStarted}
              onChange={(e) => setDateStarted(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>■ Date Finished</span>
          <div style={valueStyle}>
            <input
              type="date"
              value={dateFinished}
              onChange={(e) => setDateFinished(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ ...rowStyle, alignItems: 'flex-start', borderBottom: 'none' }}>
          <span style={{ ...labelStyle, paddingTop: 6 }}>≡ Notes</span>
          <div style={valueStyle}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Write your thoughts..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingTop: 16,
        borderTop: '1px solid #2a2a2a',
      }}>
        <div>
          {existingLog && (
            <button
              onClick={handleDelete}
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#ff4d4f',
                border: '1px solid #ff4d4f',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Remove Log
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onClose(false)}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1677ff',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {existingLog ? 'Update Log' : 'Log This Book'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default BookLogModal;