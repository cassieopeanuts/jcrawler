// Placeholder for Dialogue Manager
// TODO: Handle loading, displaying, and navigating NPC dialogues.

interface DialogueNode {
    id: string;
    text: string; // What the NPC says
    speaker?: string; // NPC name, if not obvious from context
    options?: DialogueOption[]; // Player choices
    nextNodeId?: string; // If no options, automatically go to this node
    questTrigger?: string; // ID of a quest to start/progress
    endsDialogue?: boolean;
}

interface DialogueOption {
    text: string; // What the player can say
    nextNodeId: string; // Which node this option leads to
    condition?: () => boolean; // Optional condition for this option to be visible
}

export class DialogueManager {
    private dialogues: Map<string, DialogueNode[]> = new Map(); // NPC name -> Dialogue tree
    private currentNode: DialogueNode | null = null;
    private currentNpcName: string | null = null;

    constructor() {
        console.log("DialogueManager initialized.");
        // this.loadExampleDialogues(); // Load dialogues from a file or define them
    }

    // Example method to load dialogues for an NPC
    loadDialogueForNpc(npcName: string, dialogueTree: DialogueNode[]) {
        this.dialogues.set(npcName, dialogueTree);
    }

    startDialogue(npcName: string): DialogueNode | null {
        const npcDialogues = this.dialogues.get(npcName);
        if (npcDialogues && npcDialogues.length > 0) {
            this.currentNpcName = npcName;
            this.currentNode = npcDialogues[0]; // Start with the first node
            console.log(`Starting dialogue with ${npcName}: "${this.currentNode.text}"`);
            return this.currentNode;
        }
        console.warn(`No dialogue found for ${npcName}.`);
        return null;
    }

    selectOption(optionIndex: number): DialogueNode | null {
        if (!this.currentNode || !this.currentNode.options || optionIndex >= this.currentNode.options.length) {
            console.warn("Invalid dialogue option selected or no options available.");
            return this.currentNode; // Or null if dialogue should end
        }

        const selectedOption = this.currentNode.options[optionIndex];
        const nextNodeId = selectedOption.nextNodeId;

        return this.goToNode(nextNodeId);
    }

    goToNode(nodeId: string): DialogueNode | null {
        if (!this.currentNpcName) {
            console.warn("No active NPC for dialogue.");
            return null;
        }
        const npcDialogues = this.dialogues.get(this.currentNpcName);
        const nextNode = npcDialogues?.find(node => node.id === nodeId);

        if (nextNode) {
            this.currentNode = nextNode;
            console.log(`NPC: "${this.currentNode.text}"`);
            if (this.currentNode.endsDialogue) {
                console.log("Dialogue ended.");
                this.endDialogue();
            }
            return this.currentNode;
        } else {
            console.warn(`Dialogue node ${nodeId} not found for ${this.currentNpcName}. Ending dialogue.`);
            this.endDialogue();
            return null;
        }
    }

    endDialogue() {
        this.currentNode = null;
        this.currentNpcName = null;
    }

    getCurrentNode(): DialogueNode | null {
        return this.currentNode;
    }

    // Example:
    // loadExampleDialogues() {
    //     const mireDialogue: DialogueNode[] = [
    //         { id: "start", text: "Hmph. What is it now?", options: [{ text: "Just looking around.", nextNodeId: "looking" }, { text: "Need something potent.", nextNodeId: "potent" }] },
    //         { id: "looking", text: "Well, don't get your hopes up. Nothing interesting here.", endsDialogue: true },
    //         { id: "potent", text: "Potent, you say? For what, disturbing ancient evils or just a stubborn cough?", options: [{ text: "Ancient evils, definitely.", nextNodeId: "evil_end" }] },
    //         { id: "evil_end", text: "Hah! You'll need more than my brews for that. Now, shoo!", endsDialogue: true }
    //     ];
    //     this.loadDialogueForNpc("Mire Taddpole", mireDialogue);
    // }
}

// const dialogueManager = new DialogueManager();
// dialogueManager.startDialogue("Mire Taddpole");
// ... then based on UI, call dialogueManager.selectOption(0) etc.
