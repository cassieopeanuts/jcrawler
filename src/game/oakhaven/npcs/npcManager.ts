// Placeholder for NpcManager
// TODO: Manage creation, state, and interactions of all NPCs in Oakhaven.

// import { MireTaddpole } from './mireTaddpole';
// import { BorinStonebeard } from './borinStonebeard';
// import { ElaraSwift } from './elaraSwift';
// import { GrandElderMorwenna } from './grandElderMorwenna';

interface NPC {
    name: string;
    interact: () => string;
    // Add other common NPC methods or properties here
}

export class NpcManager {
    private npcs: Map<string, NPC> = new Map();

    constructor() {
        // Initialize NPCs - In a real scenario, you might load data or use factories
        // this.addNpc(new MireTaddpole());
        // this.addNpc(new BorinStonebeard());
        // this.addNpc(new ElaraSwift());
        // this.addNpc(new GrandElderMorwenna());
        console.log("NpcManager initialized. (NPCs will be added dynamically later)");
    }

    addNpc(npc: NPC) {
        this.npcs.set(npc.name, npc);
        console.log(`${npc.name} added to NpcManager.`);
    }

    getNpc(name: string): NPC | undefined {
        return this.npcs.get(name);
    }

    // Example: Trigger interaction with an NPC by name
    triggerInteraction(name: string): string | undefined {
        const npc = this.getNpc(name);
        if (npc) {
            return npc.interact();
        }
        return undefined; // Or throw an error, or return a default message
    }

    // In a 3D game, this manager would also handle NPC positions, models, and scene interactions.
}

// Example instantiation
// const npcManager = new NpcManager();
// console.log(npcManager.triggerInteraction("Mire Taddpole"));
