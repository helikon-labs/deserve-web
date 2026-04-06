import { AppEvent, eventBus } from "@/event/event";
import { getDOMElementById } from "./dom";
import { logger } from "@/log/logger";

export interface UIDelegate {}

export class UI {
    private readonly appContainer: HTMLDivElement;

    private delegate: UIDelegate;

    constructor(delegate: UIDelegate) {
        this.delegate = delegate;
        this.appContainer = getDOMElementById('app-container', HTMLDivElement);
        this.setup();
    }

    private setup() {
        window.addEventListener('resize', () => {
            logger.info('resize');
            eventBus.emit(
                AppEvent.UI.Layout.Resize,
                { width: this.appContainer.clientWidth, height: this.appContainer.clientHeight },
            );
        });
    }

    start() {
        this.appContainer.innerHTML = `<div>hello!</div>`;
    }
}
