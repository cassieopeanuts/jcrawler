// Placeholder for Borin Stonebeard - The Stoic Smith (Dwarf)
// TODO: Define Borin's class/object, including properties, dialogue, quests, and smithing services.

export class BorinStonebeard {
    name: string = "Borin Stonebeard";
    ancestry: string = "Dwarf";
    role: string = "Blacksmith";
    description: string = "A broad-shouldered and stout Dwarf, with a grey-streaked auburn beard and calloused hands.";

    constructor() {
        console.log(`${this.name} initialized.`);
    }

    interact() {
        console.log(`Interacting with ${this.name}.`);
        // TODO: Implement dialogue, smithing services, quest triggers
        return "Borin nods curtly, the clang of his hammer echoing his silence.";
    }

    getSmithingServices() {
        return [
            { service: "Repair Tool", cost: 5 },
            { service: "Repair Armor (Simple)", cost: 15 },
            { service: "Forge Basic Weapon", cost: 50 },
        ];
    }
}

// Example instantiation
// const borin = new BorinStonebeard();
// console.log(borin.interact());
// console.log(borin.getSmithingServices());
