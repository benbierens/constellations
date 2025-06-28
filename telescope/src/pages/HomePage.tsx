import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const api = '/api';

export default function HomePage() {
  const [owners, setOwners] = useState('');
  const [connectId, setConnectId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${api}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owners: owners.split(',').map(s => s.trim()).filter(Boolean) }),
      });
      if (!res.ok) throw new Error('Failed to create constellation');
      const data = await res.json();
      navigate(`/constellation/${data.newId}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${api}/connect/${connectId}`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to connect');
      const data = await res.json();
      navigate(`/constellation/${data.newId}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto' }}>
      <h2>Create Constellation</h2>
      <form onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Owner addresses (comma separated)"
          value={owners}
          onChange={e => setOwners(e.target.value)}
          style={{ width: '100%' }}
        />
        <button type="submit" style={{ marginTop: 8 }}>Create</button>
      </form>
      <h2 style={{ marginTop: 32 }}>Connect to Constellation</h2>
      <form onSubmit={handleConnect}>
        <input
          type="number"
          placeholder="Constellation ID"
          value={connectId}
          onChange={e => setConnectId(e.target.value)}
          style={{ width: '100%' }}
        />
        <button type="submit" style={{ marginTop: 8 }}>Connect</button>
      </form>
      {error && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
    </div>
  );
}
