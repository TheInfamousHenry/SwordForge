// client/src/components/inventory/InventoryInterface.jsx
import React, { useState } from 'react';
import Button from '../ui/Button';

const RECIPES = {
    BASIC_SWORD: { name: 'Basic Iron Sword' },
    REFINED_SWORD: { name: 'Refined Steel Sword' },
    ENHANCED_SWORD: { name: 'Enhanced Crystal Sword' },
    MASTERWORK_SWORD: { name: 'Masterwork Mythril Sword' }
};
const TIER_COLORS = {
    BASIC: 'border-gray-500 bg-gray-700',
    REFINED: 'border-green-500 bg-green-900/30',
    ENHANCED: 'border-blue-500 bg-blue-900/30',
    MASTERWORK: 'border-purple-500 bg-purple-900/30'
};

const TIER_ICONS = {
    BASIC: '🗡️',
    REFINED: '⚔️',
    ENHANCED: '🔷',
    MASTERWORK: '✨'
};

const InventoryInterface = ({ playerProgress, onEquip, onRepair, onClose }) => {
    const [selectedSword, setSelectedSword] = useState(null);
    const [view, setView] = useState('swords'); // 'swords' or 'resources'

    const getSwordCondition = (sword) => {
        const percent = (sword.durability / sword.stats.durability) * 100;
        if (percent >= 80) return { text: 'Excellent', color: 'text-green-400' };
        if (percent >= 50) return { text: 'Good', color: 'text-yellow-400' };
        if (percent >= 25) return { text: 'Damaged', color: 'text-orange-400' };
        return { text: 'Broken', color: 'text-red-400' };
    };

    const handleEquip = (swordId) => {
        onEquip(swordId);
        setSelectedSword(null);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-6 border-b-2 border-gray-700">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                                🎒 Inventory
                            </h2>
                            <p className="text-gray-300 mt-1">
                                Level {playerProgress.level} • {playerProgress.inventory.length} Swords
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-red-400 text-2xl transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* View Tabs */}
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => setView('swords')}
                            className={`px-4 py-2 rounded font-semibold transition-colors ${
                                view === 'swords'
                                    ? 'bg-white text-blue-900'
                                    : 'bg-blue-900/50 text-white hover:bg-blue-800'
                            }`}
                        >
                            ⚔️ Swords
                        </button>
                        <button
                            onClick={() => setView('resources')}
                            className={`px-4 py-2 rounded font-semibold transition-colors ${
                                view === 'resources'
                                    ? 'bg-white text-blue-900'
                                    : 'bg-blue-900/50 text-white hover:bg-blue-800'
                            }`}
                        >
                            📦 Resources
                        </button>
                    </div>
                </div>

                {/* Collection Progress */}
                <div className="bg-gray-700 p-4 border-t border-gray-600">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm">🏆 Sword Collection Progress:</span>
                        <div className="flex gap-2">
                            {Object.entries(playerProgress.swordOwnership || {}).map(([key, owned]) => (
                                <div
                                    key={key}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                                        owned ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-400'
                                    }`}
                                    title={RECIPES[key]?.name || key}
                                >
                                    {owned ? '✓' : '?'}
                                </div>
                            ))}
                        </div>
                        <span className="text-blue-400 font-bold">
                            {Object.values(playerProgress.swordOwnership || {}).filter(Boolean).length}/4
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {view === 'swords' && (
                        <div>
                            {playerProgress.inventory.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">⚔️</div>
                                    <p className="text-gray-400 text-lg">No swords yet!</p>
                                    <p className="text-gray-500 text-sm mt-2">
                                        Visit the Forge to craft your first weapon
                                    </p>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {playerProgress.inventory.map((sword) => {
                                        const condition = getSwordCondition(sword);
                                        const isEquipped = playerProgress.equippedSword === sword.id;
                                        const durabilityPercent = (sword.durability / sword.stats.durability) * 100;

                                        return (
                                            <div
                                                key={sword.id}
                                                className={`relative rounded-lg p-4 border-2 transition-all ${
                                                    TIER_COLORS[sword.tier]
                                                } ${
                                                    isEquipped ? 'ring-4 ring-yellow-400' : ''
                                                } hover:scale-105 cursor-pointer`}
                                                onClick={() => setSelectedSword(sword)}
                                            >
                                                {/* Equipped Badge */}
                                                {isEquipped && (
                                                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 px-2 py-1 rounded-full text-xs font-bold">
                                                        ⭐ EQUIPPED
                                                    </div>
                                                )}

                                                {/* Icon and Name */}
                                                <div className="flex items-start gap-3 mb-3">
                                                    <span className="text-4xl">{TIER_ICONS[sword.tier]}</span>
                                                    <div className="flex-1">
                                                        <h3 className="text-white font-bold text-lg leading-tight">
                                                            {sword.name}
                                                        </h3>
                                                        <p className="text-gray-400 text-xs">
                                                            Tier {sword.tier}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Stats */}
                                                <div className="space-y-2 mb-3">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-400">⚔️ Attack:</span>
                                                        <span className="text-red-400 font-bold">
                                                            +{sword.getAttackPower()}
                                                        </span>
                                                    </div>

                                                    {/* Durability Bar */}
                                                    <div>
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="text-gray-400">🛡️ Durability:</span>
                                                            <span className={condition.color}>
                                                                {condition.text}
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-2 bg-gray-600 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all ${
                                                                    durabilityPercent >= 50 ? 'bg-green-500' :
                                                                        durabilityPercent >= 25 ? 'bg-yellow-500' :
                                                                            'bg-red-500'
                                                                }`}
                                                                style={{ width: `${durabilityPercent}%` }}
                                                            />
                                                        </div>
                                                        <div className="text-xs text-gray-500 text-center mt-1">
                                                            {sword.durability} / {sword.stats.durability}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="space-y-2">
                                                    {!isEquipped && (
                                                        <Button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEquip(sword.id);
                                                            }}
                                                            variant="primary"
                                                            size="small"
                                                            fullWidth
                                                        >
                                                            ⭐ Equip
                                                        </Button>
                                                    )}

                                                    {durabilityPercent < 100 && (
                                                        <Button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onRepair(sword.id);
                                                            }}
                                                            variant="secondary"
                                                            size="small"
                                                            fullWidth
                                                        >
                                                            🔧 Repair
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {view === 'resources' && (
                        <div>
                            <h3 className="text-white font-semibold mb-4">📦 Your Resources</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {Object.entries(playerProgress.resources).map(([type, amount]) => {
                                    const RESOURCE_INFO = {
                                        IRON: { icon: '⚙️', color: 'bg-gray-600' },
                                        STEEL: { icon: '🔩', color: 'bg-blue-600' },
                                        STONE: { icon: '🪨', color: 'bg-gray-500' },
                                        WOOD: { icon: '🪵', color: 'bg-amber-700' },
                                        CRYSTAL: { icon: '💎', color: 'bg-cyan-600' },
                                        MYTHRIL: { icon: '✨', color: 'bg-purple-600' }
                                    };

                                    const info = RESOURCE_INFO[type];
                                    return (
                                        <div
                                            key={type}
                                            className={`${info.color} rounded-lg p-4 text-center border-2 border-white/20`}
                                        >
                                            <div className="text-5xl mb-2">{info.icon}</div>
                                            <div className="text-white text-3xl font-bold mb-1">
                                                {amount}
                                            </div>
                                            <div className="text-gray-200 text-sm font-semibold">
                                                {type}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sword Detail Modal */}
                {selectedSword && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
                        onClick={() => setSelectedSword(null)}
                    >
                        <div
                            className={`${TIER_COLORS[selectedSword.tier]} rounded-lg p-6 max-w-md border-2`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-white text-2xl font-bold mb-4 flex items-center gap-2">
                                <span className="text-4xl">{TIER_ICONS[selectedSword.tier]}</span>
                                {selectedSword.name}
                            </h3>

                            <div className="space-y-3 text-white">
                                <p><strong>Tier:</strong> {selectedSword.tier}</p>
                                <p><strong>Attack Power:</strong> +{selectedSword.getAttackPower()}</p>
                                <p><strong>Durability:</strong> {selectedSword.durability}/{selectedSword.stats.durability}</p>
                                <p><strong>Created:</strong> {new Date(selectedSword.createdAt).toLocaleDateString()}</p>

                                <div>
                                    <strong>Materials Used:</strong>
                                    <div className="mt-2 space-y-1">
                                        {Object.entries(selectedSword.materials).map(([type, amount]) => (
                                            <div key={type} className="text-sm text-gray-300">
                                                • {type}: {amount}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={() => setSelectedSword(null)}
                                variant="secondary"
                                fullWidth
                                className="mt-6"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryInterface;