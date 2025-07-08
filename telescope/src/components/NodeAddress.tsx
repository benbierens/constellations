import React, { useState, useEffect } from 'react';
import { api } from '../api';

function NodeAddress() {
  const [nodeAddress, setNodeAddress] = useState<string>('initial');

  useEffect(() => {
    fetch(`${api}/address`)
      .then(res => res.json())
      .then(data => setNodeAddress(data))
      .catch(() => setNodeAddress(''));
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: 0,
        color: '#555',
        fontSize: 14,
        height: '100%'
      }}
    >
      <strong>nodeAddress: </strong>
      <span style={{ marginLeft: 4 }}>
        {nodeAddress !== '' ? nodeAddress : <span style={{ color: '#aaa' }}>Loading...</span>}
      </span>
    </div>
  );
}

export default NodeAddress;
