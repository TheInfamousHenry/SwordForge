// client/src/components/trading/ShopInterface.jsx
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

const ShopInterface = ({ playerProgress, offers, onCreateOffer, onBuyOffer, onCancelOffer, onClose }) => {
    const [view, setView] = useState('market'); // 'market' or 'sell'
    const [sellForm, setSellForm] = useState({
        resourceType: 'IRON',
        amount: 1,
        pricePerUnit: 1
    });

    const handleCreateOffer = async () => {
        if (sellForm.amount < 1 || sellForm.pricePerUnit < 1) {
            alert('Invalid amounts');
            return;
        }

        if ((playerProgress.resources[sellForm.resourceType] || 0) < sellForm.amount) {
            alert('Not enough resources!');
            return;
        }

        await onCreateOffer(sellForm.resourceType, sellForm.amount, sellForm.pricePerUnit);
        setSellForm({ resourceType: 'IRON', amount: 1, pricePerUnit: 1 });
        setView('market');
    };

    const canAffordOffer = (offer) => {
        return (playerProgress.resources.IRON || 0) >= offer.totalPrice;
    };

    const myOffers = offers.filter(o => o.sellerId === playerProgress.userId);
    const otherOffers = offers.filter(o => o.sellerId !== playerProgress.userId);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-900 to-emerald-900 p-6 border-b-2 border-gray-700">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                                🏪 Trading Post
                            </h2>
                            <p className="text-gray-300 mt-1">
                                Your Gold: <span className="text-yellow-400 font-bold">{playerProgress.resources.IRON || 0} ⚙️</span>
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
                            onClick={() => setView('market')}
                            className={`px-4 py-2 rounded font-semibold transition-colors ${
                                view === 'market'
                                    ? 'bg-white text-green-900'
                                    : 'bg-green-900/50 text-white hover:bg-green-800'
                            }`}
                        >
                            🛒 Market
                        </button>
                        <button
                            onClick={() => setView('sell')}
                            className={`px-4 py-2 rounded font-semibold transition-colors ${
                                view === 'sell'
                                    ? 'bg-white text-green-900'
                                    : 'bg-green-900/50 text-white hover:bg-green-800'
                            }`}
                        >
                            💰 Sell
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {view === 'market' && (
                        <div>
                            <h3 className="text-white font-semibold mb-4">🛒 Available Offers</h3>

                            {otherOffers.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">🏪</div>
                                    <p className="text-gray-400 text-lg">No offers available</p>
                                    <p className="text-gray-500 text-sm mt-2">
                                        Be the first to sell resources!
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {otherOffers.map((offer) => {
                                        const canAfford = canAffordOffer(offer);

                                        return (
                                            <div
                                                key={offer.id}
                                                className={`bg-gray-700 rounded-lg p-4 border-2 ${
                                                    canAfford ? 'border-green-500' : 'border-red-500/50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-4xl">
                                                            {RESOURCE_ICONS[offer.resourceType]}
                                                        </span>
                                                        <div>
                                                            <h4 className="text-white font-bold text-lg">
                                                                {offer.resourceType}
                                                            </h4>
                                                            <p className="text-gray-400 text-sm">
                                                                Amount: <span className="text-white font-semibold">{offer.amount}</span>
                                                            </p>
                                                            <p className="text-gray-400 text-sm">
                                                                Price per unit: <span className="text-yellow-400 font-semibold">{offer.pricePerUnit} ⚙️</span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-yellow-400 mb-2">
                                                            {offer.totalPrice} ⚙️
                                                        </div>
                                                        <Button
                                                            onClick={() => onBuyOffer(offer.id)}
                                                            variant={canAfford ? 'success' : 'secondary'}
                                                            size="small"
                                                            disabled={!canAfford}
                                                        >
                                                            {canAfford ? '💰 Buy' : '❌ Cannot Afford'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* My Active Offers */}
                            {myOffers.length > 0 && (
                                <div className="mt-8">
                                    <h3 className="text-white font-semibold mb-4">📋 Your Active Offers</h3>
                                    <div className="space-y-3">
                                        {myOffers.map((offer) => (
                                            <div
                                                key={offer.id}
                                                className="bg-blue-900/30 rounded-lg p-4 border-2 border-blue-500"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-4xl">
                                                            {RESOURCE_ICONS[offer.resourceType]}
                                                        </span>
                                                        <div>
                                                            <h4 className="text-white font-bold">
                                                                {offer.resourceType} x{offer.amount}
                                                            </h4>
                                                            <p className="text-gray-400 text-sm">
                                                                Total: <span className="text-yellow-400">{offer.totalPrice} ⚙️</span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        onClick={() => onCancelOffer(offer.id)}
                                                        variant="danger"
                                                        size="small"
                                                    >
                                                        ❌ Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {view === 'sell' && (
                        <div className="max-w-2xl mx-auto">
                            <h3 className="text-white font-semibold mb-4">💰 Create Sell Offer</h3>

                            <div className="bg-gray-700 rounded-lg p-6 space-y-4">
                                {/* Resource Selection */}
                                <div>
                                    <label className="block text-gray-300 text-sm font-semibold mb-2">
                                        Resource Type
                                    </label>
                                    <select
                                        value={sellForm.resourceType}
                                        onChange={(e) => setSellForm({...sellForm, resourceType: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border-2 border-gray-600 focus:border-green-500 focus:outline-none"
                                    >
                                        {Object.keys(playerProgress.resources).map(type => (
                                            <option key={type} value={type}>
                                                {RESOURCE_ICONS[type]} {type} (You have: {playerProgress.resources[type]})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Amount */}
                                <div>
                                    <label className="block text-gray-300 text-sm font-semibold mb-2">
                                        Amount to Sell
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={playerProgress.resources[sellForm.resourceType] || 0}
                                        value={sellForm.amount}
                                        onChange={(e) => setSellForm({...sellForm, amount: parseInt(e.target.value) || 1})}
                                        className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border-2 border-gray-600 focus:border-green-500 focus:outline-none"
                                    />
                                    <p className="text-gray-400 text-xs mt-1">
                                        Available: {playerProgress.resources[sellForm.resourceType] || 0}
                                    </p>
                                </div>

                                {/* Price Per Unit */}
                                <div>
                                    <label className="block text-gray-300 text-sm font-semibold mb-2">
                                        Price Per Unit (in Iron ⚙️)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={sellForm.pricePerUnit}
                                        onChange={(e) => setSellForm({...sellForm, pricePerUnit: parseInt(e.target.value) || 1})}
                                        className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border-2 border-gray-600 focus:border-green-500 focus:outline-none"
                                    />
                                </div>

                                {/* Total Price Display */}
                                <div className="bg-gray-800 rounded-lg p-4 border-2 border-yellow-500">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-300 font-semibold">Total Price:</span>
                                        <span className="text-yellow-400 text-2xl font-bold">
                                            {sellForm.amount * sellForm.pricePerUnit} ⚙️
                                        </span>
                                    </div>
                                </div>

                                {/* Create Offer Button */}
                                <Button
                                    onClick={handleCreateOffer}
                                    variant="success"
                                    fullWidth
                                    disabled={
                                        sellForm.amount < 1 ||
                                        sellForm.pricePerUnit < 1 ||
                                        (playerProgress.resources[sellForm.resourceType] || 0) < sellForm.amount
                                    }
                                >
                                    📝 Create Offer
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShopInterface;