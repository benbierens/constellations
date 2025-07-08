import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const win95Style = `
  html, body {
    font-family: 'MS Sans Serif', 'Tahoma', 'Geneva', sans-serif;
    font-size: 15px;
    background: #008080;
    color: #000;
    margin: 0;
    padding: 0;
    height: 100%;
  }
  #root {
    min-height: 100vh;
  }
  button, input, select, textarea {
    font-family: inherit;
    font-size: 15px;
    background: #dfdfdf;
    border: 2px outset #fff;
    padding: 2px 8px;
    margin: 2px 0;
    box-sizing: border-box;
    color: #000;
    outline: none;
  }
  button:active, input:active, select:active, textarea:active {
    border: 2px inset #fff;
  }
  button:disabled {
    color: #888;
    background: #eaeaea;
    border: 2px outset #fff;
    cursor: not-allowed;
  }
  nav, .win95-bar {
    background: #c0c0c0;
    border-bottom: 2px solid #fff;
    box-shadow: 0 2px 0 #808080;
    padding: 4px 8px;
    margin-bottom: 8px;
  }
  .win95-window {
    background: #c0c0c0;
    border: 2px solid #fff;
    box-shadow: 2px 2px 0 #808080, 4px 4px 0 #000;
    padding: 16px;
    margin: 16px auto;
    max-width: 700px;
    min-width: 320px;
    border-radius: 0;
  }
  .win95-title {
    background: linear-gradient(90deg, #000080 80%, #1084d0 100%);
    color: #fff;
    font-weight: bold;
    padding: 4px 8px;
    margin: -16px -16px 16px -16px;
    font-size: 18px;
    letter-spacing: 1px;
    border-bottom: 2px solid #fff;
  }
  .win95-modal {
    background: #c0c0c0;
    border: 2px solid #fff;
    box-shadow: 4px 4px 0 #808080, 8px 8px 0 #000;
    padding: 24px;
    border-radius: 0;
    min-width: 320px;
    max-width: 600px;
    font-size: 15px;
  }
  .win95-list {
    background: #fff;
    border: 2px inset #fff;
    padding: 8px;
    margin: 8px 0;
    font-size: 15px;
  }
  .win95-input {
    border: 2px inset #fff;
    background: #fff;
    padding: 2px 6px;
    font-size: 15px;
    color: #000;
    margin: 2px 0;
  }
`;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <style>{win95Style}</style>
    <App />
  </React.StrictMode>
);
