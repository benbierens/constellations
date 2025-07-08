import React, { useState } from 'react';
import { api } from '../api';

type StarInfoProps = {
  constellationId: string;
  path: string[];
};

function StarInfo({ constellationId, path }: StarInfoProps) {
  const [info, setInfo] = useState<any>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const handleToggle = async () => {
    if (open) {
      setOpen(false);
      setInfo(null);
      setError('');
    } else {
      setError('');
      setOpen(true);
      try {
        const res = await fetch(`${api}/${constellationId}/info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path }),
        });
        if (!res.ok) throw new Error();
        setInfo(await res.json());
      } catch {
        setError('Failed to fetch info');
      }
    }
  };

  return (
    <span style={{ display: 'inline-block', marginLeft: 0 }}>
      <button onClick={handleToggle}>{open ? 'Close Info' : 'Info'}</button>
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
          onClick={handleToggle}
        >
          <div
            className="win95-modal"
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
            <div className="win95-title" style={{ marginBottom: 16 }}>Star Info</div>
            {info && (
              <pre style={{ background: '#eee', padding: 8, maxHeight: 400, overflow: 'auto' }}>
                {JSON.stringify(info, null, 2)}
              </pre>
            )}
            {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
            <button onClick={handleToggle} style={{ marginTop: 16 }}>Close</button>
          </div>
        </div>
      )}
    </span>
  );
}

export default StarInfo;