import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333); // Dark gray background
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Soft white light
scene.add(ambientLight);

// First-person controls
const controls = new PointerLockControls(camera, document.body);
scene.add(controls.getObject());

document.addEventListener('click', () => {
  controls.lock();
});

// Room Geometry
const roomSize = { width: 20, height: 10, depth: 30 };
const wallThickness = 0.5;

// Floor
const floorGeometry = new THREE.PlaneGeometry(roomSize.width, roomSize.depth);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -roomSize.height / 2;
scene.add(floor);

// Ceiling
const ceilingGeometry = new THREE.PlaneGeometry(roomSize.width, roomSize.depth);
const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x909090, side: THREE.DoubleSide });
const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = roomSize.height / 2;
scene.add(ceiling);

// Walls
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xA0A0A0 });

// Front wall
const frontWallGeometry = new THREE.BoxGeometry(roomSize.width + wallThickness, roomSize.height, wallThickness);
const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
frontWall.position.z = -roomSize.depth / 2;
scene.add(frontWall);

// Back wall
const backWallGeometry = new THREE.BoxGeometry(roomSize.width + wallThickness, roomSize.height, wallThickness);
const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
backWall.position.z = roomSize.depth / 2;
scene.add(backWall);

// Left wall
const leftWallGeometry = new THREE.BoxGeometry(wallThickness, roomSize.height, roomSize.depth);
const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
leftWall.position.x = -roomSize.width / 2;
scene.add(leftWall);

// Right wall
const rightWallGeometry = new THREE.BoxGeometry(wallThickness, roomSize.height, roomSize.depth);
const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
rightWall.position.x = roomSize.width / 2;
scene.add(rightWall);


// Gameplay Elements
const elementMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // Green for now

// Hand
const handGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.5);
const hand = new THREE.Mesh(handGeometry, elementMaterial);
hand.position.set(0.5, -0.3, -0.7); // Position relative to camera
camera.add(hand); // Add hand to camera so it moves with it

// Weapon
const weaponGeometry = new THREE.CylinderGeometry(0.05, 0.1, 1, 8);
const weapon = new THREE.Mesh(weaponGeometry, elementMaterial);
weapon.position.set(0.7, -0.2, -1.2); // Position relative to camera
weapon.rotation.z = Math.PI / 4;
weapon.rotation.x = Math.PI / 2;
camera.add(weapon); // Add weapon to camera

// Torch
const torchGeometry = new THREE.SphereGeometry(0.2, 16, 16);
const torchMaterial = new THREE.MeshBasicMaterial({ color: 0xffa500 }); // Orange, emissive
const torch = new THREE.Mesh(torchGeometry, torchMaterial);
torch.position.set(-roomSize.width / 2 + wallThickness + 0.5, 0, 0); // On the left wall
scene.add(torch);

const torchLight = new THREE.PointLight(0xffa500, 1, 15, 1.5); // Orange light
torchLight.position.copy(torch.position);
torchLight.position.y += 0.5; // Slightly above the torch geometry
scene.add(torchLight);

// Treasury Chest
const chestGeometry = new THREE.BoxGeometry(1.5, 1, 1);
const chest = new THREE.Mesh(chestGeometry, elementMaterial);
chest.position.set(0, -roomSize.height / 2 + 0.5, -roomSize.depth / 2 + 2); // On the floor near the front wall
scene.add(chest);

// Skeleton Body
const skeletonGeometry = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8);
const skeleton = new THREE.Mesh(skeletonGeometry, elementMaterial);
skeleton.position.set(5, -roomSize.height / 2 + 0.6, 5); // On the floor
skeleton.rotation.z = Math.PI / 2; // Laying down
scene.add(skeleton);


// Initial camera position
camera.position.set(0, 0, 0); // Start at the center of the 'camera rig' for PointerLockControls

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
