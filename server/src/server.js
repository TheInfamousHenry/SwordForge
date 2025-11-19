// server/src/server.js - ES MODULES VERSION
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/swordforge', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// User Schema - UPDATED WITH PHASE 2 FIELDS
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    // Phase 2 fields
    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 },
    resources: {
        IRON: { type: Number, default: 20 },
        STEEL: { type: Number, default: 5 },
        STONE: { type: Number, default: 10 },
        WOOD: { type: Number, default: 15 },
        CRYSTAL: { type: Number, default: 2 },
        MYTHRIL: { type: Number, default: 0 }
    },
    inventory: [{
        id: String,
        name: String,
        tier: String,
        stats: {
            attackBonus: Number,
            durability: Number
        },
        materials: Object,
        durability: Number,
        maxDurability: Number,
        createdAt: Date
    }],
    equippedSword: { type: String, default: null },
    forgeLevel: { type: Number, default: 1 },
    totalForges: { type: Number, default: 0 },
    duelsWon: { type: Number, default: 0 },
    duelsLost: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username,
            password: hashedPassword
        });

        await user.save();

        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                level: user.level,
                resources: user.resources
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                level: user.level,
                experience: user.experience,
                resources: user.resources,
                inventory: user.inventory,
                equippedSword: user.equippedSword,
                forgeLevel: user.forgeLevel,
                totalForges: user.totalForges,
                duelsWon: user.duelsWon,
                duelsLost: user.duelsLost,
                swordOwnership: user.swordOwnership || {
                    BASIC_SWORD: false,
                    REFINED_SWORD: false,
                    ENHANCED_SWORD: false,
                    MASTERWORK_SWORD: false
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// ============= PHASE 2: CRAFTING SYSTEM =============
const RECIPES = {
    BASIC_SWORD: {
        name: 'Basic Iron Sword',
        tier: 'BASIC',
        requirements: { IRON: 5, WOOD: 2 },
        minLevel: 1,
        stats: { attackBonus: 5, durability: 100 },
        experience: 50
    },
    REFINED_SWORD: {
        name: 'Refined Steel Sword',
        tier: 'REFINED',
        requirements: { STEEL: 8, IRON: 10, WOOD: 3 },
        minLevel: 5,
        stats: { attackBonus: 15, durability: 200 },
        experience: 150
    },
    ENHANCED_SWORD: {
        name: 'Enhanced Crystal Sword',
        tier: 'ENHANCED',
        requirements: { CRYSTAL: 3, STEEL: 15, STONE: 10 },
        minLevel: 10,
        stats: { attackBonus: 30, durability: 350 },
        experience: 400
    },
    MASTERWORK_SWORD: {
        name: 'Masterwork Mythril Sword',
        tier: 'MASTERWORK',
        requirements: { MYTHRIL: 5, CRYSTAL: 8, STEEL: 20 },
        minLevel: 20,
        stats: { attackBonus: 50, durability: 500 },
        experience: 1000
    }
};

function canCraftSword(user, recipe) {
    if (user.level < recipe.minLevel) {
        return { success: false, reason: `Requires level ${recipe.minLevel}` };
    }

    for (const [resource, amount] of Object.entries(recipe.requirements)) {
        if ((user.resources[resource] || 0) < amount) {
            return { success: false, reason: 'Insufficient resources' };
        }
    }

    return { success: true };
}

function calculateLevelUp(experience, level) {
    const requiredXP = level * 100 + Math.pow(level, 2) * 50;
    if (experience >= requiredXP) {
        return {
            levelUp: true,
            newLevel: level + 1,
            remainingXP: experience - requiredXP
        };
    }
    return { levelUp: false };
}

// ============= PHASE 2: TRADING SYSTEM =============
const activeOffers = new Map();

function createTradeOffer(userId, username, resourceType, amount, pricePerUnit) {
    const offerId = `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offer = {
        id: offerId,
        sellerId: userId,
        sellerName: username,
        resourceType,
        amount,
        pricePerUnit,
        totalPrice: amount * pricePerUnit,
        createdAt: Date.now(),
        status: 'active'
    };
    activeOffers.set(offerId, offer);
    return offer;
}

// ============= PHASE 2: DUEL SYSTEM =============
const pendingDuels = new Map();
const activeDuels = new Map();

// ============= EXISTING GAME STATE =============
const WORLD_SIZE = 3000;
const BORDER_THICKNESS = 200;
const SAFE_ZONE_MIN = BORDER_THICKNESS;
const SAFE_ZONE_MAX = WORLD_SIZE - BORDER_THICKNESS;

let players = [];
let enemies = [];
let resources = [];
let thrownSwords = [];

function getRandomSafePosition() {
    return {
        x: SAFE_ZONE_MIN + Math.random() * (SAFE_ZONE_MAX - SAFE_ZONE_MIN),
        y: SAFE_ZONE_MIN + Math.random() * (SAFE_ZONE_MAX - SAFE_ZONE_MIN)
    };
}

function spawnInitialEnemies() {
    const enemyCount = 10;
    for (let i = 0; i < enemyCount; i++) {
        const pos = getRandomSafePosition();
        enemies.push({
            id: `enemy_${Date.now()}_${i}`,
            x: pos.x,
            y: pos.y,
            health: 100,
            maxHealth: 100,
            velocityX: 0,
            velocityY: 0,
            facingAngle: 0,
            isAlive: true,
            level: Math.floor(Math.random() * 3) + 1
        });
    }
}

function spawnInitialResources() {
    const resourceCount = 20;
    for (let i = 0; i < resourceCount; i++) {
        const pos = getRandomSafePosition();
        resources.push({
            id: `resource_${Date.now()}_${i}`,
            x: pos.x,
            y: pos.y
        });
    }
}

spawnInitialEnemies();
spawnInitialResources();

// Socket.io Authentication Middleware
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication required'));
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return next(new Error('User not found'));
        }
        socket.userId = user._id.toString();
        socket.username = user.username;
        socket.userData = user;
        next();
    } catch (error) {
        next(new Error('Invalid token'));
    }
});

// Main Game Socket Connection
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.username}`);

    const pos = getRandomSafePosition();
    const player = {
        id: socket.id,
        userId: socket.userId,
        username: socket.username,
        x: pos.x,
        y: pos.y,
        velocityX: 0,
        velocityY: 0,
        health: 100,
        maxHealth: 100,
        resources: {
            IRON: 0,
            STEEL: 0,
            STONE: 0,
            WOOD: 0,
            CRYSTAL: 0,
            MYTHRIL: 0
        },
        facingAngle: 0,
        isAlive: true,
        equippedSwordBonus: 0
    };

    // Load equipped sword bonus
    if (socket.userData.equippedSword) {
        const sword = socket.userData.inventory.find(s => s.id === socket.userData.equippedSword);
        if (sword) {
            player.equippedSwordBonus = sword.stats.attackBonus;
        }
    }

    players.push(player);

    socket.emit('init', {
        playerId: socket.id,
        worldSize: WORLD_SIZE,
        borderThickness: BORDER_THICKNESS,
        players: players.map(p => ({
            id: p.id,
            username: p.username,
            x: p.x,
            y: p.y,
            health: p.health,
            resources: p.resources,
            isAlive: p.isAlive
        })),
        enemies: enemies.map(e => ({
            id: e.id,
            x: e.x,
            y: e.y,
            health: e.health,
            isAlive: e.isAlive
        })),
        resources: resources
    });

    socket.broadcast.emit('playerJoined', {
        id: player.id,
        username: player.username,
        x: player.x,
        y: player.y,
        health: player.health
    });
    players.push(player);
    io.emit('playerJoined', player);

    // Send initial progress data
    socket.emit('initialProgress', {
        level: player.level,
        experience: player.experience,
        resources: player.resources,
        inventory: player.inventory,
        equippedSword: player.equippedSword,
        forgeLevel: player.forgeLevel,
        totalForges: player.totalForges,
        duelsWon: player.duelsWon,
        duelsLost: player.duelsLost,
        swordOwnership: player.swordOwnership || {
            BASIC_SWORD: false,
            REFINED_SWORD: false,
            ENHANCED_SWORD: false,
            MASTERWORK_SWORD: false
        }
    });

    // ============= PHASE 2: CRAFTING EVENTS =============
    socket.on('craftSword', async (data, callback) => {
        console.log('🔨 [SERVER] Craft request received:', {
            userId: socket.userId,
            username: socket.username,
            recipeKey: data.recipeKey
        });

        try {
            // Validate callback exists
            if (!callback || typeof callback !== 'function') {
                console.error('❌ [SERVER] No callback provided for craftSword');
                return;
            }

            const user = await User.findById(socket.userId);
            if (!user) {
                console.error('❌ [SERVER] User not found:', socket.userId);
                return callback({ success: false, reason: 'User not found' });
            }

            console.log('👤 [SERVER] User found:', {
                username: user.username,
                level: user.level,
                resources: user.resources
            });

            const recipe = RECIPES[data.recipeKey];
            if (!recipe) {
                console.error('❌ [SERVER] Invalid recipe:', data.recipeKey);
                return callback({ success: false, reason: 'Invalid recipe' });
            }

            console.log('📜 [SERVER] Recipe found:', {
                name: recipe.name,
                requirements: recipe.requirements,
                minLevel: recipe.minLevel
            });

            const canCraft = canCraftSword(user, recipe);
            if (!canCraft.success) {
                console.log('❌ [SERVER] Cannot craft:', canCraft.reason);
                return callback(canCraft);
            }

            console.log('✅ [SERVER] Can craft, proceeding...');

            // Deduct resources
            for (const [resource, amount] of Object.entries(recipe.requirements)) {
                console.log(`  - Deducting ${amount} ${resource} (had ${user.resources[resource]})`);
                user.resources[resource] -= amount;
            }

            // Create sword
            const swordId = `sword_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const newSword = {
                id: swordId,
                name: recipe.name,
                tier: recipe.tier,
                stats: recipe.stats,
                materials: recipe.requirements,
                durability: recipe.stats.durability,
                maxDurability: recipe.stats.durability,
                createdAt: new Date()
            };

            console.log('⚔️ [SERVER] Sword created:', newSword.name);

            user.inventory.push(newSword);
            user.totalForges++;
            user.experience += recipe.experience;

            // Mark sword type as owned
            if (!user.swordOwnership) {
                user.swordOwnership = {
                    BASIC_SWORD: false,
                    REFINED_SWORD: false,
                    ENHANCED_SWORD: false,
                    MASTERWORK_SWORD: false
                };
            }
            user.swordOwnership[data.recipeKey] = true;

            // Auto-equip if no sword equipped
            if (!user.equippedSword) {
                user.equippedSword = swordId;
                console.log('⭐ [SERVER] Auto-equipped sword');
            }

            // Check level up
            const levelUpResult = calculateLevelUp(user.experience, user.level);
            if (levelUpResult.levelUp) {
                user.level = levelUpResult.newLevel;
                user.experience = levelUpResult.remainingXP;
                console.log('🎉 [SERVER] Level up!', user.level);
            }

            console.log('💾 [SERVER] Saving user...');
            await user.save();
            console.log('✅ [SERVER] User saved successfully');

            const response = {
                success: true,
                sword: newSword,
                leveledUp: levelUpResult.levelUp,
                resources: user.resources,
                inventory: user.inventory,
                level: user.level,
                experience: user.experience,
                swordOwnership: user.swordOwnership
            };

            console.log('📨 [SERVER] Sending success response');
            callback(response);
        } catch (error) {
            console.error('❌ [SERVER] Craft error:', error);
            console.error(error.stack);
            callback({ success: false, reason: `Server error: ${error.message}` });
        }
    });

    socket.on('equipSword', async (data, callback) => {
        try {
            const user = await User.findById(socket.userId);
            const sword = user.inventory.find(s => s.id === data.swordId);

            if (!sword) {
                return callback({ success: false, reason: 'Sword not found' });
            }

            user.equippedSword = data.swordId;
            await user.save();

            // Update player's attack bonus
            const player = players.find(p => p.id === socket.id);
            if (player) {
                player.equippedSwordBonus = sword.stats.attackBonus;
            }

            callback({ success: true });
        } catch (error) {
            callback({ success: false, reason: 'Server error' });
        }
    });

    socket.on('repairSword', async (data, callback) => {
        try {
            const user = await User.findById(socket.userId);
            const sword = user.inventory.find(s => s.id === data.swordId);

            if (!sword) {
                return callback({ success: false, reason: 'Sword not found' });
            }

            const repairCost = 5;
            if (user.resources.IRON < repairCost) {
                return callback({ success: false, reason: 'Not enough iron (need 5)' });
            }

            user.resources.IRON -= repairCost;
            sword.durability = sword.maxDurability;

            await user.save();

            callback({
                success: true,
                inventory: user.inventory,
                resources: user.resources
            });
        } catch (error) {
            callback({ success: false, reason: 'Server error' });
        }
    });

    // ============= PHASE 2: TRADING EVENTS =============
    socket.on('createOffer', async (data, callback) => {
        try {
            const user = await User.findById(socket.userId);
            const { resourceType, amount, pricePerUnit } = data;

            if ((user.resources[resourceType] || 0) < amount) {
                return callback({ success: false, reason: 'Insufficient resources' });
            }

            user.resources[resourceType] -= amount;
            await user.save();

            const offer = createTradeOffer(socket.userId, socket.username, resourceType, amount, pricePerUnit);
            io.emit('shopOffersUpdate', Array.from(activeOffers.values()));

            callback({ success: true, offer });
        } catch (error) {
            callback({ success: false, reason: 'Server error' });
        }
    });

    socket.on('buyOffer', async (data, callback) => {
        try {
            const offer = activeOffers.get(data.offerId);
            if (!offer || offer.status !== 'active') {
                return callback({ success: false, reason: 'Offer not available' });
            }

            if (offer.sellerId === socket.userId) {
                return callback({ success: false, reason: 'Cannot buy your own offer' });
            }

            const buyer = await User.findById(socket.userId);
            const seller = await User.findById(offer.sellerId);

            if (buyer.resources.IRON < offer.totalPrice) {
                return callback({ success: false, reason: 'Not enough Iron' });
            }

            // Transfer resources
            buyer.resources.IRON -= offer.totalPrice;
            buyer.resources[offer.resourceType] += offer.amount;
            seller.resources.IRON += offer.totalPrice;

            await buyer.save();
            await seller.save();

            activeOffers.delete(data.offerId);
            io.emit('shopOffersUpdate', Array.from(activeOffers.values()));

            callback({ success: true, resources: buyer.resources });
        } catch (error) {
            callback({ success: false, reason: 'Server error' });
        }
    });

    socket.on('cancelOffer', async (data, callback) => {
        try {
            const offer = activeOffers.get(data.offerId);
            if (!offer || offer.sellerId !== socket.userId) {
                return callback({ success: false, reason: 'Cannot cancel offer' });
            }

            const user = await User.findById(socket.userId);
            user.resources[offer.resourceType] += offer.amount;
            await user.save();

            activeOffers.delete(data.offerId);
            io.emit('shopOffersUpdate', Array.from(activeOffers.values()));

            callback({ success: true });
        } catch (error) {
            callback({ success: false, reason: 'Server error' });
        }
    });

    // ============= PHASE 2: DUEL EVENTS =============
    socket.on('challengeDuel', async (data, callback) => {
        try {
            const challenger = await User.findById(socket.userId);
            const { targetId, wager } = data;

            // Verify resources
            for (const [resource, amount] of Object.entries(wager.resources)) {
                if (challenger.resources[resource] < amount) {
                    return callback({ success: false, reason: 'Insufficient resources for wager' });
                }
            }

            const duelId = `duel_${Date.now()}`;
            const challenge = {
                id: duelId,
                challengerId: socket.userId,
                challengerName: socket.username,
                targetId,
                wager,
                createdAt: Date.now()
            };

            pendingDuels.set(targetId, challenge);

            // Send to target player
            const targetSockets = Array.from(io.sockets.sockets.values()).filter(s => s.userId === targetId);
            targetSockets.forEach(s => s.emit('duelChallenge', challenge));

            callback({ success: true });
        } catch (error) {
            callback({ success: false, reason: 'Server error' });
        }
    });

    socket.on('acceptDuel', async (data, callback) => {
        try {
            const challenge = pendingDuels.get(socket.userId);
            if (!challenge || challenge.id !== data.challengeId) {
                return callback({ success: false, reason: 'Challenge not found' });
            }

            const target = await User.findById(socket.userId);

            // Verify target has resources
            for (const [resource, amount] of Object.entries(challenge.wager.resources)) {
                if (target.resources[resource] < amount) {
                    return callback({ success: false, reason: 'Insufficient resources for wager' });
                }
            }

            activeDuels.set(challenge.id, challenge);
            pendingDuels.delete(socket.userId);

            // Notify both players
            const challengerSockets = Array.from(io.sockets.sockets.values()).filter(s => s.userId === challenge.challengerId);
            challengerSockets.forEach(s => s.emit('duelStarting', { duelId: challenge.id }));
            socket.emit('duelStarting', { duelId: challenge.id });

            callback({ success: true });
        } catch (error) {
            callback({ success: false, reason: 'Server error' });
        }
    });

    socket.on('declineDuel', (data) => {
        const challenge = pendingDuels.get(socket.userId);
        if (challenge) {
            const challengerSockets = Array.from(io.sockets.sockets.values()).filter(s => s.userId === challenge.challengerId);
            challengerSockets.forEach(s => s.emit('duelDeclined', { targetName: socket.username }));
            pendingDuels.delete(socket.userId);
        }
    });

    socket.on('duelComplete', async (data) => {
        const duel = activeDuels.get(data.duelId);
        if (!duel) return;

        const winner = await User.findById(data.winnerId);
        const loser = await User.findById(
            data.winnerId === duel.challengerId ? duel.targetId : duel.challengerId
        );

        // Transfer wager
        for (const [resource, amount] of Object.entries(duel.wager.resources)) {
            loser.resources[resource] -= amount;
            winner.resources[resource] += amount * 2;
        }

        winner.duelsWon++;
        winner.experience += 100;
        loser.duelsLost++;

        await winner.save();
        await loser.save();

        activeDuels.delete(data.duelId);
    });

    // ============= EXISTING GAME EVENTS =============
    socket.on('playerMove', (data) => {
        const player = players.find(p => p.id === socket.id);
        if (player && player.isAlive) {
            player.velocityX = data.velocityX;
            player.velocityY = data.velocityY;
            player.facingAngle = data.facingAngle;

            player.x += player.velocityX * (1/60);
            player.y += player.velocityY * (1/60);

            player.x = Math.max(0, Math.min(WORLD_SIZE, player.x));
            player.y = Math.max(0, Math.min(WORLD_SIZE, player.y));

            // Border damage
            if (player.x < SAFE_ZONE_MIN || player.x > SAFE_ZONE_MAX ||
                player.y < SAFE_ZONE_MIN || player.y > SAFE_ZONE_MAX) {
                player.health = Math.max(0, player.health - 1);
                if (player.health <= 0 && player.isAlive) {
                    player.isAlive = false;
                }
            }
        }
    });

    socket.on('playerAttack', () => {
        const player = players.find(p => p.id === socket.id);
        if (!player || !player.isAlive) return;

        const attackRange = 50;
        const baseDamage = 20;
        const totalDamage = baseDamage + player.equippedSwordBonus;

        enemies.forEach(enemy => {
            if (!enemy.isAlive) return;

            const distance = Math.sqrt(
                Math.pow(player.x - enemy.x, 2) + Math.pow(player.y - enemy.y, 2)
            );

            if (distance <= attackRange) {
                enemy.health = Math.max(0, enemy.health - totalDamage);

                const enemyAlive = enemy.health > 0;
                if (!enemyAlive) {
                    enemy.isAlive = false;
                    dropResourcesForEnemy(enemy);
                }

                io.emit('playerAttacked', {
                    playerId: player.id,
                    enemyId: enemy.id,
                    enemyHealth: enemy.health,
                    enemyAlive
                });
            }
        });
    });

    function dropResourcesForEnemy(enemy) {
        const dropTypes = ['IRON', 'WOOD', 'STONE', 'STEEL', 'CRYSTAL', 'MYTHRIL'];
        const dropChances = [0.8, 0.6, 0.5, 0.3, 0.1, 0.02];

        dropTypes.forEach((type, index) => {
            if (Math.random() < dropChances[index]) {
                const amount = Math.ceil(Math.random() * (enemy.level || 1) * 2);

                const resourceId = `drop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const resource = {
                    id: resourceId,
                    x: enemy.x,
                    y: enemy.y,
                    type: type,
                    amount: amount
                };

                resources.push(resource);
                io.emit('resourceDropped', resource);
            }
        });
    }

    socket.on('collectResource', async (resourceId) => {
        const player = players.find(p => p.id === socket.id);
        const resource = resources.find(r => r.id === resourceId);

        if (player && resource && player.isAlive) {
            const distance = Math.sqrt(
                Math.pow(player.x - resource.x, 2) + Math.pow(player.y - resource.y, 2)
            );

            if (distance <= 30) {
                resources = resources.filter(r => r.id !== resourceId);

                // Add resource to player's dictionary
                const resourceType = resource.type || 'IRON';
                const resourceAmount = resource.amount || 1;

                if (!player.resources[resourceType]) {
                    player.resources[resourceType] = 0;
                }
                player.resources[resourceType] += resourceAmount;

                // Update database
                try {
                    const user = await User.findById(socket.userId);
                    if (user) {
                        if (!user.resources[resourceType]) {
                            user.resources[resourceType] = 0;
                        }
                        user.resources[resourceType] += resourceAmount;
                        user.experience += 10;
                        await user.save();
                    }
                } catch (error) {
                    console.error('Error updating user resources:', error);
                }

                io.emit('resourceCollected', {
                    resourceId,
                    playerId: player.id,
                    resourceType,
                    resourceAmount
                });
            }
        }
    });

    socket.on('throwSword', (data) => {
        const player = players.find(p => p.id === socket.id);
        if (!player || !player.isAlive) return;

        const swordId = `thrown_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const thrownSword = {
            id: swordId,
            playerId: player.id,
            x: player.x,
            y: player.y,
            angle: data.angle,
            velocityX: Math.cos(data.angle) * 400,
            velocityY: Math.sin(data.angle) * 400,
            damage: 30 + player.equippedSwordBonus,
            lifespan: 2000,
            createdAt: Date.now()
        };

        thrownSwords.push(thrownSword);
        io.emit('swordThrown', {
            id: swordId,
            playerId: player.id,
            x: player.x,
            y: player.y,
            angle: data.angle
        });
    });

    socket.on('respawn', () => {
        const player = players.find(p => p.id === socket.id);
        if (player) {
            const pos = getRandomSafePosition();
            player.x = pos.x;
            player.y = pos.y;
            player.health = player.maxHealth;
            player.isAlive = true;

            io.emit('playerRespawned', {
                id: player.id,
                x: player.x,
                y: player.y
            });
        }
    });

    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.username}`);
        players = players.filter(p => p.id !== socket.id);
        socket.broadcast.emit('playerLeft', socket.id);
    });
});

// Game Loop
setInterval(() => {
    const now = Date.now();

    // Update thrown swords
    thrownSwords.forEach(sword => {
        sword.x += sword.velocityX * (1/60);
        sword.y += sword.velocityY * (1/60);

        // Check enemy collisions
        enemies.forEach(enemy => {
            if (!enemy.isAlive) return;

            const distance = Math.sqrt(
                Math.pow(sword.x - enemy.x, 2) + Math.pow(sword.y - enemy.y, 2)
            );

            if (distance <= 20) {
                enemy.health = Math.max(0, enemy.health - sword.damage);
                const enemyAlive = enemy.health > 0;

                if (!enemyAlive) {
                    enemy.isAlive = false;
                    setTimeout(() => {
                        const index = enemies.findIndex(e => e.id === enemy.id);
                        if (index !== -1) {
                            enemies.splice(index, 1);
                            io.emit('enemyRemoved', enemy.id);

                            const pos = getRandomSafePosition();
                            const newEnemy = {
                                id: `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                x: pos.x,
                                y: pos.y,
                                health: 100,
                                maxHealth: 100,
                                velocityX: 0,
                                velocityY: 0,
                                facingAngle: 0,
                                isAlive: true,
                                level: Math.floor(Math.random() * 3) + 1
                            };
                            enemies.push(newEnemy);
                            io.emit('enemySpawned', newEnemy);
                        }
                    }, 3000);
                }

                io.emit('swordHit', {
                    swordId: sword.id,
                    enemyId: enemy.id,
                    enemyHealth: enemy.health,
                    enemyAlive
                });

                sword.lifespan = 0;
            }
        });
    });

    thrownSwords = thrownSwords.filter(sword => {
        if (now - sword.createdAt >= sword.lifespan ||
            sword.x < 0 || sword.x > WORLD_SIZE ||
            sword.y < 0 || sword.y > WORLD_SIZE) {
            io.emit('swordRemoved', sword.id);
            return false;
        }
        return true;
    });

    // Send sword updates
    if (thrownSwords.length > 0) {
        io.emit('swordUpdate', thrownSwords.map(s => ({
            id: s.id,
            x: s.x,
            y: s.y,
            angle: s.angle
        })));
    }

    // Enemy AI
    enemies.forEach(enemy => {
        if (!enemy.isAlive) return;

        let nearestPlayer = null;
        let nearestDistance = Infinity;

        players.forEach(player => {
            if (!player.isAlive) return;
            const distance = Math.sqrt(
                Math.pow(player.x - enemy.x, 2) + Math.pow(player.y - enemy.y, 2)
            );
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestPlayer = player;
            }
        });

        if (nearestPlayer && nearestDistance < 300) {
            const angle = Math.atan2(
                nearestPlayer.y - enemy.y,
                nearestPlayer.x - enemy.x
            );
            enemy.facingAngle = angle;
            enemy.velocityX = Math.cos(angle) * 80;
            enemy.velocityY = Math.sin(angle) * 80;

            enemy.x += enemy.velocityX * (1/60);
            enemy.y += enemy.velocityY * (1/60);

            // Attack if in range
            if (nearestDistance < 40) {
                const attackCooldown = enemy.lastAttack || 0;
                if (now - attackCooldown > 1000) {
                    enemy.lastAttack = now;
                    nearestPlayer.health = Math.max(0, nearestPlayer.health - 15);

                    if (nearestPlayer.health <= 0 && nearestPlayer.isAlive) {
                        nearestPlayer.isAlive = false;
                    }

                    io.emit('enemyAttack', {
                        enemyId: enemy.id,
                        targetId: nearestPlayer.id,
                        damage: 15
                    });
                }
            }
        } else {
            enemy.velocityX *= 0.95;
            enemy.velocityY *= 0.95;
        }

        enemy.x = Math.max(SAFE_ZONE_MIN, Math.min(SAFE_ZONE_MAX, enemy.x));
        enemy.y = Math.max(SAFE_ZONE_MIN, Math.min(SAFE_ZONE_MAX, enemy.y));
    });

    // Broadcast game state
    io.emit('gameState', {
        players: players.map(p => ({
            id: p.id,
            x: p.x,
            y: p.y,
            health: p.health,
            facingAngle: p.facingAngle,
            isAlive: p.isAlive,
            resources: p.resources
        })),
        enemies: enemies.map(e => ({
            id: e.id,
            x: e.x,
            y: e.y,
            health: e.health,
            facingAngle: e.facingAngle,
            isAlive: e.isAlive
        }))
    });
}, 1000 / 60);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Phase 2 features enabled: Crafting, Trading, Duels');
});