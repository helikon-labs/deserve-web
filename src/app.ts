// import { setupCounter } from './data/counter';

import { AppEvent, eventBus, type EventMap } from './event/event';
import { logger } from './log/logger';
import { UIEvent } from './event/ui';
import { $counter } from './data/data-store';
import { UI, type UIDelegate } from './ui/ui';

class App {
    private unsubs: Array<() => void> = [];
    private readonly uiDelegate: UIDelegate = {};
    private readonly ui: UI;

    private readonly onClose = async (event: EventMap[typeof AppEvent.Close]): Promise<void> => {
        logger.info('Close', event.id);
    };
    private readonly onLayoutChange = async (
        event: EventMap[typeof UIEvent.Layout.Resize],
    ): Promise<void> => {
        logger.info('New w/h:', event.width, event.height);
    };

    constructor() {
        this.ui = new UI(this.uiDelegate);
    }

    async setup() {
        eventBus.on(UIEvent.Layout.Resize, this.onLayoutChange);
        eventBus.on(AppEvent.Close, this.onClose);
        await this.ui.setup();
    }

    async start() {
        logger.info('Start app.');
        this.ui.start();
    }

    async stop() {
        logger.info('Stop app.');
        eventBus.off(AppEvent.Close, this.onClose);
        eventBus.off(UIEvent.Layout.Resize, this.onLayoutChange);
        for (const unsub of this.unsubs) {
            unsub();
        }
        this.unsubs = [];
        $counter.set(0);
    }

    /*
    setupCounter(document.querySelector<HTMLButtonElement>('#counter')!);
    try {
        eventBus.on(AppEvent.Ping, this.onPing);
        eventBus.on(AppEvent.Close, this.onClose);
        
        const unsub = $counter.subscribe((value, oldValue) => {
            logger.info(`counter value changed from ${oldValue} to ${value}`);
        });
        this.unsubs.push(unsub);

        setTimeout(() => {
            eventBus.emit(AppEvent.Ping);
            eventBus.emit(AppEvent.Close, { id: 'close-id-200' });
            $counter.set($counter.get() + 2);
        }, 2500);

        setTimeout(() => {
            eventBus.emit(AppEvent.UI.Layout.Resize, { width: 1920, height: 1080 });
        }, 5000);
    } catch (error) {
        logger.error('Failed to start app:', error);
    }
    */

    /*
    private async onPing(): Promise<void> {
        logger.info('Pong.');
    }
    */
}

export { App };
