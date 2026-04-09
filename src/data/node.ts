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

const NODE_LOCATIONS: NodeLocation[] = [
    { id: 0, city: 'Atlanta', latitude: 33.749, longitude: -84.388, slug: 'atlanta' },
    { id: 1, city: 'Gravelines', latitude: 50.988, longitude: 2.128, slug: 'gravelines' },
    { id: 2, city: 'İstanbul', latitude: 41.0082, longitude: 28.9784, slug: 'istanbul' },
    { id: 3, city: 'Johannesburg', latitude: -26.204, longitude: 28.047, slug: 'johannesburg' },
    { id: 4, city: 'Limburg', latitude: 50.384, longitude: 8.05, slug: 'limburg' },
    { id: 5, city: 'London', latitude: 51.507, longitude: -0.128, slug: 'london' },
    { id: 6, city: 'Miami', latitude: 25.762, longitude: -80.192, slug: 'miami' },
    { id: 7, city: 'Montréal', latitude: 45.502, longitude: -73.567, slug: 'montreal' },
    { id: 8, city: 'Mumbai', latitude: 19.076, longitude: 72.878, slug: 'mumbai' },
    { id: 9, city: 'São Paulo', latitude: -23.551, longitude: -46.633, slug: 'sao-paulo' },
    { id: 10, city: 'Seattle', latitude: 47.606, longitude: -122.332, slug: 'seattle' },
    { id: 11, city: 'Singapore', latitude: 1.352, longitude: 103.82, slug: 'singapore' },
    { id: 12, city: 'Sydney', latitude: -33.869, longitude: 151.209, slug: 'sydney' },
    { id: 13, city: 'Warsaw', latitude: 52.23, longitude: 21.012, slug: 'warsaw' },
];

const CHAIN_SLUGS: Record<Chain, string> = {
    'asset-hub': 'asset-hub.polkadot',
    coretime: 'coretime.polkadot',
};

function getNodes(chain: Chain): RPCNode[] {
    const chainSlug = CHAIN_SLUGS[chain];
    return NODE_LOCATIONS.map((loc) => ({
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
