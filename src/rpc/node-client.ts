import type { RPCNode } from '@/data/node';
import type { NodeState } from '@/data/network-store';

interface JsonRpcRequest {
    id: number;
    jsonrpc: '2.0';
    method: string;
    params: unknown[];
}

interface JsonRpcResponse {
    jsonrpc: '2.0';
    id: number;
    result?: unknown;
    error?: { code: number; message: string };
}

interface JsonRpcNotification {
    jsonrpc: '2.0';
    method: string;
    params: {
        subscription: string;
        result: unknown;
    };
}

interface BlockHeader {
    number: string;
}

type StateUpdate = Partial<NodeState>;
type OnUpdateCallback = (update: StateUpdate) => void;

class NodeClient {
    private readonly node: RPCNode;
    private readonly onUpdate: OnUpdateCallback;
    private ws: WebSocket | null = null;
    private idCounter = 0;
    private readonly pending = new Map<
        number,
        { resolve: (value: unknown) => void; reject: (reason: unknown) => void }
    >();
    private bestBlockSubId: string | null = null;
    private finalizedBlockSubId: string | null = null;
    private latencyInterval: ReturnType<typeof setInterval> | null = null;

    constructor(node: RPCNode, onUpdate: OnUpdateCallback) {
        this.node = node;
        this.onUpdate = onUpdate;
    }

    connect(): void {
        this.onUpdate({ status: 'connecting' });
        this.ws = new WebSocket(this.node.wsURL);
        this.ws.onopen = () => {
            this.onOpen().catch(() => this.onUpdate({ status: 'error' }));
        };
        this.ws.onmessage = (e) => {
            this.onMessage(e);
        };
        this.ws.onerror = () => {
            this.onUpdate({ status: 'error' });
        };
        this.ws.onclose = () => {
            this.onClose();
        };
    }

    disconnect(): void {
        this.clearLatencyInterval();
        this.ws?.close();
        this.ws = null;
    }

    private async onOpen(): Promise<void> {
        this.onUpdate({ status: 'connected' });
        const [bestSubId, finalizedSubId] = await Promise.all([
            this.request<string>('chain_subscribeNewHeads', []),
            this.request<string>('chain_subscribeFinalizedHeads', []),
        ]);
        this.bestBlockSubId = bestSubId;
        this.finalizedBlockSubId = finalizedSubId;
        void this.measureLatency();
        this.latencyInterval = setInterval(() => {
            void this.measureLatency();
        }, 10_000);
    }

    private onClose(): void {
        this.clearLatencyInterval();
        this.onUpdate({ status: 'error' });
    }

    private onMessage(event: MessageEvent): void {
        const msg = JSON.parse(event.data as string) as JsonRpcResponse | JsonRpcNotification;
        if ('id' in msg) {
            const pending = this.pending.get(msg.id);
            if (!pending) return;
            this.pending.delete(msg.id);
            if (msg.error) {
                pending.reject(msg.error);
            } else {
                pending.resolve(msg.result);
            }
        } else if ('method' in msg) {
            this.onNotification(msg);
        }
    }

    private onNotification(msg: JsonRpcNotification): void {
        const { subscription, result } = msg.params;
        const blockNumber = parseInt((result as BlockHeader).number, 16);
        if (subscription === this.bestBlockSubId) {
            this.onUpdate({ bestBlock: blockNumber });
        } else if (subscription === this.finalizedBlockSubId) {
            this.onUpdate({ finalizedBlock: blockNumber });
        }
    }

    private async measureLatency(): Promise<void> {
        const start = performance.now();
        try {
            await this.request('system_health', []);
            this.onUpdate({ latencyMs: Math.round(performance.now() - start) });
        } catch {
            // ignore, latency stays at last known value
        }
    }

    private request<T>(method: string, params: unknown[]): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const id = ++this.idCounter;
            this.pending.set(id, {
                resolve: resolve as (value: unknown) => void,
                reject,
            });
            const msg: JsonRpcRequest = { id, jsonrpc: '2.0', method, params };
            this.ws?.send(JSON.stringify(msg));
        });
    }

    private clearLatencyInterval(): void {
        if (this.latencyInterval !== null) {
            clearInterval(this.latencyInterval);
            this.latencyInterval = null;
        }
    }
}

export { NodeClient };
