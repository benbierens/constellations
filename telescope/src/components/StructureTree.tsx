import React, { useState } from 'react';
import NodeActions from './NodeActions';
import folderClosedIcon from '../assets/icon_folder_closed.png';
import folderOpenIcon from '../assets/icon_folder_open.png';
import fileOpenIcon from '../assets/icon_file_open.png';
import { api } from '../api';

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

function StructureTree({ constellationId, node, path }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey(k => k + 1);

  // re-fetch node on refresh
  const [currentNode, setCurrentNode] = useState(node);
  React.useEffect(() => {
    setCurrentNode(node);
  }, [node, refreshKey]);

  // Activation checkbox state
  const [activation, setActivation] = useState(currentNode.isActive);

  React.useEffect(() => {
    setActivation(currentNode.isActive);
  }, [currentNode]);

  const handleActivationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    try {
      await fetch(`${api}/${constellationId}/${checked ? 'activate' : 'deactivate'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      refresh();
    } catch {
      // Optionally handle error
    }
  };

  // Compute row background color based on depth
  const rowBg = path.length % 2 === 0 ? '#D4D4D4' : '#C0C0C0';

  const [starType, setStarType] = useState<string | null>(null);

  React.useEffect(() => {
    fetch(`${api}/${constellationId}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => setStarType(data && data.starInfo && data.starInfo.type ? data.starInfo.type : null))
      .catch(() => setStarType(null));
    // eslint-disable-next-line
  }, [activation, constellationId, JSON.stringify(path)]);

  return (
    <div style={{ marginLeft: path.length ? 34 : 0, marginTop: 0, background: rowBg }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {!activation && (
          <img
            src={folderClosedIcon}
            alt="Inactive"
            style={{ width: 18, height: 18, marginRight: 6, verticalAlign: 'middle' }}
          />
        )}
        {activation && starType && starType === '_constellation' && (
          <img
            src={folderOpenIcon}
            alt="Open"
            style={{ width: 18, height: 18, marginRight: 6, verticalAlign: 'middle' }}
          />
        )}
        {activation && starType && starType !== '_constellation' && (
          <img
            src={fileOpenIcon}
            alt="Open"
            style={{ width: 18, height: 18, marginRight: 6, verticalAlign: 'middle' }}
          />
        )}
        <input
          className="win95-input"
          type="checkbox"
          checked={activation}
          onChange={handleActivationChange}
          style={{ marginRight: 8 }}
        />
        <span
          style={{ cursor: 'pointer', fontWeight: path.length === 0 ? 'bold' : undefined }}
          onClick={() => setExpanded(e => !e)}
        >
          {currentNode.entries && currentNode.entries.length > 0
            ? (expanded ? '▼' : '▶')
            : '•'}{' '}
          {currentNode.path || '/'}
        </span>
        <div style={{ flex: 1 }} />
        {activation && (
          <NodeActions
            constellationId={constellationId}
            path={path}
            refresh={refresh}
            starType={starType}
          />
        )}
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
