import './style.css';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

// Interaction State
let playerGold = 0;
let chestLooted = false;
let skeletonLooted = false;
const interactionDistance = 2.0; // Max distance to interact

// UI Elements
const popupElement = document.getElementById('popup') as HTMLDivElement;
const goldDisplayElement = document.getElementById('gold-display') as HTMLDivElement;

// Helper functions for UI
function showPopup(message: string, duration: number = 3000) {
  if (popupElement) {
    popupElement.textContent = message;
    popupElement.classList.remove('hidden');
    setTimeout(() => {
      popupElement.classList.add('hidden');
    }, duration);
  }
}

import { setupRoom, RuinSetupContext } from './game/aethelburg_ruins/ruinUtils'; // Import new functions

// Helper functions for UI (showPopup, updateGoldDisplay) - remain in main.ts for now or move to a UI manager
function showPopup(message: string, duration: number = 3000) {
  if (popupElement) {
    popupElement.textContent = message;
    popupElement.classList.remove('hidden');
    setTimeout(() => {
      popupElement.classList.add('hidden');
    }, duration);
  }
}

function updateGoldDisplay() {
  if (goldDisplayElement) {
    goldDisplayElement.textContent = `Gold: ${playerGold}`;
  }
}

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333); // Dark grey background

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 5); // Typical human eye height, looking towards origin from z=5

// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
const sceneContainer = document.getElementById('scene-container');
if (sceneContainer) {
  sceneContainer.appendChild(renderer.domElement);
} else {
  console.error('Scene container not found!');
}

// Lighting
// Change ambient light to blueish and increase intensity
const ambientLight = new THREE.AmbientLight(0x405080, 2.0); // Blueish light, increased intensity
scene.add(ambientLight);

// Increase torch light intensity
const torchLight = new THREE.PointLight(0xffaa33, 5.0, 20); // Warm torch light, increased intensity, reduced range for more focus
// The torchLight will be added as a child of torchModel, so its position will be relative to the model.
// We'll set the model's position, and the light will be at (0,0,0) within the model.
scene.add(torchLight); // Add to scene so it can be parented

// Room Geometry
const roomSize = { width: 10, height: 3, depth: 10 };

// Dynamic Game Objects - these will be managed by setupRoom via the context
let chest: THREE.Mesh | undefined;
let skeleton: THREE.Mesh | undefined;
let door: THREE.Mesh | undefined;

// Floor
const floorGeometry = new THREE.PlaneGeometry(roomSize.width, roomSize.depth);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
floor.position.y = 0;
scene.add(floor);

// Ceiling
const ceilingGeometry = new THREE.PlaneGeometry(roomSize.width, roomSize.depth);
const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x909090, side: THREE.DoubleSide });
const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
ceiling.rotation.x = Math.PI / 2; // Rotate to be horizontal
ceiling.position.y = roomSize.height;
scene.add(ceiling);

// Walls
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xa0a0a0 });

// Wall 1 (Back)
const wall1Geometry = new THREE.PlaneGeometry(roomSize.width, roomSize.height);
const wall1 = new THREE.Mesh(wall1Geometry, wallMaterial);
wall1.position.set(0, roomSize.height / 2, -roomSize.depth / 2);
scene.add(wall1);

// Wall 2 (Front)
const wall2Geometry = new THREE.PlaneGeometry(roomSize.width, roomSize.height);
const wall2 = new THREE.Mesh(wall2Geometry, wallMaterial);
wall2.position.set(0, roomSize.height / 2, roomSize.depth / 2);
wall2.rotation.y = Math.PI; // Rotate to face inwards
scene.add(wall2);


// Wall 3 (Left)
const wall3Geometry = new THREE.PlaneGeometry(roomSize.depth, roomSize.height);
const wall3 = new THREE.Mesh(wall3Geometry, wallMaterial);
wall3.position.set(-roomSize.width / 2, roomSize.height / 2, 0);
wall3.rotation.y = Math.PI / 2;
scene.add(wall3);

// Wall 4 (Right)
const wall4Geometry = new THREE.PlaneGeometry(roomSize.depth, roomSize.height);
const wall4 = new THREE.Mesh(wall4Geometry, wallMaterial);
wall4.position.set(roomSize.width / 2, roomSize.height / 2, 0);
wall4.rotation.y = -Math.PI / 2;
scene.add(wall4);


// Gameplay Elements

// Hand (relative to camera)
const handGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const handMaterial = new THREE.MeshStandardMaterial({ color: 0xcc8866 });
const hand = new THREE.Mesh(handGeometry, handMaterial);
// Position will be updated in animate loop relative to camera

// Weapon (relative to camera)
const weaponGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 16);
const weaponMaterial = new THREE.MeshStandardMaterial({ color: 0x666677 });
// Explicitly type weapon to allow different BufferGeometry types
const weapon: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial> = new THREE.Mesh(weaponGeometry, weaponMaterial);
// Position will be updated in animate loop relative to camera

// Add hand and weapon to a group that will be added to the camera
const playerCameraGroup = new THREE.Group();
playerCameraGroup.add(hand);
playerCameraGroup.add(weapon);
camera.add(playerCameraGroup); // Attach group to camera
scene.add(camera); // Ensure camera (and its children) are part of the scene

// Position hand and weapon - these are local to the playerCameraGroup
hand.position.set(0.3, -0.3, -0.5);
weapon.position.set(0.35, -0.2, -1.0);
weapon.rotation.x = Math.PI / 2; // Pointing forward
weapon.rotation.z = Math.PI / 4; // Slight angle

// Torch model
const torchModelGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const torchModelMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa33, emissive: 0xffaa33, emissiveIntensity: 1 });
const torchModel = new THREE.Mesh(torchModelGeometry, torchModelMaterial);
torchModel.position.set(2, 1.5, -4.5); // Position the model on the wall
scene.add(torchModel);

// Add light to the torch model, so it moves with the torch.
// The light's position is now relative to the torchModel (0,0,0)
torchModel.add(torchLight);


// Treasury Chest, Skeleton, Door - will be initialized in setupRoom
let chest: THREE.Mesh;
let skeleton: THREE.Mesh;
let door: THREE.Mesh;

// Default geometries and materials (can be reused or customized per object type)
const defaultChestGeometry = new THREE.BoxGeometry(0.8, 0.5, 0.5);
const defaultChestMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // SaddleBrown

const defaultSkeletonGeometry = new THREE.CapsuleGeometry(0.3, 1.0, 4, 8);
const defaultSkeletonMaterial = new THREE.MeshStandardMaterial({ color: 0xe0e0e0 });

const defaultDoorGeometry = new THREE.BoxGeometry(1, 2, 0.1); // Width, height, depth
const defaultDoorMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 }); // Brown color for door


// Pointer Lock Controls
const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject()); // Add camera to scene via controls

const instructions = document.createElement('div');
instructions.innerHTML = 'Click to start (ESC to release cursor)';
instructions.style.position = 'absolute';
instructions.style.top = '10px';
instructions.style.width = '100%';
instructions.style.textAlign = 'center';
instructions.style.color = 'white';
instructions.style.zIndex = '100';
document.body.appendChild(instructions);

renderer.domElement.addEventListener('click', () => {
  controls.lock();
});

controls.addEventListener('lock', () => {
  instructions.style.display = 'none';
});

controls.addEventListener('unlock', () => {
  instructions.style.display = '';
});

// Movement variables
const moveSpeed = 0.05; // Adjusted from 0.1 for finer control with collisions
const playerVelocity = new THREE.Vector3();
const keysPressed: { [key: string]: boolean } = {};
const playerColliderRadius = 0.5; // Approximate radius of player for collision
const walls = [wall1, wall2, wall3, wall4]; // Added wall2 for collision

document.addEventListener('keydown', (event) => {
  // For movement, store based on event.code
  keysPressed[event.code] = true;

  // For interaction, check event.code directly in the same listener
  // This was previously a separate listener, combining them is fine.
  if (event.code === 'KeyF' && controls.isLocked && highlightedObject) {
    const distanceToTarget = camera.position.distanceTo(highlightedObject.position);
    if (distanceToTarget <= interactionDistance) {
      // Attempt interaction
      if (highlightedObject === chest && !chestLooted) {
        chestLooted = true;
        playerGold += 100; // Add 100 gold
        updateGoldDisplay();
        showPopup("You found 100 gold!", 3000);
        if (highlightedObject) restoreOriginalMaterial(highlightedObject); // Stop highlighting
        highlightedObject = null; // Clear highlight
      } else if (highlightedObject === chest && chestLooted) {
        showPopup("The chest is empty.", 2000);
      } else if (highlightedObject === skeleton && !skeletonLooted) {
        skeletonLooted = true;
        
        // Dispose of old weapon geometry
        if (weapon.geometry) {
          weapon.geometry.dispose();
        }
        // Create new "sword" geometry (long, thin box)
        const swordGeometry = new THREE.BoxGeometry(0.08, 0.08, 1.2); // thinner, longer
        weapon.geometry = swordGeometry;
        // Optionally change material or appearance
        // weapon.material = new THREE.MeshStandardMaterial({ color: 0x9999AA });
        
        showPopup("You found a sword!", 3000);
        if (highlightedObject) restoreOriginalMaterial(highlightedObject); 
        highlightedObject = null; 
      } else if (highlightedObject === skeleton && skeletonLooted) {
        showPopup("The skeleton has nothing more of interest.", 2000);
      } else if (highlightedObject === door) { // Door interaction
        showPopup("Moving to a new area...", 1500);
        // Call setupRoom which internally calls clearRoomObjects
        setupRoom(false); 
        
        // Reposition Player
        camera.position.set(0, 1.6, roomSize.depth / 2 - 1.5); // Place just inside new "front" door area
        controls.getObject().position.copy(camera.position); // Ensure controller matches camera
        // Ensure the player is looking forward into the room, not at the door they just came through
        // This requires setting the rotation of the camera. A simple way is to make it look at the center of the room.
        camera.lookAt(0, 1.6, 0); 

        if (highlightedObject) restoreOriginalMaterial(highlightedObject); // Clear highlight from door
        highlightedObject = null;
      }
    } else {
      showPopup("Too far to interact", 2000);
    }
  }
});

document.addEventListener('keyup', (event) => {
  keysPressed[event.code] = false;
});

function checkCollision(moveDirection: THREE.Vector3): boolean {
  const playerPosition = controls.getObject().position;
  const collisionRaycaster = new THREE.Raycaster(playerPosition, moveDirection.normalize(), 0, playerColliderRadius + moveSpeed);
  const intersections = collisionRaycaster.intersectObjects(walls);

  if (intersections.length > 0) {
    // Check if the intersection is close enough to be considered a collision
    if (intersections[0].distance < playerColliderRadius) {
        return true; // Collision detected
    }
  }
  return false; // No collision
}

function updatePlayerMovement() {
  if (!controls.isLocked) return;

  // Reset velocity
  playerVelocity.x = 0;
  playerVelocity.z = 0;

  // Calculate intended movement direction
  const forwardDirection = new THREE.Vector3();
  camera.getWorldDirection(forwardDirection);
  forwardDirection.y = 0; // Keep movement horizontal
  forwardDirection.normalize();

  const rightDirection = new THREE.Vector3();
  rightDirection.crossVectors(camera.up, forwardDirection).normalize(); // Get right vector relative to camera's up and forward

  let moveForward = 0;
  let moveRight = 0;

  if (keysPressed['KeyW']) {
    moveForward += moveSpeed;
  }
  if (keysPressed['KeyS']) {
    moveForward -= moveSpeed;
  }
  if (keysPressed['KeyA']) {
    moveRight -= moveSpeed;
  }
  if (keysPressed['KeyD']) {
    moveRight += moveSpeed;
  }

  // Attempt to move forward/backward
  const forwardMovement = forwardDirection.clone().multiplyScalar(moveForward);
  if (moveForward !== 0 && !checkCollision(forwardMovement.clone().normalize())) {
    controls.moveForward(moveForward);
  }

  // Attempt to move left/right
  // Get the camera's actual right vector for strafing
  const strafeDirection = new THREE.Vector3();
  strafeDirection.setFromMatrixColumn(camera.matrix, 0); // Local X axis is the right vector
  strafeDirection.y = 0; // Keep movement horizontal
  strafeDirection.normalize();

  if (moveRight > 0) { // Moving Right (D key)
    if (!checkCollision(strafeDirection.clone())) {
        controls.moveRight(moveSpeed);
    }
  }
  if (moveRight < 0) { // Moving Left (A key)
    if (!checkCollision(strafeDirection.clone().negate())) {
        controls.moveRight(-moveSpeed);
    }
  }
}


// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Gaze Highlighting
const raycaster = new THREE.Raycaster();
const gazePoint = new THREE.Vector2(0, 0); // Center of the screen
let highlightedObject: THREE.Mesh | null = null;
const originalMaterials = new Map<THREE.Material, { emissive: THREE.Color | undefined, emissiveIntensity: number | undefined }>();
let highlightableSceneObjects: THREE.Mesh[] = []; // Will be populated by setupRoom

function storeOriginalMaterial(object: THREE.Mesh) {
  if (!originalMaterials.has(object.material as THREE.Material)) {
    const material = object.material as THREE.MeshStandardMaterial;
    originalMaterials.set(material, {
      emissive: material.emissive ? material.emissive.clone() : undefined,
      emissiveIntensity: material.emissiveIntensity
    });
  }
}

function restoreOriginalMaterial(object: THREE.Mesh) {
  const material = object.material as THREE.MeshStandardMaterial;
  const original = originalMaterials.get(material);
  if (original) {
    if (original.emissive) {
      material.emissive.copy(original.emissive);
    } else {
      material.emissive = new THREE.Color(0x000000); // Explicitly set to black if no original emissive
    }
    material.emissiveIntensity = original.emissiveIntensity || 0;
    material.needsUpdate = true;
  }
}

function updateGazeHighlighting() {
  if (!controls.isLocked) {
    if (highlightedObject) {
      restoreOriginalMaterial(highlightedObject);
      highlightedObject = null;
    }
    return;
  }

  raycaster.setFromCamera(gazePoint, camera);
  const highlightableSceneObjects = [chest, skeleton, door]; // Ensure these are the actual Mesh objects
  const intersects = raycaster.intersectObjects(highlightableSceneObjects, false);

  let newTarget: THREE.Mesh | null = null;

  if (intersects.length > 0) {
    const firstHit = intersects[0].object as THREE.Mesh;
    // Determine if this hit object *should* be highlighted
    if (firstHit === chest && !chestLooted) {
      newTarget = chest;
    } else if (firstHit === skeleton && !skeletonLooted) {
      newTarget = skeleton;
    } else if (firstHit === door) { // Door is always highlightable if hit
      newTarget = door;
    }
    // If it's looted chest/skeleton, newTarget remains null
  }

  // Now compare current highlightedObject with newTarget
  if (highlightedObject !== newTarget) {
    // If there was an old highlight, remove it
    if (highlightedObject) {
      restoreOriginalMaterial(highlightedObject);
    }

    highlightedObject = newTarget; // Set the new highlight (could be null)

    // If there's a new object to highlight, apply the highlight
    if (highlightedObject) {
      storeOriginalMaterial(highlightedObject);
      const material = highlightedObject.material as THREE.MeshStandardMaterial;

      if (highlightedObject === chest) {
        material.emissive.setHex(0xffd700); // Gold
        material.emissiveIntensity = 0.8;
      } else if (highlightedObject === skeleton) {
        material.emissive.setHex(0xff0000); // Red
        material.emissiveIntensity = 0.8;
      } else if (highlightedObject === door) {
        material.emissive.setHex(0x00ff00); // Green
        material.emissiveIntensity = 0.7;
      }
      material.needsUpdate = true;
    }
  }
  // If highlightedObject is the same as newTarget (and not null), no change needed, it's already highlighted.
  // If newTarget is null and highlightedObject was also null, no change.
}

// Initial Room Setup
setupRoom(true); // Generate the first room


// Basic Attack Animation
let isAttacking = false;
let attackProgress = 0; // 0 to 1 and back to 0
const attackDuration = 0.2; // seconds
const attackDistance = 0.3; // How far the weapon moves forward

const originalHandPosition = hand.position.clone();
const originalWeaponPosition = weapon.position.clone();

function triggerAttack() {
  if (!isAttacking && controls.isLocked) {
    isAttacking = true;
    attackProgress = 0;
  }
}

renderer.domElement.addEventListener('mousedown', (event) => {
  if (event.button === 0) { // Left mouse button
    triggerAttack();
  }
});

function updateAttackAnimation(deltaTime: number) {
  if (!isAttacking) return;

  attackProgress += deltaTime / attackDuration;

  if (attackProgress >= 1) {
    // Reached peak of attack, start returning
    hand.position.copy(originalHandPosition);
    weapon.position.copy(originalWeaponPosition);
    isAttacking = false;
    attackProgress = 0;
  } else {
    // Animate forward then back
    const phase = Math.sin(attackProgress * Math.PI); // Smooth out-and-in motion using sine wave (0 -> 1 -> 0)
    const currentOffset = phase * attackDistance;

    hand.position.z = originalHandPosition.z - currentOffset;
    weapon.position.z = originalWeaponPosition.z - currentOffset;
  }
}

const clock = new THREE.Clock(); // Clock to manage deltaTime for animations

// Initial UI updates
updateGoldDisplay(); // Initialize gold display

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  const deltaTime = clock.getDelta(); // Get time since last frame

  updatePlayerMovement();
  updateGazeHighlighting();
  updateAttackAnimation(deltaTime); // Add this call

  renderer.render(scene, camera);
}

animate();
