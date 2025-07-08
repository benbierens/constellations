import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ConstellationPage from './pages/ConstellationPage';
import NodeAddress from './components/NodeAddress';
import LogDialog from './components/LogDialog';
import PrototypeWarningDialog from './components/PrototypeWarningDialog';

function App() {
  const [showLogs, setShowLogs] = React.useState(false);
  const [showPrototype, setShowPrototype] = React.useState(false);

  const handlePrototypeClick = () => {
    localStorage.removeItem('prototypeWarningAccepted');
    setShowPrototype(true);
  };

  return (
    <Router>
      <nav
        className="win95-bar"
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={handlePrototypeClick}>Prototype</button>
          <button onClick={() => setShowLogs(true)} style={{ marginLeft: 'auto' }}>Logs</button>
        </div>
        {showLogs && (
          <LogDialogWrapper onClose={() => setShowLogs(false)} />
        )}
        {showPrototype && (
          <PrototypeWarningDialog open={showPrototype} onClose={() => setShowPrototype(false)} />
        )}
      </nav>
      <div className="win95-window">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/constellation/:id" element={<ConstellationPage />} />
        </Routes>
      </div>
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
