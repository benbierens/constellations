import React, { useEffect, useRef } from 'react';

type WebSocketMessageHandler = (msg: MessageEvent) => void;

export function withWebSocket<P>(
  WrappedComponent: React.ComponentType<P & { wsMessage: any }>,
  wsUrl: string = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/ws/'
) {
  return function WebSocketHOC(props: P) {
    const [wsMessage, setWsMessage] = React.useState<any>(null);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
      const ws = new window.WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (msg) => {
        setWsMessage(msg.data);
      };

      // Optionally handle open/close/error events here

    //   return () => {
    //     ws.close();
    //   };
    }, [wsUrl]);

    return <WrappedComponent {...props} wsMessage={wsMessage} />;
  };
}
