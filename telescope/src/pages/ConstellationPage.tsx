import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import StructureTree from '../components/StructureTree';

const api = 'http://localhost:3000';

export default function ConstellationPage() {
  const { id } = useParams<{ id: string }>();
  const [info, setInfo] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${api}/${id}`)
      .then(res => res.json())
      .then(setInfo)
      .catch(() => setError('Failed to load structure'));
  }, [id]);

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto' }}>
      <h2>Constellation #{id}</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {info ? (
        <StructureTree constellationId={id!} node={info} path={[]} />
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}
