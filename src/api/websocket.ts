/**
 * WebSocket API Service for Real-time Alerts
 * Aligns with backend com.nocontext.siteguard.service.AlertWebSocketHandler
 */
import type { AlertDTO } from './alert';
import { WS_ENDPOINTS } from './config';

export interface WsConnectionParams {
  role: string;
  personCode: string;
  teamId?: number | null;
}

let socket: WebSocket | null = null;

export const connectAlertWebSocket = (
  params: WsConnectionParams,
  onAlertReceived: (alert: AlertDTO) => void
): WebSocket => {
  // Disconnect existing socket to prevent multiple active connections
  if (socket && socket.readyState !== WebSocket.CLOSED) {
    socket.close();
  }

  const query = new URLSearchParams();
  if (params.role) query.append('role', params.role);
  if (params.personCode) query.append('personCode', params.personCode);
  if (params.teamId) query.append('teamId', String(params.teamId));

  const url = `${WS_ENDPOINTS.alerts}?${query.toString()}`;
  socket = new WebSocket(url);

  socket.onopen = () => {
    console.log('✅ [WS] Connected to alerts stream:', url);
  };

  socket.onmessage = (event) => {
    try {
      const alert: AlertDTO = JSON.parse(event.data);
      console.log('🔔 [WS] Alert Received:', alert);
      onAlertReceived(alert);
    } catch (error) {
      console.error('❌ [WS] Failed to parse WebSocket message:', error);
    }
  };

  socket.onerror = (error) => console.error('❌ [WS] Error:', error);
  socket.onclose = (event) => console.log('🚪 [WS] Disconnected:', event.reason);

  return socket;
};

export const disconnectAlertWebSocket = (): void => {
  if (socket) socket.close();
  socket = null;
};

// ===== Exported WebSocket URLs for Dashboard Usage =====
export const getWebSocketUrls = () => WS_ENDPOINTS;