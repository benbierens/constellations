import React, { useState } from 'react';
import StarInfo from './StarInfo';
import NewDialog from './NewDialog';

type StructureNode = {
  path: string;
  starId: string;
  isActive: boolean;
  entries?: StructureNode[];
};

type Props = {
  constellationId: string;
  node: StructureNode;
  path: string[];
};

const api = 'http://localhost:3000';

function NodeActions({
  constellationId,
  path,
  refresh,
}: {
  constellationId: string;
  path: string[];
  refresh: () => void;
}) {
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
      .then(data => setStarType(data && data.starInfo  && data.starInfo.type ? data.starInfo.type : null))
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
    <div style={{ display: 'inline-block', marginLeft: 8 }}>
      {starType === '_constellation' && (
        <NewDialog constellationId={constellationId} path={path} refresh={refresh} />
      )}
      <StarInfo constellationId={constellationId} path={path} />
      <button onClick={handleDelete} style={{ color: 'red' }}>Delete</button>
      {error && <span style={{ color: 'red', marginLeft: 8 }}>{error}</span>}
    </div>
  );
}

function StructureTree({ constellationId, node, path }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey(k => k + 1);

  // re-fetch node on refresh
  const [currentNode, setCurrentNode] = useState(node);
  React.useEffect(() => {
    setCurrentNode(node);
  }, [node, refreshKey]);

  return (
    <div style={{ marginLeft: path.length ? 24 : 0, marginTop: 8 }}>
      <div>
        <span
          style={{ cursor: 'pointer', fontWeight: path.length === 0 ? 'bold' : undefined }}
          onClick={() => setExpanded(e => !e)}
        >
          {currentNode.entries && currentNode.entries.length > 0
            ? (expanded ? '▼' : '▶')
            : '•'}{' '}
          {currentNode.path || '/'}
        </span>
        <NodeActions constellationId={constellationId} path={path} refresh={refresh} />
      </div>
      {expanded && currentNode.entries && currentNode.entries.length > 0 && (
        <div>
          {currentNode.entries.map((entry, idx) => (
            <StructureTree
              key={entry.path + idx}
              constellationId={constellationId}
              node={entry}
              path={[...path, entry.path]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default StructureTree;
