import { useEffect, useState, useRef } from 'react';
import { useAppStore, useAuthStore } from '../lib/store';

export interface LogEntry {
  ts: string;
  level: string;
  stage: string;
  message: string;
  duration_ms?: number;
}

export function useWebSocket() {
  const sessionId = useAppStore(state => state.sessionId);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLogs([]);
      setIsConnected(false);
      if (wsRef.current) {
        wsRef.current.close();
      }
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NODE_ENV === 'development' ? 'localhost:8080' : window.location.host;
    const token = useAuthStore.getState().token;
    const ws = new WebSocket(`${protocol}//${host}/ws/log/${sessionId}?token=${token}`);
    
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLogs(prev => [...prev, data]);
      } catch (e) {
        console.error('Failed to parse WS msg', e);
      }
    };
    ws.onclose = () => setIsConnected(false);

    return () => {
      ws.close();
    };
  }, [sessionId]);

  return { logs, isConnected };
}
