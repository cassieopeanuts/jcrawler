// Placeholder for Player Inventory System
// TODO: Define data structures and logic for managing player's items, equipment, gold.

interface Item {
    id: string;
    name: string;
    description: string;
    type: 'weapon' | 'armor' | 'consumable' | 'keyItem' | 'currency';
    quantity?: number;
    // Other properties like stats, effects, etc.
}

export class Inventory {
    private items: Map<string, Item> = new Map();
    private gold: number = 0;

    constructor(initialGold: number = 0) {
        this.gold = initialGold;
        console.log(`Inventory initialized with ${this.gold} gold.`);
    }

    addItem(item: Item, quantity: number = 1): boolean {
        if (item.type === 'currency' && item.id === 'gold') {
            this.addGold(quantity);
            return true;
        }

        const existingItem = this.items.get(item.id);
        if (existingItem && existingItem.quantity !== undefined) {
            existingItem.quantity += quantity;
        } else if (!existingItem && item.quantity !== undefined) {
            this.items.set(item.id, { ...item, quantity });
        } else if (!existingItem && item.quantity === undefined) { // For unique items
             this.items.set(item.id, { ...item });
        } else {
            console.warn(`Cannot add item ${item.name} with quantity if not stackable or already exists as unique.`);
            return false;
        }
        console.log(`Added ${quantity} of ${item.name} to inventory.`);
        this.displayInventory();
        return true;
    }

    removeItem(itemId: string, quantity: number = 1): boolean {
        const item = this.items.get(itemId);
        if (item && item.quantity !== undefined && item.quantity >= quantity) {
            item.quantity -= quantity;
            if (item.quantity <= 0) {
                this.items.delete(itemId);
            }
            console.log(`Removed ${quantity} of ${item.name} from inventory.`);
            this.displayInventory();
            return true;
        } else if (item && item.quantity === undefined) { // Unique item
            this.items.delete(itemId);
            console.log(`Removed ${item.name} from inventory.`);
            this.displayInventory();
            return true;
        }
        console.warn(`Could not remove ${quantity} of item ID ${itemId}. Not enough quantity or item not found.`);
        return false;
    }

    getItem(itemId: string): Item | undefined {
        return this.items.get(itemId);
    }

    getAllItems(): Item[] {
        return Array.from(this.items.values());
    }

    addGold(amount: number) {
        this.gold += amount;
        console.log(`Added ${amount} gold. Total gold: ${this.gold}`);
        // TODO: Update UI gold display if this class directly manages it or emits an event.
    }

    removeGold(amount: number): boolean {
        if (this.gold >= amount) {
            this.gold -= amount;
            console.log(`Removed ${amount} gold. Total gold: ${this.gold}`);
            return true;
        }
        console.warn(`Not enough gold. Current: ${this.gold}, Tried to remove: ${amount}`);
        return false;
    }

    getGold(): number {
        return this.gold;
    }

    displayInventory() {
        console.log("Current Inventory:");
        this.items.forEach(item => {
            console.log(`- ${item.name}${item.quantity ? ` (x${item.quantity})` : ''}`);
        });
        console.log(`Gold: ${this.gold}`);
    }
}

// Example Usage:
// const playerInventory = new Inventory(50);
// playerInventory.addItem({ id: 'healing_potion', name: 'Healing Potion', description: 'Restores some health.', type: 'consumable', quantity: 1 });
// playerInventory.addItem({ id: 'gold', name: 'Gold Coins', description: 'Shiny currency.', type: 'currency' }, 100);
// playerInventory.removeItem('healing_potion');
// playerInventory.removeGold(20);
// console.log(playerInventory.getAllItems());
// console.log(playerInventory.getGold());
