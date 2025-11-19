// src/hooks/useSocket.jsx
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

/**
 * Custom hook for managing Socket.io connection with authentication
 * @param {string} url - Server URL (empty string for same domain)
 * @param {object} options - Socket.io options
 * @returns {object} - { socket, isConnected, error, connect, disconnect }
 */
const useSocket = (url = '', options = {}) => {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState('');
    const socketRef = useRef(null);

    useEffect(() => {
        // Get auth token from localStorage
        const token = localStorage.getItem('authToken');

        if (!token) {
            setError('Authentication required');
            return;
        }

        // Create socket connection with auth
        const socket = io(url, {
            auth: { token },
            ...options
        });

        socketRef.current = socket;

        // Connection event handlers
        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            setIsConnected(true);
            setError('');
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            setIsConnected(false);

            if (reason === 'io server disconnect') {
                // Server disconnected the socket - likely auth issue
                setError('Disconnected by server. Please log in again.');
            }
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            setError(`Connection failed: ${err.message}`);
            setIsConnected(false);
        });

        socket.on('error', (err) => {
            console.error('Socket error:', err);
            setError(err.message || 'Socket error occurred');
        });

        // Cleanup on unmount
        return () => {
            if (socket) {
                socket.disconnect();
                socketRef.current = null;
            }
        };
    }, [url, options]);

    // Manual connect function
    const connect = () => {
        if (socketRef.current && !socketRef.current.connected) {
            socketRef.current.connect();
        }
    };

    // Manual disconnect function
    const disconnect = () => {
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.disconnect();
        }
    };

    return {
        socket: socketRef.current,
        isConnected,
        error,
        connect,
        disconnect
    };
};

export default useSocket;

/**
 * Usage example:
 *
 * const MyComponent = () => {
 *   const { socket, isConnected, error } = useSocket();
 *
 *   useEffect(() => {
 *     if (!socket) return;
 *
 *     socket.on('gameState', (data) => {
 *       console.log('Game state:', data);
 *     });
 *
 *     socket.emit('playerMove', { x: 100, y: 200 });
 *
 *     return () => {
 *       socket.off('gameState');
 *     };
 *   }, [socket]);
 *
 *   if (error) return <div>Error: {error}</div>;
 *   if (!isConnected) return <div>Connecting...</div>;
 *
 *   return <div>Connected!</div>;
 * };
 */