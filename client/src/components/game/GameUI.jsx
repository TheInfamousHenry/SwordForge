// src/components/game/GameUI.jsx
import React from 'react';

const GameUI = ({ stats }) => {
    const { health, maxHealth, resources, playerCount, enemyCount, position } = stats || {};

    const healthPercent = maxHealth > 0 ? (health / maxHealth) * 100 : 0;

    const getHealthColor = () => {
        if (healthPercent > 60) return 'bg-green-500';
        if (healthPercent > 30) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="w-full max-w-[820px] space-y-3">
            {/* Stats Bar */}
            <div className="bg-gray-800 rounded-lg p-4 border-2 border-gray-700 shadow-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    {/* Health */}
                    <div>
                        <div className="text-gray-400 text-xs mb-1">Health</div>
                        <div className="relative w-full h-6 bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`absolute top-0 left-0 h-full ${getHealthColor()} transition-all duration-300`}
                                style={{ width: `${healthPercent}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold">
                                {health}/{maxHealth}
                            </div>
                        </div>
                    </div>

                    {/* Resources */}
                    <div>
                        <div className="text-gray-400 text-xs mb-1">Resources</div>
                        <div className="flex items-center justify-center h-6">
                            <span className="text-2xl">💎</span>
                            <span className="text-white text-lg font-bold ml-2">{resources || 0}</span>
                        </div>
                    </div>

                    {/* Players */}
                    <div>
                        <div className="text-gray-400 text-xs mb-1">Players</div>
                        <div className="flex items-center justify-center h-6">
                            <span className="text-2xl">👥</span>
                            <span className="text-white text-lg font-bold ml-2">{playerCount || 0}</span>
                        </div>
                    </div>

                    {/* Enemies */}
                    <div>
                        <div className="text-gray-400 text-xs mb-1">Enemies</div>
                        <div className="flex items-center justify-center h-6">
                            <span className="text-2xl">👹</span>
                            <span className="text-white text-lg font-bold ml-2">{enemyCount || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls & Info */}
            <div className="bg-gray-800 rounded-lg p-4 border-2 border-gray-700 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Controls */}
                    <div>
                        <h3 className="text-white font-semibold mb-2 text-sm">🎮 Controls</h3>
                        <div className="space-y-1 text-xs text-gray-300">
                            <div><kbd className="px-2 py-1 bg-gray-700 rounded">WASD</kbd> or <kbd className="px-2 py-1 bg-gray-700 rounded">↑←↓→</kbd> Move</div>
                            <div><kbd className="px-2 py-1 bg-gray-700 rounded">SPACE</kbd> Attack</div>
                            <div>Walk over <span className="text-yellow-400">💎</span> to collect</div>
                        </div>
                    </div>

                    {/* Position */}
                    <div>
                        <h3 className="text-white font-semibold mb-2 text-sm">📍 Position</h3>
                        <div className="text-xs text-gray-300">
                            <div>X: <span className="text-blue-400 font-mono">{position?.x || 0}</span></div>
                            <div>Y: <span className="text-blue-400 font-mono">{position?.y || 0}</span></div>
                            <div className="mt-1 text-yellow-400">
                                ⚠️ Stay away from red zones!
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Phase Info */}
            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-3 border-2 border-blue-700/50 shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-bold text-sm">Phase 1d - Authentication Complete ✅</h3>
                        <p className="text-gray-300 text-xs">Real-time multiplayer with persistent user accounts</p>
                    </div>
                    <div className="text-3xl">⚔️</div>
                </div>
            </div>
        </div>
    );
};

export default GameUI;