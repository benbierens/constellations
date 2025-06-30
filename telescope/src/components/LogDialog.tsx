import React, { useState } from 'react';

const api = 'http://localhost:3000';

type LogDialogProps = {
  open?: boolean;
  setOpen?: (open: boolean) => void;
};

function LogDialog(props: LogDialogProps = {}) {
  const [logsHistory, setLogsHistory] = useState<string[][]>([]);
  const [error, setError] = useState('');
  const open = props.open !== undefined ? props.open : undefined;
  const setOpen = props.setOpen !== undefined ? props.setOpen : undefined;
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = setOpen !== undefined ? setOpen : setInternalOpen;

  const handleOpen = async () => {
    setIsOpen(true);
    setError('');
    try {
      const res = await fetch(`${api}/logs`);
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      // Only add to history if there is at least one non-empty line
      if (Array.isArray(data) && data.some((line) => typeof line === 'string' && line.trim() !== '')) {
        setLogsHistory(prev => [...prev, data]);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch logs');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setError('');
  };

  const handleFetch = async () => {
    setError('');
    try {
      const res = await fetch(`${api}/logs`);
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      // Only add to history if there is at least one non-empty line
      if (Array.isArray(data) && data.some((line) => typeof line === 'string' && line.trim() !== '')) {
        setLogsHistory(prev => [...prev, data]);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch logs');
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      handleOpen();
    }
    // eslint-disable-next-line
  }, [isOpen]);

  return (
    <span style={{ display: 'inline-block' }}>
      {open === undefined && (
        <button onClick={handleOpen}>Show Logs</button>
      )}
      {isOpen && (
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
              minWidth: '90vw',
              maxWidth: '98vw',
              minHeight: '80vh',
              maxHeight: '96vh',
              boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
              position: 'relative',
              width: '95vw',
              height: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: 24 }}>Logs</h3>
            {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
            {logsHistory.length > 0 ? (
              <div style={{ flex: 1, overflow: 'auto', background: '#eee', padding: 8 }}>
                {logsHistory.map((logs, idx) => (
                  <div key={idx} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
                      Fetch #{idx + 1}
                    </div>
                    <pre style={{ margin: 0 }}>{logs.join('\n')}</pre>
                  </div>
                ))}
              </div>
            ) : !error ? (
              <div>Loading...</div>
            ) : null}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={handleFetch}>Fetch</button>
              <button onClick={handleClose}>Close</button>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}

export default LogDialog;
