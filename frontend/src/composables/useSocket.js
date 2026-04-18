import { io } from 'socket.io-client';
import { apiUrl } from '../utils/backendUrl';

export function createSocket(defaultUrl = null) {
  let socket = null;

  function buildUrls() {
    const url = defaultUrl || apiUrl('');
    return url ? [url] : [];
  }

  function connect(userId, handlers = {}, token = null) {
    const urls = buildUrls();
    let idx = 0;

    const tryConnect = () => {
      if (idx >= urls.length) {
        const err = new Error('No backend reachable');
        console.error(err);
        if (handlers.connect_error) handlers.connect_error(err);
        return;
      }

      const url = urls[idx++];
      console.log('Attempting socket connect to', url);

      if (socket) {
        try { socket.disconnect(); } catch (e) { /* ignore */ }
        socket = null;
      }

      socket = io(url, {
        auth: { token },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 800,
        reconnectionDelayMax: 2500
      });

      const onConnect = () => {
        console.log('Socket connected to', url, socket.id);
        if (userId) socket.emit('join', String(userId));
        if (handlers.connect) handlers.connect(socket.id);

        socket.on('disconnect', (reason) => {
          if (handlers.disconnect) handlers.disconnect(reason);
        });

        socket.on('connect_error', (err) => {
          if (handlers.connect_error) handlers.connect_error(err);
        });

        // Register all provided handlers except lifecycle events
        Object.entries(handlers).forEach(([event, cb]) => {
          if (!cb || typeof cb !== 'function') return;
          if (['connect', 'disconnect', 'connect_error'].includes(event)) return;
          socket.on(event, cb);
        });
      };

      const onConnectError = (err) => {
        console.warn(`connect_error connecting to ${url}`, err && err.message);
        socket.close();
        tryConnect();
      };

      socket.once('connect', onConnect);
      socket.once('connect_error', onConnectError);
    };

    tryConnect();
    return socket;
  }

  function on(event, cb) { if (socket) socket.on(event, cb); }
  function off(event, cb) { if (socket) socket.off(event, cb); }
  function emit(event, payload, ack) { if (socket) socket.emit(event, payload, ack); }
  function disconnect() { if (socket) socket.disconnect(); socket = null; }

  return { connect, on, off, emit, disconnect, get socket() { return socket; } };
}
