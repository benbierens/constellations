import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { withWebSocket } from '../components/withWebSocket';
import PrototypeWarningDialog from '../components/PrototypeWarningDialog';

const api = 'http://localhost:3000';

function HomePageBase({ wsMessage }: { wsMessage: any }) {
  const [owners, setOwners] = useState('');
  const [connectId, setConnectId] = useState('');
  const [error, setError] = useState('');
  const [constellationIds, setConstellationIds] = useState<number[]>([]);
  const [showWarning, setShowWarning] = useState(true);
  const navigate = useNavigate();

  const fetchConstellations = useCallback(() => {
    fetch(`${api}/`)
      .then(res => res.json())
      .then(data => setConstellationIds(Array.isArray(data) ? data : []))
      .catch(() => setConstellationIds([]));
  }, []);

  useEffect(() => {
    fetchConstellations();
  }, [fetchConstellations]);

  useEffect(() => {
    if (wsMessage === 'constellationsChanged') {
      fetchConstellations();
    }
  }, [wsMessage, fetchConstellations]);

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
    <>
      <PrototypeWarningDialog open={showWarning} onClose={() => setShowWarning(false)} />
      <div style={{ maxWidth: 400, margin: '2rem auto' }}>
        {constellationIds.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3>Existing Constellations</h3>
            <ul style={{ paddingLeft: 20 }}>
              {constellationIds.map(id => (
                <li key={id} style={{ marginBottom: 4 }}>
                  <button
                    style={{ cursor: 'pointer', textDecoration: 'underline', background: 'none', border: 'none', color: '#1976d2', padding: 0 }}
                    onClick={() => navigate(`/constellation/${id}`)}
                  >
                    Constellation #{id}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
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
    </>
  );
}

export default withWebSocket(HomePageBase);