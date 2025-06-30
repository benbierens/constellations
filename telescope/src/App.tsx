import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ConstellationPage from './pages/ConstellationPage';
import NodeAddress from './components/NodeAddress';
import LogDialog from './components/LogDialog';

function App() {
  const [showLogs, setShowLogs] = React.useState(false);

  return (
    <Router>
      <nav
        style={{
          padding: 8,
          borderBottom: '1px solid #ccc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/" style={{ marginRight: 16 }}>Home</Link>
          <NodeAddress />
        </div>
        <button onClick={() => setShowLogs(true)} style={{ marginLeft: 'auto' }}>Logs</button>
        {showLogs && (
          <LogDialogWrapper onClose={() => setShowLogs(false)} />
        )}
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/constellation/:id" element={<ConstellationPage />} />
      </Routes>
    </Router>
  );
}

// Helper to allow LogDialog to be closed from outside
function LogDialogWrapper({ onClose }: { onClose: () => void }) {
  return <LogDialogWithClose onClose={onClose} />;
}

function LogDialogWithClose({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = React.useState(true);
  React.useEffect(() => {
    if (!open) onClose();
  }, [open, onClose]);
  return <LogDialog open={open} setOpen={setOpen} />;
}

export default App;
