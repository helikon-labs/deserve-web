import { AppEvent, eventBus } from '@/event/event';
import { getDOMElementById } from './dom';
import { logger } from '@/log/logger';
import { WorldMap } from './world-map';

class UI {
    private readonly appContainer: HTMLDivElement;
    private readonly map: WorldMap;
    private readonly onResize = (): void => {
        logger.info('resize');
        this.map.resize();
        eventBus.emit(AppEvent.UI.Layout.Resize, {
            width: this.appContainer.clientWidth,
            height: this.appContainer.clientHeight,
        });
    };

    constructor() {
        this.appContainer = getDOMElementById('app-container', HTMLDivElement);
        this.map = new WorldMap();
    }

    async setup() {
        window.addEventListener('resize', this.onResize);
        await this.map.setup();
    }

    start(): void {}

    destroy(): void {
        window.removeEventListener('resize', this.onResize);
        this.map.destroy();
    }
}

export { UI };
