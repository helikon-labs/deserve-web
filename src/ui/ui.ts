import { AppEvent, eventBus } from '@/event/event';
import { getDOMElementById } from './dom';
import { logger } from '@/log/logger';
import { WorldMap } from './world-map';
import { ThemeManager } from './theme';
import { MOON_SVG, SUN_SVG } from './icon';

class UI {
    private readonly appContainer: HTMLDivElement;
    private readonly map: WorldMap;
    private readonly themeManager: ThemeManager;
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
        this.themeManager = new ThemeManager();
    }

    async setup() {
        window.addEventListener('resize', this.onResize);
        this.setupThemeToggle();
        await this.map.setup();
    }

    start(): void {}

    destroy(): void {
        window.removeEventListener('resize', this.onResize);
        this.map.destroy();
    }

    private setupThemeToggle(): void {
        const button = document.createElement('button');
        button.className = 'theme-toggle';
        button.setAttribute('aria-label', 'Toggle theme');
        this.updateToggleIcon(button);
        button.addEventListener('click', () => {
            this.themeManager.toggle();
            this.updateToggleIcon(button);
        });
        this.appContainer.appendChild(button);
    }

    private updateToggleIcon(button: HTMLButtonElement): void {
        button.innerHTML = this.themeManager.theme === 'dark' ? SUN_SVG : MOON_SVG;
    }
}

export { UI };
