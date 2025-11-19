// client/src/pages/HomePage.jsx - UPDATED FOR PHASE 2
import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import ForgeInterface from '../components/crafting/ForgeInterface';
import InventoryInterface from '../components/inventory/InventoryInterface';
import ShopInterface from '../components/trading/ShopInterface';
import DuelInterface from '../components/duel/DuelInterface';
import { io } from 'socket.io-client';

const HomePage = ({ onStartGame, onJoinLobby, onLogout, playerName, setPlayerName, user }) => {
    const [showForge, setShowForge] = useState(false);
    const [showInventory, setShowInventory] = useState(false);
    const [showShop, setShowShop] = useState(false);
    const [showDuel, setShowDuel] = useState(false);

    // Get fresh user data from localStorage (which gets updated on login)
    const getUserFromStorage = () => {
        try {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : user;
        } catch {
            return user;
        }
    };

    const freshUser = getUserFromStorage();

    const [playerProgress, setPlayerProgress] = useState({
        userId: freshUser.id,
        level: freshUser.level || 1,
        experience: freshUser.experience || 0,
        resources: freshUser.resources || {
            IRON: 20,
            STEEL: 5,
            STONE: 10,
            WOOD: 15,
            CRYSTAL: 2,
            MYTHRIL: 0
        },
        inventory: freshUser.inventory || [],
        equippedSword: freshUser.equippedSword || null,
        forgeLevel: freshUser.forgeLevel || 1,
        totalForges: freshUser.totalForges || 0,
        duelsWon: freshUser.duelsWon || 0,
        duelsLost: freshUser.duelsLost || 0,
        swordOwnership: freshUser.swordOwnership || {
            BASIC_SWORD: false,
            REFINED_SWORD: false,
            ENHANCED_SWORD: false,
            MASTERWORK_SWORD: false
        }
    });

    const [shopOffers, setShopOffers] = useState([]);
    const [onlinePlayers, setOnlinePlayers] = useState([]);
    const [pendingDuelChallenge, setPendingDuelChallenge] = useState(null);
    const [socket, setSocket] = useState(null);

    // Connect to progression socket
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        console.log('🔌 Connecting to progression socket with token:', token ? 'Present' : 'Missing');

        // Connect to MAIN namespace (not /progression)
        const progressSocket = io('http://localhost:3000', {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        progressSocket.on('connect', () => {
            console.log('✅ Progression socket connected:', progressSocket.id);
        });

        progressSocket.on('connect_error', (error) => {
            console.error('❌ Progression socket connection error:', error.message);
        });

        progressSocket.on('disconnect', (reason) => {
            console.log('🔌 Progression socket disconnected:', reason);
        });
        progressSocket.on('initialProgress', (data) => {
            console.log('📊 Initial progress received from server:', data);
            setPlayerProgress(prev => ({
                ...prev,
                level: data.level,
                experience: data.experience,
                resources: data.resources,
                inventory: data.inventory,
                equippedSword: data.equippedSword,
                forgeLevel: data.forgeLevel,
                totalForges: data.totalForges,
                duelsWon: data.duelsWon,
                duelsLost: data.duelsLost,
                swordOwnership: data.swordOwnership
            }));
        });

        setSocket(progressSocket);

        progressSocket.on('progressUpdate', (data) => {
            console.log('📊 Progress update received:', data);
            setPlayerProgress(prev => ({ ...prev, ...data }));
        });

        setSocket(progressSocket);

        progressSocket.on('shopOffersUpdate', (offers) => {
            console.log('🏪 Shop offers update:', offers.length);
            setShopOffers(offers);
        });

        progressSocket.on('onlinePlayersUpdate', (players) => {
            console.log('👥 Online players update:', players.length);
            setOnlinePlayers(players);
        });

        progressSocket.on('duelChallenge', (challenge) => {
            console.log('⚔️ Duel challenge received:', challenge);
            setPendingDuelChallenge(challenge);
        });

        progressSocket.on('duelAccepted', (duel) => {
            alert(`${duel.targetName} accepted your duel challenge! Starting duel...`);
            onStartGame();
        });

        progressSocket.on('duelDeclined', (data) => {
            alert(`${data.targetName} declined your duel challenge`);
        });

        return () => {
            console.log('🔌 Disconnecting progression socket');
            progressSocket.disconnect();
        };
    }, []);

    // Crafting handlers
    const handleCraft = async (recipeKey) => {
        console.log('📡 Sending craft request to server:', recipeKey);
        console.log('Socket connected?', socket?.connected);

        if (!socket || !socket.connected) {
            console.error('❌ Socket not connected!');
            return { success: false, reason: 'Not connected to server' };
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Craft request timed out'));
            }, 5000);

            socket.emit('craftSword', { recipeKey }, (response) => {
                clearTimeout(timeout);
                console.log('📨 Server response:', response);

                if (response.success) {
                    console.log('✅ Craft successful, updating state');
                    setPlayerProgress(prev => ({
                        ...prev,
                        resources: response.resources,
                        inventory: response.inventory,
                        level: response.level,
                        experience: response.experience,
                        totalForges: prev.totalForges + 1,
                        swordOwnership: response.swordOwnership
                    }));
                } else {
                    console.error('❌ Craft failed:', response.reason);
                }
                resolve(response);
            });
        });
    };

    // Inventory handlers
    const handleEquipSword = (swordId) => {
        socket.emit('equipSword', { swordId }, (response) => {
            if (response.success) {
                setPlayerProgress(prev => ({
                    ...prev,
                    equippedSword: swordId
                }));
            }
        });
    };

    const handleRepairSword = (swordId) => {
        socket.emit('repairSword', { swordId }, (response) => {
            if (response.success) {
                setPlayerProgress(prev => ({
                    ...prev,
                    inventory: response.inventory,
                    resources: response.resources
                }));
                alert('Sword repaired! Cost: 5 Iron');
            } else {
                alert(response.reason);
            }
        });
    };

    // Shop handlers
    const handleCreateOffer = (resourceType, amount, pricePerUnit) => {
        socket.emit('createOffer', { resourceType, amount, pricePerUnit }, (response) => {
            if (response.success) {
                alert('Offer created successfully!');
            } else {
                alert(response.reason);
            }
        });
    };

    const handleBuyOffer = (offerId) => {
        socket.emit('buyOffer', { offerId }, (response) => {
            if (response.success) {
                alert('Purchase successful!');
                setPlayerProgress(prev => ({
                    ...prev,
                    resources: response.resources
                }));
            } else {
                alert(response.reason);
            }
        });
    };

    const handleCancelOffer = (offerId) => {
        socket.emit('cancelOffer', { offerId }, (response) => {
            if (response.success) {
                alert('Offer cancelled');
            }
        });
    };

    // Duel handlers
    const handleChallenge = (targetId, wager) => {
        socket.emit('challengeDuel', { targetId, wager }, (response) => {
            if (response.success) {
                alert('Challenge sent! Waiting for response...');
            } else {
                alert(response.reason);
            }
        });
    };

    const handleAcceptDuel = (challengeId) => {
        socket.emit('acceptDuel', { challengeId }, (response) => {
            if (response.success) {
                setPendingDuelChallenge(null);
                alert('Duel accepted! Starting battle...');
                onStartGame(); // Navigate to game with duel mode
            }
        });
    };

    const handleDeclineDuel = (challengeId) => {
        socket.emit('declineDuel', { challengeId });
        setPendingDuelChallenge(null);
    };

    const getNextLevelXP = () => {
        return playerProgress.level * 100 + Math.pow(playerProgress.level, 2) * 50;
    };

    const xpPercent = (playerProgress.experience / getNextLevelXP()) * 100;

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
            {/* Logout button */}
            <div className="absolute top-4 right-4 z-10">
                <Button onClick={onLogout} variant="secondary" size="small">
                    🚪 Logout
                </Button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <Header />

                <div className="max-w-5xl w-full space-y-6">
                    {/* Player Stats Card */}
                    <div className="bg-gray-800 rounded-lg shadow-2xl p-6 border-2 border-gray-700">
                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Player Info */}
                            <div className="md:col-span-2">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="text-5xl">⚔️</div>
                                    <div>
                                        <h2 className="text-white text-2xl font-bold">{user.username}</h2>
                                        <p className="text-gray-400">Level {playerProgress.level} Warrior</p>
                                    </div>
                                </div>

                                {/* XP Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                                        <span>Experience</span>
                                        <span>{playerProgress.experience} / {getNextLevelXP()}</span>
                                    </div>
                                    <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                                            style={{ width: `${xpPercent}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-gray-700 rounded p-3 text-center">
                                        <div className="text-yellow-400 text-2xl font-bold">{playerProgress.totalForges}</div>
                                        <div className="text-gray-400 text-xs">Forges</div>
                                    </div>
                                    <div className="bg-green-900/30 rounded p-3 text-center border border-green-500">
                                        <div className="text-green-400 text-2xl font-bold">{playerProgress.duelsWon}</div>
                                        <div className="text-gray-400 text-xs">Wins</div>
                                    </div>
                                    <div className="bg-red-900/30 rounded p-3 text-center border border-red-500">
                                        <div className="text-red-400 text-2xl font-bold">{playerProgress.duelsLost}</div>
                                        <div className="text-gray-400 text-xs">Losses</div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Resources */}
                            <div>
                                <h3 className="text-white font-semibold mb-3">📦 Resources</h3>
                                <div className="space-y-2">
                                    {Object.entries(playerProgress.resources).slice(0, 4).map(([type, amount]) => (
                                        <div key={type} className="flex justify-between items-center bg-gray-700 rounded px-3 py-2">
                                            <span className="text-gray-300 text-sm">{type}</span>
                                            <span className="text-white font-bold">{amount}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons Grid */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Game Actions */}
                        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 border-2 border-gray-700">
                            <h3 className="text-white font-bold text-xl mb-4">🎮 Game</h3>
                            <div className="space-y-3">
                                <Button onClick={onStartGame} variant="primary" fullWidth>
                                    🎮 Quick Play
                                </Button>
                                <Button onClick={onJoinLobby} variant="secondary" fullWidth>
                                    🚪 Join Lobby
                                </Button>
                            </div>
                        </div>

                        {/* Progression Actions */}
                        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 border-2 border-gray-700">
                            <h3 className="text-white font-bold text-xl mb-4">⚒️ Progression</h3>
                            <div className="space-y-3">
                                <Button onClick={() => setShowForge(true)} variant="danger" fullWidth>
                                    🔥 The Forge
                                </Button>
                                <Button onClick={() => setShowInventory(true)} variant="success" fullWidth>
                                    🎒 Inventory
                                </Button>
                            </div>
                        </div>

                        {/* Trading Actions */}
                        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 border-2 border-gray-700">
                            <h3 className="text-white font-bold text-xl mb-4">💰 Trading</h3>
                            <div className="space-y-3">
                                <Button onClick={() => setShowShop(true)} variant="success" fullWidth>
                                    🏪 Trading Post
                                </Button>
                                <div className="text-gray-400 text-xs text-center">
                                    {shopOffers.length} active offers
                                </div>
                            </div>
                        </div>

                        {/* Duel Actions */}
                        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 border-2 border-gray-700 relative">
                            <h3 className="text-white font-bold text-xl mb-4">⚔️ Duels</h3>
                            {pendingDuelChallenge && (
                                <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold animate-bounce">
                                    !
                                </div>
                            )}
                            <div className="space-y-3">
                                <Button onClick={() => setShowDuel(true)} variant="danger" fullWidth>
                                    ⚔️ Challenge Players
                                </Button>
                                <div className="text-gray-400 text-xs text-center">
                                    {onlinePlayers.length} players online
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Phase Info */}
                    <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-4 border-2 border-purple-700/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-white font-bold">Phase 2 - Progression & Crafting ✅</h3>
                                <p className="text-gray-300 text-sm">
                                    Forge weapons, trade resources, and challenge players to duels!
                                </p>
                            </div>
                            <div className="text-4xl">⚒️</div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />

            {/* Modals */}
            {showForge && (
                <ForgeInterface
                    playerProgress={playerProgress}
                    onCraft={handleCraft}
                    onClose={() => setShowForge(false)}
                />
            )}

            {showInventory && (
                <InventoryInterface
                    playerProgress={playerProgress}
                    onEquip={handleEquipSword}
                    onRepair={handleRepairSword}
                    onClose={() => setShowInventory(false)}
                />
            )}

            {showShop && (
                <ShopInterface
                    playerProgress={playerProgress}
                    offers={shopOffers}
                    onCreateOffer={handleCreateOffer}
                    onBuyOffer={handleBuyOffer}
                    onCancelOffer={handleCancelOffer}
                    onClose={() => setShowShop(false)}
                />
            )}

            {showDuel && (
                <DuelInterface
                    playerProgress={playerProgress}
                    onlinePlayers={onlinePlayers}
                    pendingChallenge={pendingDuelChallenge}
                    onChallenge={handleChallenge}
                    onAccept={handleAcceptDuel}
                    onDecline={handleDeclineDuel}
                    onClose={() => setShowDuel(false)}
                />
            )}
        </div>
    );
};

export default HomePage;