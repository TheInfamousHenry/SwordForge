// server/src/server.js - Complete Server with Authentication and Fixed Combat
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';

console.log('🚀 Starting SwordForge Server...');

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

console.log('✅ Middleware configured');

// Socket.io with CORS
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ["GET", "POST"],
        credentials: true
    }
});

console.log('✅ Socket.io configured');

// In-memory database
const users = new Map();
const playerData = new Map();

// Game state
const players = new Map();
const enemies = new Map();
const resources = new Map();
const thrownSwords = new Map(); // NEW: Track thrown swords

const WORLD_SIZE = 3000;
const BORDER_THICKNESS = 200;
const MAX_ENEMIES = 15;
const TICK_RATE = 60;

let nextEnemyId = 0;
let nextResourceId = 0;
let nextSwordId = 0; // NEW: ID counter for thrown swords

console.log('✅ Game state initialized');

// =====================
// AUTH ROUTES
// =====================

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        console.log('📝 Register request:', req.body.username);
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password required' });
        }

        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({ message: 'Username must be 3-20 characters' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const existingUser = Array.from(users.values()).find(u => u.username === username);
        if (existingUser) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const user = {
            id: userId,
            username,
            passwordHash,
            stats: {
                level: 1,
                xp: 0,
                totalResources: 0,
                wins: 0,
                losses: 0,
                kills: 0,
                deaths: 0
            },
            createdAt: new Date().toISOString()
        };

        users.set(userId, user);
        playerData.set(userId, { inventory: [], achievements: [], skills: {} });

        const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });

        console.log('✅ User registered:', username);
        console.log('📊 Total users:', users.size);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: userId,
                username,
                stats: user.stats
            }
        });
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('🔐 Login request:', req.body.username);
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password required' });
        }

        const user = Array.from(users.values()).find(u => u.username === username);
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        console.log('✅ User logged in:', username);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                stats: user.stats
            }
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user stats
app.get('/api/user/stats', authenticateToken, (req, res) => {
    const user = users.get(req.userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.json({
        stats: user.stats,
        playerData: playerData.get(req.userId)
    });
});

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.userId = decoded.userId;
        req.username = decoded.username;
        next();
    });
}

console.log('✅ Auth routes configured');

// =====================
// SOCKET.IO AUTH
// =====================

io.use((socket, next) => {
    console.log('🔌 Socket connection attempt');
    const token = socket.handshake.auth.token;

    if (!token) {
        console.log('❌ No token provided');
        return next(new Error('Authentication required'));
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log('❌ Invalid token:', err.message);
            return next(new Error('Invalid token'));
        }

        socket.userId = decoded.userId;
        socket.username = decoded.username;
        console.log(`✅ Socket authenticated: ${decoded.username}`);
        next();
    });
});

console.log('✅ Socket.io auth configured');

// =====================
// GAME LOGIC
// =====================

function initializeEnemies() {
    console.log('🎮 Initializing enemies...');
    for (let i = 0; i < MAX_ENEMIES; i++) {
        const enemy = {
            id: nextEnemyId++,
            x: BORDER_THICKNESS + Math.random() * (WORLD_SIZE - BORDER_THICKNESS * 2),
            y: BORDER_THICKNESS + Math.random() * (WORLD_SIZE - BORDER_THICKNESS * 2),
            health: 100,
            maxHealth: 100,
            isAlive: true,
            velocityX: 0,
            velocityY: 0,
            facingAngle: 0,
            state: 'wander',
            wanderTimer: 0,
            lastAttackTime: 0,
            deathTime: null // NEW: Track when enemy died
        };
        enemies.set(enemy.id, enemy);
    }
    console.log(`✅ Initialized ${enemies.size} enemies`);
}

function updateEnemyAI(enemy, deltaTime) {
    if (!enemy.isAlive) return;

    const CHASE_RANGE = 300;
    const ATTACK_RANGE = 50; // CRITICAL: This is the attack range for validation
    const ENEMY_SPEED = 100;
    const ATTACK_COOLDOWN = 1000;
    const ATTACK_DAMAGE = 15;

    let nearestPlayer = null;
    let nearestDistance = Infinity;

    players.forEach(player => {
        if (!player.isAlive) return;
        const distance = Math.sqrt(
            Math.pow(player.x - enemy.x, 2) +
            Math.pow(player.y - enemy.y, 2)
        );
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestPlayer = player;
        }
    });

    if (nearestPlayer) {
        if (nearestDistance <= ATTACK_RANGE) {
            enemy.state = 'attack';
            enemy.velocityX = 0;
            enemy.velocityY = 0;

            const now = Date.now();
            if (now - enemy.lastAttackTime >= ATTACK_COOLDOWN) {
                // CRITICAL FIX: Re-verify distance before applying damage
                const verifyDistance = Math.sqrt(
                    Math.pow(nearestPlayer.x - enemy.x, 2) +
                    Math.pow(nearestPlayer.y - enemy.y, 2)
                );

                if (verifyDistance <= ATTACK_RANGE) {
                    // Distance verified - apply damage
                    nearestPlayer.health -= ATTACK_DAMAGE;
                    enemy.lastAttackTime = now;

                    const angle = Math.atan2(nearestPlayer.y - enemy.y, nearestPlayer.x - enemy.x);
                    nearestPlayer.velocityX = Math.cos(angle) * 200;
                    nearestPlayer.velocityY = Math.sin(angle) * 200;

                    if (nearestPlayer.health <= 0) {
                        nearestPlayer.health = 0;
                        nearestPlayer.isAlive = false;
                    }

                    io.emit('enemyAttack', {
                        enemyId: enemy.id,
                        targetId: nearestPlayer.id,
                        damage: ATTACK_DAMAGE
                    });
                } else {
                    console.log(`⚠️ Attack rejected: Distance ${verifyDistance.toFixed(0)} > ${ATTACK_RANGE}`);
                }
            }
        } else if (nearestDistance <= CHASE_RANGE) {
            enemy.state = 'chase';
            const angle = Math.atan2(nearestPlayer.y - enemy.y, nearestPlayer.x - enemy.x);
            enemy.velocityX = Math.cos(angle) * ENEMY_SPEED;
            enemy.velocityY = Math.sin(angle) * ENEMY_SPEED;
            enemy.facingAngle = angle;
        } else {
            enemy.state = 'wander';
            enemy.wanderTimer -= deltaTime;

            if (enemy.wanderTimer <= 0) {
                const angle = Math.random() * Math.PI * 2;
                enemy.velocityX = Math.cos(angle) * ENEMY_SPEED * 0.5;
                enemy.velocityY = Math.sin(angle) * ENEMY_SPEED * 0.5;
                enemy.wanderTimer = Math.random() * 2000 + 1000;
                enemy.facingAngle = angle;
            }
        }
    }

    enemy.x += enemy.velocityX * (deltaTime / 1000);
    enemy.y += enemy.velocityY * (deltaTime / 1000);

    enemy.x = Math.max(0, Math.min(WORLD_SIZE, enemy.x));
    enemy.y = Math.max(0, Math.min(WORLD_SIZE, enemy.y));
}

function spawnEnemy() {
    const enemy = {
        id: nextEnemyId++,
        x: BORDER_THICKNESS + Math.random() * (WORLD_SIZE - BORDER_THICKNESS * 2),
        y: BORDER_THICKNESS + Math.random() * (WORLD_SIZE - BORDER_THICKNESS * 2),
        health: 100,
        maxHealth: 100,
        isAlive: true,
        velocityX: 0,
        velocityY: 0,
        facingAngle: 0,
        state: 'wander',
        wanderTimer: 0,
        lastAttackTime: 0,
        deathTime: null
    };
    enemies.set(enemy.id, enemy);
    io.emit('enemySpawned', enemy);
    console.log(`✨ Enemy spawned: ${enemy.id}`);
}

// NEW: Clean up dead enemies
function cleanupDeadEnemies() {
    const DEATH_CLEANUP_TIME = 2000; // 2 seconds after death
    const now = Date.now();

    enemies.forEach((enemy, id) => {
        if (!enemy.isAlive && enemy.deathTime && (now - enemy.deathTime) > DEATH_CLEANUP_TIME) {
            enemies.delete(id);
            io.emit('enemyRemoved', id);
            console.log(`🧹 Enemy removed: ${id}`);

            // Spawn replacement to maintain MAX_ENEMIES
            if (Array.from(enemies.values()).filter(e => e.isAlive).length < MAX_ENEMIES) {
                spawnEnemy();
            }
        }
    });
}

// =====================
// SOCKET.IO EVENTS
// =====================

io.on('connection', (socket) => {
    console.log(`🎮 Player connected: ${socket.username} (${socket.id})`);

    const user = users.get(socket.userId);
    if (!user) {
        console.error(`❌ User not found: ${socket.userId}`);
        socket.disconnect();
        return;
    }

    const player = {
        id: socket.id,
        userId: socket.userId,
        username: socket.username,
        x: WORLD_SIZE / 2,
        y: WORLD_SIZE / 2,
        health: 100,
        maxHealth: 100,
        resources: 0,
        isAlive: true,
        velocityX: 0,
        velocityY: 0,
        facingAngle: 0,
        lastAttackTime: 0,
        stats: user.stats,
        dashDamageBoost: 1, // NEW: Dash damage multiplier
        dashEndTime: 0 // NEW: When dash boost ends
    };

    players.set(socket.id, player);

    socket.emit('init', {
        playerId: socket.id,
        players: Array.from(players.values()),
        enemies: Array.from(enemies.values()),
        resources: Array.from(resources.values()),
        worldSize: WORLD_SIZE,
        borderThickness: BORDER_THICKNESS,
        userStats: user.stats
    });

    socket.broadcast.emit('playerJoined', player);

    socket.on('playerMove', (data) => {
        const player = players.get(socket.id);
        if (!player || !player.isAlive) return;

        player.velocityX = data.velocityX;
        player.velocityY = data.velocityY;
        player.facingAngle = data.facingAngle;
    });

    socket.on('playerAttack', () => {
        const player = players.get(socket.id);
        if (!player || !player.isAlive) return;

        const now = Date.now();
        const ATTACK_COOLDOWN = 1000;
        const ATTACK_RANGE = 80;
        const BASE_ATTACK_DAMAGE = 25;

        if (now - player.lastAttackTime < ATTACK_COOLDOWN) return;

        player.lastAttackTime = now;

        // Check if dash boost is active
        const damageMultiplier = now < player.dashEndTime ? player.dashDamageBoost : 1;
        const ATTACK_DAMAGE = BASE_ATTACK_DAMAGE * damageMultiplier;

        let hitEnemy = false;

        enemies.forEach(enemy => {
            if (!enemy.isAlive) return;

            const distance = Math.sqrt(
                Math.pow(player.x - enemy.x, 2) +
                Math.pow(player.y - enemy.y, 2)
            );

            if (distance <= ATTACK_RANGE) {
                hitEnemy = true;
                enemy.health -= ATTACK_DAMAGE;

                const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                enemy.velocityX = Math.cos(angle) * 200;
                enemy.velocityY = Math.sin(angle) * 200;

                if (enemy.health <= 0) {
                    enemy.health = 0;
                    enemy.isAlive = false;
                    enemy.deathTime = Date.now();

                    const resourceCount = Math.floor(Math.random() * 3) + 1;
                    for (let i = 0; i < resourceCount; i++) {
                        const resource = {
                            id: nextResourceId++,
                            x: enemy.x + (Math.random() - 0.5) * 40,
                            y: enemy.y + (Math.random() - 0.5) * 40
                        };
                        resources.set(resource.id, resource);
                        io.emit('resourceDropped', resource);
                    }
                }

                io.emit('playerAttacked', {
                    playerId: socket.id,
                    enemyId: enemy.id,
                    damage: ATTACK_DAMAGE,
                    enemyHealth: enemy.health,
                    enemyAlive: enemy.isAlive
                });
            }
        });

        // ALWAYS emit attack animation even if no enemy hit
        if (!hitEnemy) {
            io.emit('playerAttacked', {
                playerId: socket.id,
                enemyId: null,
                damage: 0,
                enemyHealth: 0,
                enemyAlive: false
            });
        }
    });

    // NEW: Handle player dash
    socket.on('playerDash', (data) => {
        const player = players.get(socket.id);
        if (!player || !player.isAlive) return;

        // Apply dash velocity boost
        player.velocityX = data.velocityX;
        player.velocityY = data.velocityY;

        // Store damage boost and duration
        player.dashDamageBoost = data.damageBoost;
        player.dashEndTime = Date.now() + data.duration;

        console.log(`⚡ ${player.username} dashed with ${data.damageBoost.toFixed(2)}x damage boost`);
    });

    // NEW: Handle sword throw
    socket.on('throwSword', (data) => {
        const player = players.get(socket.id);
        if (!player || !player.isAlive) return;

        const swordId = `sword_${nextSwordId++}`;
        const sword = {
            id: swordId,
            playerId: socket.id,
            x: player.x,
            y: player.y,
            velocityX: Math.cos(data.angle) * 400,
            velocityY: Math.sin(data.angle) * 400,
            angle: data.angle,
            distance: 0,
            maxDistance: 500,
            createdAt: Date.now()
        };

        thrownSwords.set(swordId, sword);

        io.emit('swordThrown', {
            id: swordId,
            playerId: socket.id,
            x: sword.x,
            y: sword.y,
            angle: sword.angle
        });

        console.log(`⚔️ Sword thrown by ${player.username}: ${swordId}`);
    });

    socket.on('collectResource', (resourceId) => {
        const player = players.get(socket.id);
        const resource = resources.get(resourceId);

        if (!player || !resource) return;

        const distance = Math.sqrt(
            Math.pow(player.x - resource.x, 2) +
            Math.pow(player.y - resource.y, 2)
        );

        // TIGHTER: Must be very close to collect (inside player circle)
        if (distance <= 25) {
            player.resources++;
            resources.delete(resourceId);
            io.emit('resourceCollected', {
                playerId: socket.id,
                resourceId: resourceId
            });
        }
    });

    socket.on('respawn', () => {
        const player = players.get(socket.id);
        if (!player) return;

        player.x = WORLD_SIZE / 2;
        player.y = WORLD_SIZE / 2;
        player.health = 100;
        player.isAlive = true;
        player.velocityX = 0;
        player.velocityY = 0;

        io.emit('playerRespawned', player);
    });

    socket.on('disconnect', () => {
        console.log(`👋 Player disconnected: ${socket.username} (${socket.id})`);

        const player = players.get(socket.id);
        if (player && user) {
            user.stats.totalResources += player.resources;
        }

        players.delete(socket.id);
        io.emit('playerLeft', socket.id);
    });
});

// =====================
// GAME LOOP
// =====================

let lastUpdateTime = Date.now();

setInterval(() => {
    const now = Date.now();
    const deltaTime = now - lastUpdateTime;
    lastUpdateTime = now;

    // Update players
    players.forEach(player => {
        if (!player.isAlive) return;

        player.x += player.velocityX * (deltaTime / 1000);
        player.y += player.velocityY * (deltaTime / 1000);

        player.velocityX *= 0.95;
        player.velocityY *= 0.95;

        player.x = Math.max(0, Math.min(WORLD_SIZE, player.x));
        player.y = Math.max(0, Math.min(WORLD_SIZE, player.y));
    });

    // Update enemies
    enemies.forEach(enemy => updateEnemyAI(enemy, deltaTime));

    // Clean up dead enemies
    cleanupDeadEnemies();

    // Spawn new enemies if needed
    const aliveEnemies = Array.from(enemies.values()).filter(e => e.isAlive).length;
    if (aliveEnemies < MAX_ENEMIES && Math.random() < 0.01) {
        spawnEnemy();
    }

    // NEW: Update thrown swords
    const SWORD_DAMAGE = 35;
    const swordsToRemove = [];

    thrownSwords.forEach((sword, swordId) => {
        // Move sword
        sword.x += sword.velocityX * (deltaTime / 1000);
        sword.y += sword.velocityY * (deltaTime / 1000);
        sword.distance += Math.sqrt(
            Math.pow(sword.velocityX * (deltaTime / 1000), 2) +
            Math.pow(sword.velocityY * (deltaTime / 1000), 2)
        );

        // Check collision with enemies
        let hitEnemy = false;
        enemies.forEach(enemy => {
            if (!enemy.isAlive || hitEnemy) return;

            const distance = Math.sqrt(
                Math.pow(sword.x - enemy.x, 2) +
                Math.pow(sword.y - enemy.y, 2)
            );

            if (distance <= 25) {
                hitEnemy = true;
                enemy.health -= SWORD_DAMAGE;

                const angle = Math.atan2(enemy.y - sword.y, enemy.x - sword.x);
                enemy.velocityX = Math.cos(angle) * 300;
                enemy.velocityY = Math.sin(angle) * 300;

                if (enemy.health <= 0) {
                    enemy.health = 0;
                    enemy.isAlive = false;
                    enemy.deathTime = Date.now();

                    const resourceCount = Math.floor(Math.random() * 4) + 2;
                    for (let i = 0; i < resourceCount; i++) {
                        const resource = {
                            id: nextResourceId++,
                            x: enemy.x + (Math.random() - 0.5) * 50,
                            y: enemy.y + (Math.random() - 0.5) * 50
                        };
                        resources.set(resource.id, resource);
                        io.emit('resourceDropped', resource);
                    }
                }

                io.emit('swordHit', {
                    swordId: sword.id,
                    enemyId: enemy.id,
                    damage: SWORD_DAMAGE,
                    enemyHealth: enemy.health,
                    enemyAlive: enemy.isAlive
                });

                swordsToRemove.push(swordId);
            }
        });

        // Remove sword if it traveled too far or hit something
        if (sword.distance >= sword.maxDistance || hitEnemy ||
            sword.x < 0 || sword.x > WORLD_SIZE ||
            sword.y < 0 || sword.y > WORLD_SIZE) {
            swordsToRemove.push(swordId);
        }
    });

    // Remove marked swords
    swordsToRemove.forEach(swordId => {
        thrownSwords.delete(swordId);
        io.emit('swordRemoved', swordId);
    });

    // Emit game state
    io.emit('gameState', {
        players: Array.from(players.values()),
        enemies: Array.from(enemies.values())
    });

    // Emit sword updates
    if (thrownSwords.size > 0) {
        io.emit('swordUpdate', Array.from(thrownSwords.values()));
    }

}, 1000 / TICK_RATE);

// Initialize game
initializeEnemies();

// Start server
httpServer.listen(PORT, () => {
    console.log('=================================');
    console.log(`✅ SwordForge Server Running`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`🔐 JWT Authentication: Enabled`);
    console.log(`🎮 Game Ready: ${enemies.size} enemies spawned`);
    console.log(`⚔️ Enhanced Combat: Active`);
    console.log('=================================');
});