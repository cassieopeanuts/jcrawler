// Placeholder for The Azure Gardens ruin (Gardens of Harmony)
// TODO: Define specific logic, layout, enemies, treasures for this area.

export const azureGardens = {
    name: "The Azure Gardens",
    originalDistrict: "Gardens of Harmony (Exotic Flora)",
    description: "Terraced, bioluminescent gardens that once sustained exotic flora, now overgrown and twisted, where predatory botanical creatures lurk.",
    threatLevel: "Mid-to-high",
    entryPoints: [],
    exitPoints: [],

    init: () => {
        console.log(`Initializing ${azureGardens.name}...`);
    },

    getEnemies: () => {
        return ["Snapdragon Vine", "Gloomcap Shroomfiend", "Fae-Touched Thornbeast"];
    },

    getTreasures: () => {
        return ["Luminescent Petal", "Potion of Barkskin Recipe", "Fae-touched Seed"];
    }
};

// azureGardens.init();
