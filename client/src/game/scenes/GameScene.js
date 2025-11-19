// src/game/scenes/GameScene.js
import Phaser from 'phaser';
import Entity from '../entities/Entity';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });

        // Game state
        this.localPlayer = null;
        this.otherPlayers = new Map();
        this.enemies = new Map();
        this.resourceSprites = new Map();
        this.playerId = null;

        // World config
        this.TILE_SIZE = 64;
        this.WORLD_SIZE = 3000;
        this.BORDER_THICKNESS = 200;

        // Controls
        this.cursors = null;
        this.wasdKeys = null;
        this.spaceKey = null;

        // References
        this.socket = null;
        this.playerName = '';
        this.onStatsUpdate = null;
        this.background = null;
    }

    init(data) {
        // Receive data from game component
        this.socket = data.socket;
        this.playerName = data.playerName;
        this.onStatsUpdate = data.onStatsUpdate;
    }

    preload() {
        // Create tileable background texture
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x34495e, 1);
        graphics.fillRect(0, 0, this.TILE_SIZE, this.TILE_SIZE);
        graphics.lineStyle(2, 0x2c3e50, 1);
        graphics.strokeRect(0, 0, this.TILE_SIZE, this.TILE_SIZE);
        graphics.lineStyle(1, 0x3d5a73, 0.5);
        graphics.lineBetween(0, 0, this.TILE_SIZE, this.TILE_SIZE);
        graphics.lineBetween(this.TILE_SIZE, 0, 0, this.TILE_SIZE);
        graphics.generateTexture('bgTile', this.TILE_SIZE, this.TILE_SIZE);
        graphics.destroy();

        // Create red danger tile texture
        const dangerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        dangerGraphics.fillStyle(0x8B0000, 1);
        dangerGraphics.fillRect(0, 0, this.TILE_SIZE, this.TILE_SIZE);
        dangerGraphics.lineStyle(2, 0xFF0000, 1);
        dangerGraphics.strokeRect(0, 0, this.TILE_SIZE, this.TILE_SIZE);
        dangerGraphics.lineStyle(1, 0xFF4444, 0.5);
        dangerGraphics.lineBetween(0, 0, this.TILE_SIZE, this.TILE_SIZE);
        dangerGraphics.lineBetween(this.TILE_SIZE, 0, 0, this.TILE_SIZE);
        dangerGraphics.generateTexture('dangerTile', this.TILE_SIZE, this.TILE_SIZE);
        dangerGraphics.destroy();
    }

    create() {
        // Setup controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasdKeys = {
            W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Setup socket event listeners
        this.setupSocketListeners();
    }

    setupSocketListeners() {
        if (!this.socket) return;

        // Initialize game state
        this.socket.on('init', (data) => {
            console.log('Game initialized', data);
            this.playerId = data.playerId;
            this.WORLD_SIZE = data.worldSize;
            this.BORDER_THICKNESS = data.borderThickness;

            // Create world
            this.createWorld();

            // Create local player
            const playerData = data.players.find(p => p.id === this.playerId);
            this.localPlayer = new Entity(this, playerData.x, playerData.y, { r: 255, g: 203, b: 164 }, 20);
            this.localPlayer.nameText.setText(this.playerName);
            this.localPlayer.health = playerData.health;
            this.localPlayer.resources = playerData.resources || 0;
            this.localPlayer.isAlive = playerData.isAlive;
            this.localPlayer.updateHealthBar();

            // Create other players
            data.players.forEach(p => {
                if (p.id !== this.playerId) {
                    const player = new Entity(this, p.x, p.y, { r: 100, g: 200, b: 255 }, 20);
                    player.nameText.setText(p.username || `Player ${p.id.substring(0, 4)}`);
                    player.health = p.health;
                    player.isAlive = p.isAlive;
                    player.updateHealthBar();
                    this.otherPlayers.set(p.id, player);
                }
            });

            // Create enemies
            data.enemies.forEach(e => {
                const enemy = new Entity(this, e.x, e.y, { r: 255, g: 80, b: 80 }, 18);
                enemy.nameText.setText('Enemy');
                enemy.health = e.health;
                enemy.isAlive = e.isAlive;
                enemy.updateHealthBar();
                this.enemies.set(e.id, enemy);
            });

            // Create resources
            data.resources.forEach(r => {
                const resource = this.add.circle(r.x, r.y, 8, 0xffd700);
                resource.setStrokeStyle(2, 0xffaa00);
                this.resourceSprites.set(r.id, resource);
            });

            // Camera follow local player
            this.cameras.main.startFollow(this.localPlayer.sprite, true, 0.1, 0.1);
            this.cameras.main.setBounds(0, 0, this.WORLD_SIZE, this.WORLD_SIZE);

            // Update stats
            this.updateStats();
        });

        // Game state updates
        this.socket.on('gameState', (data) => {
            // Update other players
            data.players.forEach(p => {
                if (p.id === this.playerId) return;

                let player = this.otherPlayers.get(p.id);
                if (player) {
                    player.x = p.x;
                    player.y = p.y;
                    player.health = p.health;
                    player.facingAngle = p.facingAngle;

                    if (!p.isAlive && player.isAlive) {
                        player.die();
                    } else if (p.isAlive && !player.isAlive) {
                        player.revive();
                    }

                    player.isAlive = p.isAlive;
                    player.updateHealthBar();
                }
            });

            // Update enemies
            data.enemies.forEach(e => {
                let enemy = this.enemies.get(e.id);
                if (enemy) {
                    enemy.x = e.x;
                    enemy.y = e.y;
                    enemy.health = e.health;
                    enemy.facingAngle = e.facingAngle;

                    if (!e.isAlive && enemy.isAlive) {
                        enemy.die();
                    }

                    enemy.isAlive = e.isAlive;
                    enemy.updateHealthBar();
                }
            });
        });

        // Player joined
        this.socket.on('playerJoined', (playerData) => {
            console.log('Player joined:', playerData.username);
            const player = new Entity(this, playerData.x, playerData.y, { r: 100, g: 200, b: 255 }, 20);
            player.nameText.setText(playerData.username || `Player ${playerData.id.substring(0, 4)}`);
            player.health = playerData.health;
            player.updateHealthBar();
            this.otherPlayers.set(playerData.id, player);
            this.updateStats();
        });

        // Player left
        this.socket.on('playerLeft', (leftPlayerId) => {
            console.log('Player left:', leftPlayerId);
            const player = this.otherPlayers.get(leftPlayerId);
            if (player) {
                player.destroy();
                this.otherPlayers.delete(leftPlayerId);
            }
            this.updateStats();
        });

        // Player attacked enemy
        this.socket.on('playerAttacked', (data) => {
            const enemy = this.enemies.get(data.enemyId);
            if (enemy) {
                enemy.health = data.enemyHealth;
                enemy.takeDamage(0); // Trigger flash effect
                enemy.updateHealthBar();

                if (!data.enemyAlive) {
                    enemy.die();
                }
            }

            // Play attack animation
            if (data.playerId === this.playerId && this.localPlayer) {
                this.localPlayer.playAttackAnimation();
            } else {
                const player = this.otherPlayers.get(data.playerId);
                if (player) player.playAttackAnimation();
            }
        });

        // Enemy attacked player
        this.socket.on('enemyAttack', (data) => {
            const enemy = this.enemies.get(data.enemyId);
            if (enemy) {
                enemy.playAttackAnimation();
            }

            if (data.targetId === this.playerId && this.localPlayer) {
                this.localPlayer.takeDamage(data.damage);
                this.updateStats();
            } else {
                const player = this.otherPlayers.get(data.targetId);
                if (player) player.takeDamage(data.damage);
            }
        });

        // Resource dropped
        this.socket.on('resourceDropped', (resource) => {
            const sprite = this.add.circle(resource.x, resource.y, 8, 0xffd700);
            sprite.setStrokeStyle(2, 0xffaa00);
            this.resourceSprites.set(resource.id, sprite);
        });

        // Resource collected
        this.socket.on('resourceCollected', (data) => {
            const sprite = this.resourceSprites.get(data.resourceId);
            if (sprite) {
                sprite.destroy();
                this.resourceSprites.delete(data.resourceId);
            }

            if (data.playerId === this.playerId && this.localPlayer) {
                this.localPlayer.resources++;
                this.updateStats();
            }
        });

        // Enemy spawned
        this.socket.on('enemySpawned', (enemy) => {
            const enemySprite = new Entity(this, enemy.x, enemy.y, { r: 255, g: 80, b: 80 }, 18);
            enemySprite.nameText.setText('Enemy');
            enemySprite.health = enemy.health;
            enemySprite.updateHealthBar();
            this.enemies.set(enemy.id, enemySprite);
            this.updateStats();
        });

        // Player respawned
        this.socket.on('playerRespawned', (playerData) => {
            if (playerData.id === this.playerId && this.localPlayer) {
                this.localPlayer.x = playerData.x;
                this.localPlayer.y = playerData.y;
                this.localPlayer.revive();
                this.updateStats();
            } else {
                const player = this.otherPlayers.get(playerData.id);
                if (player) {
                    player.x = playerData.x;
                    player.y = playerData.y;
                    player.revive();
                }
            }
        });
    }

    createWorld() {
        // Main play area
        this.background = this.add.tileSprite(
            this.BORDER_THICKNESS,
            this.BORDER_THICKNESS,
            this.WORLD_SIZE - this.BORDER_THICKNESS * 2,
            this.WORLD_SIZE - this.BORDER_THICKNESS * 2,
            'bgTile'
        );
        this.background.setOrigin(0, 0);

        // Danger zone borders
        this.add.tileSprite(0, 0, this.WORLD_SIZE, this.BORDER_THICKNESS, 'dangerTile').setOrigin(0, 0);
        this.add.tileSprite(0, this.WORLD_SIZE - this.BORDER_THICKNESS, this.WORLD_SIZE, this.BORDER_THICKNESS, 'dangerTile').setOrigin(0, 0);
        this.add.tileSprite(0, this.BORDER_THICKNESS, this.BORDER_THICKNESS, this.WORLD_SIZE - this.BORDER_THICKNESS * 2, 'dangerTile').setOrigin(0, 0);
        this.add.tileSprite(this.WORLD_SIZE - this.BORDER_THICKNESS, this.BORDER_THICKNESS, this.BORDER_THICKNESS, this.WORLD_SIZE - this.BORDER_THICKNESS * 2, 'dangerTile').setOrigin(0, 0);
    }

    update() {
        if (!this.localPlayer || !this.localPlayer.isAlive) {
            if (this.localPlayer && !this.localPlayer.isAlive) {
                // Auto-respawn after 5 seconds
                if (!this.respawnTimer) {
                    this.respawnTimer = this.time.delayedCall(5000, () => {
                        this.socket.emit('respawn');
                        this.respawnTimer = null;
                    });
                }
            }
            return;
        }

        // Handle player input
        let velocityX = 0;
        let velocityY = 0;

        if (this.wasdKeys.A.isDown || this.cursors.left.isDown) velocityX = -160;
        else if (this.wasdKeys.D.isDown || this.cursors.right.isDown) velocityX = 160;

        if (this.wasdKeys.W.isDown || this.cursors.up.isDown) velocityY = -160;
        else if (this.wasdKeys.S.isDown || this.cursors.down.isDown) velocityY = 160;

        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            const normalizer = Math.sqrt(2);
            velocityX /= normalizer;
            velocityY /= normalizer;
        }

        // Update facing angle based on movement
        if (velocityX !== 0 || velocityY !== 0) {
            this.localPlayer.facingAngle = Math.atan2(velocityY, velocityX);
        }

        // Send movement to server
        this.socket.emit('playerMove', {
            velocityX,
            velocityY,
            facingAngle: this.localPlayer.facingAngle
        });

        // Client-side prediction for smooth movement
        this.localPlayer.x += velocityX * (1/60);
        this.localPlayer.y += velocityY * (1/60);
        this.localPlayer.update();

        // Handle attack input
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.socket.emit('playerAttack');
        }

        // Check for resource collection
        this.resourceSprites.forEach((sprite, id) => {
            const distance = Phaser.Math.Distance.Between(
                this.localPlayer.x,
                this.localPlayer.y,
                sprite.x,
                sprite.y
            );
            if (distance <= 30) {
                this.socket.emit('collectResource', id);
            }
        });

        // Update all entities
        this.otherPlayers.forEach(player => player.update());
        this.enemies.forEach(enemy => enemy.update());

        // Update stats periodically
        this.updateStats();
    }

    updateStats() {
        if (this.onStatsUpdate && this.localPlayer) {
            this.onStatsUpdate({
                health: this.localPlayer.health,
                maxHealth: this.localPlayer.maxHealth,
                resources: this.localPlayer.resources,
                playerCount: this.otherPlayers.size + 1,
                enemyCount: Array.from(this.enemies.values()).filter(e => e.isAlive).length,
                position: {
                    x: Math.round(this.localPlayer.x),
                    y: Math.round(this.localPlayer.y)
                }
            });
        }
    }

    getLocalPlayer() {
        return this.localPlayer;
    }

    getOtherPlayers() {
        return this.otherPlayers;
    }

    getEnemies() {
        return this.enemies;
    }

    getWorldSize() {
        return this.WORLD_SIZE;
    }

    getBorderThickness() {
        return this.BORDER_THICKNESS;
    }
}
