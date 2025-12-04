'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './useApi';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3334';

interface WebSocketMessage {
  event: string;
  data: unknown;
  timestamp: string;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected to CCG API');
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);

          // Invalidate relevant queries based on event type
          if (message.event.startsWith('memory:')) {
            queryClient.invalidateQueries({ queryKey: queryKeys.memories });
            queryClient.invalidateQueries({ queryKey: queryKeys.memorySummary });
          } else if (message.event.startsWith('task:') || message.event.startsWith('workflow:')) {
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
            queryClient.invalidateQueries({ queryKey: queryKeys.currentTask });
          } else if (message.event.startsWith('guard:')) {
            queryClient.invalidateQueries({ queryKey: queryKeys.guardStatus });
            queryClient.invalidateQueries({ queryKey: queryKeys.guardRules });
          } else if (message.event.startsWith('documents:')) {
            queryClient.invalidateQueries({ queryKey: queryKeys.documents });
          } else if (message.event.startsWith('process:')) {
            queryClient.invalidateQueries({ queryKey: queryKeys.processes });
          }

          // Always refresh status on any change
          queryClient.invalidateQueries({ queryKey: queryKeys.status });
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');

        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 5000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [queryClient]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    connect,
    disconnect,
  };
}

// Hook to subscribe to specific events
export function useWebSocketEvent(
  eventPattern: string,
  callback: (data: unknown) => void
) {
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage && lastMessage.event.startsWith(eventPattern)) {
      callback(lastMessage.data);
    }
  }, [lastMessage, eventPattern, callback]);
}
