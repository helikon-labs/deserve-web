import { RPC_NODES } from '@/data/node';
import { nodeStateAtoms } from '@/data/network-store';
import { NodeClient } from './node-client';

class RPCManager {
    private readonly clients: NodeClient[];

    constructor() {
        this.clients = RPC_NODES.map((node) => {
            const stateAtom = nodeStateAtoms.get(node.id)!;
            return new NodeClient(node, (update) => {
                stateAtom.set({ ...stateAtom.get(), ...update });
            });
        });
    }

    start(): void {
        for (const client of this.clients) {
            client.connect();
        }
    }

    stop(): void {
        for (const client of this.clients) {
            client.disconnect();
        }
    }
}

export { RPCManager };
