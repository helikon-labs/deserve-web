type Chain = 'asset-hub' | 'coretime';

interface NodeLocation {
    id: number;
    city: string;
    latitude: number;
    longitude: number;
    slug: string;
}

interface RPCNode {
    id: number;
    city: string;
    latitude: number;
    longitude: number;
    httpURL: string;
    wsURL: string;
}

const ASSET_HUB_LOCATIONS: NodeLocation[] = [
    { id: 0, city: 'Warsaw', latitude: 52.237, longitude: 21.0175, slug: 'warsaw' },
];

const CORETIME_LOCATIONS: NodeLocation[] = [
    // { id: 0, city: 'Warsaw', latitude: 41.0082, longitude: 28.9784, slug: 'istanbul' },
];

const NODE_LOCATIONS: Record<Chain, NodeLocation[]> = {
    'asset-hub': ASSET_HUB_LOCATIONS,
    coretime: CORETIME_LOCATIONS,
};

const CHAIN_SLUGS: Record<Chain, string> = {
    'asset-hub': 'asset-hub.polkadot',
    coretime: 'coretime.polkadot',
};

function getNodes(chain: Chain): RPCNode[] {
    const chainSlug = CHAIN_SLUGS[chain];
    return NODE_LOCATIONS[chain].map((loc) => ({
        id: loc.id,
        city: loc.city,
        latitude: loc.latitude,
        longitude: loc.longitude,
        httpURL: `https://${loc.slug}.${chainSlug}.rpc.deserve.network`,
        wsURL: `wss://${loc.slug}.${chainSlug}.rpc.deserve.network`,
    }));
}

const RPC_NODES: RPCNode[] = getNodes('asset-hub');

export type { RPCNode, Chain };
export { NODE_LOCATIONS, getNodes, RPC_NODES };
