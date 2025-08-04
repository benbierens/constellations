import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { withWebSocket } from '../components/withWebSocket';
import PrototypeWarningDialog from '../components/PrototypeWarningDialog';

import constellationIcon from '../assets/icon_constellation.png';
import { DemoContent } from '../demoContent';
import { api } from '../api';

async function CreateDemoContent(id: any, owners: any) {
  const demoContent = new DemoContent(id, owners);
  await demoContent.create();  
}

function HomePageBase({ wsMessage }: { wsMessage: any }) {
  const [owners, setOwners] = useState('');
  const [connectId, setConnectId] = useState('');
  const [error, setError] = useState('');
  const [constellationIds, setConstellationIds] = useState<number[]>([]);
  const [showWarning, setShowWarning] = useState(true);
  const [populateDemo, setPopulateDemo] = useState(false);
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

  // Initialize owners with node address on mount
  useEffect(() => {
    fetch(`${api}/address`)
      .then(res => res.json())
      .then(data => setOwners(typeof data === 'string' ? data : (data.address || '')))
      .catch(() => setOwners(''));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const ow = owners.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch(`${api}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owners: ow }),
      });
      if (!res.ok) throw new Error('Failed to create constellation');
      const data = await res.json();

      if (populateDemo) {
        await CreateDemoContent(data.newId, ow);
      }

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img
          src={constellationIcon}
          alt="Constellation"
          style={{ height: 108, verticalAlign: 'middle', marginBottom: 16 }}
        />
      </div>
      <div className="win95-window" style={{ maxWidth: 400, margin: '2rem auto' }}>
        {constellationIds.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3>Connected Constellations</h3>
            <ul className="win95-list" style={{ paddingLeft: 20 }}>
              {constellationIds.map(id => (
                <li key={id} style={{ marginBottom: 4 }}>
                  <button
                    style={{ cursor: 'pointer', textDecoration: 'underline', background: 'none', border: 'none', color: '#000080', padding: 0 }}
                    onClick={() => navigate(`/constellation/${id}`)}
                  >
                    Constellation #{id}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <h2 style={{ marginTop: 32 }}>Connect to a Constellation</h2>
        <form onSubmit={handleConnect}>
          <input
            className="win95-input"
            type="text"
            placeholder="Constellation ID"
            value={connectId}
            onChange={e => setConnectId(e.target.value)}
            style={{ width: '100%' }}
          />
          <button type="submit" style={{ marginTop: 8 }}>Connect and Mount</button>
        </form>
        <h2>Create a new Constellation</h2>
        <form onSubmit={handleCreate}>
          <input
            className="win95-input"
            type="text"
            placeholder="Owner addresses (comma separated)"
            value={owners}
            onChange={e => setOwners(e.target.value)}
            style={{ width: '100%' }}
          />
          <div style={{ margin: '8px 0', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="populate-demo"
              checked={populateDemo}
              onChange={e => setPopulateDemo(e.target.checked)}
              style={{ marginRight: 6 }}
            />
            <label htmlFor="populate-demo" style={{ userSelect: 'none', cursor: 'pointer' }}>
              Populate with demo content
            </label>
          </div>
          <button type="submit" style={{ marginTop: 8 }}>Create and Mount</button>
        </form>
        {error && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
      </div>
    </>
  );
}

export default withWebSocket(HomePageBase);