// src/game/entities/Entity.js
import Phaser from 'phaser';

class Entity {
    constructor(scene, x, y, color, radius = 20) {

        this.scene = scene;
        this.maxHealth = 100;

        this.facingAngle = 0;
        this.resources = 0;

        // Create circle sprite
        this.sprite = scene.add.circle(x, y, radius);
        this.sprite.setStrokeStyle(3, Phaser.Display.Color.GetColor(
            Math.max(0, color.r - 30),
            Math.max(0, color.g - 30),
            Math.max(0, color.b - 30)
        ));
        this.sprite.setFillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);

        // Create weapon (POSITIONED TO THE SIDE - offset from center)
        this.weaponOffsetX = radius; // Offset to the side
        this.weaponOffsetY = 5;
        this.weapon = scene.add.rectangle(
            x + this.weaponOffsetX,
            y + this.weaponOffsetY,
            40, 8, 0xC0C0C0
        );
        this.weapon.setStrokeStyle(2, 0xFFFFFF, 1); // White outline for better visibility
        this.weapon.setOrigin(0, 0.5);
        this.weapon.setDepth(2); // Higher depth to be above player

        // Health bar
        this.healthBarBg = scene.add.rectangle(x, y - 35, 40, 6, 0x000000, 0.5);
        this.healthBar = scene.add.rectangle(x, y - 35, 40, 6, 0x00ff00);

        // Name tag
        this.nameText = scene.add.text(x, y - 45, '', {
            fontSize: '12px',
            fill: '#fff',
            backgroundColor: '#00000088',
            padding: { x: 4, y: 2 }
        });
        this.nameText.setOrigin(0.5, 0);
        this.health = 100;
        this.isAlive = true;
    }

    get x() { return this.sprite.x; }
    get y() { return this.sprite.y; }
    set x(val) { this.sprite.x = val; }
    set y(val) { this.sprite.y = val; }

    takeDamage(amount) {
        if (!this.isAlive) return;

        this.health -= amount;
        this.updateHealthBar();

        // Flash red when hit (more intense)
        const originalColor = this.sprite.fillColor;
        this.sprite.setFillStyle(0xff0000, 1);

        // Add impact flash circle
        const impactFlash = this.scene.add.circle(this.x, this.y, 25, 0xff0000, 0.5);
        this.scene.tweens.add({
            targets: impactFlash,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => impactFlash.destroy()
        });

        this.scene.time.delayedCall(100, () => {
            this.sprite.setFillStyle(originalColor, 1);
        });

        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    updateHealthBar() {
        const healthPercent = this.health / this.maxHealth;
        this.healthBar.width = 40 * healthPercent;
        this.healthBar.x = this.x - 20 + (this.healthBar.width / 2);

        if (healthPercent > 0.6) {
            this.healthBar.setFillStyle(0x00ff00);
        } else if (healthPercent > 0.3) {
            this.healthBar.setFillStyle(0xffaa00);
        } else {
            this.healthBar.setFillStyle(0xff0000);
        }
    }

    die() {
        this.isAlive = false;

        // ENHANCED DEATH ANIMATION - fade out and scale down
        this.scene.tweens.add({
            targets: [this.sprite, this.weapon],
            alpha: 0,
            scale: 0.5,
            duration: 500,
            ease: 'Power2'
        });

        this.healthBar.setVisible(false);
        this.healthBarBg.setVisible(false);
        this.nameText.setVisible(false);
    }

    revive() {
        this.isAlive = true;
        this.health = this.maxHealth;
        this.sprite.setAlpha(1);
        this.sprite.setScale(1);
        this.weapon.setAlpha(1);
        this.weapon.setScale(1);
        this.healthBar.setVisible(true);
        this.healthBarBg.setVisible(true);
        this.nameText.setVisible(true);
        this.updateHealthBar();
    }

    update() {
        if (!this.isAlive) return;

        this.healthBarBg.setPosition(this.x, this.y - 35);
        this.healthBar.setPosition(this.x - 20 + (this.healthBar.width / 2), this.y - 35);
        this.nameText.setPosition(this.x, this.y - 45);

        // Position weapon to the side based on facing angle
        const weaponDistance = 25;
        this.weapon.setPosition(
            this.x + Math.cos(this.facingAngle) * weaponDistance,
            this.y + Math.sin(this.facingAngle) * weaponDistance
        );

        if (!this.scene.tweens.isTweening(this.weapon)) {
            this.weapon.setRotation(this.facingAngle);
        }
    }

    playAttackAnimation() {
        const currentRotation = this.weapon.rotation;
        const swingAmount = Math.PI; // INCREASED from Math.PI/2 for bigger, clearer swing

        // Add weapon glow effect
        this.weapon.setFillStyle(0xFFFFFF);
        this.weapon.setStrokeStyle(3, 0x00FFFF, 1); // Cyan glow during attack

        // Create slash particle effect at weapon tip
        const weaponTipX = this.x + Math.cos(this.facingAngle) * 35;
        const weaponTipY = this.y + Math.sin(this.facingAngle) * 35;

        const slash = this.scene.add.circle(weaponTipX, weaponTipY, 15, 0xFFFFFF, 0.7);
        this.scene.tweens.add({
            targets: slash,
            scale: 2.5,
            alpha: 0,
            duration: 250,
            ease: 'Power2',
            onComplete: () => slash.destroy()
        });

        // Main swing animation
        this.scene.tweens.add({
            targets: this.weapon,
            rotation: currentRotation + swingAmount,
            duration: 150,
            ease: 'Cubic.easeOut',
            yoyo: true,
            onComplete: () => {
                this.weapon.setRotation(this.facingAngle);
                // Reset weapon appearance
                this.weapon.setFillStyle(0xC0C0C0);
                this.weapon.setStrokeStyle(2, 0xFFFFFF, 1);
            }
        });

        // Player body attack animation (larger pulse)
        // const originalScale = this.sprite.scale;
        // this.scene.tweens.add({
        //     targets: this.sprite,
        //     scaleX: originalScale * 1.3,
        //     scaleY: originalScale * 1.3,
        //     duration: 100,
        //     yoyo: true
        // });

        // Add screen shake for local player attacks (small subtle shake)
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(100, 0.003);
        }
    }

    playThrowAnimation() {
        // Hide weapon temporarily (it's being thrown)
        this.weapon.setAlpha(0);

        // Player recoil animation
        const originalScale = this.sprite.scale;
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: originalScale * 0.9,
            scaleY: originalScale * 1.2,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                // Sword returns after throw completes (2 seconds)
                this.scene.time.delayedCall(2000, () => {
                    this.scene.tweens.add({
                        targets: this.weapon,
                        alpha: 1,
                        duration: 200
                    });
                });
            }
        });

        // Throw particle effect
        const throwEffect = this.scene.add.circle(this.x, this.y, 15, 0x00FFFF, 0.6);
        this.scene.tweens.add({
            targets: throwEffect,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => throwEffect.destroy()
        });
    }

    destroy() {
        this.sprite.destroy();
        this.weapon.destroy();
        this.healthBar.destroy();
        this.healthBarBg.destroy();
        this.nameText.destroy();
    }
}

export default Entity;