// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;
const GROUND_Y = 390;
const GRAVITY = 0.35;
const PIKACHU_RADIUS = 32;
const BALL_RADIUS = 16;
const NET_X = 400;
const NET_Y = 270;
const NET_WIDTH = 12;
const NET_HEIGHT = 120;

const PLAYER_SPEED = 5;
const JUMP_FORCE = -8.5;

// Player color schemes
const PLAYER_STYLES = {
    1: { body: '#ffcc00', cheek: '#ff4757', earTip: '#000000', eye: '#000', name: 'P1 (Yellow)' },
    2: { body: '#00d2ff', cheek: '#ffffff', earTip: '#0f0c1b', eye: '#fff', name: 'P2 (Blue)' },
    3: { body: '#2ed573', cheek: '#a0f4c0', earTip: '#0f0c1b', eye: '#fff', name: 'P3 (Green)' },
    4: { body: '#e056fd', cheek: '#ff7979', earTip: '#000000', eye: '#000', name: 'P4 (Purple)' }
};

class GameEngine {
    constructor() {
        this.gameState = this.getInitialState();
        this.clientInputs = { 1: {}, 2: {}, 3: {}, 4: {} };
        this.particleEffects = [];
        this.lastScoredTeam = null; // 'left' or 'right'
    }

    getInitialState() {
        return {
            players: {
                1: { x: 120, y: GROUND_Y, vx: 0, vy: 0, isGrounded: true, facingLeft: false, score: 0 },
                2: { x: 240, y: GROUND_Y, vx: 0, vy: 0, isGrounded: true, facingLeft: false, score: 0 },
                3: { x: 560, y: GROUND_Y, vx: 0, vy: 0, isGrounded: true, facingLeft: true, score: 0 },
                4: { x: 680, y: GROUND_Y, vx: 0, vy: 0, isGrounded: true, facingLeft: true, score: 0 }
            },
            ball: {
                x: 200,
                y: 100,
                vx: 2,
                vy: 0,
                lastTouchedBy: null
            },
            scores: { left: 0, right: 0 },
            gameStatus: 'countdown', // 'countdown', 'playing', 'scored', 'gameover'
            countdownTimer: 3,
            winner: null
        };
    }

    resetPositions(serveToTeam = 'left') {
        const p = this.gameState.players;
        p[1].x = 120; p[1].y = GROUND_Y; p[1].vx = 0; p[1].vy = 0;
        p[2].x = 240; p[2].y = GROUND_Y; p[2].vx = 0; p[2].vy = 0;
        p[3].x = 560; p[3].y = GROUND_Y; p[3].vx = 0; p[3].vy = 0;
        p[4].x = 680; p[4].y = GROUND_Y; p[4].vx = 0; p[4].vy = 0;

        // Reset ball position based on who serves
        this.gameState.ball.x = serveToTeam === 'left' ? 200 : 600;
        this.gameState.ball.y = 100;
        this.gameState.ball.vx = serveToTeam === 'left' ? 1 : -1;
        this.gameState.ball.vy = 0;
        this.gameState.ball.lastTouchedBy = null;
    }

    update(inputs) {
        if (this.gameState.gameStatus === 'countdown') {
            return;
        }

        if (this.gameState.gameStatus === 'scored') {
            return;
        }

        if (this.gameState.gameStatus === 'gameover') {
            return;
        }

        // Apply input movement for each player
        for (let id = 1; id <= 4; id++) {
            const player = this.gameState.players[id];
            const input = inputs[id] || {};

            // Left/Right
            let moveX = 0;
            if (input.left) moveX -= PLAYER_SPEED;
            if (input.right) moveX += PLAYER_SPEED;

            player.vx = moveX;

            // Facing direction
            if (player.vx < 0) player.facingLeft = true;
            if (player.vx > 0) player.facingLeft = false;

            // Jump
            if (input.up && player.isGrounded) {
                player.vy = JUMP_FORCE;
                player.isGrounded = false;
            }

            // Apply gravity to player
            if (!player.isGrounded) {
                player.vy += GRAVITY;
                player.y += player.vy;

                if (player.y >= GROUND_Y) {
                    player.y = GROUND_Y;
                    player.vy = 0;
                    player.isGrounded = true;
                }
            }

            // Update player horizontal position
            player.x += player.vx;

            // Boundary checks
            const leftLimit = (id <= 2) ? PIKACHU_RADIUS : NET_X + NET_WIDTH/2 + PIKACHU_RADIUS;
            const rightLimit = (id <= 2) ? NET_X - NET_WIDTH/2 - PIKACHU_RADIUS : CANVAS_WIDTH - PIKACHU_RADIUS;

            if (player.x < leftLimit) player.x = leftLimit;
            if (player.x > rightLimit) player.x = rightLimit;
        }

        // Apply physics to the ball
        const ball = this.gameState.ball;
        ball.vy += GRAVITY * 0.75; // Ball falls slightly slower than players for better control
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Ball bounds checks (walls)
        if (ball.x - BALL_RADIUS < 0) {
            ball.x = BALL_RADIUS;
            ball.vx = -ball.vx * 0.85;
            this.createSparks(ball.x - BALL_RADIUS, ball.y, '#fff');
        }
        if (ball.x + BALL_RADIUS > CANVAS_WIDTH) {
            ball.x = CANVAS_WIDTH - BALL_RADIUS;
            ball.vx = -ball.vx * 0.85;
            this.createSparks(ball.x + BALL_RADIUS, ball.y, '#fff');
        }
        // Ceiling
        if (ball.y - BALL_RADIUS < 0) {
            ball.y = BALL_RADIUS;
            ball.vy = -ball.vy * 0.85;
            this.createSparks(ball.x, ball.y - BALL_RADIUS, '#fff');
        }

        // Net Collisions
        // Net starts at NET_X - NET_WIDTH/2, ends at NET_X + NET_WIDTH/2, vertically from NET_Y to GROUND_Y
        const netLeft = NET_X - NET_WIDTH/2;
        const netRight = NET_X + NET_WIDTH/2;
        const netTop = NET_Y;

        // Ball with net collision
        if (ball.x + BALL_RADIUS > netLeft && ball.x - BALL_RADIUS < netRight) {
            if (ball.y + BALL_RADIUS > netTop && ball.y - BALL_RADIUS < GROUND_Y + NET_HEIGHT) {
                // If ball is above the net top slightly, bounce up
                if (ball.y < netTop && ball.vy > 0) {
                    ball.y = netTop - BALL_RADIUS;
                    ball.vy = -ball.vy * 0.8;
                } else {
                    // Bounce off sides
                    if (ball.x < NET_X) {
                        ball.x = netLeft - BALL_RADIUS;
                        ball.vx = -Math.abs(ball.vx) * 0.85;
                    } else {
                        ball.x = netRight + BALL_RADIUS;
                        ball.vx = Math.abs(ball.vx) * 0.85;
                    }
                }
                this.createSparks(ball.x, ball.y, '#fff');
            }
        }

        // Player to Ball Collisions
        for (let id = 1; id <= 4; id++) {
            const player = this.gameState.players[id];
            const dist = Math.hypot(ball.x - player.x, ball.y - player.y);
            const minDist = PIKACHU_RADIUS + BALL_RADIUS;

            if (dist < minDist) {
                ball.lastTouchedBy = id;
                const input = inputs[id] || {};

                // Push ball out of player circle
                const nx = (ball.x - player.x) / dist;
                const ny = (ball.y - player.y) / dist;

                ball.x = player.x + nx * minDist;
                ball.y = player.y + ny * minDist;

                // Bounce dynamics
                let force = 8;
                
                // If spiking (down direction)
                if (input.down) {
                    force = 13;
                    ball.vx = nx * force * 1.2;
                    ball.vy = Math.abs(ny) * force * 0.8 + 2; // force downwards
                    this.createSparks(ball.x, ball.y, '#ff4757', 20);
                } else {
                    // Regular bounce off the head
                    ball.vx = nx * force;
                    ball.vy = ny * force - 2; // give slightly upward boost
                    this.createSparks(ball.x, ball.y, PLAYER_STYLES[id].body, 10);
                }
            }
        }

        // Ball Ground collision (scoring)
        if (ball.y + BALL_RADIUS >= GROUND_Y) {
            this.createSparks(ball.x, GROUND_Y, '#ffcc00', 30);
            this.gameState.gameStatus = 'scored';

            if (ball.x < NET_X) {
                // Score for Right team
                this.gameState.scores.right++;
                this.lastScoredTeam = 'right';
            } else {
                // Score for Left team
                this.gameState.scores.left++;
                this.lastScoredTeam = 'left';
            }

            // Check match win (e.g. 15 points)
            if (this.gameState.scores.left >= 15) {
                this.gameState.gameStatus = 'gameover';
                this.gameState.winner = 'Left Team';
            } else if (this.gameState.scores.right >= 15) {
                this.gameState.gameStatus = 'gameover';
                this.gameState.winner = 'Right Team';
            } else {
                // Trigger score screen transition
                setTimeout(() => {
                    if (this.gameState.gameStatus === 'scored') {
                        this.resetPositions(this.lastScoredTeam === 'left' ? 'right' : 'left');
                        this.gameState.gameStatus = 'playing';
                    }
                }, 2000);
            }
        }

        // Particle updates
        this.updateParticles();
    }

    createSparks(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.particleEffects.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: Math.random() * 0.05 + 0.02,
                color: color
            });
        }
    }

    updateParticles() {
        for (let i = this.particleEffects.length - 1; i >= 0; i--) {
            const p = this.particleEffects[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            if (p.life <= 0) {
                this.particleEffects.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        // Clear background with nice gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bgGrad.addColorStop(0, '#0a051b');
        bgGrad.addColorStop(0.7, '#150f33');
        bgGrad.addColorStop(1, '#231942');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw Ground Grid Line / Neon effect
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.4)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y);
        ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
        ctx.stroke();

        ctx.fillStyle = '#0f0c1b';
        ctx.fillRect(0, GROUND_Y + 2, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

        // Draw Net
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(NET_X - NET_WIDTH/2, NET_Y, NET_WIDTH, NET_HEIGHT);
        ctx.strokeStyle = '#a4b0be';
        ctx.lineWidth = 1;
        // Cross lines for net
        for (let y = NET_Y; y < GROUND_Y; y += 12) {
            ctx.beginPath();
            ctx.moveTo(NET_X - NET_WIDTH/2, y);
            ctx.lineTo(NET_X + NET_WIDTH/2, y);
            ctx.stroke();
        }

        // Draw Players
        for (let id = 1; id <= 4; id++) {
            const player = this.gameState.players[id];
            this.drawPikachu(ctx, player.x, player.y, PLAYER_STYLES[id], player.facingLeft);
        }

        // Draw Ball
        const ball = this.gameState.ball;
        this.drawBall(ctx, ball.x, ball.y);

        // Draw Particles
        this.particleEffects.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    drawPikachu(ctx, x, y, style, facingLeft) {
        ctx.save();
        ctx.translate(x, y);
        if (facingLeft) {
            ctx.scale(-1, 1);
        }

        // Ears
        ctx.fillStyle = style.body;
        ctx.beginPath();
        // Left Ear
        ctx.moveTo(-15, -20);
        ctx.quadraticCurveTo(-25, -45, -22, -48);
        ctx.quadraticCurveTo(-15, -40, -5, -22);
        ctx.fill();

        // Left Ear Tip (Black/Dark)
        ctx.fillStyle = style.earTip;
        ctx.beginPath();
        ctx.moveTo(-22, -48);
        ctx.quadraticCurveTo(-18, -42, -15, -35);
        ctx.quadraticCurveTo(-18, -42, -22, -48);
        ctx.fill();

        // Right Ear
        ctx.fillStyle = style.body;
        ctx.beginPath();
        ctx.moveTo(15, -20);
        ctx.quadraticCurveTo(25, -45, 22, -48);
        ctx.quadraticCurveTo(15, -40, 5, -22);
        ctx.fill();

        // Right Ear Tip
        ctx.fillStyle = style.earTip;
        ctx.beginPath();
        ctx.moveTo(22, -48);
        ctx.quadraticCurveTo(18, -42, 15, -35);
        ctx.quadraticCurveTo(18, -42, 22, -48);
        ctx.fill();

        // Main Body (Round Semicircle / Pikachu shape)
        ctx.fillStyle = style.body;
        ctx.beginPath();
        ctx.arc(0, 0, PIKACHU_RADIUS, Math.PI, 0, false);
        ctx.lineTo(PIKACHU_RADIUS, 5);
        ctx.quadraticCurveTo(0, 10, -PIKACHU_RADIUS, 5);
        ctx.closePath();
        ctx.fill();

        // Cheek
        ctx.fillStyle = style.cheek;
        ctx.beginPath();
        ctx.arc(18, -8, 7, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = style.eye;
        ctx.beginPath();
        ctx.arc(12, -18, 4, 0, Math.PI * 2);
        ctx.fill();
        // Eye shine
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(14, -20, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(12, -12, 3, 0, Math.PI);
        ctx.stroke();

        ctx.restore();
    }

    drawBall(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        // Neon Outer Glow
        ctx.shadowColor = '#00d2ff';
        ctx.shadowBlur = 10;

        // Ball Body
        const grad = ctx.createRadialGradient(-4, -4, 2, 0, 0, BALL_RADIUS);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, '#ff007f');
        grad.addColorStop(1, '#7f00ff');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Ball Pattern (Volleyball Stripes)
        ctx.shadowBlur = 0; // turn off shadow for pattern lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.arc(-BALL_RADIUS, 0, BALL_RADIUS, -Math.PI/4, Math.PI/4);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(BALL_RADIUS, 0, BALL_RADIUS, Math.PI - Math.PI/4, Math.PI + Math.PI/4);
        ctx.stroke();

        ctx.restore();
    }
}
