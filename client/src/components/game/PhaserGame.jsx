// src/components/game/PhaserGame.jsx
import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { io } from 'socket.io-client';
import Entity from '../../game/entities/Entity';
import ConnectionStatus from '../ui/ConnectionStatus';

const PhaserGame = ({ playerName, user }) => {
    const gameRef = useRef(null);
    const phaserGameRef = useRef(null);
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState('');
    const [gameStats, setGameStats] = useState({
        health: 100,
        maxHealth: 100,
        resources: 0,
        playerCount: 0,
        enemyCount: 0,
        position: { x: 0, y: 0 }
    });

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        console.log('Auth Token:', token);
        if (!token) {
            setConnectionError('Authentication required');
            return;
        }

        // Connect to server with authentication
        const socket = io('http://localhost:3000', {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to server');
            setIsConnected(true);
            setConnectionError('');
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from server');
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            setConnectionError('Cannot connect to server. Make sure server is running.');
        });

        // Game state
        let localPlayer;
        let otherPlayers = new Map();
        let enemies = new Map();
        let resourceSprites = new Map();
        let thrownSwords = new Map();
        let cursors;
        let wasdKeys;
        let spaceKey;
        let shiftKey; // NEW: Dash key
        let background;
        let playerId;
        const TILE_SIZE = 64;
        let WORLD_SIZE = 3000;
        let BORDER_THICKNESS = 200;
        let minimapGraphics;
        let minimapData;

        // NEW: Dash mechanics
        let dashCharges = 3;
        let maxDashCharges = 3;
        let dashRechargeTimer = 0;
        let dashRechargeRate = 5000; // 5 seconds per charge
        let isDashing = false;
        let isChargingDash = false;
        let dashChargeStartTime = 0;
        let dashChargeAmount = 0;
        let dashUI = null;

        // Phaser scene functions
        function preload() {
            // Create tileable background
            const graphics = this.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0x34495e, 1);
            graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
            graphics.lineStyle(2, 0x2c3e50, 1);
            graphics.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
            graphics.lineStyle(1, 0x3d5a73, 0.5);
            graphics.lineBetween(0, 0, TILE_SIZE, TILE_SIZE);
            graphics.lineBetween(TILE_SIZE, 0, 0, TILE_SIZE);
            graphics.generateTexture('bgTile', TILE_SIZE, TILE_SIZE);
            graphics.destroy();

            // Create red danger tile
            const dangerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
            dangerGraphics.fillStyle(0x8B0000, 1);
            dangerGraphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
            dangerGraphics.lineStyle(2, 0xFF0000, 1);
            dangerGraphics.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
            dangerGraphics.lineStyle(1, 0xFF4444, 0.5);
            dangerGraphics.lineBetween(0, 0, TILE_SIZE, TILE_SIZE);
            dangerGraphics.lineBetween(TILE_SIZE, 0, 0, TILE_SIZE);
            dangerGraphics.generateTexture('dangerTile', TILE_SIZE, TILE_SIZE);
            dangerGraphics.destroy();
        }

        function create() {
            const scene = this;

            // Setup controls
            cursors = this.input.keyboard.createCursorKeys();
            wasdKeys = {
                W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
            };
            spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
            shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

            // Create dash UI in top right
            createDashUI.call(this);

            // Socket event handlers
            socket.on('init', (data) => {
                console.log('Initialized game state', data);
                playerId = data.playerId;
                WORLD_SIZE = data.worldSize;
                BORDER_THICKNESS = data.borderThickness;

                // Create world
                createWorld.call(scene);

                // Create local player
                const playerData = data.players.find(p => p.id === playerId);
                localPlayer = new Entity(scene, playerData.x, playerData.y, { r: 255, g: 203, b: 164 }, 20);
                localPlayer.nameText.setText(playerName || user.username);
                localPlayer.health = playerData.health;
                localPlayer.resources = playerData.resources || {
                    IRON: 0, STEEL: 0, STONE: 0, WOOD: 0, CRYSTAL: 0, MYTHRIL: 0
                };
                localPlayer.isAlive = playerData.isAlive;
                localPlayer.updateHealthBar();

                // Create other players
                data.players.forEach(p => {
                    if (p.id !== playerId) {
                        const player = new Entity(scene, p.x, p.y, { r: 100, g: 200, b: 255 }, 20);
                        player.nameText.setText(p.username || `Player ${p.id.substring(0, 4)}`);
                        player.health = p.health;
                        player.isAlive = p.isAlive;
                        player.updateHealthBar();
                        otherPlayers.set(p.id, player);
                    }
                });

                // Create enemies
                data.enemies.forEach(e => {
                    const enemy = new Entity(scene, e.x, e.y, { r: 255, g: 80, b: 80 }, 18);
                    enemy.nameText.setText('Enemy');
                    enemy.health = e.health;
                    enemy.isAlive = e.isAlive;
                    enemy.updateHealthBar();
                    enemies.set(e.id, enemy);
                });

                // Create resources with pulse animation
                data.resources.forEach(r => {
                    const resource = scene.add.circle(r.x, r.y, 8, 0xffd700);
                    resource.setStrokeStyle(2, 0xffaa00);
                    resourceSprites.set(r.id, resource);
                });

                // Camera follow local player
                scene.cameras.main.startFollow(localPlayer.sprite, true, 0.1, 0.1);
                scene.cameras.main.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);

                // Create minimap
                createMinimap.call(scene);

                // Update stats
                updateGameStats();
            });

            socket.on('gameState', (data) => {
                // Update other players with smooth interpolation
                data.players.forEach(p => {
                    if (p.id === playerId) return;

                    let player = otherPlayers.get(p.id);
                    if (player) {
                        // Smooth position interpolation
                        player.x = Phaser.Math.Linear(player.x, p.x, 0.3);
                        player.y = Phaser.Math.Linear(player.y, p.y, 0.3);
                        player.health = p.health;
                        player.facingAngle = p.facingAngle;
                        player.isAlive = p.isAlive;
                        player.updateHealthBar();
                        if (!p.isAlive && player.isAlive) {
                            player.die();
                        } else if (p.isAlive && !player.isAlive) {
                            player.revive();
                        }
                    }
                });

                // Update enemies with smooth interpolation
                data.enemies.forEach(e => {
                    let enemy = enemies.get(e.id);
                    if (enemy) {
                        // Smooth position interpolation to prevent teleporting
                        enemy.x = Phaser.Math.Linear(enemy.x, e.x, 0.3);
                        enemy.y = Phaser.Math.Linear(enemy.y, e.y, 0.3);
                        enemy.health = e.health;
                        enemy.facingAngle = e.facingAngle;
                        enemy.isAlive = e.isAlive;
                        enemy.updateHealthBar();
                        if (!e.isAlive && enemy.isAlive) {
                            enemy.die();
                        }
                    }
                });

                updateGameStats();
            });

            socket.on('playerJoined', (playerData) => {
                console.log('Player joined:', playerData.username);
                const player = new Entity(scene, playerData.x, playerData.y, { r: 100, g: 200, b: 255 }, 20);
                player.nameText.setText(playerData.username || `Player ${playerData.id.substring(0, 4)}`);
                player.health = playerData.health;
                player.updateHealthBar();
                otherPlayers.set(playerData.id, player);
                updateGameStats();
            });

            socket.on('playerLeft', (leftPlayerId) => {
                console.log('Player left:', leftPlayerId);
                const player = otherPlayers.get(leftPlayerId);
                if (player) {
                    player.destroy();
                    otherPlayers.delete(leftPlayerId);
                }
                updateGameStats();
            });

            socket.on('playerAttacked', (data) => {
                const enemy = enemies.get(data.enemyId);
                if (enemy) {
                    enemy.health = data.enemyHealth;
                    enemy.takeDamage(0);
                    enemy.updateHealthBar();

                    if (!data.enemyAlive) {
                        enemy.die();
                    }
                }

                // ALWAYS play attack animation for the attacker
                if (data.playerId === playerId && localPlayer) {
                    localPlayer.playAttackAnimation();
                } else {
                    const player = otherPlayers.get(data.playerId);
                    if (player) player.playAttackAnimation();
                }
            });

            // NEW: Handle thrown sword creation
            socket.on('swordThrown', (data) => {
                console.log('Sword thrown:', data);

                // Create thrown sword sprite
                const sword = scene.add.rectangle(data.x, data.y, 40, 8, 0xC0C0C0);
                sword.setStrokeStyle(2, 0xFFFFFF, 1);
                sword.setRotation(data.angle);
                sword.setDepth(5);

                // Add glow effect
                const glow = scene.add.circle(data.x, data.y, 20, 0x00FFFF, 0.3);
                glow.setDepth(4);

                thrownSwords.set(data.id, { sword, glow, data });

                // Play throw animation for the player
                if (data.playerId === playerId && localPlayer) {
                    localPlayer.playThrowAnimation();
                } else {
                    const player = otherPlayers.get(data.playerId);
                    if (player) player.playThrowAnimation();
                }
            });

            // NEW: Handle thrown sword updates
            socket.on('swordUpdate', (swords) => {
                swords.forEach(swordData => {
                    const sword = thrownSwords.get(swordData.id);
                    if (sword) {
                        sword.sword.setPosition(swordData.x, swordData.y);
                        sword.sword.setRotation(sword.sword.rotation + 0.3); // Spinning effect
                        sword.glow.setPosition(swordData.x, swordData.y);
                    }
                });
            });

            // NEW: Handle thrown sword hits
            socket.on('swordHit', (data) => {
                const sword = thrownSwords.get(data.swordId);
                const enemy = enemies.get(data.enemyId);

                if (enemy) {
                    enemy.health = data.enemyHealth;
                    enemy.takeDamage(0);
                    enemy.updateHealthBar();

                    if (!data.enemyAlive) {
                        enemy.die();
                    }
                }

                if (sword) {
                    // Impact effect
                    const impact = scene.add.circle(sword.sword.x, sword.sword.y, 20, 0xFFFF00, 0.8);
                    scene.tweens.add({
                        targets: impact,
                        scale: 3,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => impact.destroy()
                    });
                }
            });

            // NEW: Handle thrown sword removal
            socket.on('swordRemoved', (swordId) => {
                const sword = thrownSwords.get(swordId);
                if (sword) {
                    // Fade out effect
                    scene.tweens.add({
                        targets: [sword.sword, sword.glow],
                        alpha: 0,
                        duration: 200,
                        onComplete: () => {
                            sword.sword.destroy();
                            sword.glow.destroy();
                            thrownSwords.delete(swordId);
                        }
                    });
                }
            });

            socket.on('enemyAttack', (data) => {
                const enemy = enemies.get(data.enemyId);
                if (enemy) {
                    enemy.playAttackAnimation();
                }

                if (data.targetId === playerId && localPlayer) {
                    localPlayer.takeDamage(data.damage);
                    updateGameStats();
                } else {
                    const player = otherPlayers.get(data.targetId);
                    if (player) player.takeDamage(data.damage);
                }
            });

            socket.on('resourceDropped', (resource) => {
                const sprite = scene.add.circle(resource.x, resource.y, 8, 0xffd700);
                sprite.setStrokeStyle(2, 0xffaa00);
                resourceSprites.set(resource.id, sprite);
            });

            socket.on('resourceCollected', (data) => {
                const sprite = resourceSprites.get(data.resourceId);
                if (sprite) {
                    // Add collection animation
                    scene.tweens.add({
                        targets: sprite,
                        scale: 2,
                        alpha: 0,
                        duration: 200,
                        onComplete: () => {
                            sprite.destroy();
                            resourceSprites.delete(data.resourceId);
                        }
                    });
                }
                socket.on('resourcesUpdated', (data) => {
                    // Update your player progress state with the new resources
                    setPlayerProgress(prev => ({
                        ...prev,
                        resources: data.resources,
                        experience: data.experience,
                        level: data.level
                    }));

                    // Optionally show a level up notification
                    if (data.leveledUp) {
                        console.log('Level up!', data.level);
                        // Show level up animation/notification
                    }
                });

                if (data.playerId === playerId && localPlayer) {
                    localPlayer.resources++;
                    updateGameStats();
                }
            });

            socket.on('enemySpawned', (enemy) => {
                const enemySprite = new Entity(scene, enemy.x, enemy.y, { r: 255, g: 80, b: 80 }, 18);
                enemySprite.nameText.setText('Enemy');
                enemySprite.health = enemy.health;
                enemySprite.updateHealthBar();
                enemies.set(enemy.id, enemySprite);
                updateGameStats();
            });

            // NEW EVENT: Enemy completely removed from game
            socket.on('enemyRemoved', (enemyId) => {
                const enemy = enemies.get(enemyId);
                if (enemy) {
                    enemy.destroy();
                    enemies.delete(enemyId);
                    updateGameStats();
                }
            });
            socket.on('enemyRespawned', (enemyData) => {
                // Find and update the enemy, or create a new one
                const existingEnemy = enemies.get(enemyData.id);
                if (existingEnemy) {
                    existingEnemy.setPosition(enemyData.x, enemyData.y);
                    existingEnemy.health = enemyData.health;
                    existingEnemy.isAlive = true;
                    // Reset any visual state (health bars, etc.)
                } else {
                    // Create new enemy sprite
                    createEnemy(enemyData);
                }
            });

            socket.on('playerRespawned', (playerData) => {
                if (playerData.id === playerId && localPlayer) {
                    localPlayer.x = playerData.x;
                    localPlayer.y = playerData.y;
                    localPlayer.revive();
                    updateGameStats();
                } else {
                    const player = otherPlayers.get(playerData.id);
                    if (player) {
                        player.x = playerData.x;
                        player.y = playerData.y;
                        player.revive();
                    }
                }
            });
        }

        function createWorld() {
            // Main play area
            background = this.add.tileSprite(
                BORDER_THICKNESS,
                BORDER_THICKNESS,
                WORLD_SIZE - BORDER_THICKNESS * 2,
                WORLD_SIZE - BORDER_THICKNESS * 2,
                'bgTile'
            );
            background.setOrigin(0, 0);

            // Borders
            this.add.tileSprite(0, 0, WORLD_SIZE, BORDER_THICKNESS, 'dangerTile').setOrigin(0, 0);
            this.add.tileSprite(0, WORLD_SIZE - BORDER_THICKNESS, WORLD_SIZE, BORDER_THICKNESS, 'dangerTile').setOrigin(0, 0);
            this.add.tileSprite(0, BORDER_THICKNESS, BORDER_THICKNESS, WORLD_SIZE - BORDER_THICKNESS * 2, 'dangerTile').setOrigin(0, 0);
            this.add.tileSprite(WORLD_SIZE - BORDER_THICKNESS, BORDER_THICKNESS, BORDER_THICKNESS, WORLD_SIZE - BORDER_THICKNESS * 2, 'dangerTile').setOrigin(0, 0);
        }

        function createMinimap() {
            const minimapSize = 150;
            minimapGraphics = this.add.graphics();
            minimapGraphics.setScrollFactor(0);
            minimapGraphics.setDepth(200);

            minimapData = {
                x: this.scale.width - minimapSize - 10,
                y: 10,
                size: minimapSize,
                scale: minimapSize / WORLD_SIZE
            };
        }

        function createDashUI() {
            const uiX = 10;
            const uiY = 10;

            dashUI = {
                graphics: this.add.graphics(),
                chargeText: this.add.text(uiX + 100, uiY + 15, '', {
                    fontSize: '14px',
                    fill: '#fff',
                    fontStyle: 'bold'
                })
            };

            dashUI.graphics.setScrollFactor(0);
            dashUI.graphics.setDepth(300);
            dashUI.chargeText.setScrollFactor(0);
            dashUI.chargeText.setDepth(301);
            dashUI.chargeText.setOrigin(0, 0.5);
        }

        function updateDashUI() {
            if (!dashUI) return;

            const uiX = 10;
            const uiY = 10;
            const chargeSize = 25;
            const spacing = 5;

            dashUI.graphics.clear();

            // Draw charge slots
            for (let i = 0; i < maxDashCharges; i++) {
                const x = uiX + i * (chargeSize + spacing);
                const y = uiY;

                if (i < dashCharges) {
                    // Full charge - cyan
                    dashUI.graphics.fillStyle(0x00FFFF, 0.8);
                    dashUI.graphics.fillRoundedRect(x, y, chargeSize, chargeSize, 5);
                    dashUI.graphics.lineStyle(2, 0xFFFFFF, 1);
                    dashUI.graphics.strokeRoundedRect(x, y, chargeSize, chargeSize, 5);
                } else {
                    // Empty charge - dark
                    dashUI.graphics.fillStyle(0x333333, 0.5);
                    dashUI.graphics.fillRoundedRect(x, y, chargeSize, chargeSize, 5);
                    dashUI.graphics.lineStyle(2, 0x666666, 0.5);
                    dashUI.graphics.strokeRoundedRect(x, y, chargeSize, chargeSize, 5);

                    // Show recharge progress on first empty slot
                    if (i === dashCharges && dashRechargeTimer > 0) {
                        const progress = dashRechargeTimer / dashRechargeRate;
                        dashUI.graphics.fillStyle(0x00FFFF, 0.4);
                        dashUI.graphics.fillRoundedRect(
                            x,
                            y + chargeSize * (1 - progress),
                            chargeSize,
                            chargeSize * progress,
                            5
                        );
                    }
                }
            }

            // Charging indicator
            if (isChargingDash) {
                const chargePercent = Math.min(dashChargeAmount / 1000, 1);
                dashUI.chargeText.setText(`⚡ CHARGING ${Math.floor(chargePercent * 100)}%`);
                dashUI.chargeText.setColor('#ffff00');
            } else {
                dashUI.chargeText.setText('');
            }
        }

        function updateMinimap() {
            if (!minimapData || !minimapGraphics || !localPlayer) return;

            minimapGraphics.clear();
            const mm = minimapData;

            // Background
            minimapGraphics.fillStyle(0x000000, 0.7);
            minimapGraphics.fillRect(mm.x, mm.y, mm.size, mm.size);

            // Border
            minimapGraphics.lineStyle(2, 0xFF0000, 0.5);
            minimapGraphics.strokeRect(mm.x, mm.y, mm.size, mm.size);

            // Safe zone
            const safeZoneOffset = (BORDER_THICKNESS / WORLD_SIZE) * mm.size;
            minimapGraphics.lineStyle(1, 0x00FF00, 0.3);
            minimapGraphics.strokeRect(
                mm.x + safeZoneOffset,
                mm.y + safeZoneOffset,
                mm.size - safeZoneOffset * 2,
                mm.size - safeZoneOffset * 2
            );

            // Local player
            minimapGraphics.fillStyle(0xFFCBA4, 1);
            minimapGraphics.fillCircle(
                mm.x + (localPlayer.x / WORLD_SIZE) * mm.size,
                mm.y + (localPlayer.y / WORLD_SIZE) * mm.size,
                3
            );

            // Other players
            otherPlayers.forEach(player => {
                minimapGraphics.fillStyle(0x64C8FF, 1);
                minimapGraphics.fillCircle(
                    mm.x + (player.x / WORLD_SIZE) * mm.size,
                    mm.y + (player.y / WORLD_SIZE) * mm.size,
                    3
                );
            });

            // Enemies
            enemies.forEach(enemy => {
                if (enemy.isAlive) {
                    minimapGraphics.fillStyle(0xFF5050, 1);
                    minimapGraphics.fillCircle(
                        mm.x + (enemy.x / WORLD_SIZE) * mm.size,
                        mm.y + (enemy.y / WORLD_SIZE) * mm.size,
                        2
                    );
                }
            });

            // Border
            minimapGraphics.lineStyle(2, 0xffffff, 1);
            minimapGraphics.strokeRect(mm.x, mm.y, mm.size, mm.size);
        }

        function updateGameStats() {
            if (localPlayer) {
                const totalResources = Object.values(localPlayer.resources).reduce((sum, val) => sum + val, 0);
                setGameStats({
                    health: localPlayer.health,
                    maxHealth: localPlayer.maxHealth,
                    resources: totalResources,
                    playerCount: otherPlayers.size + 1,
                    enemyCount: Array.from(enemies.values()).filter(e => e.isAlive).length,
                    position: { x: Math.round(localPlayer.x), y: Math.round(localPlayer.y) }
                });
            }
        }

        function update() {
            if (!localPlayer || !localPlayer.isAlive) {
                if (localPlayer && !localPlayer.isAlive) {
                    // Auto-respawn after 5 seconds
                    if (!this.respawnTimer) {
                        this.respawnTimer = this.time.delayedCall(5000, () => {
                            socket.emit('respawn');
                            this.respawnTimer = null;
                        });
                    }
                }
                return;
            }

            // Update dash recharge
            if (dashCharges < maxDashCharges) {
                dashRechargeTimer += 16.67; // ~60fps
                if (dashRechargeTimer >= dashRechargeRate) {
                    dashCharges++;
                    dashRechargeTimer = 0;
                }
            } else {
                dashRechargeTimer = 0;
            }

            // Handle dash charging
            if (shiftKey.isDown && !isDashing && dashCharges > 0) {
                if (!isChargingDash) {
                    isChargingDash = true;
                    dashChargeStartTime = Date.now();
                }
                dashChargeAmount = Date.now() - dashChargeStartTime;

                // Visual charging effect
                if (!localPlayer.chargeEffect) {
                    localPlayer.chargeEffect = this.add.circle(localPlayer.x, localPlayer.y, 30, 0xffff00, 0.3);
                    localPlayer.chargeEffect.setDepth(0);
                }
                localPlayer.chargeEffect.setPosition(localPlayer.x, localPlayer.y);
                const pulseScale = 1 + Math.sin(Date.now() / 100) * 0.2;
                localPlayer.chargeEffect.setScale(pulseScale);
            // } else if (Phaser.Input.Keyboard.JustUp(shiftKey) && isChargingDash) {
            //     // Release dash
            //     isChargingDash = false;
            //
            //     if (localPlayer.chargeEffect) {
            //         localPlayer.chargeEffect.destroy();
            //         localPlayer.chargeEffect = null;
            //     }
            //
            //     if (dashCharges > 0) {
            //         dashCharges--;
            //         isDashing = true;
            //
            //         const chargeTime = Math.min(dashChargeAmount, 2000); // Max 2 seconds
            //         const dashSpeed = 500 + (chargeTime / 2000) * 500; // 500-1000 speed
            //         const dashDamageBoost = 1 + (chargeTime / 2000); // 1x-2x damage
            //
            //         // Dash in facing direction
            //         const dashVelX = Math.cos(localPlayer.facingAngle) * dashSpeed;
            //         const dashVelY = Math.sin(localPlayer.facingAngle) * dashSpeed;
            //
            //         // Dash trail effect
            //         for (let i = 0; i < 5; i++) {
            //             this.time.delayedCall(i * 30, () => {
            //                 const trail = this.add.circle(localPlayer.x, localPlayer.y, 20, 0x00ffff, 0.5);
            //                 this.tweens.add({
            //                     targets: trail,
            //                     alpha: 0,
            //                     scale: 0.5,
            //                     duration: 300,
            //                     onComplete: () => trail.destroy()
            //                 });
            //             });
            //         }
            //
            //         socket.emit('playerDash', {
            //             velocityX: dashVelX,
            //             velocityY: dashVelY,
            //             damageBoost: dashDamageBoost,
            //             duration: 200
            //         });
            //
            //         // Apply dash velocity locally
            //         localPlayer.x += dashVelX * 0.2;
            //         localPlayer.y += dashVelY * 0.2;
            //
            //         // Reset dash state
            //         this.time.delayedCall(200, () => {
            //             isDashing = false;
            //         });
            //
            //         dashChargeAmount = 0;
            //     }
            // }
            } else if (Phaser.Input.Keyboard.JustUp(shiftKey) && isChargingDash) {
                // Release dash
                isChargingDash = false;

                if (localPlayer.chargeEffect) {
                    localPlayer.chargeEffect.destroy();
                    localPlayer.chargeEffect = null;
                }

                if (dashCharges > 0) {
                    dashCharges--;
                    isDashing = true;

                    const chargeTime = Math.min(dashChargeAmount, 2000); // Max 2 seconds
                    const speedMultiplier = 5 + (chargeTime / 2000) * 5; // 5x-10x speed boost
                    const dashDamageBoost = 1 + (chargeTime / 2000); // 1x-2x damage

                    // Store original velocity for smooth transition
                    const baseVelX = Math.cos(localPlayer.facingAngle) * 160;
                    const baseVelY = Math.sin(localPlayer.facingAngle) * 160;

                    const dashVelX = baseVelX * speedMultiplier;
                    const dashVelY = baseVelY * speedMultiplier;

                    // Apply dash velocity with decay over 500ms
                    let dashStartTime = Date.now();
                    const dashDuration = 500;

                    // Store dash state
                    this.dashState = {
                        active: true,
                        startTime: dashStartTime,
                        duration: dashDuration,
                        velocityX: dashVelX,
                        velocityY: dashVelY,
                        damageBoost: dashDamageBoost
                    };

                    // Dash trail effect
                    const trailInterval = setInterval(() => {
                        if (!this.dashState || !this.dashState.active) {
                            clearInterval(trailInterval);
                            return;
                        }
                        const trail = this.add.circle(localPlayer.x, localPlayer.y, 20, 0x00ffff, 0.5);
                        this.tweens.add({
                            targets: trail,
                            alpha: 0,
                            scale: 0.5,
                            duration: 300,
                            onComplete: () => trail.destroy()
                        });
                    }, 30);

                    // End dash after duration
                    this.time.delayedCall(dashDuration, () => {
                        isDashing = false;
                        if (this.dashState) {
                            this.dashState.active = false;
                            this.dashState = null;
                        }
                        clearInterval(trailInterval);
                    });

                    // Notify server
                    socket.emit('playerDash', {
                        velocityX: dashVelX,
                        velocityY: dashVelY,
                        damageBoost: dashDamageBoost,
                        duration: dashDuration
                    });

                    dashChargeAmount = 0;
                }
            }

            // // Regular movement (disabled during dash)
            // let velocityX = 0;
            // let velocityY = 0;
            //
            // if (!isDashing) {
            //     if (wasdKeys.A.isDown || cursors.left.isDown) velocityX = -160;
            //     else if (wasdKeys.D.isDown || cursors.right.isDown) velocityX = 160;
            //
            //     if (wasdKeys.W.isDown || cursors.up.isDown) velocityY = -160;
            //     else if (wasdKeys.S.isDown || cursors.down.isDown) velocityY = 160;
            //
            //     // Normalize diagonal
            //     if (velocityX !== 0 && velocityY !== 0) {
            //         const normalizer = Math.sqrt(2);
            //         velocityX /= normalizer;
            //         velocityY /= normalizer;
            //     }
            //
            //     // Update facing angle
            //     if (velocityX !== 0 || velocityY !== 0) {
            //         localPlayer.facingAngle = Math.atan2(velocityY, velocityX);
            //     }
            //
            //     // Send movement to server
            //     socket.emit('playerMove', {
            //         velocityX,
            //         velocityY,
            //         facingAngle: localPlayer.facingAngle
            //     });
            //
            //     // Client-side prediction
            //     localPlayer.x += velocityX * (1/60);
            //     localPlayer.y += velocityY * (1/60);
            //}
            // Regular movement (modified during dash)
            let velocityX = 0;
            let velocityY = 0;

            if (isDashing && this.dashState && this.dashState.active) {
                // Apply dash velocity with decay
                const elapsed = Date.now() - this.dashState.startTime;
                const progress = Math.min(elapsed / this.dashState.duration, 1);
                const decayFactor = 1 - (progress * 0.3); // Slight decay over time

                velocityX = this.dashState.velocityX * decayFactor;
                velocityY = this.dashState.velocityY * decayFactor;
            } else {
                // Normal movement
                if (wasdKeys.A.isDown || cursors.left.isDown) velocityX = -160;
                else if (wasdKeys.D.isDown || cursors.right.isDown) velocityX = 160;

                if (wasdKeys.W.isDown || cursors.up.isDown) velocityY = -160;
                else if (wasdKeys.S.isDown || cursors.down.isDown) velocityY = 160;

                // Normalize diagonal
                if (velocityX !== 0 && velocityY !== 0) {
                    const normalizer = Math.sqrt(2);
                    velocityX /= normalizer;
                    velocityY /= normalizer;
                }
            }

            // Update facing angle (from actual movement or input)
            if (velocityX !== 0 || velocityY !== 0) {
                localPlayer.facingAngle = Math.atan2(velocityY, velocityX);
            }

            // Send movement to server
            socket.emit('playerMove', {
                velocityX,
                velocityY,
                facingAngle: localPlayer.facingAngle
            });

            // Client-side prediction
            localPlayer.x += velocityX * (1/60);
            localPlayer.y += velocityY * (1/60);


            localPlayer.update();

            // Attack - SPACE key (always plays animation)
            if (Phaser.Input.Keyboard.JustDown(spaceKey)) {
                localPlayer.playAttackAnimation(); // Always play animation locally
                socket.emit('playerAttack');
            }

            // Throw sword - C key or Mouse Click
            if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C)) ||
                this.input.activePointer.isDown && this.input.activePointer.justDown) {

                const now = Date.now();
                if (!this.lastThrowTime || now - this.lastThrowTime > 2000) { // 2 second cooldown
                    this.lastThrowTime = now;

                    // Get mouse position in world coordinates
                    const worldPoint = this.cameras.main.getWorldPoint(
                        this.input.activePointer.x,
                        this.input.activePointer.y
                    );

                    const angle = Math.atan2(
                        worldPoint.y - localPlayer.y,
                        worldPoint.x - localPlayer.x
                    );

                    socket.emit('throwSword', { angle });
                }
            }

            // IMPROVED RESOURCE COLLECTION - Only collect when very close
            const COLLECTION_RANGE = 25; // Tighter collection

            resourceSprites.forEach((sprite, id) => {
                const distance = Phaser.Math.Distance.Between(
                    localPlayer.x, localPlayer.y, sprite.x, sprite.y
                );

                // Only collect if very close (inside player circle basically)
                if (distance <= COLLECTION_RANGE) {
                    socket.emit('collectResource', id);
                }
            });

            // Update other entities
            otherPlayers.forEach(player => player.update());
            enemies.forEach(enemy => enemy.update());

            // Update minimap
            updateMinimap.call(this);

            // Update dash UI
            updateDashUI.call(this);

            // Update stats display
            updateGameStats();
        }

        // Phaser config
        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: gameRef.current,
            backgroundColor: '#2d3436',
            scene: {
                preload: preload,
                create: create,
                update: update
            }
        };

        // Initialize game
        phaserGameRef.current = new Phaser.Game(config);

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            if (phaserGameRef.current) {
                phaserGameRef.current.destroy(true);
                phaserGameRef.current = null;
            }
        };
    }, [playerName, user]);

    return (
        <div>
            <ConnectionStatus isConnected={isConnected} error={connectionError} />
            <div
                ref={gameRef}
                className="border-4 border-gray-700 rounded-lg shadow-2xl mt-4"
                style={{ width: '800px', height: '600px' }}
            />
        </div>
    );
};

export default PhaserGame;