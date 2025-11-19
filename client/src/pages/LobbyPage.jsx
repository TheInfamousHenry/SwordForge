// src/pages/LobbyPage.jsx
import React from 'react';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';

const LobbyPage = ({ onStartGame, onBack, playerName }) => {
    // Future: Add lobby functionality, player list, room selection, etc.

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
            <Header />

            <div className="max-w-2xl w-full bg-gray-800 rounded-lg shadow-2xl p-8 border-2 border-gray-700">
                <h2 className="text-3xl font-bold text-white mb-6">Game Lobby</h2>

                <div className="bg-gray-700 rounded-lg p-6 mb-6">
                    <p className="text-gray-300 mb-2">
                        <strong>Player:</strong> {playerName}
                    </p>
                    <p className="text-gray-400 text-sm">
                        Lobby system coming in Phase 2! For now, use Quick Play.
                    </p>
                </div>

                <div className="space-y-3">
                    <Button onClick={onStartGame} variant="primary" fullWidth>
                        🎮 Start Game
                    </Button>
                    <Button onClick={onBack} variant="secondary" fullWidth>
                        ← Back to Menu
                    </Button>
                </div>

                <div className="mt-8 p-4 bg-gray-700 rounded-lg">
                    <h3 className="text-white font-semibold mb-3">Coming Soon:</h3>
                    <ul className="text-gray-400 text-sm space-y-1">
                        <li>• Private rooms with codes</li>
                        <li>• Player ready system</li>
                        <li>• Team selection</li>
                        <li>• Game mode selection</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default LobbyPage;