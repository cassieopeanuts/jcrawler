// Placeholder for Elara Swift - The Nimble Merchant (Human)
// TODO: Define Elara's class/object, including properties, dialogue, quests, and merchant inventory.

export class ElaraSwift {
    name: string = "Elara Swift";
    ancestry: string = "Human";
    role: string = "Merchant";
    description: string = "A lean and agile Human merchant with bright, inquisitive eyes.";

    constructor() {
        console.log(`${this.name} initialized.`);
    }

    interact() {
        console.log(`Interacting with ${this.name}.`);
        // TODO: Implement dialogue, trade/barter system, quest triggers
        return "Elara offers a weary smile: 'Welcome, traveler! Anything catch your eye? Or perhaps some news from beyond the mists?'";
    }

    getMerchantInventory() {
        return [
            { item: "Rations (1 day)", cost: 5 },
            { item: "Rope (50ft)", cost: 10 },
            { item: "Torch", cost: 2 },
            { item: "Curious Trinket", cost: 20 },
        ];
    }
}

// Example instantiation
// const elara = new ElaraSwift();
// console.log(elara.interact());
// console.log(elara.getMerchantInventory());
