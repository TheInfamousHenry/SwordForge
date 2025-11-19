
// client/src/components/duel/DuelInterface.jsx
import React, { useState } from 'react';
import Button from '../ui/Button';

const RESOURCE_ICONS = {
    IRON: '⚙️',
    STEEL: '🔩',
    STONE: '🪨',
    WOOD: '🪵',
    CRYSTAL: '💎',
    MYTHRIL: '✨'
};

const DuelInterface = ({
                           playerProgress,
                           onlinePlayers,
                           pendingChallenge,
                           onChallenge,
                           onAccept,
                           onDecline,
                           onClose
                       }) => {
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [wagerAmount, setWagerAmount] = useState(5);
    const [wagerResource, setWagerResource] = useState('IRON');

    const handleChallenge = () => {
        if (!selectedPlayer) {
            alert('Select a player to challenge!');
            return;
        }

        if ((playerProgress.resources[wagerResource] || 0) < wagerAmount) {
            alert('Not enough resources for wager!');
            return;
        }

        const wager = {
            resources: { [wagerResource]: wagerAmount }
        };

        onChallenge(selectedPlayer.id, wager);
        setSelectedPlayer(null);
    };

    // Filter out self from online players
    const challengeablePlayers = onlinePlayers.filter(p => p.id !== playerProgress.userId);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-900 to-orange-900 p-6 border-b-2 border-gray-700">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                                ⚔️ Duel Arena
                            </h2>
                            <p className="text-gray-300 mt-1">
                                Wins: {playerProgress.duelsWon} • Losses: {playerProgress.duelsLost}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-red-400 text-2xl transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Pending Challenge Notification */}
                {pendingChallenge && (
                    <div className="m-6 bg-yellow-900/50 border-2 border-yellow-500 rounded-lg p-6 animate-pulse">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-yellow-400 font-bold text-xl mb-2">
                                    🎯 Challenge Received!
                                </h3>
                                <p className="text-white mb-2">
                                    <span className="font-semibold">{pendingChallenge.challengerName}</span> challenges you to a duel!
                                </p>
                                <div className="text-gray-300 text-sm">
                                    <p>Wager:</p>
                                    {Object.entries(pendingChallenge.wager.resources).map(([type, amount]) => (
                                        <div key={type} className="text-yellow-400 font-semibold">
                                            {RESOURCE_ICONS[type]} {amount} {type}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => onAccept(pendingChallenge.id)}
                                    variant="success"
                                    size="medium"
                                >
                                    ✅ Accept
                                </Button>
                                <Button
                                    onClick={() => onDecline(pendingChallenge.id)}
                                    variant="danger"
                                    size="medium"
                                >
                                    ❌ Decline
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Players List */}
                        <div>
                            <h3 className="text-white font-semibold mb-4">👥 Online Players</h3>

                            {challengeablePlayers.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">👥</div>
                                    <p className="text-gray-400">No other players online</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {challengeablePlayers.map((player) => (
                                        <div
                                            key={player.id}
                                            onClick={() => setSelectedPlayer(player)}
                                            className={`bg-gray-700 rounded-lg p-4 cursor-pointer transition-all border-2 ${
                                                selectedPlayer?.id === player.id
                                                    ? 'border-red-500 bg-red-900/30'
                                                    : 'border-transparent hover:border-gray-500'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-white font-bold">
                                                        {player.username}
                                                    </h4>
                                                    <p className="text-gray-400 text-sm">
                                                        Level {player.level || 1}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-yellow-400 text-sm">
                                                        W: {player.duelsWon || 0}
                                                    </div>
                                                    <div className="text-red-400 text-sm">
                                                        L: {player.duelsLost || 0}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Challenge Setup */}
                        <div>
                            <h3 className="text-white font-semibold mb-4">⚔️ Challenge Setup</h3>

                            {selectedPlayer ? (
                                <div className="bg-gray-700 rounded-lg p-6 space-y-4">
                                    <div className="text-center pb-4 border-b border-gray-600">
                                        <p className="text-gray-400 text-sm mb-2">Challenging</p>
                                        <h4 className="text-white text-2xl font-bold">
                                            {selectedPlayer.username}
                                        </h4>
                                        <p className="text-gray-400 text-sm">
                                            Level {selectedPlayer.level || 1}
                                        </p>
                                    </div>

                                    {/* Wager Settings */}
                                    <div>
                                        <label className="block text-gray-300 text-sm font-semibold mb-2">
                                            Wager Resource
                                        </label>
                                        <select
                                            value={wagerResource}
                                            onChange={(e) => setWagerResource(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border-2 border-gray-600 focus:border-red-500 focus:outline-none"
                                        >
                                            {Object.keys(playerProgress.resources).map(type => (
                                                <option key={type} value={type}>
                                                    {RESOURCE_ICONS[type]} {type} (You have: {playerProgress.resources[type]})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-gray-300 text-sm font-semibold mb-2">
                                            Wager Amount
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={playerProgress.resources[wagerResource] || 0}
                                            value={wagerAmount}
                                            onChange={(e) => setWagerAmount(parseInt(e.target.value) || 1)}
                                            className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border-2 border-gray-600 focus:border-red-500 focus:outline-none"
                                        />
                                        <p className="text-gray-400 text-xs mt-1">
                                            Available: {playerProgress.resources[wagerResource] || 0}
                                        </p>
                                    </div>

                                    {/* Prize Display */}
                                    <div className="bg-gray-800 rounded-lg p-4 border-2 border-yellow-500">
                                        <p className="text-gray-400 text-sm mb-2">Winner takes:</p>
                                        <div className="text-yellow-400 text-2xl font-bold">
                                            {RESOURCE_ICONS[wagerResource]} {wagerAmount * 2} {wagerResource}
                                        </div>
                                        <p className="text-gray-500 text-xs mt-1">
                                            (Both players wager {wagerAmount})
                                        </p>
                                    </div>

                                    {/* Challenge Button */}
                                    <Button
                                        onClick={handleChallenge}
                                        variant="danger"
                                        fullWidth
                                        disabled={(playerProgress.resources[wagerResource] || 0) < wagerAmount}
                                    >
                                        ⚔️ Send Challenge
                                    </Button>

                                    <Button
                                        onClick={() => setSelectedPlayer(null)}
                                        variant="secondary"
                                        fullWidth
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">⚔️</div>
                                    <p className="text-gray-400">
                                        Select a player to challenge
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Rules Section */}
                    <div className="mt-8 bg-gray-700 rounded-lg p-6">
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                            📜 Duel Rules
                        </h3>
                        <ul className="text-gray-300 text-sm space-y-2">
                            <li className="flex items-start">
                                <span className="mr-2">⚔️</span>
                                <span>Both players must wager equal resources</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">🎯</span>
                                <span>First player to reduce opponent's health to 0 wins</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">💰</span>
                                <span>Winner takes both wagers</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">🏆</span>
                                <span>Lower level players can challenge higher levels for a chance at better rewards</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">⏱️</span>
                                <span>Challenges expire after 1 minute</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DuelInterface;