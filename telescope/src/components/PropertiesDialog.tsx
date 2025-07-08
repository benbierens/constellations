import React, { useState } from 'react';

const api = 'http://localhost:3000';

type PropertiesDialogProps = {
  constellationId: string;
  path: string[];
};

function PropertiesDialog({ constellationId, path }: PropertiesDialogProps) {
  const [open, setOpen] = useState(false);
  const [properties, setProperties] = useState<any>(null);
  const [editProps, setEditProps] = useState<any>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleToggle = async () => {
    if (open) {
      setOpen(false);
      setProperties(null);
      setEditProps(null);
      setError('');
    } else {
      setError('');
      setOpen(true);
      try {
        const res = await fetch(`${api}/${constellationId}/info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path }),
        });
        if (!res.ok) throw new Error();
        const info = await res.json();
        const props = info && info.properties ? info.properties : info;
        setProperties(props);
        setEditProps(JSON.parse(JSON.stringify(props)));
      } catch {
        setError('Failed to fetch properties');
      }
    }
  };

  const handleChange = (field: string, value: any) => {
    setEditProps((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleConfigChange = (field: string, value: any) => {
    setEditProps((prev: any) => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        [field]: value,
      },
    }));
  };

  const handleArrayChange = (field: string, value: string) => {
    setEditProps((prev: any) => ({
      ...prev,
      [field]: value.split(',').map((v) => v.trim()).filter(Boolean),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${api}/${constellationId}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, properties: editProps }),
      });
      if (!res.ok) throw new Error();
      setProperties(editProps);
      setOpen(false);
    } catch {
      setError('Failed to save properties');
    } finally {
      setSaving(false);
    }
  };

  return (
    <span style={{ display: 'inline-block', marginLeft: 0 }}>
      <button onClick={handleToggle}>{open ? 'Close Properties' : 'Properties'}</button>
      {open && (
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
          onClick={handleToggle}
        >
          <div
            className="win95-modal"
            style={{
              background: '#fff',
              padding: 24,
              borderRadius: 8,
              minWidth: 320,
              maxWidth: 600,
              boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="win95-title" style={{ marginBottom: 16 }}>Properties</div>
            {editProps ? (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSave();
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <label>
                  Status:
                  <select
                    value={editProps.status ?? ''}
                    onChange={e => handleChange('status', e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="bright">bright</option>
                    <option value="cold">cold</option>
                  </select>
                </label>
                <fieldset style={{ border: '1px solid #ccc', padding: 8 }}>
                  <legend>Configuration</legend>
                  {editProps.configuration &&
                    Object.entries(editProps.configuration).map(([key, val]) => (
                      <label key={key} style={{ display: 'block', marginBottom: 4 }}>
                        {key}:
                        <input
                          type="number"
                          value={val}
                          onChange={e => handleConfigChange(key, Number(e.target.value))}
                          style={{ width: 120, marginLeft: 8 }}
                        />
                      </label>
                    ))}
                </fieldset>
                <label>
                  Admins (comma separated):
                  <input
                    type="text"
                    value={Array.isArray(editProps.admins) ? editProps.admins.join(', ') : ''}
                    onChange={e => handleArrayChange('admins', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </label>
                <label>
                  Mods (comma separated):
                  <input
                    type="text"
                    value={Array.isArray(editProps.mods) ? editProps.mods.join(', ') : ''}
                    onChange={e => handleArrayChange('mods', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </label>
                <label>
                  Annotations:
                  <input
                    type="text"
                    value={editProps.annotations ?? ''}
                    onChange={e => handleChange('annotations', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </label>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button type="submit" disabled={saving}>Save</button>
                  <button type="button" onClick={handleToggle}>Cancel</button>
                </div>
                {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
              </form>
            ) : error ? (
              <div style={{ color: 'red', marginTop: 8 }}>{error}</div>
            ) : (
              <div>Loading...</div>
            )}
          </div>
        </div>
      )}
    </span>
  );
}

export default PropertiesDialog;
