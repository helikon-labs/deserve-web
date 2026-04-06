import { atom } from 'nanostores';
import { RPC_NODES } from './node';

interface NodeState {
    bestBlock: number | null;
    finalizedBlock: number | null;
    latencyMs: number | null;
    status: 'connecting' | 'connected' | 'error';
}

const createInitialState = (): NodeState => ({
    bestBlock: null,
    finalizedBlock: null,
    latencyMs: null,
    status: 'connecting',
});

const nodeStateAtoms = new Map(
    RPC_NODES.map((node) => [node.id, atom<NodeState>(createInitialState())]),
);

export type { NodeState };
export { nodeStateAtoms };
