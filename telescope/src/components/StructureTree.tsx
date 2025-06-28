import React, { useState } from 'react';

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

const api = '/api';

function NodeActions({
  constellationId,
  path,
  refresh,
}: {
  constellationId: string;
  path: string[];
  refresh: () => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [type, setType] = useState<'file' | 'folder'>('file');
  const [name, setName] = useState('');
  const [owners, setOwners] = useState('');
  const [info, setInfo] = useState<any>(null);
  const [error, setError] = useState('');

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

  const handleInfo = async () => {
    setError('');
    try {
      const res = await fetch(`${api}/${constellationId}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      if (!res.ok) throw new Error();
      setInfo(await res.json());
    } catch {
      setError('Failed to fetch info');
    }
  };

  return (
    <div style={{ display: 'inline-block', marginLeft: 8 }}>
      <button onClick={() => setShowCreate((v) => !v)}>+ New</button>
      <button onClick={handleInfo}>Info</button>
      <button onClick={handleDelete} style={{ color: 'red' }}>Delete</button>
      {showCreate && (
        <form onSubmit={handleCreate} style={{ display: 'inline-block', marginLeft: 8 }}>
          <select value={type} onChange={e => setType(e.target.value as any)}>
            <option value="file">File</option>
            <option value="folder">Folder</option>
          </select>
          <input
            type="text"
            placeholder="Name"
            value={name}
            required
            onChange={e => setName(e.target.value)}
            style={{ width: 80 }}
          />
          <input
            type="text"
            placeholder="Owners (comma separated)"
            value={owners}
            onChange={e => setOwners(e.target.value)}
            style={{ width: 120 }}
          />
          <button type="submit">Create</button>
        </form>
      )}
      {info && (
        <pre style={{ background: '#eee', padding: 8, marginTop: 8 }}>{JSON.stringify(info, null, 2)}</pre>
      )}
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
