import * as THREE from 'three';

// Interfaces for state to be passed from main.ts or a game manager
// This makes dependencies explicit.
export interface RuinSetupContext {
    scene: THREE.Scene;
    roomSize: { width: number; height: number; depth: number; };
    // Dynamic Meshes - these will be updated by setupRoom
    chest: THREE.Mesh | undefined;
    skeleton: THREE.Mesh | undefined;
    door: THREE.Mesh | undefined;
    // Highlight state
    highlightableSceneObjects: THREE.Mesh[];
    highlightedObject: THREE.Mesh | null;
    originalMaterials: Map<THREE.Material, { emissive: THREE.Color | undefined, emissiveIntensity: number | undefined }>;
    storeOriginalMaterial: (object: THREE.Mesh) => void;
    // Loot state
    chestLooted: boolean;
    skeletonLooted: boolean;
    // UI update functions
    updateGoldDisplay: () => void;
}


// Default geometries and materials
export const defaultChestGeometry = new THREE.BoxGeometry(0.8, 0.5, 0.5);
export const defaultChestMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });

export const defaultSkeletonGeometry = new THREE.CapsuleGeometry(0.3, 1.0, 4, 8);
export const defaultSkeletonMaterial = new THREE.MeshStandardMaterial({ color: 0xe0e0e0 });

export const defaultDoorGeometry = new THREE.BoxGeometry(1, 2, 0.1);
export const defaultDoorMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });


export function clearRoomObjects(context: RuinSetupContext) {
    if (context.chest) {
        context.scene.remove(context.chest);
        context.chest.geometry.dispose();
        (context.chest.material as THREE.MeshStandardMaterial).dispose();
    }
    if (context.skeleton) {
        context.scene.remove(context.skeleton);
        context.skeleton.geometry.dispose();
        (context.skeleton.material as THREE.MeshStandardMaterial).dispose();
    }
    if (context.door) {
        context.scene.remove(context.door);
        context.door.geometry.dispose();
        (context.door.material as THREE.MeshStandardMaterial).dispose();
    }
    context.highlightableSceneObjects.length = 0; // Clear the array
    if (context.highlightedObject) {
        // If the currently highlighted object is one of those being cleared,
        // it should also be nullified. The calling context (main.ts) might need to handle this
        // or we pass highlightedObject by reference if it's an object property.
        // For now, this just clears the list of what *can* be highlighted.
        // The main highlighting logic will then see nothing is highlighted.
    }
     // Resetting highlightedObject itself should be done in main.ts if needed after calling clear.
}

export function setupRoom(_isFirstRoom: boolean, context: RuinSetupContext): {
    newChest: THREE.Mesh,
    newSkeleton: THREE.Mesh,
    newDoor: THREE.Mesh,
    newHighlightableObjects: THREE.Mesh[]
} {
    clearRoomObjects(context); // Clear previous room's objects first

    context.chestLooted = false;
    context.skeletonLooted = false;

    const chestX = Math.random() * (context.roomSize.width - 2) - (context.roomSize.width / 2 - 1);
    const chestZ = Math.random() * (context.roomSize.depth - 2) - (context.roomSize.depth / 2 - 1);
    const newChest = new THREE.Mesh(defaultChestGeometry, defaultChestMaterial.clone());
    newChest.position.set(chestX, 0.25, chestZ);
    context.scene.add(newChest);

    let skeletonX, skeletonZ;
    do {
        skeletonX = Math.random() * (context.roomSize.width - 2) - (context.roomSize.width / 2 - 1);
        skeletonZ = Math.random() * (context.roomSize.depth - 2) - (context.roomSize.depth / 2 - 1);
    } while (new THREE.Vector3(skeletonX, 0, skeletonZ).distanceTo(newChest.position) < 2.0);

    const newSkeleton = new THREE.Mesh(defaultSkeletonGeometry, defaultSkeletonMaterial.clone());
    newSkeleton.position.set(skeletonX, 0.5, skeletonZ);
    newSkeleton.rotation.z = Math.PI / 2;
    context.scene.add(newSkeleton);

    const newDoor = new THREE.Mesh(defaultDoorGeometry, defaultDoorMaterial.clone());
    newDoor.position.set(0, 1, context.roomSize.depth / 2 - 0.05);
    context.scene.add(newDoor);

    const newHighlightableObjects = [newChest, newSkeleton, newDoor];

    context.storeOriginalMaterial(newChest);
    context.storeOriginalMaterial(newSkeleton);
    context.storeOriginalMaterial(newDoor);

    context.updateGoldDisplay();

    return { newChest, newSkeleton, newDoor, newHighlightableObjects };
}
