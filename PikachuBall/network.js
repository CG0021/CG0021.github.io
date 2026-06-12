// DOM elements
const btnHost = document.getElementById('btn-host');
const btnCopyId = document.getElementById('btn-copy-id');
const btnCopyLink = document.getElementById('btn-copy-link');
const btnJoin = document.getElementById('btn-join');
const btnStartGame = document.getElementById('btn-start-game');
const hostIdContainer = document.getElementById('host-id-container');
const hostIdInput = document.getElementById('host-id-input');
const hostLinkInput = document.getElementById('host-link-input');
const joinIdInput = document.getElementById('join-id-input');
const connectionStatus = document.getElementById('connection-status');
const playerNickname = document.getElementById('player-nickname');

const lobbyScreen = document.getElementById('lobby-screen');
const gameScreen = document.getElementById('game-screen');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const scoreLeft = document.getElementById('score-left');
const scoreRight = document.getElementById('score-right');
const gameStatusText = document.getElementById('game-status-text');
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownText = countdownOverlay.querySelector('.countdown-text');
const gameOverOverlay = document.getElementById('game-over-overlay');
const victoryText = gameOverOverlay.querySelector('.victory-text');
const btnRematch = document.getElementById('btn-rematch');
const btnLobbyReturn = document.getElementById('btn-lobby-return');
const networkPing = document.getElementById('network-ping');
const gameRoomId = document.getElementById('game-room-id');

// Network Variables
let peer = null;
let connection = null; // Client's connection to host
let connectedClients = []; // Host's connections to clients
let isHost = false;
let myPlayerSlot = null; // 1, 2, 3, or 4
let hostId = '';
let lobbySlots = {
    1: { id: null, name: 'Waiting...', occupied: false },
    2: { id: null, name: 'Waiting...', occupied: false },
    3: { id: null, name: 'Waiting...', occupied: false },
    4: { id: null, name: 'Waiting...', occupied: false }
};

// Input variables
const localInput = { left: false, right: false, up: false, down: false };
const engine = new GameEngine();

// Setup UI slots
const slotButtons = document.querySelectorAll('.btn-join-slot');
slotButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const slot = parseInt(btn.dataset.slot);
        requestClaimSlot(slot);
    });
});

// Host Matchmaking ID generator
function generateRoomId() {
    return 'PIKA-' + Math.random().toString(36).substring(2, 7).toUpperCase();
}

// ----------------------------------------------------
// PEER INITIALIZATION
// ----------------------------------------------------

function initHost() {
    isHost = true;
    const roomId = generateRoomId();
    peer = new Peer(roomId);

    peer.on('open', (id) => {
        hostId = id;
        hostIdContainer.classList.remove('hidden');
        hostIdInput.value = id;
        
        // Generate Invite URL
        const inviteUrl = window.location.origin + window.location.pathname + '?room=' + id;
        hostLinkInput.value = inviteUrl;

        connectionStatus.textContent = 'Status: Hosting... waiting for players';
        connectionStatus.style.color = 'var(--primary-color)';
        
        // Host automatically claims P1
        claimSlotLocal(1, playerNickname.value || 'Host P1');
        updateLobbyUI();
        enableSlotButtons();
    });

    peer.on('connection', (conn) => {
        setupHostConnection(conn);
    });

    peer.on('error', (err) => {
        console.error(err);
        alert('Error: ' + err.type + '. Room ID might already be in use. Try again.');
        connectionStatus.textContent = 'Status: Offline';
    });
}

function initClient(targetHostId) {
    isHost = false;
    // Client gets random Peer ID
    peer = new Peer();

    peer.on('open', (id) => {
        connectionStatus.textContent = 'Status: Connecting to host...';
        connection = peer.connect(targetHostId, { reliable: true });

        connection.on('open', () => {
            connectionStatus.textContent = 'Status: Connected to Host!';
            connectionStatus.style.color = 'var(--success-color)';
            enableSlotButtons();
            
            // Periodically check ping
            setInterval(() => {
                connection.send({ type: 'ping', time: Date.now() });
            }, 2000);
        });

        connection.on('data', (data) => {
            handleClientData(data);
        });

        connection.on('close', () => {
            alert('Host disconnected.');
            location.reload();
        });
    });

    peer.on('error', (err) => {
        console.error(err);
        alert('Could not connect to host.');
        connectionStatus.textContent = 'Status: Connection Failed';
    });
}

// ----------------------------------------------------
// HOST NETWORKING LOGIC
// ----------------------------------------------------

function setupHostConnection(conn) {
    conn.on('data', (data) => {
        handleHostData(conn, data);
    });

    conn.on('close', () => {
        // Find player slot associated with this connection
        for (let slot = 1; slot <= 4; slot++) {
            if (lobbySlots[slot].id === conn.peer) {
                lobbySlots[slot] = { id: null, name: 'Waiting...', occupied: false };
                engine.clientInputs[slot] = {};
            }
        }
        connectedClients = connectedClients.filter(c => c.peer !== conn.peer);
        broadcastLobbyUpdate();
        updateLobbyUI();
    });

    connectedClients.push(conn);
}

function handleHostData(conn, data) {
    if (data.type === 'ping') {
        conn.send({ type: 'pong', time: data.time });
    }

    else if (data.type === 'claim_slot') {
        const slot = data.slot;
        const name = data.name;
        // Check if slot is available
        if (!lobbySlots[slot].occupied) {
            // Free any slot previously occupied by this peer
            for (let s = 1; s <= 4; s++) {
                if (lobbySlots[s].id === conn.peer) {
                    lobbySlots[s] = { id: null, name: 'Waiting...', occupied: false };
                }
            }

            lobbySlots[slot] = { id: conn.peer, name: name, occupied: true };
            conn.send({ type: 'slot_assigned', slot: slot });
            broadcastLobbyUpdate();
            updateLobbyUI();
        }
    }

    else if (data.type === 'client_input') {
        if (data.slot) {
            engine.clientInputs[data.slot] = data.input;
        }
    }
}

function broadcastLobbyUpdate() {
    broadcast({
        type: 'lobby_update',
        slots: lobbySlots
    });
}

function broadcast(data) {
    connectedClients.forEach(conn => {
        if (conn.open) {
            conn.send(data);
        }
    });
}

// ----------------------------------------------------
// CLIENT NETWORKING LOGIC
// ----------------------------------------------------

function handleClientData(data) {
    if (data.type === 'pong') {
        const ping = Date.now() - data.time;
        networkPing.textContent = ping + ' ms';
    }

    else if (data.type === 'lobby_update') {
        lobbySlots = data.slots;
        updateLobbyUI();
    }

    else if (data.type === 'slot_assigned') {
        myPlayerSlot = data.slot;
        updateLobbyUI();
    }

    else if (data.type === 'start_game') {
        transitionToGame();
    }

    else if (data.type === 'state_sync') {
        engine.gameState = data.state;
        engine.particleEffects = data.particles || [];
        updateHUD();
    }
}

// ----------------------------------------------------
// UI & LOBBY INTERACTIONS
// ----------------------------------------------------

function requestClaimSlot(slot) {
    const name = playerNickname.value || 'Player ' + slot;
    if (isHost) {
        claimSlotLocal(slot, name);
    } else {
        if (connection) {
            connection.send({
                type: 'claim_slot',
                slot: slot,
                name: name
            });
        }
    }
}

function claimSlotLocal(slot, name) {
    // Release existing slot held by host
    for (let s = 1; s <= 4; s++) {
        if (lobbySlots[s].id === 'host') {
            lobbySlots[s] = { id: null, name: 'Waiting...', occupied: false };
        }
    }
    lobbySlots[slot] = { id: 'host', name: name, occupied: true };
    myPlayerSlot = slot;
    broadcastLobbyUpdate();
    updateLobbyUI();
}

function enableSlotButtons() {
    slotButtons.forEach(btn => {
        btn.disabled = false;
    });
}

function updateLobbyUI() {
    let occupiedCount = 0;

    for (let slot = 1; slot <= 4; slot++) {
        const slotEl = document.getElementById('slot-p' + slot);
        const nameEl = slotEl.querySelector('.player-name');
        const deviceEl = slotEl.querySelector('.player-device');
        const btn = slotEl.querySelector('.btn-join-slot');
        const info = lobbySlots[slot];

        if (info.occupied) {
            nameEl.textContent = info.name;
            deviceEl.textContent = (info.id === 'host' ? '(Host)' : '(Connected)');
            slotEl.classList.add('occupied');
            btn.style.display = 'none';
            occupiedCount++;
        } else {
            nameEl.textContent = 'Waiting...';
            deviceEl.textContent = '';
            slotEl.classList.remove('occupied');
            btn.style.display = 'block';
        }

        // Highlight my own slot
        if (myPlayerSlot === slot) {
            slotEl.style.borderColor = 'var(--success-color)';
        } else {
            slotEl.style.borderColor = '';
        }
    }

    // Only host can start game, and we need at least 1 occupied slot (can play solo practice or multiplayer)
    if (isHost && occupiedCount >= 1) {
        btnStartGame.disabled = false;
    } else {
        btnStartGame.disabled = true;
    }
}

function transitionToGame() {
    lobbyScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    gameRoomId.textContent = hostId || 'Client Session';
    
    // Start game loop
    startGameLoop();
}

// ----------------------------------------------------
// GAME SYNC & LOOP
// ----------------------------------------------------

let gameLoopRunning = false;

function startGameLoop() {
    if (gameLoopRunning) return;
    gameLoopRunning = true;

    // Start countdown
    triggerCountdown();
}

function triggerCountdown() {
    engine.gameState.gameStatus = 'countdown';
    countdownOverlay.classList.remove('hidden');
    gameOverOverlay.classList.add('hidden');

    let count = 3;
    countdownText.textContent = count;

    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownText.textContent = count;
        } else {
            clearInterval(interval);
            countdownOverlay.classList.add('hidden');
            if (isHost) {
                engine.resetPositions();
                engine.gameState.gameStatus = 'playing';
            }
        }
    }, 1000);
}

function updateHUD() {
    scoreLeft.textContent = engine.gameState.scores.left;
    scoreRight.textContent = engine.gameState.scores.right;

    if (engine.gameState.gameStatus === 'playing') {
        gameStatusText.textContent = 'Match in progress...';
        gameOverOverlay.classList.add('hidden');
    } else if (engine.gameState.gameStatus === 'scored') {
        gameStatusText.textContent = 'POINT! Resetting...';
    } else if (engine.gameState.gameStatus === 'gameover') {
        gameStatusText.textContent = 'Game Over!';
        victoryText.textContent = engine.gameState.winner.toUpperCase() + ' WINS!';
        gameOverOverlay.classList.remove('hidden');

        // Only host sees replay buttons
        if (!isHost) {
            btnRematch.style.display = 'none';
            btnLobbyReturn.style.display = 'none';
        }
    }
}

// Core Loop
function frame() {
    if (isHost) {
        // Collect host input
        if (myPlayerSlot) {
            engine.clientInputs[myPlayerSlot] = localInput;
        }

        // Update physics
        engine.update(engine.clientInputs);

        // Sync state to clients
        broadcast({
            type: 'state_sync',
            state: engine.gameState,
            particles: engine.particleEffects
        });

        // Update local HUD
        updateHUD();
    } else {
        // Send client inputs to host
        if (connection && connection.open && myPlayerSlot) {
            connection.send({
                type: 'client_input',
                slot: myPlayerSlot,
                input: localInput
            });
        }
    }

    // Render screen
    engine.draw(ctx);

    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// ----------------------------------------------------
// KEYBOARD LISTENERS
// ----------------------------------------------------

const keysPressed = {};

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    
    if (key === 'a' || e.key === 'ArrowLeft') localInput.left = true;
    if (key === 'd' || e.key === 'ArrowRight') localInput.right = true;
    if (key === 'w' || e.key === 'ArrowUp') localInput.up = true;
    if (key === 's' || e.key === 'ArrowDown' || e.key === ' ') localInput.down = true;
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    
    if (key === 'a' || e.key === 'ArrowLeft') localInput.left = false;
    if (key === 'd' || e.key === 'ArrowRight') localInput.right = false;
    if (key === 'w' || e.key === 'ArrowUp') localInput.up = false;
    if (key === 's' || e.key === 'ArrowDown' || e.key === ' ') localInput.down = false;
});

// Button events
btnHost.addEventListener('click', () => {
    initHost();
});

btnJoin.addEventListener('click', () => {
    const target = joinIdInput.value.trim().toUpperCase();
    if (target) {
        initClient(target);
    }
});

btnCopyId.addEventListener('click', () => {
    hostIdInput.select();
    document.execCommand('copy');
    alert('Copied Room ID to clipboard!');
});

btnCopyLink.addEventListener('click', () => {
    hostLinkInput.select();
    document.execCommand('copy');
    alert('Copied Invite Link to clipboard!');
});

btnStartGame.addEventListener('click', () => {
    if (isHost) {
        broadcast({ type: 'start_game' });
        transitionToGame();
    }
});

btnRematch.addEventListener('click', () => {
    if (isHost) {
        engine.gameState = engine.getInitialState();
        broadcast({ type: 'start_game' });
        triggerCountdown();
    }
});

btnLobbyReturn.addEventListener('click', () => {
    if (isHost) {
        engine.gameState = engine.getInitialState();
        broadcast({ type: 'lobby_update', slots: lobbySlots });
        // Return everybody to lobby
        broadcast({ type: 'return_to_lobby' });
        returnToLobbyLocal();
    }
});

function returnToLobbyLocal() {
    gameScreen.classList.add('hidden');
    lobbyScreen.classList.remove('hidden');
}

// Client returns to lobby instruction handler helper
function handleClientDataExtra(data) {
    if (data.type === 'return_to_lobby') {
        returnToLobbyLocal();
    }
}
// Append handling inside handleClientData
const originalHandleClientData = handleClientData;
handleClientData = function(data) {
    originalHandleClientData(data);
    handleClientDataExtra(data);
};

// Check for room ID in URL on startup
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
        const cleanRoom = roomParam.trim().toUpperCase();
        joinIdInput.value = cleanRoom;
        connectionStatus.textContent = `Status: Auto-joining room ${cleanRoom}...`;
        initClient(cleanRoom);
    }
});
