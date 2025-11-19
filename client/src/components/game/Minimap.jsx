// src/components/game/Minimap.jsx
import React, { useEffect, useRef } from 'react';

const Minimap = ({
                     localPlayer,
                     otherPlayers,
                     enemies,
                     worldSize,
                     borderThickness,
                     size = 150
                 }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !localPlayer) return;

        const ctx = canvas.getContext('2d');
        const scale = size / worldSize;
        const safeZoneOffset = (borderThickness / worldSize) * size;

        // Animation loop
        const animate = () => {
            // Clear canvas
            ctx.clearRect(0, 0, size, size);

            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, size, size);

            // Danger zone border (red outline)
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, size, size);

            // Safe zone (green outline)
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(
                safeZoneOffset,
                safeZoneOffset,
                size - safeZoneOffset * 2,
                size - safeZoneOffset * 2
            );

            // Draw enemies (small red dots)
            if (enemies) {
                enemies.forEach(enemy => {
                    if (enemy.isAlive) {
                        ctx.fillStyle = '#FF5050';
                        ctx.beginPath();
                        ctx.arc(
                            (enemy.x / worldSize) * size,
                            (enemy.y / worldSize) * size,
                            2,
                            0,
                            Math.PI * 2
                        );
                        ctx.fill();
                    }
                });
            }

            // Draw other players (blue dots)
            if (otherPlayers) {
                otherPlayers.forEach(player => {
                    ctx.fillStyle = '#64C8FF';
                    ctx.beginPath();
                    ctx.arc(
                        (player.x / worldSize) * size,
                        (player.y / worldSize) * size,
                        3,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                });
            }

            // Draw local player (peach dot - larger)
            if (localPlayer) {
                ctx.fillStyle = '#FFCBA4';
                ctx.beginPath();
                ctx.arc(
                    (localPlayer.x / worldSize) * size,
                    (localPlayer.y / worldSize) * size,
                    4,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

                // Player direction indicator
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1;
                const dirLength = 8;
                const endX = (localPlayer.x / worldSize) * size + Math.cos(localPlayer.facingAngle) * dirLength;
                const endY = (localPlayer.y / worldSize) * size + Math.sin(localPlayer.facingAngle) * dirLength;
                ctx.beginPath();
                ctx.moveTo((localPlayer.x / worldSize) * size, (localPlayer.y / worldSize) * size);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }

            // White border frame
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, size, size);
        };

        animate();
        const intervalId = setInterval(animate, 100); // Update 10 times per second

        return () => clearInterval(intervalId);
    }, [localPlayer, otherPlayers, enemies, worldSize, borderThickness, size]);

    return (
        <div className="relative">
            <canvas
                ref={canvasRef}
                width={size}
                height={size}
                className="rounded border-2 border-gray-600 shadow-lg"
            />
            <div className="absolute bottom-1 left-1 text-xs text-white bg-black bg-opacity-50 px-1 rounded">
                Map
            </div>
        </div>
    );
};

export default Minimap;