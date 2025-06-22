// Placeholder for Randomization Utilities
// TODO: Add functions for various randomization needs, e.g., weighted choices, random point in area, etc.

export function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

// Fisher-Yates (Knuth) Shuffle for an array
export function shuffleArray<T>(array: T[]): T[] {
    const shuffledArray = [...array]; // Create a copy to avoid modifying the original
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
}

// Choose a random element from an array
export function chooseRandom<T>(array: T[]): T | undefined {
    if (array.length === 0) {
        return undefined;
    }
    return array[Math.floor(Math.random() * array.length)];
}

// Example: Get a random position within a defined rectangular area on XZ plane
export function getRandomPositionInBounds(
    minX: number, maxX: number,
    minZ: number, maxZ: number,
    fixedY: number = 0
): { x: number, y: number, z: number } {
    const x = getRandomFloat(minX, maxX);
    const z = getRandomFloat(minZ, maxZ);
    return { x, y: fixedY, z };
}

console.log("randomization.ts loaded - provides utility functions for random number generation and choices.");

// Example Usage:
// console.log("Random Int (1-10):", getRandomInt(1, 10));
// console.log("Random Float (0-1):", getRandomFloat(0, 1));
// const arr = [1, 2, 3, 4, 5];
// console.log("Shuffled Array:", shuffleArray(arr));
// console.log("Random Choice from Array:", chooseRandom(arr));
// console.log("Random Position:", getRandomPositionInBounds(-5, 5, -5, 5, 0.5));
