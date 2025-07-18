import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import StructureTree from '../components/StructureTree';
import { withWebSocket } from '../components/withWebSocket';
import constellationIcon from '../assets/icon_constellation.png';
import driveIcon from '../assets/icon_drive.png';
import { api } from '../api';

function ConstellationPageBase({ wsMessage }: { wsMessage: any }) {
  const { id } = useParams<{ id: string }>();
  const [info, setInfo] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchStructure = useCallback(() => {
    fetch(`${api}/${id}`)
      .then(res => res.json())
      .then(setInfo)
      .catch(() => setError('Failed to load structure'));
  }, [id]);

  useEffect(() => {
    fetchStructure();
  }, [fetchStructure]);

  useEffect(() => {
    if (
      typeof wsMessage === 'string' &&
      id &&
      wsMessage.split("/")[1] === id
    ) {
      console.log("websocket message causes fetchStructure");
      fetchStructure();
    }
  }, [wsMessage, id, fetchStructure]);

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', position: 'relative' }}>
      <img
        src={constellationIcon}
        alt="Constellation"
        style={{
          position: 'absolute',
          top: -35,
          right: -10,
          height: 64,
          margin: 8,
          zIndex: 1
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img
          src={driveIcon}
          alt="Drive"
          style={{ width: 22, height: 22, marginRight: 4, verticalAlign: 'middle' }}
        />
        <h2 style={{ display: 'inline', margin: 0 }}>Constellation #{id}</h2>
      </div>
      {info && (
        <div style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
          <span style={{
            background: '#f0f0f0',
            borderRadius: 4,
            padding: '2px 8px',
            fontFamily: 'monospace'
          }}>
            id: {info.starId}
          </span>
        </div>
      )}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {info ? (
        <StructureTree constellationId={id!} node={info} path={[]} />
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

export default withWebSocket(ConstellationPageBase);
