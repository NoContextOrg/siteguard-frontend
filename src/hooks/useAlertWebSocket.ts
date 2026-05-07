import { useEffect } from 'react';
import { connectAlertWebSocket, disconnectAlertWebSocket } from '../api/websocket';
import type { WsConnectionParams } from '../api/websocket';
import type { AlertDTO } from '../api/alert';

/**
 * Custom hook to establish and manage the Alert WebSocket connection.
 * 
 * @param params Connection parameters (role, personCode, teamId)
 * @param onAlert Callback triggered when a new alert arrives
 * @param enabled Toggle to conditionally connect/disconnect
 */
export const useAlertWebSocket = (
  params: WsConnectionParams,
  onAlert: (alert: AlertDTO) => void,
  enabled: boolean = true
) => {
  useEffect(() => {
    // Only attempt connection if enabled and we have the bare minimum backend requirements
    if (!enabled || !params.role || !params.personCode) {
      return;
    }

    // Connect to WebSocket using the params
    connectAlertWebSocket(params, onAlert);

    // Cleanup unmount: close connection
    return () => {
      disconnectAlertWebSocket();
    };
  }, [
    enabled, 
    params.role, 
    params.personCode, 
    params.teamId, 
    // If your onAlert wrapper isn't wrapped in useCallback, you might want to omit it from deps
    onAlert 
  ]);
};