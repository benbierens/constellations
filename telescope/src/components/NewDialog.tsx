import React, { useState } from 'react';
import { api } from '../api';

type NewDialogProps = {
  constellationId: string;
  path: string[];
  refresh: () => void;
};

function NewDialog({ constellationId, path, refresh }: NewDialogProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [type, setType] = useState<'file' | 'folder'>('file');
  const [name, setName] = useState('');
  const [owners, setOwners] = useState('');
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = type === 'file' ? 'newfile' : 'newfolder';
      const req: any = {
        path: [...path, name],
        owners: owners.split(',').map((s) => s.trim()).filter(Boolean),
      };
      if (type === 'file') req.type = 'file';
      await fetch(`${api}/${constellationId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      setShowCreate(false);
      setName('');
      setOwners('');
      refresh();
    } catch {
      setError('Create failed');
    }
  };

  const handleOpen = async () => {
    // Fetch node address and set as default owners
    try {
      const res = await fetch(`${api}/address`);
      const data = await res.json();
      setOwners(typeof data === 'string' ? data : (data.address || ''));
    } catch {
      setOwners('');
    }
    setShowCreate(true);
  };

  return (
    <span style={{ display: 'inline-block', marginLeft: 0 }}>
      <button onClick={handleOpen}>+ New</button>
      {showCreate && (
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
          onClick={() => setShowCreate(false)}
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
              width: 400,
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: 24 }}>Create New</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ width: '100%' }}>
                <label style={{ display: 'block', fontWeight: type === 'file' ? 'bold' : undefined, marginBottom: 4 }}>
                  <input
                    type="radio"
                    name="type"
                    value="file"
                    checked={type === 'file'}
                    onChange={() => setType('file')}
                    style={{ marginRight: 4 }}
                  />
                  File
                </label>
                <span style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 8 }}>
                  (A single document or data item)
                </span>
                <label style={{ display: 'block', fontWeight: type === 'folder' ? 'bold' : undefined, marginBottom: 4 }}>
                  <input
                    type="radio"
                    name="type"
                    value="folder"
                    checked={type === 'folder'}
                    onChange={() => setType('folder')}
                    style={{ marginRight: 4 }}
                  />
                  Folder
                </label>
                <span style={{ fontSize: 12, color: '#888', display: 'block' }}>
                  (A container for files and folders)
                </span>
              </div>
              <input
                type="text"
                placeholder="Name"
                value={name}
                required
                onChange={e => setName(e.target.value)}
                style={{ width: '100%', marginBottom: 0 }}
              />
              <input
                type="text"
                placeholder="Owners (comma separated)"
                value={owners}
                onChange={e => setOwners(e.target.value)}
                style={{ width: '100%', marginBottom: 0 }}
              />
              {error && <span style={{ color: 'red' }}>{error}</span>}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <button type="button" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button type="submit">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </span>
  );
}

export default NewDialog;
