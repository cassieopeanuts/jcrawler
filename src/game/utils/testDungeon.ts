import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import '../../style.css'; // Basic styles

// --- Dungeon Grid Parameters & Cell Types ---
const GRID_WIDTH = 30; // Number of cells horizontally
const GRID_HEIGHT = 30; // Number of cells vertically
const CELL_SIZE = 2;   // Size of one cell in 3D units (e.g., 2x2 meters)

// Cell type identifiers
const CELL_EMPTY = 0; // Or use for un-carved areas if not starting with all walls
const CELL_WALL = 1;
const CELL_FLOOR = 2; // General walkable floor (could be used for tunnels)
const CELL_ROOM_FLOOR = 3;
const CELL_TUNNEL_FLOOR = 4; // Explicitly for tunnels if needed for different styling/logic
const CELL_DOOR_START = 5;
const CELL_DOOR_END = 6;
// Potentially more: CELL_CORRIDOR_FLOOR, CELL_WATER, CELL_TRAP etc.

// Type for the grid data
type DungeonGrid = number[][];

// --- Dungeon Generation Algorithm ---

interface Room {
    x: number;
    y: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
}

function generateDungeonData(width: number, height: number): { grid: DungeonGrid, rooms: Room[], startDoorPosition: {x: number, y: number} | null, endDoorPosition: {x: number, y: number} | null } {
    const grid: DungeonGrid = Array.from({ length: height }, () => Array(width).fill(CELL_WALL));
    const rooms: Room[] = [];
    const minRoomSize = 4;
    const maxRoomSize = 8;
    const numRoomAttempts = 20; // Try to place this many rooms

    for (let i = 0; i < numRoomAttempts; i++) {
        const roomWidth = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
        const roomHeight = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
        // Position must be odd to ensure walls can surround rooms if using even room sizes + odd positions for walls
        const x = Math.floor(Math.random() * (width - roomWidth - 1) / 2) * 2 + 1;
        const y = Math.floor(Math.random() * (height - roomHeight - 1) / 2) * 2 + 1;

        let overlaps = false;
        // Check for overlap with existing rooms (simple bounding box check with padding)
        for (const room of rooms) {
            if (x < room.x + room.width + 1 && x + roomWidth + 1 > room.x &&
                y < room.y + room.height + 1 && y + roomHeight + 1 > room.y) {
                overlaps = true;
                break;
            }
        }

        if (!overlaps) {
            for (let rY = y; rY < y + roomHeight; rY++) {
                for (let rX = x; rX < x + roomWidth; rX++) {
                    if (rX >= 0 && rX < width && rY >= 0 && rY < height) { // Boundary check
                        grid[rY][rX] = CELL_ROOM_FLOOR;
                    }
                }
            }
            const newRoom: Room = {
                x, y, width: roomWidth, height: roomHeight,
                centerX: Math.floor(x + roomWidth / 2),
                centerY: Math.floor(y + roomHeight / 2)
            };
            rooms.push(newRoom);
        }
    }

    // Connect rooms with tunnels
    for (let i = 0; i < rooms.length - 1; i++) {
        const r1 = rooms[i];
        const r2 = rooms[i + 1]; // Connect to the next room in the list for simplicity

        let curX = r1.centerX;
        let curY = r1.centerY;

        // Randomly decide to go horizontal then vertical, or vice-versa
        if (Math.random() > 0.5) {
            // Horizontal then Vertical
            while (curX !== r2.centerX) {
                grid[curY][curX] = CELL_TUNNEL_FLOOR;
                curX += Math.sign(r2.centerX - curX);
            }
            while (curY !== r2.centerY) {
                grid[curY][curX] = CELL_TUNNEL_FLOOR;
                curY += Math.sign(r2.centerY - curY);
            }
        } else {
            // Vertical then Horizontal
            while (curY !== r2.centerY) {
                grid[curY][curX] = CELL_TUNNEL_FLOOR;
                curY += Math.sign(r2.centerY - curY);
            }
            while (curX !== r2.centerX) {
                grid[curY][curX] = CELL_TUNNEL_FLOOR;
                curX += Math.sign(r2.centerX - curX);
            }
        }
        grid[curY][curX] = CELL_TUNNEL_FLOOR; // Ensure endpoint of tunnel is floor
    }
    
    let startDoorPosition: {x: number, y: number} | null = null;
    let endDoorPosition: {x: number, y: number} | null = null;

    if (rooms.length > 0) {
        // Place start door in the first room
        const startRoom = rooms[0];
        const startX = startRoom.centerX;
        const startY = startRoom.centerY;
        grid[startY][startX] = CELL_DOOR_START;
        startDoorPosition = { x: startX, y: startY };


        // Place end door in the last room (or a distant room)
        const endRoom = rooms[rooms.length - 1];
        const endX = endRoom.centerX;
        const endY = endRoom.centerY;
        // Ensure end door is not same as start if only one room
        if (rooms.length === 1 && startX === endX && startY === endY) {
            // slightly offset if possible, or pick another spot
            if (endX + 1 < endRoom.x + endRoom.width) grid[endY][endX+1] = CELL_DOOR_END;
            else grid[endY][endX-1] = CELL_DOOR_END; // crude fallback
            endDoorPosition = { x: (endX + 1 < endRoom.x + endRoom.width ? endX+1 : endX-1) , y: endY };

        } else {
             grid[endY][endX] = CELL_DOOR_END;
             endDoorPosition = { x: endX, y: endY };
        }
    }

    return { grid, rooms, startDoorPosition, endDoorPosition };
}


export function startTestDungeon() {
    // --- Basic Three.js Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020); // Darker background for a dungeon feel

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Player will be positioned later based on dungeon start

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const sceneContainer = document.getElementById('scene-container');
    if (sceneContainer) {
        // Clear previous content (e.g., from testRoom)
        while (sceneContainer.firstChild) {
            sceneContainer.removeChild(sceneContainer.firstChild);
        }
        sceneContainer.appendChild(renderer.domElement);
    } else {
        console.error("Scene container 'scene-container' not found!");
        return;
    }

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Soft white light
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.5, 100);
    pointLight.position.set(0, 5, 0); // Will be positioned relative to player later
    scene.add(pointLight);

    // --- Player Representation (Placeholder) ---
    const playerGeometry = new THREE.CapsuleGeometry(0.4, 1.0, 4, 8); // radius, height
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x00dd00 });
    const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
    playerMesh.position.set(0, 0.9, 0); // Initial position, will be updated
    scene.add(playerMesh); // Add player to scene so it's visible if camera is separate

    // --- Controls ---
    const controls = new PointerLockControls(camera, renderer.domElement);
    scene.add(controls.getObject());
    controls.getObject().position.copy(playerMesh.position); 
    // camera.position.set(0,0.6,0); // Camera is child of controls.getObject(), its relative position is fixed.

    // --- Player Movement Variables ---
    const moveSpeed = 1.5 * CELL_SIZE; // Adjusted for CELL_SIZE, e.g., 3 units per second if CELL_SIZE is 2
    const playerVelocity = new THREE.Vector3();
    const keysPressed: { [key: string]: boolean } = {};
    const playerColliderRadius = 0.4 * CELL_SIZE; // Player's collision radius


    const instructions = document.getElementById('instructions') || document.createElement('div');
    if (!instructions.id) instructions.id = 'instructions';
    instructions.innerHTML = 'Click to enter dungeon (ESC to release cursor)';
    instructions.style.position = 'absolute';
    instructions.style.top = '10px';
    instructions.style.width = '100%';
    instructions.style.textAlign = 'center';
    instructions.style.color = 'white';
    instructions.style.zIndex = '100';
    if (!instructions.parentElement) {
        document.body.appendChild(instructions);
    }
    instructions.style.display = 'block';

    renderer.domElement.addEventListener('click', () => {
        controls.lock();
    });

    controls.addEventListener('lock', () => {
        instructions.style.display = 'none';
    });

    controls.addEventListener('unlock', () => {
        instructions.style.display = 'block';
    });
    
    // --- Basic Floor (Placeholder, will be replaced by dungeon geometry) ---
    const placeholderFloorGeometry = new THREE.PlaneGeometry(100, 100);
    const placeholderFloorMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, side: THREE.DoubleSide });
    const placeholderFloor = new THREE.Mesh(placeholderFloorGeometry, placeholderFloorMaterial);
    placeholderFloor.name = "placeholderFloor"; // Name for easy removal
    placeholderFloor.rotation.x = -Math.PI / 2;
    placeholderFloor.position.y = 0;
    scene.add(placeholderFloor);




    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Keyboard event listeners for movement
    document.addEventListener('keydown', (event) => {
        keysPressed[event.code] = true;
    });

    document.addEventListener('keyup', (event) => {
        keysPressed[event.code] = false;
    });

    console.log("Test Dungeon Started: Basic scene set up.");
    
    // Dungeon generation and rendering logic will be called here
    // This array will store wall meshes for collision detection
    let dungeonWallMeshes: THREE.Mesh[] = []; 
    
    const dungeonData = generateDungeonData(GRID_WIDTH, GRID_HEIGHT);
    dungeonWallMeshes = renderDungeonFromGrid(scene, dungeonData.grid, CELL_SIZE); // Capture wall meshes

    // Position player at start door
    if (dungeonData.startDoorPosition) {
        // Calculate world coordinates, ensuring player is at correct height (center of cell y, plus half player height)
        const playerYPosition = playerMesh.position.y; // Assuming playerMesh.position.y is set correctly for standing on floor (e.g. 0.9)
        const startWorldX = (dungeonData.startDoorPosition.x - GRID_WIDTH / 2 + 0.5) * CELL_SIZE;
        const startWorldZ = (dungeonData.startDoorPosition.y - GRID_HEIGHT / 2 + 0.5) * CELL_SIZE;
        controls.getObject().position.set(startWorldX, playerYPosition, startWorldZ);
        playerMesh.position.set(startWorldX, playerYPosition, startWorldZ);
    }

    console.log("Test Dungeon Started: Basic scene set up.");
    console.log("Dungeon Data:", dungeonData);
    console.log("Number of wall meshes for collision:", dungeonWallMeshes.length);

    // --- Collision Detection Function ---
    function checkCollision(moveDirection: THREE.Vector3, movementAmount: number): boolean {
        if (!controls.isLocked) return false;

        const playerPosition = controls.getObject().position.clone();
        // Adjust raycaster origin slightly, perhaps to actual feet or center mass for better collision feel
        // For capsule, ray origin could be center of lower sphere.
        // playerPosition.y -= (playerMesh.geometry as THREE.CapsuleGeometry).parameters.height / 2 - (playerMesh.geometry as THREE.CapsuleGeometry).parameters.radius;


        const collisionRaycaster = new THREE.Raycaster(playerPosition, moveDirection.normalize(), 0, playerColliderRadius + movementAmount);
        const intersections = collisionRaycaster.intersectObjects(dungeonWallMeshes, false); // Check against dynamic dungeon walls

        if (intersections.length > 0) {
            // console.log("Collision detected at distance:", intersections[0].distance);
            return true; // Collision detected
        }
        return false; // No collision
    }

    // --- Player Movement Function ---
    function updatePlayerMovement(delta: number) {
        if (!controls.isLocked) return;

        const currentMoveSpeed = moveSpeed * delta; // Adjust speed by delta time

        // Calculate intended movement direction
        const forwardDirection = new THREE.Vector3();
        camera.getWorldDirection(forwardDirection);
        forwardDirection.y = 0; // Keep movement horizontal
        forwardDirection.normalize();

        const rightDirection = new THREE.Vector3();
        rightDirection.copy(forwardDirection).cross(camera.up).normalize();


        let moveForward = 0;
        if (keysPressed['KeyW'] || keysPressed['ArrowUp']) moveForward += 1;
        if (keysPressed['KeyS'] || keysPressed['ArrowDown']) moveForward -= 1;
        
        let moveStrafe = 0;
        if (keysPressed['KeyA'] || keysPressed['ArrowLeft']) moveStrafe -= 1;
        if (keysPressed['KeyD'] || keysPressed['ArrowRight']) moveStrafe += 1;

        // Handle forward/backward movement
        if (moveForward !== 0) {
            const effectiveMoveSpeed = moveForward * currentMoveSpeed;
            const moveVec = forwardDirection.clone().multiplyScalar(effectiveMoveSpeed);
            if (!checkCollision(forwardDirection.clone().multiplyScalar(Math.sign(effectiveMoveSpeed)), Math.abs(effectiveMoveSpeed))) {
                controls.moveForward(effectiveMoveSpeed);
            }
        }

        // Handle strafe movement
        if (moveStrafe !== 0) {
            const effectiveStrafeSpeed = moveStrafe * currentMoveSpeed;
            const strafeVec = rightDirection.clone().multiplyScalar(effectiveStrafeSpeed);
             if (!checkCollision(rightDirection.clone().multiplyScalar(Math.sign(effectiveStrafeSpeed)), Math.abs(effectiveStrafeSpeed))) {
                controls.moveRight(effectiveStrafeSpeed);
            }
        }
        
        // Update playerMesh visual position to follow the controls object
        playerMesh.position.copy(controls.getObject().position);
        // Adjust visual mesh y position if necessary (e.g. if controls object is at eye level and mesh is full body)
        playerMesh.position.y -= (playerMesh.geometry as THREE.CapsuleGeometry).parameters.height / 2;


        // Update point light to follow player
        pointLight.position.x = controls.getObject().position.x;
        pointLight.position.y = controls.getObject().position.y + 1.0; // Slightly above player
        pointLight.position.z = controls.getObject().position.z;
    }


    // --- Animation Loop ---
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        
        updatePlayerMovement(delta); // Call player movement update

        renderer.render(scene, camera);
    }

    animate(); // Start animation loop at the end of startTestDungeon
}

// --- Dungeon Visualization ---
// renderDungeonFromGrid now returns an array of wall meshes
function renderDungeonFromGrid(scene: THREE.Scene, grid: DungeonGrid, cellSize: number): THREE.Mesh[] {
    const wallMeshes: THREE.Mesh[] = [];
    // Clear previous dungeon meshes if any (important for regeneration)
    const objectsToRemove = scene.children.filter(child => child.userData.isDungeonElement);
    objectsToRemove.forEach(obj => scene.remove(obj));
    // Note: Proper disposal of geometries and materials should be handled for long-running apps

    const wallGeometry = new THREE.BoxGeometry(cellSize, cellSize, cellSize); // Assuming walls are cubes
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 }); // Dark grey walls

    const floorGeometry = new THREE.PlaneGeometry(cellSize, cellSize);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x777777, side: THREE.DoubleSide }); // Grey floor
    const roomFloorMaterial = new THREE.MeshStandardMaterial({ color: 0x887766, side: THREE.DoubleSide }); // Brownish room floor
    const tunnelFloorMaterial = new THREE.MeshStandardMaterial({ color: 0x666677, side: THREE.DoubleSide }); // Bluish tunnel floor
    const startDoorMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, side: THREE.DoubleSide }); // Green start
    const endDoorMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, side: THREE.DoubleSide });   // Red end

    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
            const cellType = grid[y][x];
            const worldX = (x - grid[y].length / 2) * cellSize + cellSize / 2; // Center cell in world space
            const worldZ = (y - grid.length / 2) * cellSize + cellSize / 2;   // Center cell in world space

            if (cellType === CELL_WALL) {
                const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial.clone());
                wallMesh.position.set(worldX, cellSize / 2, worldZ);
                wallMesh.userData.isDungeonElement = true;
                scene.add(wallMesh);
                wallMeshes.push(wallMesh); // Collect wall mesh
            } else { // If not a wall, it's some kind of floor
                let currentFloorMaterial = floorMaterial;
                if (cellType === CELL_ROOM_FLOOR) currentFloorMaterial = roomFloorMaterial;
                else if (cellType === CELL_TUNNEL_FLOOR) currentFloorMaterial = tunnelFloorMaterial;
                else if (cellType === CELL_DOOR_START) currentFloorMaterial = startDoorMaterial;
                else if (cellType === CELL_DOOR_END) currentFloorMaterial = endDoorMaterial;
                // Also CELL_FLOOR would use the default floorMaterial

                const floorPlane = new THREE.Mesh(floorGeometry, currentFloorMaterial.clone());
                floorPlane.rotation.x = -Math.PI / 2;
                floorPlane.position.set(worldX, 0, worldZ); // Position floor plane
                floorPlane.userData.isDungeonElement = true;
                scene.add(floorPlane);
            }
        }
    }
    // Remove the placeholder floor after real dungeon is rendered
    const placeholderFloor = scene.getObjectByName("placeholderFloor");
    if (placeholderFloor) {
        scene.remove(placeholderFloor);
        (placeholderFloor as THREE.Mesh).geometry.dispose();
        ((placeholderFloor as THREE.Mesh).material as THREE.Material).dispose();
    }
    return wallMeshes; // Return the collected wall meshes
}
