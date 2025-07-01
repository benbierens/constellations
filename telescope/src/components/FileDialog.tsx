import React, { useState } from 'react';

const api = 'http://localhost:3000';

type FileDialogProps = {
  constellationId: string;
  path: string[];
  buttonLabel?: string;
  refresh?: () => void;
};

function FileDialog({ constellationId, path, buttonLabel = "File" }: FileDialogProps) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<number | null>(null);
  const [lastChange, setLastChange] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    setError('');
    setSize(null);
    setLastChange(null);
    try {
      const res = await fetch(`${api}/${constellationId}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      if (!res.ok) throw new Error();
      const info = await res.json();
      setSize(
        info && typeof info.size === 'number'
          ? info.size
          : info && info.starInfo && typeof info.starInfo.size === 'number'
          ? info.starInfo.size
          : null
      );
      setLastChange(
        info && typeof info.LastChangeUtc === 'string'
          ? info.LastChangeUtc
          : info && info.starInfo && typeof info.starInfo.LastChangeUtc === 'string'
          ? info.starInfo.LastChangeUtc
          : null
      );
    } catch {
      setError('Failed to fetch file info');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSize(null);
    setLastChange(null);
    setError('');
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(`${api}/${constellationId}/getdata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      if (!res.ok) throw new Error();
      const base64 = await res.text();
      // Decode base64 to binary
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; ++i) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes]);
      // Use the last path segment as filename, fallback to "file"
      const filename = path.length > 0 ? path[path.length - 1] : 'file';
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch {
      setError('Failed to download file');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setError('File too large (max 3MB)');
      return;
    }
    try {
      // Read file as binary and base64 encode (safe for large files)
      const arrayBuffer = await file.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(arrayBuffer);
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(
          null,
          bytes.subarray(i, i + chunkSize) as any
        );
      }
      const base64String = btoa(binary);
      const res = await fetch(`${api}/${constellationId}/setdata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, data: base64String }),
      });
     console.log("c"); 
      if (!res.ok) throw new Error();
      // Optionally refresh info after upload
      setSize(file.size);
      setError('');
    } catch (error) {
      setError('Failed to upload file: ' + error);
    }
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
              position: 'relative',
              height: '90vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>File Info</h3>
            {loading ? (
              <div>Loading...</div>
            ) : error ? (
              <div style={{ color: 'red' }}>{error}</div>
            ) : (
              <div>
                <div>
                  <strong>Size:</strong>{' '}
                  {size !== null ? `${size} bytes` : <span style={{ color: '#888' }}>Unknown</span>}
                </div>
                <div style={{ marginTop: 8 }}>
                  <strong>Last change:</strong>{' '}
                  {size && size > 0 && lastChange
                    ? lastChange
                    : <span style={{ color: '#888' }}>N/A</span>}
                </div>
                <button
                  style={{ marginTop: 16, marginRight: 8 }}
                  onClick={handleDownload}
                  disabled={!size || size <= 0}
                >
                  Download
                </button>
                <label style={{ marginTop: 16 }}>
                  <input
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleUpload}
                  />
                  <button
                    type="button"
                    style={{ marginLeft: 0 }}
                    onClick={e => {
                      // @ts-ignore
                      e.target.previousSibling.click();
                    }}
                  >
                    Upload
                  </button>
                </label>
              </div>
            )}
            <button onClick={handleClose} style={{ marginTop: 16 }}>Close</button>
          </div>
        </div>
      )}
    </span>
  );
}

export default FileDialog;
