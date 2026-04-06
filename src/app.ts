import { AppEvent, eventBus, type EventMap } from './event/event';
import { logger } from './log/logger';
import { UIEvent } from './event/ui';
import { UI } from './ui/ui';
import { RPCManager } from './rpc/rpc-manager';

class App {
    private readonly rpcManager: RPCManager;
    private readonly ui: UI;

    private readonly onClose = (_event: EventMap[typeof AppEvent.Close]): void => {
        // no-op
    };
    private readonly onLayoutChange = (_event: EventMap[typeof UIEvent.Layout.Resize]): void => {
        // no-op
    };

    constructor() {
        this.rpcManager = new RPCManager();
        this.ui = new UI();
    }

    async setup() {
        eventBus.on(UIEvent.Layout.Resize, this.onLayoutChange);
        eventBus.on(AppEvent.Close, this.onClose);
        await this.ui.setup();
        this.rpcManager.start();
    }

    start() {
        logger.info('Start app.');
        this.ui.start();
    }

    stop(): void {
        logger.info('Stop app.');
        this.rpcManager.stop();
        this.ui.destroy();
        eventBus.off(AppEvent.Close, this.onClose);
        eventBus.off(UIEvent.Layout.Resize, this.onLayoutChange);
    }
}

export { App };
