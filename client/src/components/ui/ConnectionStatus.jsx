// src/components/ui/ConnectionStatus.jsx
import React from 'react';

const ConnectionStatus = ({ isConnected, error, showDetails = false }) => {
    if (error) {
        return (
            <div className="bg-red-900/50 border-2 border-red-500 text-red-200 px-4 py-3 rounded-lg shadow-lg animate-pulse">
                <div className="flex items-center">
                    <span className="text-2xl mr-3">⚠️</span>
                    <div>
                        <div className="font-semibold">Connection Error</div>
                        {showDetails && <div className="text-sm mt-1">{error}</div>}
                    </div>
                </div>
            </div>
        );
    }

    if (!isConnected) {
        return (
            <div className="bg-yellow-900/50 border-2 border-yellow-500 text-yellow-200 px-4 py-3 rounded-lg shadow-lg">
                <div className="flex items-center">
                    <div className="animate-spin text-2xl mr-3">🔄</div>
                    <div>
                        <div className="font-semibold">Connecting to server...</div>
                        {showDetails && <div className="text-sm mt-1">Please wait</div>}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-green-900/50 border-2 border-green-500 text-green-200 px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-center">
                <span className="text-2xl mr-3">✅</span>
                <div>
                    <div className="font-semibold">Connected to server</div>
                    {showDetails && (
                        <div className="text-sm mt-1">
                            Real-time multiplayer active
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConnectionStatus;