import React, { useState, useEffect } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
};

function PrototypeWarningDialog({ open, onClose }: Props) {
  const [checks, setChecks] = useState([false, false, false]);

  // Hide dialog permanently after first acceptance (per browser)
  useEffect(() => {
    if (!open) return;
    const accepted = localStorage.getItem('prototypeWarningAccepted');
    if (accepted === 'true') {
      onClose();
    }
    // eslint-disable-next-line
  }, [open]);

  const handleAccept = () => {
    localStorage.setItem('prototypeWarningAccepted', 'true');
    onClose();
  };

  if (!open) return null;

  const allChecked = checks.every(Boolean);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: 48,
          borderRadius: 12,
          minWidth: 400,
          maxWidth: 600,
          boxShadow: '0 2px 32px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}
        onClick={e => e.stopPropagation()}
      >
        <h1 style={{ color: '#b71c1c', marginBottom: 24 }}>⚠️ Prototype Warning</h1>
        <p style={{ fontSize: 20, marginBottom: 32 }}>
          This is a prototype. Do not trust it with important or sensitve data. Data may be lost, corrupted, or become publicly accessible.<br />
          <b>Do not use for important or production data. Use at your own risk.</b>
        </p>
        <div style={{ textAlign: 'left', margin: '0 auto', maxWidth: 400, marginBottom: 32 }}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={checks[0]}
              onChange={e => setChecks([e.target.checked, checks[1], checks[2]])}
              style={{ marginRight: 8 }}
            />
            I understand that this is an experimental prototype and may be unstable.
          </label>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={checks[1]}
              onChange={e => setChecks([checks[0], e.target.checked, checks[2]])}
              style={{ marginRight: 8 }}
            />
            I will not hold any of the developers of this prototype and its dependencies liable for any potential damage caused by my use of this prototype.
          </label>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={checks[2]}
              onChange={e => setChecks([checks[0], checks[1], e.target.checked])}
              style={{ marginRight: 8 }}
            />
            I will not use this prototype to store important, or sensitive data.
          </label>
        </div>
        <button
          style={{
            fontSize: 18,
            padding: '12px 32px',
            borderRadius: 8,
            background: allChecked ? '#1976d2' : '#aaa',
            color: '#fff',
            border: 'none',
            cursor: allChecked ? 'pointer' : 'not-allowed'
          }}
          onClick={handleAccept}
          disabled={!allChecked}
        >
          Proceed
        </button>
      </div>
    </div>
  );
}

export default PrototypeWarningDialog;
