import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import '../../style.css'; // Basic styles

// --- Dungeon Grid Parameters & Cell Types ---
const GRID_WIDTH = 31; // Number of cells horizontally (odd number for maze algo)
const GRID_HEIGHT = 31; // Number of cells vertically (odd number for maze algo)
const CELL_SIZE = 2;   // Size of one cell in 3D units (e.g., 2x2 meters)

// Cell type identifiers
const CELL_EMPTY = 0; // Unused for now
const CELL_MAZE_WALL = 1; // Wall cell in the maze
const CELL_PATH = 2;      // Carved path cell in the maze
const CELL_ROOM_FLOOR = 3;// Floor of an expanded room area
const CELL_DOOR_START = 5;// Location of the start door
const CELL_DOOR_END = 6;  // Location of the end door
// CELL_TUNNEL_FLOOR is deprecated, CELL_PATH will be used for maze corridors.

// Type for the grid data
type DungeonGrid = number[][];

// --- Dungeon Generation Algorithm ---

// Room interface might not be needed in the same way if rooms are just expanded paths.
// We'll store room locations as simple {x,y} points or small areas.
interface RoomArea { // Simple representation for an area designated as a room
    x: number; // Top-left x of the room area on the grid
    y: number; // Top-left y of the room area on the grid
    width: number; // Width of the room area on the grid
    height: number; // Height of the room area on the grid
}


function generateDungeonData(width: number, height: number): { grid: DungeonGrid, rooms: RoomArea[], startDoorPosition: {x: number, y: number} | null, endDoorPosition: {x: number, y: number} | null } {
    // Initialize grid with all walls
    // The maze algorithm will carve paths.
    // For Recursive Backtracker, a common approach is a grid where:
    // - Even coordinates (e.g., 0,0, 2,2, 0,2) are potential path cells.
    // - Odd coordinates (e.g., 1,0, 0,1, 1,1) are walls between path cells.
    // To simplify, our grid will represent "cells". If a cell is a path, it's walkable.
    // If it's a wall, it's not. The algorithm will convert wall cells to path cells.
    // The grid dimensions (width, height) should be odd to allow paths to be surrounded by walls.
    // e.g. W P W P W (P = Path, W = Wall)
    //      P P P P P
    //      W P W P W
    // Our GRID_WIDTH/HEIGHT refer to the total dimensions.
    // The maze carving will happen on cells at odd indices like (1,1), (1,3), (3,1) etc.
    // And it will carve walls at even indices like (1,2) or (2,1) to connect them.

    const grid: DungeonGrid = Array.from({ length: height }, () => Array(width).fill(CELL_MAZE_WALL));
    const rooms: RoomArea[] = []; // To store locations of expanded room areas
    let startDoorPosition: {x: number, y: number} | null = null;
    let endDoorPosition: {x: number, y: number} | null = null;

    // --- Recursive Backtracker Maze Algorithm ---
    const carveMaze = (cx: number, cy: number) => {
        grid[cy][cx] = CELL_PATH; // Carve the current cell

        // Define directions (N, S, E, W) for neighbors 2 cells away
        const directions = [
            { x: 0, y: -2, wallX: 0, wallY: -1 }, // North
            { x: 0, y: 2,  wallX: 0, wallY: 1 },  // South
            { x: 2, y: 0,  wallX: 1, wallY: 0 },  // East
            { x: -2, y: 0, wallX: -1, wallY: 0 }  // West
        ];

        // Shuffle directions
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }

        for (const dir of directions) {
            const nx = cx + dir.x; // Neighbor X
            const ny = cy + dir.y; // Neighbor Y
            const wallNx = cx + dir.wallX; // Wall X between current and neighbor
            const wallNy = cy + dir.wallY; // Wall Y between current and neighbor

            // Check if neighbor is within bounds and unvisited (still a wall)
            if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && grid[ny][nx] === CELL_MAZE_WALL) {
                grid[wallNy][wallNx] = CELL_PATH; // Carve wall to neighbor
                carveMaze(nx, ny); // Recursively visit neighbor
            }
        }
    };

    // Start maze generation from a typical starting cell (e.g., 1,1)
    // Ensure starting cell is within bounds (especially for small test grids)
    if (width > 1 && height > 1) {
        carveMaze(1, 1);
    }
    // --- End Maze Algorithm ---

    // --- Integrate Rooms into the Maze ---
    const numRoomsToCreate = Math.floor(Math.random() * 3) + 3; // 3 to 5 rooms
    const roomMinSize = 2; // Min width/height in cells for a room
    const roomMaxSize = 3; // Max width/height in cells for a room
    const maxRoomAttempts = 50; // Attempts to place rooms

    for (let i = 0; i < maxRoomAttempts && rooms.length < numRoomsToCreate; i++) {
        // Pick a random *odd* coordinate for potential room center (must be a path cell)
        const potentialRoomX = Math.floor(Math.random() * ((width - 1) / 2)) * 2 + 1;
        const potentialRoomY = Math.floor(Math.random() * ((height - 1) / 2)) * 2 + 1;

        if (grid[potentialRoomY][potentialRoomX] === CELL_PATH) {
            const roomWidth = Math.floor(Math.random() * (roomMaxSize - roomMinSize + 1)) + roomMinSize;
            const roomHeight = Math.floor(Math.random() * (roomMaxSize - roomMinSize + 1)) + roomMinSize;

            // Calculate top-left corner for the room, ensuring it's on the grid
            // Try to center the room around potentialRoomX, potentialRoomY
            const rX = Math.max(1, potentialRoomX - Math.floor(roomWidth / 2));
            const rY = Math.max(1, potentialRoomY - Math.floor(roomHeight / 2));

            // Ensure room doesn't go out of bounds (respecting 1-cell border)
            if (rX + roomWidth < width -1 && rY + roomHeight < height -1) {
                // Basic check for overlap: for simplicity, we don't do a detailed overlap check here
                // as rooms are small and maze is sparse. Could be improved.
                // A simple check: is the center of this new room already part of another room?
                let canPlace = true;
                for (const existingRoom of rooms) {
                    const centerX = rX + roomWidth / 2;
                    const centerY = rY + roomHeight / 2;
                    if (centerX >= existingRoom.x && centerX < existingRoom.x + existingRoom.width &&
                        centerY >= existingRoom.y && centerY < existingRoom.y + existingRoom.height) {
                        canPlace = false;
                        break;
                    }
                }

                if (canPlace) {
                    for (let yOffset = 0; yOffset < roomHeight; yOffset++) {
                        for (let xOffset = 0; xOffset < roomWidth; xOffset++) {
                            grid[rY + yOffset][rX + xOffset] = CELL_ROOM_FLOOR;
                        }
                    }
                    rooms.push({ x: rX, y: rY, width: roomWidth, height: roomHeight });
                }
            }
        }
    }
    // --- End Room Integration ---

    // --- Place Start and End Doors ---
    if (rooms.length > 0) {
        // Start door in the first room
        const startRoom = rooms[0];
        const startX = Math.floor(startRoom.x + startRoom.width / 2);
        const startY = Math.floor(startRoom.y + startRoom.height / 2);
        grid[startY][startX] = CELL_DOOR_START;
        startDoorPosition = { x: startX, y: startY };

        // End door in the last room
        const endRoom = rooms[rooms.length - 1];
        let endX = Math.floor(endRoom.x + endRoom.width / 2);
        let endY = Math.floor(endRoom.y + endRoom.height / 2);

        // Ensure end door is not the same as start door if only one room or if centers coincide
        if (rooms.length === 1 || (startX === endX && startY === endY)) {
            // Try to find a different spot in the same room or an adjacent path cell
            // This is a simple fallback; could be more robust
            if (endX + 1 < endRoom.x + endRoom.width && grid[endY][endX+1] !== CELL_MAZE_WALL) {
                 endX = endX + 1;
            } else if (endX - 1 >= endRoom.x && grid[endY][endX-1] !== CELL_MAZE_WALL) {
                 endX = endX - 1;
            } else if (endY + 1 < endRoom.y + endRoom.height && grid[endY+1][endX] !== CELL_MAZE_WALL ) {
                 endY = endY + 1;
            } // Add more checks or a systematic search if needed
        }
        grid[endY][endX] = CELL_DOOR_END;
        endDoorPosition = { x: endX, y: endY };

    } else {
        // No rooms created, place doors on maze paths
        startDoorPosition = { x: 1, y: 1 }; // Default start of maze
        grid[1][1] = CELL_DOOR_START;

        // Find a distant path for the end door
        let foundEndDoor = false;
        for (let r = height - 2; r > 0; r--) {
            for (let c = width - 2; c > 0; c--) {
                if (grid[r][c] === CELL_PATH && !(c === 1 && r === 1)) {
                    grid[r][c] = CELL_DOOR_END;
                    endDoorPosition = { x: c, y: r };
                    foundEndDoor = true;
                    break;
                }
            }
            if (foundEndDoor) break;
        }
        if (!foundEndDoor) { // Fallback if no other path found (highly unlikely for a maze)
            if(width > 3) { // ensure there's space to move
                grid[1][3] = CELL_DOOR_END;
                endDoorPosition = { x: 3, y: 1};
            } else { // last resort
                 grid[3][1] = CELL_DOOR_END;
                 endDoorPosition = { x: 1, y: 3};
            }
        }
    }
    // --- End Door Placement ---

    // Example: Mark center as path for now to have something to see (temporary)
    // if (width > 2 && height > 2) {
    //     grid[Math.floor(height/2)][Math.floor(width/2)] = CELL_PATH;
    // }


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
    let doorMeshes: THREE.Mesh[] = []; // For potential future interaction
    
    // Make dungeonDataInstance accessible and updatable
    let dungeonDataInstance = generateDungeonData(GRID_WIDTH, GRID_HEIGHT);

    // Initial rendering
    let renderResult = renderDungeonFromGrid(scene, dungeonDataInstance.grid, CELL_SIZE, dungeonDataInstance.rooms);
    dungeonWallMeshes = renderResult.wallMeshes;
    doorMeshes = renderResult.doorMeshes;

    // Position player at start door
    if (dungeonDataInstance.startDoorPosition) {
        // Calculate world coordinates, ensuring player is at correct height (center of cell y, plus half player height)
        const playerYPosition = playerMesh.position.y; // Assuming playerMesh.position.y is set correctly for standing on floor (e.g. 0.9)
        const startWorldX = (dungeonDataInstance.startDoorPosition.x - GRID_WIDTH / 2 + 0.5) * CELL_SIZE;
        const startWorldZ = (dungeonDataInstance.startDoorPosition.y - GRID_HEIGHT / 2 + 0.5) * CELL_SIZE;
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
    let fKeyPressedLastFrame = false; // To prevent multiple regenerations per key press

    function regenerateDungeon() {
        console.log("Regenerating dungeon...");
        // Generate new dungeon data
        const newDungeonData = generateDungeonData(GRID_WIDTH, GRID_HEIGHT);

        // Update the shared dungeonDataInstance
        dungeonDataInstance = newDungeonData;

        // Clear old geometry and render new dungeon
        // renderDungeonFromGrid handles clearing old elements with userData.isDungeonElement
        const newRenderResult = renderDungeonFromGrid(scene, dungeonDataInstance.grid, CELL_SIZE, dungeonDataInstance.rooms);
        dungeonWallMeshes = newRenderResult.wallMeshes;
        doorMeshes = newRenderResult.doorMeshes; // Update doorMeshes as well

        // Position player at the new start door
        if (dungeonDataInstance.startDoorPosition) {
            const playerYPosition = playerMesh.position.y; // Maintain current Y
            const startWorldX = (dungeonDataInstance.startDoorPosition.x - GRID_WIDTH / 2 + 0.5) * CELL_SIZE;
            const startWorldZ = (dungeonDataInstance.startDoorPosition.y - GRID_HEIGHT / 2 + 0.5) * CELL_SIZE;
            controls.getObject().position.set(startWorldX, playerYPosition, startWorldZ);
            playerMesh.position.set(startWorldX, playerYPosition, startWorldZ); // Also update visual mesh
             // Ensure camera is looking forward after teleporting
            camera.lookAt(playerMesh.position.x + forwardDirection.x, playerYPosition, playerMesh.position.z + forwardDirection.z);

        }
        console.log("Dungeon regenerated.");
        // Update the global grid reference if interactions depend on it directly
        // currentGrid = newDungeonData.grid; // Example if you had a global currentGrid
    }

    // Need forwardDirection for camera reset in regenerateDungeon
    const forwardDirection = new THREE.Vector3();

    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        
        camera.getWorldDirection(forwardDirection); // Update forwardDirection each frame
        forwardDirection.y = 0;
        forwardDirection.normalize();

        updatePlayerMovement(delta); // Call player movement update

        // Interaction for End Door
        if (keysPressed['KeyF']) {
            if (!fKeyPressedLastFrame) { // Process 'F' key press only once
                const playerGridX = Math.floor(controls.getObject().position.x / CELL_SIZE + GRID_WIDTH / 2);
                const playerGridY = Math.floor(controls.getObject().position.z / CELL_SIZE + GRID_HEIGHT / 2);

                if (playerGridX >= 0 && playerGridX < GRID_WIDTH && playerGridY >= 0 && playerGridY < GRID_HEIGHT) {
                    // Use the latest grid data for checking cell type
                    // This assumes dungeonData.grid is the current grid. If regenerateDungeon updates a global
                    // 'currentGrid', use that here. For now, using dungeonData from initial load.
                    // This will only work for the initially loaded dungeonData.grid.
                    // For subsequent dungeons, we need to ensure this check uses the *current* grid.
                    // Let's assume regenerateDungeon will update a 'currentLiveGrid' reference or similar.
                    // For now, this interaction will only work on the *first* dungeon's end door.
                    // To fix this, `dungeonData` should be made a `let` variable in `startTestDungeon` scope
                    // and reassigned in `regenerateDungeon`.

                    // Quick fix: make dungeonData updatable
                    // This was: const dungeonData = generateDungeonData(...)
                    // Change to: let dungeonDataInstance = generateDungeonData(...)
                    // And then in regenerateDungeon: dungeonDataInstance = newDungeonData;
                    // For now, this will be a known issue if not addressing dungeonData scope.
                    // The current fix will be to make dungeonData a 'let' and reassign. (This is done via dungeonDataInstance)

                    if (dungeonDataInstance.grid[playerGridY] && dungeonDataInstance.grid[playerGridY][playerGridX] === CELL_DOOR_END) {
                        regenerateDungeon();
                    }
                }
            }
            fKeyPressedLastFrame = true;
        } else {
            fKeyPressedLastFrame = false;
        }

        renderer.render(scene, camera);
    }

    animate(); // Start animation loop at the end of startTestDungeon
}

// --- Dungeon Visualization ---

// Helper to create a torch (model + light) - testRoom.ts style
function createTorch(scene: THREE.Scene, worldPosition: THREE.Vector3, cellSize: number) {
    const torchColor = 0xffaa33; // Warm orange
    const torchRadius = cellSize * 0.1; // Radius of the emissive sphere

    // Emissive sphere model for the torch flame
    const torchModelGeometry = new THREE.SphereGeometry(torchRadius, 16, 16);
    const torchModelMaterial = new THREE.MeshStandardMaterial({
        color: torchColor,
        emissive: torchColor,
        emissiveIntensity: 1.5 // Slightly brighter emissive intensity
    });
    const torchModel = new THREE.Mesh(torchModelGeometry, torchModelMaterial);

    // Position the torch model. Y position might need adjustment based on where it's placed (wall/floor)
    // For now, assume it's placed relative to a cell center, at a certain height.
    torchModel.position.copy(worldPosition);
    torchModel.position.y = cellSize * 0.6; // Default height from floor if position.y was 0

    // PointLight parented to the torch model
    const pointLight = new THREE.PointLight(torchColor, 1.0, cellSize * 4); // color, intensity, distance
    // Light is at the center of the sphere model by default if parented with no offset.
    // pointLight.position.set(0,0,0); // Not needed if centered in parent

    torchModel.add(pointLight); // Parent light to model
    torchModel.userData.isDungeonElement = true;
    scene.add(torchModel);
}


function renderDungeonFromGrid(scene: THREE.Scene, grid: DungeonGrid, cellSize: number, rooms: RoomArea[]): { wallMeshes: THREE.Mesh[], doorMeshes: THREE.Mesh[] } {
    const wallMeshes: THREE.Mesh[] = [];
    const doorMeshes: THREE.Mesh[] = [];
    const objectsToRemove = scene.children.filter(child => child.userData.isDungeonElement);
    objectsToRemove.forEach(obj => {
        scene.remove(obj);
        // Proper disposal for geometries and materials if they are not shared extensively
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
        if ((obj as THREE.Mesh).material) {
            if (Array.isArray((obj as THREE.Mesh).material)) {
                ((obj as THREE.Mesh).material as THREE.Material[]).forEach(m => m.dispose());
            } else {
                ((obj as THREE.Mesh).material as THREE.Material).dispose();
            }
        }
    });

    const wallGeometry = new THREE.BoxGeometry(cellSize, cellSize, cellSize);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a }); // Darker walls

    const floorPlaneGeometry = new THREE.PlaneGeometry(cellSize, cellSize);
    const pathMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, side: THREE.DoubleSide }); // Grey paths
    const roomFloorMaterial = new THREE.MeshStandardMaterial({ color: 0x776655, side: THREE.DoubleSide }); // Brownish room floor
    const startDoorMaterial = new THREE.MeshStandardMaterial({ color: 0x00cc00, side: THREE.DoubleSide, emissive: 0x00cc00, emissiveIntensity: 0.5 });
    const endDoorMaterial = new THREE.MeshStandardMaterial({ color: 0xcc0000, side: THREE.DoubleSide, emissive: 0xcc0000, emissiveIntensity: 0.5 });

    const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x505050, side: THREE.DoubleSide }); // Dark grey ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(cellSize, cellSize);

    // Slimmer door for wall placement
    const doorVisualGeometry = new THREE.BoxGeometry(cellSize * 0.8, cellSize * 0.9, cellSize * 0.1); // Width, Height, Thickness
    const doorThickness = cellSize * 0.1; // This is the actual thickness of the door model along its local Z axis

    // Keep track of walls that have doors in them to avoid rendering the wall cube
    const wallsWithDoors = new Set<string>(); // "x,y" string for key

    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
            const cellType = grid[y][x];
            const worldX = (x - grid[y].length / 2) * cellSize + cellSize / 2;
            const worldZ = (y - grid.length / 2) * cellSize + cellSize / 2;

            if (cellType === CELL_DOOR_START || cellType === CELL_DOOR_END) {
                // Render floor and ceiling for the door cell itself
                const doorCellFloorMaterial = (cellType === CELL_DOOR_START) ? startDoorMaterial : endDoorMaterial;
                const floorPlane = new THREE.Mesh(floorPlaneGeometry, doorCellFloorMaterial.clone());
                floorPlane.rotation.x = -Math.PI / 2;
                floorPlane.position.set(worldX, 0, worldZ);
                floorPlane.userData.isDungeonElement = true;
                scene.add(floorPlane);

                const ceilingPlane = new THREE.Mesh(ceilingGeometry, ceilingMaterial.clone());
                ceilingPlane.rotation.x = Math.PI / 2;
                ceilingPlane.position.set(worldX, cellSize, worldZ);
                ceilingPlane.userData.isDungeonElement = true;
                scene.add(ceilingPlane);

                // Now place the door visual in an adjacent wall
                const doorVisualMaterialToUse = (cellType === CELL_DOOR_START) ? startDoorMaterial : endDoorMaterial;
                const doorMesh = new THREE.Mesh(doorVisualGeometry, doorVisualMaterialToUse.clone());
                doorMesh.userData.isDungeonElement = true;

                let placedDoor = false;
                // Check neighbors for a wall to place the door into
                // Order: South, East, North, West
                const wallCheckOrder = [
                    { dx: 0, dy: 1, rotY: 0 }, // Wall to the South of door cell, door faces North
                    { dx: 1, dy: 0, rotY: Math.PI / 2 }, // Wall to the East of door cell, door faces West
                    { dx: 0, dy: -1, rotY: Math.PI }, // Wall to the North of door cell, door faces South
                    { dx: -1, dy: 0, rotY: -Math.PI / 2 }  // Wall to the West of door cell, door faces East
                ];

                for (const offset of wallCheckOrder) {
                    const wallX = x + offset.dx;
                    const wallY = y + offset.dy;
                    if (wallX >= 0 && wallX < grid[0].length && wallY >= 0 && wallY < grid.length && grid[wallY][wallX] === CELL_MAZE_WALL) {
                        const wallWorldX = (wallX - grid[0].length / 2) * cellSize + cellSize / 2;
                        const wallWorldZ = (wallY - grid.length / 2) * cellSize + cellSize / 2;

                        doorMesh.position.set(wallWorldX, cellSize * 0.45, wallWorldZ); // Centered in wall cell, half height
                        doorMesh.rotation.y = offset.rotY;

                        // Adjust position slightly to be "in" the wall plane, not centered in wall cell block
                        if (offset.dx === 1) { // Wall to East, door mesh X moves slightly West
                            doorMesh.position.x -= (cellSize / 2) - (doorThickness / 2) ;
                        } else if (offset.dx === -1) { // Wall to West, door mesh X moves slightly East
                            doorMesh.position.x += (cellSize / 2) - (doorThickness / 2);
                        } else if (offset.dy === 1) { // Wall to South, door mesh Z moves slightly North
                            doorMesh.position.z -= (cellSize/2) - (doorThickness/2);
                        } else if (offset.dy === -1) { // Wall to North, door mesh Z moves slightly South
                            doorMesh.position.z += (cellSize/2) - (doorThickness/2);
                        }


                        scene.add(doorMesh);
                        doorMeshes.push(doorMesh);
                        wallsWithDoors.add(`${wallX},${wallY}`); // Mark this wall as having a door
                        placedDoor = true;
                        break;
                    }
                }
                if (!placedDoor) { // Fallback if no adjacent wall (e.g. door cell in open space - should not happen with maze)
                                   // Place it in its own cell like before
                    const doorVisMaterial = (cellType === CELL_DOOR_START) ? startDoorMaterial : endDoorMaterial;
                    const fallbackDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(cellSize*0.8, cellSize*0.9, cellSize*0.1), doorVisMaterial.clone());
                    fallbackDoorMesh.position.set(worldX, cellSize * 0.45, worldZ);
                    fallbackDoorMesh.userData.isDungeonElement = true;
                    scene.add(fallbackDoorMesh);
                    doorMeshes.push(fallbackDoorMesh);
                }


            } else if (cellType === CELL_MAZE_WALL) {
                if (!wallsWithDoors.has(`${x},${y}`)) { // Only render wall if no door is in it
                    const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial.clone());
                    wallMesh.position.set(worldX, cellSize / 2, worldZ);
                    wallMesh.userData.isDungeonElement = true;
                    scene.add(wallMesh);
                    wallMeshes.push(wallMesh);
                }
            } else if (cellType === CELL_PATH || cellType === CELL_ROOM_FLOOR) {
                let currentFloorMaterial = pathMaterial;
                if (cellType === CELL_ROOM_FLOOR) currentFloorMaterial = roomFloorMaterial;
                else if (cellType === CELL_DOOR_START) currentFloorMaterial = startDoorMaterial;
                else if (cellType === CELL_DOOR_END) currentFloorMaterial = endDoorMaterial;

                const floorPlane = new THREE.Mesh(floorPlaneGeometry, currentFloorMaterial.clone());
                floorPlane.rotation.x = -Math.PI / 2;
                floorPlane.position.set(worldX, 0, worldZ);
                floorPlane.userData.isDungeonElement = true;
                scene.add(floorPlane);

                const ceilingPlane = new THREE.Mesh(ceilingGeometry, ceilingMaterial.clone());
                ceilingPlane.rotation.x = Math.PI / 2;
                ceilingPlane.position.set(worldX, cellSize, worldZ);
                ceilingPlane.userData.isDungeonElement = true;
                scene.add(ceilingPlane);

                // Add visual for doors
                if (cellType === CELL_DOOR_START || cellType === CELL_DOOR_END) {
                    const doorVisualMaterial = (cellType === CELL_DOOR_START) ? startDoorMaterial : endDoorMaterial;
                    const doorMesh = new THREE.Mesh(doorVisualGeometry, doorVisualMaterial.clone());
                    doorMesh.position.set(worldX, cellSize * 0.45, worldZ); // Position it standing on the floor
                    // Potentially rotate door based on adjacent paths later
                    doorMesh.userData.isDungeonElement = true;
                    scene.add(doorMesh);
                }
            }
        }
    }

    // Place torches in rooms
    rooms.forEach(room => {
        const roomCenterX = (room.x + room.width / 2 - grid[0].length / 2) * cellSize + cellSize / 2;
        const roomCenterZ = (room.y + room.height / 2 - grid.length / 2) * cellSize + cellSize / 2;
        createTorch(scene, new THREE.Vector3(roomCenterX, 0, roomCenterZ), cellSize);
    });

    // Place torches at some maze junctions or long corridors (simple approach)
    let pathCellsForTorches = 0;
    for (let y = 1; y < grid.length - 1; y+=2) { // Iterate over potential path cells
        for (let x = 1; x < grid[y].length - 1; x+=2) {
            if (grid[y][x] === CELL_PATH) {
                pathCellsForTorches++;
                if (pathCellsForTorches % 7 === 0) { // Place a torch every 7th path cell (approx)
                    const worldX = (x - grid[y].length / 2) * cellSize + cellSize / 2;
                    const worldZ = (y - grid.length / 2) * cellSize + cellSize / 2;

                    // Check for adjacent walls to "mount" torch visually (optional refinement)
                    // For now, place near center of path cell, slightly offset if desired
                    createTorch(scene, new THREE.Vector3(worldX, 0, worldZ), cellSize);
                }
            }
        }
    }


    const placeholderFloor = scene.getObjectByName("placeholderFloor");
    if (placeholderFloor) {
        scene.remove(placeholderFloor);
        if ((placeholderFloor as THREE.Mesh).geometry) (placeholderFloor as THREE.Mesh).geometry.dispose();
        if ((placeholderFloor as THREE.Mesh).material) ((placeholderFloor as THREE.Mesh).material as THREE.Material).dispose();
    }
    return wallMeshes;
}
