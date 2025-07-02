import React, { useState } from 'react';
import StarInfo from './StarInfo';
import NewDialog from './NewDialog';
import FileDialog from './FileDialog';
import PropertiesDialog from './PropertiesDialog';

const api = 'http://localhost:3000';

type NodeActionsProps = {
  constellationId: string;
  path: string[];
  refresh: () => void;
};

function NodeActions({ constellationId, path, refresh }: NodeActionsProps) {
  const [error, setError] = useState('');
  const [starType, setStarType] = useState<string | null>(null);

  React.useEffect(() => {
    // Fetch star info to get the type
    fetch(`${api}/${constellationId}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => setStarType(data && data.starInfo && data.starInfo.type ? data.starInfo.type : null))
      .catch(() => setStarType(null));
    // eslint-disable-next-line
  }, [constellationId, JSON.stringify(path)]);

  const handleDelete = async () => {
    setError('');
    if (!window.confirm('Delete this node and its children?')) return;
    try {
      await fetch(`${api}/${constellationId}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, updateStarStatus: true }),
      });
      refresh();
    } catch {
      setError('Delete failed');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginLeft: 8, gap: 0 }}>
      {starType && starType === '_constellation' && (
        <NewDialog constellationId={constellationId} path={path} refresh={refresh} />
      )}
      {starType && starType !== '_constellation' && (
        <FileDialog constellationId={constellationId} path={path} />
      )}
      <StarInfo constellationId={constellationId} path={path} />
      <PropertiesDialog constellationId={constellationId} path={path} />
      <button onClick={handleDelete} style={{ color: 'red' }}>Delete</button>
      {error && <span style={{ color: 'red', marginLeft: 8 }}>{error}</span>}
    </div>
  );
}

export default NodeActions;
