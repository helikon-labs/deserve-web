import { getNodes, type RPCNode, type Chain } from '@/data/node';
import { nodeStateAtoms, resetAllNodes } from '@/data/network-store';
import { NodeClient } from './node-client';

class RPCManager {
    private clients: NodeClient[];

    constructor() {
        this.clients = this.createClients(getNodes('asset-hub'));
    }

    private createClients(nodes: RPCNode[]): NodeClient[] {
        return nodes.map((node) => {
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

    restart(chain: Chain): void {
        this.stop();
        resetAllNodes();
        this.clients = this.createClients(getNodes(chain));
        this.start();
    }
}

export { RPCManager };
