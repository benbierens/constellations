import React, { useState, useEffect } from 'react';
// Add import for the icon
import telescopeIcon from '../assets/icon_telescope.png';

type Props = {
  open: boolean;
  onClose: () => void;
};

function PrototypeWarningDialog({ open, onClose }: Props) {
  const [checks, setChecks] = useState([false, false, false, false, false, false]);

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
        className="win95-modal"
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
        <div style={{ fontWeight: 'bold', fontSize: 28, marginBottom: 16 }}>
          Telescope
        </div>
        <div style={{ marginBottom: 24 }}>
          <img src={telescopeIcon} alt="Telescope" style={{ height: 108, verticalAlign: 'middle' }} />
        </div>
        <div className="win95-title" style={{ marginBottom: 24 }}>
          ⚠️ Prototype and Content Warning
        </div>
        <p style={{ fontSize: 20, marginBottom: 32 }}>
          This is a prototype. Do not trust it with important or sensitve data. Data may be lost, corrupted, or become publicly accessible.<br />
          This prototype will definitely break when you use files larger than a few MB.<br />
          <b>Do not use for important or production data. Use at your own risk.</b>
        </p>
        <div style={{ textAlign: 'left', margin: '0 auto', maxWidth: 400, marginBottom: 32 }}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={checks[0]}
              onChange={e => setChecks([e.target.checked, checks[1],checks[2],checks[3],checks[4],checks[5]])}
              style={{ marginRight: 8 }}
            />
            I understand that this is an experimental prototype and may be unstable.
          </label>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={checks[1]}
              onChange={e => setChecks([checks[0], e.target.checked, checks[2],checks[3],checks[4],checks[5]])}
              style={{ marginRight: 8 }}
            />
            I will not hold any of the developers of this prototype and its dependencies liable for any potential damage caused by my use of this prototype.
          </label>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={checks[2]}
              onChange={e => setChecks([checks[0], checks[1],e.target.checked,checks[3],checks[4],checks[5]])}
              style={{ marginRight: 8 }}
            />
            I will not use this prototype to store important, sensitive, or personal data. I understand the data I use with this prototype may become publicly visible.
          </label>
        </div>
        <p style={{ fontSize: 20, marginBottom: 32 }}>
          This is prototype can be used to access data provided by third parties, companies, or individuals.<br />
          This application has no means of detecting or restricting access to malicious or dangerous content.<br />
          You as a user are responsible for controlling your access to data, and ensuring such access complies with local law.<br />
          <b>Be careful with Constellation IDs from others. Use at your own risk.</b>
        </p>
        <div style={{ textAlign: 'left', margin: '0 auto', maxWidth: 400, marginBottom: 32 }}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={checks[3]}
              onChange={e => setChecks([checks[0], checks[1],checks[2],e.target.checked,checks[4],checks[5]])}
              style={{ marginRight: 8 }}
            />
            I understand that this prototype cannot protect me from malicious or dangerous content.
          </label>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={checks[4]}
              onChange={e => setChecks([checks[0], checks[1],checks[2],checks[3],e.target.checked,checks[5]])}
              style={{ marginRight: 8 }}
            />
            I will not hold any of the developers of this prototype and its dependencies liable for any content I am exposed to during my use of this prototype.
          </label>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={checks[5]}
              onChange={e => setChecks([checks[0], checks[1],checks[2],checks[3],checks[4],e.target.checked])}
              style={{ marginRight: 8 }}
            />
            I will not use this prototype in combination with malicious or dangerous content, or content that is in violation of local law.
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
