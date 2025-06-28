const websockMessages = {
  onConstellationsChanged: "constellationsChanged",
  onPathsChanged: "pathsChanged",
  onPropertiesChanged: "propertiesChanged",
  onDataChanged: "dataChanged",
};

export class WebsocketCallbacks {
  constructor(wss) {
    this.clients = new Set();

    wss.on("connection", (ws) => {
      clients.add(ws);
      ws.on("close", () => {
        clients.delete(ws);
      });
    });
  }

  sendConstellationsChanged = () => {
    this._sendToAll(websockMessages.onConstellationsChanged);
  };

  sendPathsChanged = (id, starId) => {
    this._sendToAll(`${websockMessages.onPathsChanged}/${id}/${starId}`);
  };

  sendPropertiesChanged = (id, starId) => {
    this._sendToAll(`${websockMessages.onPropertiesChanged}/${id}/${starId}`);
  };

  sendDataChanged = (id, starId) => {
    this._sendToAll(`${websockMessages.onDataChanged}/${id}/${starId}`);
  };

  _sendToAll = (msg) => {
    for (const ws of clients) {
      if (ws.readyState === ws.OPEN) {
        ws.send(msg);
      }
    }
  };
}
