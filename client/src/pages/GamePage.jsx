// src/pages/GamePage.jsx
import React, { useState } from 'react';
import PhaserGame from '../components/game/PhaserGame';
import GameUI from '../components/game/GameUI';
import Minimap from '../components/game/Minimap';
import Button from '../components/ui/Button';

const GamePage = ({ onLeaveGame, playerName, user }) => {
    const [gameStats, setGameStats] = useState({
        health: 100,
        maxHealth: 100,
        resources: 0,
        playerCount: 0,
        enemyCount: 0,
        position: { x: 0, y: 0 }
    });

    const [minimapData, setMinimapData] = useState({
        localPlayer: null,
        otherPlayers: [],
        enemies: [],
        worldSize: 3000,
        borderThickness: 200
    });

    const handleStatsUpdate = (stats) => {
        setGameStats(stats);
    };

    const handleMinimapUpdate = (data) => {
        setMinimapData(data);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
            {/* Header with Leave button */}
            <div className="mb-4 flex justify-between items-center w-full max-w-[820px]">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        ⚔️ SwordForge
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Playing as: <span className="text-blue-400">{playerName || user.username}</span>
                    </p>
                </div>
                <Button onClick={onLeaveGame} variant="danger" size="small">
                    Leave Game
                </Button>
            </div>

            {/* Game Canvas and Minimap Container */}
            <div className="flex gap-4 items-start">
                <PhaserGame
                    playerName={playerName || user.username}
                    user={user}
                    onStatsUpdate={handleStatsUpdate}
                    onMinimapUpdate={handleMinimapUpdate}
                />

                {/* Minimap - positioned next to game */}
                <div className="hidden lg:block">
                    <Minimap
                        localPlayer={minimapData.localPlayer}
                        otherPlayers={minimapData.otherPlayers}
                        enemies={minimapData.enemies}
                        worldSize={minimapData.worldSize}
                        borderThickness={minimapData.borderThickness}
                        size={150}
                    />
                </div>
            </div>

            {/* Game UI Stats */}
            <div className="mt-4 w-full max-w-[820px]">
                <GameUI stats={gameStats} />
            </div>
        </div>
    );
};

export default GamePage;