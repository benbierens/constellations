import React, { useState, useEffect } from 'react';

const api = 'http://localhost:3000';

type FileDialogProps = {
  constellationId: string;
  path: string[];
  buttonLabel?: string;
  refresh?: () => void;
};

function FileDialog({ constellationId, path, buttonLabel = "File" }: FileDialogProps) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${api}/${constellationId}/getdata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      if (!res.ok) throw new Error();
      const text = await res.text();
      setData(text);
    } catch {
      setError('Failed to fetch file data');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setData('');
    setError('');
  };

  return (
    <span style={{ display: 'inline-block', marginLeft: 0 }}>
      <button onClick={handleOpen}>{buttonLabel}</button>
      {open && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={handleClose}
        >
          <div
            style={{
              background: '#fff',
              padding: 24,
              borderRadius: 8,
              minWidth: 320,
              maxWidth: 600,
              boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>File Data</h3>
            {loading ? (
              <div>Loading...</div>
            ) : error ? (
              <div style={{ color: 'red' }}>{error}</div>
            ) : (
              <pre style={{ background: '#eee', padding: 8, maxHeight: 400, overflow: 'auto' }}>
                {data}
              </pre>
            )}
            <button onClick={handleClose} style={{ marginTop: 16 }}>Close</button>
          </div>
        </div>
      )}
    </span>
  );
}

export default FileDialog;
