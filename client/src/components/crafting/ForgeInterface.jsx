// client/src/components/crafting/ForgeInterface.jsx
import React, { useState } from 'react';
import Button from '../ui/Button';

const RECIPES = {
    BASIC_SWORD: {
        name: 'Basic Iron Sword',
        tier: 'BASIC',
        requirements: { IRON: 5, WOOD: 2 },
        minLevel: 1,
        stats: { attack: 5, durability: 100 },
        icon: '🗡️'
    },
    REFINED_SWORD: {
        name: 'Refined Steel Sword',
        tier: 'REFINED',
        requirements: { STEEL: 8, IRON: 10, WOOD: 3 },
        minLevel: 5,
        stats: { attack: 15, durability: 200 },
        icon: '⚔️'
    },
    ENHANCED_SWORD: {
        name: 'Enhanced Crystal Sword',
        tier: 'ENHANCED',
        requirements: { CRYSTAL: 3, STEEL: 15, STONE: 10 },
        minLevel: 10,
        stats: { attack: 30, durability: 350 },
        icon: '🔷'
    },
    MASTERWORK_SWORD: {
        name: 'Masterwork Mythril Sword',
        tier: 'MASTERWORK',
        requirements: { MYTHRIL: 5, CRYSTAL: 8, STEEL: 20 },
        minLevel: 20,
        stats: { attack: 50, durability: 500 },
        icon: '✨'
    }
};

const RESOURCE_ICONS = {
    IRON: '⚙️',
    STEEL: '🔩',
    STONE: '🪨',
    WOOD: '🪵',
    CRYSTAL: '💎',
    MYTHRIL: '✨'
};

const ForgeInterface = ({ playerProgress, onCraft, onClose }) => {
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [craftingMessage, setCraftingMessage] = useState('');

    const canCraftRecipe = (recipe) => {
        if (playerProgress.level < recipe.minLevel) return false;

        for (const [resource, amount] of Object.entries(recipe.requirements)) {
            if ((playerProgress.resources[resource] || 0) < amount) {
                return false;
            }
        }
        return true;
    };

    const handleCraft = async (recipeKey) => {
        console.log('🔨 Attempting to craft:', recipeKey);
        console.log('Current resources:', playerProgress.resources);
        console.log('Recipe requirements:', RECIPES[recipeKey]?.requirements);

        setCraftingMessage('⚒️ Forging...');

        try {
            const result = await onCraft(recipeKey);
            console.log('Craft result:', result);

            if (result.success) {
                setCraftingMessage(`✅ Successfully crafted ${result.sword.name}!`);
                if (result.leveledUp) {
                    setCraftingMessage(prev => prev + ' 🎉 Level Up!');
                }
                setTimeout(() => setCraftingMessage(''), 3000);
            } else {
                setCraftingMessage(`❌ ${result.reason || 'Unknown error'}`);
                setTimeout(() => setCraftingMessage(''), 3000);
            }
        } catch (error) {
            console.error('Craft error:', error);
            setCraftingMessage(`❌ Error: ${error.message}`);
            setTimeout(() => setCraftingMessage(''), 3000);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-900 to-red-900 p-6 border-b-2 border-gray-700">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                                🔥 The Forge
                            </h2>
                            <p className="text-gray-300 mt-1">
                                Forge Level {playerProgress.forgeLevel} • Total Forged: {playerProgress.totalForges}
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

                {/* Crafting Message */}
                {craftingMessage && (
                    <div className="mx-6 mt-6 bg-blue-900/50 border border-blue-500 text-blue-200 px-4 py-3 rounded-lg">
                        {craftingMessage}
                    </div>
                )}

                {/* Resources Display */}
                <div className="p-6 border-b border-gray-700">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        📦 Your Resources
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {Object.entries(playerProgress.resources).map(([type, amount]) => (
                            <div key={type} className="bg-gray-700 rounded-lg p-3 text-center">
                                <div className="text-2xl mb-1">{RESOURCE_ICONS[type]}</div>
                                <div className="text-white font-bold">{amount}</div>
                                <div className="text-gray-400 text-xs">{type}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recipe Grid */}
                <div className="p-6">
                    <h3 className="text-white font-semibold mb-4">⚒️ Available Recipes</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        {Object.entries(RECIPES).map(([key, recipe]) => {
                            const canCraft = canCraftRecipe(recipe);
                            const isLevelLocked = playerProgress.level < recipe.minLevel;
                            const isOwned = playerProgress.swordOwnership?.[key] || false;

                            return (
                                <div
                                    key={key}
                                    className={`bg-gray-700 rounded-lg p-4 border-2 transition-all relative ${
                                        canCraft
                                            ? 'border-green-500 hover:border-green-400'
                                            : isLevelLocked
                                                ? 'border-red-500 opacity-60'
                                                : 'border-yellow-500 opacity-75'
                                    }`}
                                >
                                    {/* Ownership Badge */}
                                    {isOwned && (
                                        <div className="absolute -top-2 -right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                            ✓ Owned
                                        </div>
                                    )}
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-3xl">{recipe.icon}</span>
                                                <div>
                                                    <h4 className="text-white font-bold">{recipe.name}</h4>
                                                    <p className="text-gray-400 text-xs">
                                                        Tier {recipe.tier} • Level {recipe.minLevel}+
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="mb-3 bg-gray-800 rounded p-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">⚔️ Attack:</span>
                                            <span className="text-red-400 font-bold">+{recipe.stats.attack}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">🛡️ Durability:</span>
                                            <span className="text-blue-400 font-bold">{recipe.stats.durability}</span>
                                        </div>
                                    </div>

                                    {/* Requirements */}
                                    <div className="mb-3">
                                        <p className="text-gray-400 text-xs mb-2">Required Materials:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(recipe.requirements).map(([resource, amount]) => {
                                                const hasEnough = (playerProgress.resources[resource] || 0) >= amount;
                                                return (
                                                    <div
                                                        key={resource}
                                                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                                            hasEnough ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                                                        }`}
                                                    >
                                                        <span>{RESOURCE_ICONS[resource]}</span>
                                                        <span>
                                                            {playerProgress.resources[resource] || 0}/{amount}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Craft Button */}
                                    <Button
                                        onClick={() => handleCraft(key)}
                                        variant={canCraft ? 'success' : 'secondary'}
                                        size="small"
                                        fullWidth
                                        disabled={!canCraft}
                                    >
                                        {isLevelLocked
                                            ? `🔒 Requires Level ${recipe.minLevel}`
                                            : canCraft
                                                ? '⚒️ Forge'
                                                : '❌ Insufficient Resources'}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgeInterface;