import React, { useState, useEffect } from 'react';

const api = 'http://localhost:3000';

function NodeAddress() {
  const [nodeAddress, setNodeAddress] = useState<string>('initial');

  useEffect(() => {
    fetch(`${api}/address`)
      .then(res => res.json())
      .then(data => setNodeAddress(data))
      .catch(() => setNodeAddress(''));
  }, []);

  return (
    <div style={{ marginBottom: 16, color: '#555', fontSize: 14 }}>
      <strong>nodeAddress: </strong>
      {nodeAddress !== '' ? nodeAddress : <span style={{ color: '#aaa' }}>Loading...</span>}
    </div>
  );
}

export default NodeAddress;
