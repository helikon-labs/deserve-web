interface RPCNode {
    id: number;
    city: string;
    latitude: number;
    longitude: number;
    httpURL: string;
    wsURL: string;
}

const RPC_NODES: RPCNode[] = [
    {
        id: 0,
        city: 'Atlanta',
        latitude: 33.749,
        longitude: -84.388,
        httpURL: 'https://atlanta-01.asset-hub.polkadot.rpc.deserve.network',
        wsURL: 'wss://atlanta-01.asset-hub.polkadot.rpc.deserve.network',
    },
    {
        id: 1,
        city: 'Gravelines',
        latitude: 50.988,
        longitude: 2.128,
        httpURL: 'https://gravelines-01.asset-hub.polkadot.rpc.deserve.network',
        wsURL: 'wss://gravelines-01.asset-hub.polkadot.rpc.deserve.network',
    },
    {
        id: 2,
        city: 'İstanbul',
        latitude: 41.0082,
        longitude: 28.9784,
        httpURL: 'https://istanbul-01.asset-hub.polkadot.rpc.deserve.network',
        wsURL: 'wss://istanbul-01.asset-hub.polkadot.rpc.deserve.network',
    },
    {
        id: 3,
        city: 'Johannesburg',
        latitude: -26.204,
        longitude: 28.047,
        httpURL: 'https://johannesburg-01.asset-hub.polkadot.rpc.deserve.network',
        wsURL: 'wss://johannesburg-01.asset-hub.polkadot.rpc.deserve.network',
    },
    {
        id: 4,
        city: 'Limburg',
        latitude: 50.384,
        longitude: 8.05,
        httpURL: 'https://limburg-01.asset-hub.polkadot.rpc.deserve.network',
        wsURL: 'wss://limburg-01.asset-hub.polkadot.rpc.deserve.network',
    },
    {
        id: 5,
        city: 'London',
        latitude: 51.507,
        longitude: -0.128,
        httpURL: 'https://london-01.asset-hub.polkadot.rpc.deserve.network',
        wsURL: 'wss://london-01.asset-hub.polkadot.rpc.deserve.network',
    },
    {
        id: 6,
        city: 'Miami',
        latitude: 25.762,
        longitude: -80.192,
        httpURL: 'https://miami-01.asset-hub.polkadot.rpc.deserve.network',
        wsURL: 'wss://miami-01.asset-hub.polkadot.rpc.deserve.network',
    },
    {
        id: 7,
        city: 'Montréal',
        latitude: 45.502,
        longitude: -73.567,
        httpURL: 'https://montreal-01.asset-hub.polkadot.rpc.deserve.network',
        wsURL: 'wss://montreal-01.asset-hub.polkadot.rpc.deserve.network',
    },
    {
        id: 8,
        city: 'Mumbai',
        latitude: 19.076,
        longitude: 72.878,
        httpURL: 'https://mumbai-01.asset-hub.polkadot.rpc.deserve.network',
        wsURL: 'wss://mumbai-01.asset-hub.polkadot.rpc.deserve.network',
    },
    {
        id: 9,
        city: 'São Paulo',
        latitude: -23.551,
        longitude: -46.633,
        httpURL: 'https://sao-paulo-01.asset-hub.polkadot.rpc.deserve.network',
        wsURL: 'wss://sao-paulo-01.asset-hub.polkadot.rpc.deserve.network',
    },
    {
        id: 10,
        city: 'Seattle',
        latitude: 47.606,
        longitude: -122.332,
        httpURL: 'https://seattle-01.asset-hub.polkadot.rpc.deserve.network',
        wsURL: 'wss://seattle-01.asset-hub.polkadot.rpc.deserve.network',
    },
    {
        id: 11,
        city: 'Singapore',
        latitude: 1.352,
        longitude: 103.82,
        httpURL: 'https://singapore-01.asset-hub.polkadot.rpc.deserve.network',
        wsURL: 'wss://singapore-01.asset-hub.polkadot.rpc.deserve.network',
    },
    {
        id: 12,
        city: 'Sydney',
        latitude: -33.869,
        longitude: 151.209,
        httpURL: 'https://sydney-01.asset-hub.polkadot.rpc.deserve.network',
        wsURL: 'wss://sydney-01.asset-hub.polkadot.rpc.deserve.network',
    },
    {
        id: 13,
        city: 'Warsaw',
        latitude: 52.23,
        longitude: 21.012,
        httpURL: 'https://warsaw-01.asset-hub.polkadot.rpc.deserve.network',
        wsURL: 'wss://warsaw-01.asset-hub.polkadot.rpc.deserve.network',
    },
];

export type { RPCNode };
export { RPC_NODES };
