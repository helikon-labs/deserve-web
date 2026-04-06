interface RpcNode {
    city: string;
    latitude: number;
    longitude: number;
    httpURL: string;
    wsURL: string;
}

const RPC_NODES: RpcNode[] = [
    {
        city: 'İstanbul',
        latitude: 41.0082,
        longitude: 28.9784,
        httpURL: 'https://istanbul-01.asset-hub.polkadot.rpc.deserve.network',
        wsURL: 'wss://istanbul-01.asset-hub.polkadot.rpc.deserve.network',
    },
];

export type { RpcNode };
export { RPC_NODES };
