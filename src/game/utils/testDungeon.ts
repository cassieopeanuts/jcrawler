import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import '../../style.css'; // Basic styles

// --- Dungeon Grid Parameters & Cell Types ---
const GRID_WIDTH = 35; // Number of cells horizontally (odd number for maze algo)
const GRID_HEIGHT = 35; // Number of cells vertically (odd number for maze algo)
// CHANGED: Reduced CELL_SIZE for tighter corridors and a more classic dungeon feel.
const CELL_SIZE = 1.5;   // Size of one cell in 3D units

// Cell type identifiers
const CELL_EMPTY = 0;
const CELL_MAZE_WALL = 1; // Wall cell in the maze
const CELL_PATH = 2;      // Carved path cell for tunnels and mazes
const CELL_ROOM_FLOOR = 3;// Floor of an expanded room area
const CELL_DOOR_START = 5;// Location of the start door
const CELL_DOOR_END = 6;  // Location of the end door

// Type for the grid data
type DungeonGrid = number[][];

interface RoomArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

// --- NEW: Dungeon Generation with a specific schema ---

/**
 * Helper function to carve a rectangular room into the grid.
 * @param grid The dungeon grid to modify.
 * @param room The room area to carve.
 */
function carveRoom(grid: DungeonGrid, room: RoomArea) {
    for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
            // Ensure we don't carve outside the grid boundaries
            if (x > 0 && x < GRID_WIDTH - 1 && y > 0 && y < GRID_HEIGHT - 1) {
                grid[y][x] = CELL_ROOM_FLOOR;
            }
        }
    }
}

/**
 * Recursive Backtracker algorithm for generating a maze in a specified region.
 * @param grid The dungeon grid to modify.
 * @param cx Current X position for the carving.
 * @param cy Current Y position for the carving.
 */
const carveMaze = (grid: DungeonGrid, cx: number, cy: number) => {
    grid[cy][cx] = CELL_PATH;

    const directions = [
        { x: 0, y: -2, wallX: 0, wallY: -1 }, // North
        { x: 0, y: 2,  wallX: 0, wallY: 1 },  // South
        { x: 2, y: 0,  wallX: 1, wallY: 0 },  // East
        { x: -2, y: 0, wallX: -1, wallY: 0 }  // West
    ];

    // Shuffle directions
    directions.sort(() => Math.random() - 0.5);

    for (const dir of directions) {
        const nx = cx + dir.x;
        const ny = cy + dir.y;

        if (nx > 0 && nx < GRID_WIDTH - 1 && ny > 0 && ny < GRID_HEIGHT - 1 && grid[ny][nx] === CELL_MAZE_WALL) {
            grid[cy + dir.wallY][cx + dir.wallX] = CELL_PATH;
            carveMaze(grid, nx, ny);
        }
    }
};

/**
 * NEW: A completely new dungeon generator that follows the schema:
 * Door -> Tunnel -> Room -> Maze -> Room(s) -> Tunnel -> Door
 */
function generateDungeonData(width: number, height: number): { grid: DungeonGrid, rooms: RoomArea[], startDoorPosition: {x: number, y: number} | null, endDoorPosition: {x: number, y: number} | null } {
    // 1. Initialize grid with all walls
    const grid: DungeonGrid = Array.from({ length: height }, () => Array(width).fill(CELL_MAZE_WALL));
    const rooms: RoomArea[] = [];
    let startDoorPosition: {x: number, y: number} | null = null;
    let endDoorPosition: {x: number, y: number} | null = null;

    // 2. Create Start Door and Entry Tunnel
    const startX = Math.floor(Math.random() * ((width - 3) / 2)) * 2 + 1; // Random odd start X
    grid[1][startX] = CELL_DOOR_START;
    startDoorPosition = { x: startX, y: 1 };
    for (let y = 1; y < 5; y++) {
        grid[y][startX] = CELL_PATH;
    }

    // 3. Create the first Room at the end of the tunnel
    const room1: RoomArea = { x: startX - 2, y: 5, width: 5, height: 4 };
    carveRoom(grid, room1);
    rooms.push(room1);

    // 4. Create the Maze connected to the first room
    const mazeEntranceX = startX;
    const mazeEntranceY = room1.y + room1.height;
    grid[mazeEntranceY - 1][mazeEntranceX] = CELL_PATH; // Connect room to maze
    if (grid[mazeEntranceY][mazeEntranceX] === CELL_MAZE_WALL) {
        carveMaze(grid, mazeEntranceX, mazeEntranceY);
    }

    // 5. Add a couple of rooms inside the maze area
    const mazeRoomAttempts = 50;
    for (let i = 0; i < mazeRoomAttempts && rooms.length < 3; i++) {
        const cx = Math.floor(Math.random() * ((width - 3) / 2)) * 2 + 1;
        const cy = Math.floor(Math.random() * ((height - (mazeEntranceY + 3)) / 2)) * 2 + (mazeEntranceY + 1);

        if (grid[cy] && grid[cy][cx] === CELL_PATH) {
            const room: RoomArea = { x: cx - 1, y: cy - 1, width: 3, height: 3 };
            carveRoom(grid, room);
            rooms.push(room);
        }
    }

    // 6. Find the farthest point in the maze to start the exit tunnel (using BFS)
    let farthestPoint = { x: mazeEntranceX, y: mazeEntranceY, dist: 0 };
    const queue: { x: number, y: number, dist: number }[] = [{ x: mazeEntranceX, y: mazeEntranceY, dist: 0 }];
    const visited = new Set<string>([`${mazeEntranceX},${mazeEntranceY}`]);

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (current.dist > farthestPoint.dist) {
            farthestPoint = current;
        }

        const neighbors = [{ dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }];
        for (const n of neighbors) {
            const nx = current.x + n.dx;
            const ny = current.y + n.dy;
            const key = `${nx},${ny}`;
            if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && !visited.has(key) && grid[ny][nx] !== CELL_MAZE_WALL) {
                visited.add(key);
                queue.push({ x: nx, y: ny, dist: current.dist + 1 });
            }
        }
    }

    // 7. Carve Exit Tunnel and Place End Door
    const exitTunnelX = farthestPoint.x;
    for (let y = farthestPoint.y; y < height - 1; y++) {
        if(grid[y]) grid[y][exitTunnelX] = CELL_PATH;
    }
    grid[height - 2][exitTunnelX] = CELL_DOOR_END;
    endDoorPosition = { x: exitTunnelX, y: height - 2 };

    return { grid, rooms, startDoorPosition, endDoorPosition };
}


export function startTestDungeon() {
    // --- Basic Three.js Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a); // Darker background

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const sceneContainer = document.getElementById('scene-container');
    if (sceneContainer) {
        while (sceneContainer.firstChild) {
            sceneContainer.removeChild(sceneContainer.firstChild);
        }
        sceneContainer.appendChild(renderer.domElement);
    } else {
        console.error("Scene container 'scene-container' not found!");
        return;
    }

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.5, 100);
    scene.add(pointLight);

    // --- Player Representation ---
    // A capsule is a good shape for a player controller.
    const playerGeometry = new THREE.CapsuleGeometry(0.3, 1.0);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x00dd00, wireframe: true });
    const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
    // Player's origin is at its center. We lift it so the bottom rests on the floor (y=0).
    playerMesh.position.set(0, 0.5 + 0.3, 0); // half-height + radius
    scene.add(playerMesh);

    // --- Controls ---
    const controls = new PointerLockControls(camera, renderer.domElement);
    scene.add(controls.getObject());
    // Position the camera at eye-level within the player's capsule.
    controls.getObject().position.y = 1.4;

    // --- Player Movement Variables ---
    // CHANGED: Adjusted speed and collider radius to match the new CELL_SIZE.
    const moveSpeed = 2.0 * CELL_SIZE;
    const playerColliderRadius = 0.4;

    const instructions = document.getElementById('instructions') || document.createElement('div');
    if (!instructions.id) instructions.id = 'instructions';
    instructions.innerHTML = 'Click to enter dungeon<br>W,A,S,D = Move | F = Use Door | ESC = Release Cursor';
    instructions.style.position = 'absolute';
    instructions.style.top = '10px';
    instructions.style.width = '100%';
    instructions.style.textAlign = 'center';
    instructions.style.color = 'white';
    instructions.style.zIndex = '100';
    document.body.appendChild(instructions);

    renderer.domElement.addEventListener('click', () => { controls.lock(); });
    controls.addEventListener('lock', () => { instructions.style.display = 'none'; });
    controls.addEventListener('unlock', () => { instructions.style.display = 'block'; });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const keysPressed: { [key: string]: boolean } = {};
    document.addEventListener('keydown', (event) => { keysPressed[event.code] = true; });
    document.addEventListener('keyup', (event) => { keysPressed[event.code] = false; });
    
    let dungeonWallMeshes: THREE.Mesh[] = [];
    let letDungeonData = generateDungeonData(GRID_WIDTH, GRID_HEIGHT);

    function initializeDungeon() {
        const renderResult = renderDungeonFromGrid(scene, letDungeonData.grid, CELL_SIZE, letDungeonData.rooms);
        dungeonWallMeshes = renderResult.wallMeshes;

        if (letDungeonData.startDoorPosition) {
            const playerYPosition = 1.4; // Player camera height
            const startWorldX = (letDungeonData.startDoorPosition.x - GRID_WIDTH / 2 + 0.5) * CELL_SIZE;
            const startWorldZ = (letDungeonData.startDoorPosition.y - GRID_HEIGHT / 2 + 0.5) * CELL_SIZE;
            controls.getObject().position.set(startWorldX, playerYPosition, startWorldZ);
        }
    }

    console.log("Test Dungeon Initializing...");
    initializeDungeon();
    console.log("Dungeon Data:", letDungeonData);

    // --- Collision Detection ---
    function checkCollision(moveDirection: THREE.Vector3): boolean {
        const playerPosition = controls.getObject().position.clone();
        const collisionRaycaster = new THREE.Raycaster(playerPosition, moveDirection, 0, playerColliderRadius + 0.1);
        const intersections = collisionRaycaster.intersectObjects(dungeonWallMeshes, false);
        return intersections.length > 0;
    }

    // --- Player Movement ---
    function updatePlayerMovement(delta: number) {
        if (!controls.isLocked) return;

        const forwardDirection = new THREE.Vector3();
        camera.getWorldDirection(forwardDirection);
        forwardDirection.y = 0;
        forwardDirection.normalize();

        const rightDirection = new THREE.Vector3().crossVectors(camera.up, forwardDirection).normalize();

        const speed = moveSpeed * delta;
        
        if ((keysPressed['KeyW'] || keysPressed['ArrowUp']) && !checkCollision(forwardDirection)) {
            controls.moveForward(speed);
        }
        if ((keysPressed['KeyS'] || keysPressed['ArrowDown']) && !checkCollision(forwardDirection.clone().negate())) {
            controls.moveForward(-speed);
        }
        if ((keysPressed['KeyA'] || keysPressed['ArrowLeft']) && !checkCollision(rightDirection)) {
            controls.moveRight(-speed);
        }
        if ((keysPressed['KeyD'] || keysPressed['ArrowRight']) && !checkCollision(rightDirection.clone().negate())) {
            controls.moveRight(speed);
        }
        
        playerMesh.position.copy(controls.getObject().position);
        playerMesh.position.y = 0.8; // Keep visual mesh on the ground

        pointLight.position.copy(controls.getObject().position);
        pointLight.position.y += 0.5;
    }

    // --- Animation Loop ---
    const clock = new THREE.Clock();
    let fKeyPressedLastFrame = false;

    function regenerateDungeon() {
        console.log("Regenerating dungeon...");
        letDungeonData = generateDungeonData(GRID_WIDTH, GRID_HEIGHT);
        initializeDungeon();
        console.log("Dungeon regenerated.");
    }

    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        updatePlayerMovement(delta);

        // Interaction for End Door
        if (keysPressed['KeyF'] && !fKeyPressedLastFrame) {
            const playerPos = controls.getObject().position;
            const endPos = letDungeonData.endDoorPosition;
            if(endPos){
                const endWorldX = (endPos.x - GRID_WIDTH / 2 + 0.5) * CELL_SIZE;
                const endWorldZ = (endPos.y - GRID_HEIGHT / 2 + 0.5) * CELL_SIZE;
                const distance = Math.sqrt(Math.pow(playerPos.x - endWorldX, 2) + Math.pow(playerPos.z - endWorldZ, 2));

                if (distance < CELL_SIZE) { // Check if player is close enough to the door cell
                     regenerateDungeon();
                }
            }
        }
        fKeyPressedLastFrame = keysPressed['KeyF'];

        renderer.render(scene, camera);
    }

    animate();
}

// --- Dungeon Visualization ---
function createTorch(scene: THREE.Scene, worldPosition: THREE.Vector3, cellSize: number) {
    const torchColor = 0xffaa33;
    const torchModelGeometry = new THREE.SphereGeometry(cellSize * 0.1, 8, 8);
    const torchModelMaterial = new THREE.MeshStandardMaterial({
        color: torchColor,
        emissive: torchColor,
        emissiveIntensity: 2.0
    });
    const torchModel = new THREE.Mesh(torchModelGeometry, torchModelMaterial);
    torchModel.position.copy(worldPosition);
    torchModel.position.y = cellSize * 0.7;

    const pointLight = new THREE.PointLight(torchColor, 1.2, cellSize * 5);
    torchModel.add(pointLight);
    torchModel.userData.isDungeonElement = true;
    scene.add(torchModel);
}

/**
 * Renders the 3D dungeon geometry from the grid data.
 * @param scene The THREE.Scene to add meshes to.
 * @param grid The 2D grid representing the dungeon layout.
 * @param cellSize The size of each cell in world units.
 * @param rooms An array of room areas for special features like torches.
 * @returns An object containing arrays of wall and door meshes.
 */
function renderDungeonFromGrid(scene: THREE.Scene, grid: DungeonGrid, cellSize: number, rooms: RoomArea[]): { wallMeshes: THREE.Mesh[], doorMeshes: THREE.Mesh[] } {
    const wallMeshes: THREE.Mesh[] = [];
    const doorMeshes: THREE.Mesh[] = [];

    // Clear old dungeon elements
    const objectsToRemove = scene.children.filter(child => child.userData.isDungeonElement);
    objectsToRemove.forEach(obj => {
        scene.remove(obj);
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
        if ((obj as THREE.Mesh).material) {
            if (Array.isArray((obj as THREE.Mesh).material)) {
                ((obj as THREE.Mesh).material as THREE.Material[]).forEach(m => m.dispose());
            } else {
                ((obj as THREE.Mesh).material as THREE.Material).dispose();
            }
        }
    });

    // Shared materials
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, map: new THREE.TextureLoader().load('https://www.textures.com/system/files/P/Thumbnails/127163/127163_490.jpg?v=5') });
    const pathMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, side: THREE.DoubleSide });
    const roomFloorMaterial = new THREE.MeshStandardMaterial({ color: 0x776655, side: THREE.DoubleSide });
    const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x3d3d3d, side: THREE.DoubleSide });

    // Shared geometries
    const wallGeometry = new THREE.BoxGeometry(cellSize, cellSize, cellSize);
    const floorPlaneGeometry = new THREE.PlaneGeometry(cellSize, cellSize);

    // CHANGED: Simplified door geometry. It's now a simple block placed in the door cell.
    const doorVisualGeometry = new THREE.BoxGeometry(cellSize * 0.2, cellSize * 0.9, cellSize * 0.9);
    const startDoorMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00cc00, emissiveIntensity: 0.7 });
    const endDoorMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xcc0000, emissiveIntensity: 0.7 });

    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
            const cellType = grid[y][x];
            const worldX = (x - grid[y].length / 2 + 0.5) * cellSize;
            const worldZ = (y - grid.length / 2 + 0.5) * cellSize;

            if (cellType === CELL_MAZE_WALL) {
                const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
                wallMesh.position.set(worldX, cellSize / 2, worldZ);
                wallMesh.userData.isDungeonElement = true;
                scene.add(wallMesh);
                wallMeshes.push(wallMesh);
            } else if (cellType !== CELL_EMPTY) { // Is a walkable space (Path, Room, or Door)
                const floorMaterial = cellType === CELL_ROOM_FLOOR ? roomFloorMaterial : pathMaterial;

                // Render Floor
                const floorPlane = new THREE.Mesh(floorPlaneGeometry, floorMaterial);
                floorPlane.rotation.x = -Math.PI / 2;
                floorPlane.position.set(worldX, 0, worldZ);
                floorPlane.userData.isDungeonElement = true;
                scene.add(floorPlane);

                // Render Ceiling
                const ceilingPlane = new THREE.Mesh(floorPlaneGeometry, ceilingMaterial);
                ceilingPlane.rotation.x = Math.PI / 2;
                ceilingPlane.position.set(worldX, cellSize, worldZ);
                ceilingPlane.userData.isDungeonElement = true;
                scene.add(ceilingPlane);

                // NEW: Simplified door rendering.
                if (cellType === CELL_DOOR_START || cellType === CELL_DOOR_END) {
                    const doorMaterial = cellType === CELL_DOOR_START ? startDoorMaterial : endDoorMaterial;
                    const doorMesh = new THREE.Mesh(doorVisualGeometry, doorMaterial);
                    // Position door in the middle of its cell, standing upright.
                    doorMesh.position.set(worldX, cellSize * 0.45, worldZ);
                    doorMesh.userData.isDungeonElement = true;
                    scene.add(doorMesh);
                    doorMeshes.push(doorMesh); // Add to this array if you need to interact with them specifically.
                }
            }
        }
    }

    // Place torches in rooms
    rooms.forEach(room => {
        const roomCenterX = (room.x + room.width / 2 - grid[0].length / 2 + 0.5) * cellSize;
        const roomCenterZ = (room.y + room.height / 2 - grid.length / 2 + 0.5) * cellSize;
        createTorch(scene, new THREE.Vector3(roomCenterX, 0, roomCenterZ), cellSize);
    });

    return { wallMeshes, doorMeshes };
}
