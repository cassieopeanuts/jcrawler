// Static imports for types and modules that are always needed
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { setupRoom } from '../aethelburg_ruins/ruinUtils';
import type { RuinSetupContext } from '../aethelburg_ruins/ruinUtils';
import '../../style.css'; // For side effects (injecting styles)

export function startTestRoom() {
    // Interaction State
    let playerGold = 0;
    let chestLooted = false; // This will be managed by ruinContext
    let skeletonLooted = false; // This will be managed by ruinContext
    const interactionDistance = 2.0;

    // UI Elements
    const popupElement = document.getElementById('popup') as HTMLDivElement;
    const goldDisplayElement = document.getElementById('gold-display') as HTMLDivElement;
    const sceneContainer = document.getElementById('scene-container');

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

    function updateGoldDisplay() {
        if (goldDisplayElement) {
            goldDisplayElement.textContent = `Gold: ${playerGold}`;
        }
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333333);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 5);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (sceneContainer) {
        while (sceneContainer.firstChild) {
            sceneContainer.removeChild(sceneContainer.firstChild);
        }
        sceneContainer.appendChild(renderer.domElement);
    } else {
        console.error('Scene container not found for testRoom!');
        return; 
    }
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x405080, 2.0);
    scene.add(ambientLight);
    const torchLight = new THREE.PointLight(0xffaa33, 5.0, 20);
    scene.add(torchLight);

    // Room Geometry
    const roomSize = { width: 10, height: 3, depth: 10 };

    let chest: THREE.Mesh | undefined;
    let skeleton: THREE.Mesh | undefined;
    let door: THREE.Mesh | undefined;

    const floorGeometry = new THREE.PlaneGeometry(roomSize.width, roomSize.depth);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const ceilingGeometry = new THREE.PlaneGeometry(roomSize.width, roomSize.depth);
    const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x909090, side: THREE.DoubleSide });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = roomSize.height;
    scene.add(ceiling);

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xa0a0a0 });
    const wall1Geometry = new THREE.PlaneGeometry(roomSize.width, roomSize.height);
    const wall1 = new THREE.Mesh(wall1Geometry, wallMaterial);
    wall1.position.set(0, roomSize.height / 2, -roomSize.depth / 2);
    scene.add(wall1);

    const wall2Geometry = new THREE.PlaneGeometry(roomSize.width, roomSize.height);
    const wall2 = new THREE.Mesh(wall2Geometry, wallMaterial);
    wall2.position.set(0, roomSize.height / 2, roomSize.depth / 2);
    wall2.rotation.y = Math.PI;
    scene.add(wall2);

    const wall3Geometry = new THREE.PlaneGeometry(roomSize.depth, roomSize.height);
    const wall3 = new THREE.Mesh(wall3Geometry, wallMaterial);
    wall3.position.set(-roomSize.width / 2, roomSize.height / 2, 0);
    wall3.rotation.y = Math.PI / 2;
    scene.add(wall3);

    const wall4Geometry = new THREE.PlaneGeometry(roomSize.depth, roomSize.height);
    const wall4 = new THREE.Mesh(wall4Geometry, wallMaterial);
    wall4.position.set(roomSize.width / 2, roomSize.height / 2, 0);
    wall4.rotation.y = -Math.PI / 2;
    scene.add(wall4);

    const handGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const handMaterial = new THREE.MeshStandardMaterial({ color: 0xcc8866 });
    const hand = new THREE.Mesh(handGeometry, handMaterial);

    const weaponGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 16);
    const weaponMaterial = new THREE.MeshStandardMaterial({ color: 0x666677 });
    const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial) as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;

    const playerCameraGroup = new THREE.Group();
    playerCameraGroup.add(hand);
    playerCameraGroup.add(weapon);
    camera.add(playerCameraGroup);
    scene.add(camera);

    hand.position.set(0.3, -0.3, -0.5);
    weapon.position.set(0.35, -0.2, -1.0);
    weapon.rotation.x = Math.PI / 2;
    weapon.rotation.z = Math.PI / 4;

    const torchModelGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const torchModelMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa33, emissive: 0xffaa33, emissiveIntensity: 1 });
    const torchModel = new THREE.Mesh(torchModelGeometry, torchModelMaterial);
    torchModel.position.set(2, 1.5, -4.5);
    scene.add(torchModel);
    torchLight.position.set(0, 0, 0);
    torchModel.add(torchLight);

    const controls = new PointerLockControls(camera, renderer.domElement);
    scene.add(controls.getObject());

    const instructions = document.getElementById('instructions') || document.createElement('div');
    if (!instructions.id) instructions.id = 'instructions'; // Ensure it has an ID if created dynamically
    instructions.innerHTML = 'Click to start (ESC to release cursor)';
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


    renderer.domElement.addEventListener('click', () => controls.lock());
    controls.addEventListener('lock', () => { instructions.style.display = 'none'; });
    controls.addEventListener('unlock', () => { instructions.style.display = ''; });

    const moveSpeed = 0.05;
    const playerVelocity = new THREE.Vector3();
    const keysPressed: { [key: string]: boolean } = {};
    const playerColliderRadius = 0.5;
    const walls = [wall1, wall2, wall3, wall4];

    const raycaster = new THREE.Raycaster();
    const gazePoint = new THREE.Vector2(0, 0);
    let highlightedObject: THREE.Mesh | null = null;
    const originalMaterials = new Map<THREE.Material, { emissive: THREE.Color | undefined, emissiveIntensity: number | undefined }>();
    let highlightableSceneObjects: THREE.Mesh[] = []; 

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
                material.emissive = new THREE.Color(0x000000);
            }
            material.emissiveIntensity = original.emissiveIntensity || 0;
            material.needsUpdate = true;
        }
    }
    
    // Define ruinContext properly using the imported RuinSetupContext type
    let currentChestLooted = false;
    let currentSkeletonLooted = false;

    const ruinContext: RuinSetupContext = {
        scene,
        roomSize,
        chest: undefined, 
        skeleton: undefined, 
        door: undefined, 
        highlightableSceneObjects: highlightableSceneObjects, // Direct reference
        highlightedObject: null, // This will be updated by gaze highlighting logic
        originalMaterials,
        storeOriginalMaterial,
        get chestLooted() { return currentChestLooted; },
        set chestLooted(value: boolean) { currentChestLooted = value; },
        get skeletonLooted() { return currentSkeletonLooted; },
        set skeletonLooted(value: boolean) { currentSkeletonLooted = value; },
        updateGoldDisplay
    };

    function initializeRoom(isFirstRoom: boolean) {
        // Update context's highlightedObject before clearing, just in case
        ruinContext.highlightedObject = highlightedObject;

        const roomData = setupRoom(isFirstRoom, ruinContext);
        chest = roomData.newChest;
        skeleton = roomData.newSkeleton;
        door = roomData.newDoor;
        
        // highlightableSceneObjects is already referenced by ruinContext.highlightableSceneObjects
        // setupRoom's clearRoomObjects should have cleared it.
        // Now, repopulate it.
        highlightableSceneObjects.length = 0; 
        highlightableSceneObjects.push(...roomData.newHighlightableObjects);

        ruinContext.chest = chest;
        ruinContext.skeleton = skeleton;
        ruinContext.door = door;
        
        // Reset looted status for the new room from the context (which setupRoom should have set)
        currentChestLooted = ruinContext.chestLooted;
        currentSkeletonLooted = ruinContext.skeletonLooted;
    }
    
    document.addEventListener('keydown', (event) => {
        keysPressed[event.code] = true;
        if (event.code === 'KeyF' && controls.isLocked && highlightedObject) {
            const distanceToTarget = camera.position.distanceTo(highlightedObject.position);
            if (distanceToTarget <= interactionDistance) {
                if (highlightedObject === chest && !currentChestLooted) {
                    currentChestLooted = true;
                    playerGold += 100;
                    updateGoldDisplay();
                    showPopup("You found 100 gold!", 3000);
                    if (highlightedObject) restoreOriginalMaterial(highlightedObject);
                    highlightedObject = null;
                } else if (highlightedObject === chest && currentChestLooted) {
                    showPopup("The chest is empty.", 2000);
                } else if (highlightedObject === skeleton && !currentSkeletonLooted) {
                    currentSkeletonLooted = true;
                    if (weapon.geometry) weapon.geometry.dispose();
                    const swordGeometry = new THREE.BoxGeometry(0.08, 0.08, 1.2);
                    weapon.geometry = swordGeometry;
                    showPopup("You found a sword!", 3000);
                    if (highlightedObject) restoreOriginalMaterial(highlightedObject);
                    highlightedObject = null;
                } else if (highlightedObject === skeleton && currentSkeletonLooted) {
                    showPopup("The skeleton has nothing more of interest.", 2000);
                } else if (highlightedObject === door) {
                    showPopup("Moving to a new area...", 1500);
                    const previouslyHighlightedDoor = highlightedObject;
                    initializeRoom(false); // This will call setupRoom with the context
                    camera.position.set(0, 1.6, roomSize.depth / 2 - 1.5);
                    controls.getObject().position.copy(camera.position);
                    camera.lookAt(0, 1.6, 0);
                    if (previouslyHighlightedDoor) restoreOriginalMaterial(previouslyHighlightedDoor);
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
        if (intersections.length > 0 && intersections[0].distance < playerColliderRadius) return true;
        return false;
    }

    function updatePlayerMovement() {
        if (!controls.isLocked) return;
        playerVelocity.x = 0;
        playerVelocity.z = 0;
        const forwardDirection = new THREE.Vector3();
        camera.getWorldDirection(forwardDirection);
        forwardDirection.y = 0;
        forwardDirection.normalize();
        
        let moveForward = 0;
        if (keysPressed['KeyW']) moveForward += moveSpeed;
        if (keysPressed['KeyS']) moveForward -= moveSpeed;
        
        let moveRight = 0;
        if (keysPressed['KeyA']) moveRight -= moveSpeed;
        if (keysPressed['KeyD']) moveRight += moveSpeed;

        const forwardMovement = forwardDirection.clone().multiplyScalar(moveForward);
        if (moveForward !== 0 && !checkCollision(forwardMovement.clone().normalize())) {
            controls.moveForward(moveForward);
        }
        
        // Correct strafing based on camera's actual right vector
        const strafeDirection = new THREE.Vector3();
        strafeDirection.setFromMatrixColumn(camera.matrix, 0); // Local X axis
        strafeDirection.y = 0;
        strafeDirection.normalize();

        const rightMovement = strafeDirection.clone().multiplyScalar(moveRight);
        if (moveRight !== 0 && !checkCollision(rightMovement.clone().normalize())) {
             controls.moveRight(moveRight); // Use moveRight which has directionality
        }
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    function updateGazeHighlighting() {
        if (!controls.isLocked) {
            if (highlightedObject) {
                restoreOriginalMaterial(highlightedObject);
                highlightedObject = null;
            }
            return;
        }
        raycaster.setFromCamera(gazePoint, camera);
        // Use the global highlightableSceneObjects array, filtered for valid meshes
        const validHighlightableObjects = highlightableSceneObjects.filter(obj => obj instanceof THREE.Mesh) as THREE.Mesh[];
        const intersects = raycaster.intersectObjects(validHighlightableObjects, false);
        
        let newTarget: THREE.Mesh | null = null;
        if (intersects.length > 0) {
            const firstHit = intersects[0].object as THREE.Mesh;
            if (firstHit === chest && !currentChestLooted) newTarget = chest;
            else if (firstHit === skeleton && !currentSkeletonLooted) newTarget = skeleton;
            else if (firstHit === door) newTarget = door;
        }

        if (highlightedObject !== newTarget) {
            if (highlightedObject) restoreOriginalMaterial(highlightedObject);
            highlightedObject = newTarget;
            ruinContext.highlightedObject = newTarget; // Update context too
            if (highlightedObject) {
                storeOriginalMaterial(highlightedObject);
                const material = highlightedObject.material as THREE.MeshStandardMaterial;
                if (highlightedObject === chest) { material.emissive.setHex(0xffd700); material.emissiveIntensity = 0.8; }
                else if (highlightedObject === skeleton) { material.emissive.setHex(0xff0000); material.emissiveIntensity = 0.8; }
                else if (highlightedObject === door) { material.emissive.setHex(0x00ff00); material.emissiveIntensity = 0.7; }
                material.needsUpdate = true;
            }
        }
    }

    let isAttacking = false;
    let attackProgress = 0;
    const attackDuration = 0.2;
    const attackDistance = 0.3;
    const originalHandPosition = hand.position.clone();
    const originalWeaponPosition = weapon.position.clone();

    function triggerAttack() {
        if (!isAttacking && controls.isLocked) {
            isAttacking = true;
            attackProgress = 0;
        }
    }

    renderer.domElement.addEventListener('mousedown', (event) => {
        if (event.button === 0) triggerAttack();
    });

    function updateAttackAnimation(deltaTime: number) {
        if (!isAttacking) return;
        attackProgress += deltaTime / attackDuration;
        if (attackProgress >= 1) {
            hand.position.copy(originalHandPosition);
            weapon.position.copy(originalWeaponPosition);
            isAttacking = false;
        } else {
            const phase = Math.sin(attackProgress * Math.PI);
            const currentOffset = phase * attackDistance;
            hand.position.z = originalHandPosition.z - currentOffset;
            weapon.position.z = originalWeaponPosition.z - currentOffset;
        }
    }

    const clock = new THREE.Clock();
    updateGoldDisplay();
    initializeRoom(true); // Initialize the first room using the new structure

    function animate() {
        requestAnimationFrame(animate);
        const deltaTime = clock.getDelta();
        updatePlayerMovement();
        updateGazeHighlighting();
        updateAttackAnimation(deltaTime);
        renderer.render(scene, camera);
    }
    animate();
}
