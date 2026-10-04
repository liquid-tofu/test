import { WebSocketMessage, UserPresence } from '../types';

type MessageHandler = (msg: WebSocketMessage) => void;
type StatusHandler = (status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected', latencyMs: number) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<StatusHandler> = new Set();
  private reconnectTimer: any = null;
  private pingTimer: any = null;
  private pingStartTime = 0;
  private latency = 0;
  private status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected' = 'disconnected';
  public clientId = '';

  constructor() {
    // will be initialized explicitly
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus(this.status === 'disconnected' ? 'connecting' : 'reconnecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus('connected');
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: WebSocketMessage = JSON.parse(event.data);
          if (msg.type === 'init' && msg.payload?.clientId) {
            this.clientId = msg.payload.clientId;
          }
          if (msg.type === 'pong') {
            this.latency = Math.max(1, Math.round(Date.now() - this.pingStartTime));
            this.notifyStatus();
          }
          this.messageHandlers.forEach(handler => handler(msg));
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      this.ws.onclose = () => {
        this.setStatus('disconnected');
        this.cleanupTimers();
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket encountered error:', err);
        this.ws?.close();
      };
    } catch (err) {
      console.error('Failed to initiate WebSocket connection:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2500);
  }

  private startHeartbeat() {
    this.cleanupTimers();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.pingStartTime = Date.now();
        this.send({ type: 'ping' });
      }
    }, 15000);
  }

  private cleanupTimers() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private setStatus(status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected') {
    this.status = status;
    this.notifyStatus();
  }

  private notifyStatus() {
    this.statusHandlers.forEach(handler => handler(this.status, this.latency));
  }

  public send(msg: Partial<WebSocketMessage>) {
    const fullMsg: WebSocketMessage = {
      type: msg.type!,
      senderId: this.clientId,
      payload: msg.payload,
    };
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(fullMsg));
    }
  }

  public updatePresence(presence: Partial<UserPresence>) {
    this.send({
      type: 'presence:update',
      payload: presence,
    });
  }

  public onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  public onStatusChange(handler: StatusHandler) {
    this.statusHandlers.add(handler);
    handler(this.status, this.latency);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  public disconnect() {
    this.cleanupTimers();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsService = new WebSocketClient();
