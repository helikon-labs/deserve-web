import { AppEvent, eventBus } from '@/event/event';
import { getDOMElementById } from './dom';
import { logger } from '@/log/logger';
import { WorldMap } from './world-map';
import { ThemeManager } from './theme';
import { MOON_SVG, SUN_SVG } from './icon';

const GEO_ENDPOINT = 'wss://asset-hub.polkadot.rpc.deserve.network';

const COPY_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">                                                                                  
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>                                                                                                                                  
  </svg>`;

const CHECK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">                                                                                 
      <polyline points="20 6 9 17 4 12"/>
  </svg>`;

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
        this.setupInfoPanel();
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

    private setupInfoPanel(): void {
        const panel = document.createElement('div');
        panel.className = 'info-panel';

        const titleName = document.createElement('div');
        titleName.className = 'info-title-name';
        titleName.textContent = 'DeServe.network';

        const titleSub = document.createElement('div');
        titleSub.className = 'info-title-sub';
        titleSub.textContent = 'Polkadot Asset Hub Archive RPC Deployment';

        const endpoint = document.createElement('div');
        endpoint.className = 'info-endpoint';

        const url = document.createElement('span');
        url.className = 'info-url';
        url.textContent = GEO_ENDPOINT;

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-button';
        copyBtn.setAttribute('aria-label', 'Copy endpoint URL');
        copyBtn.innerHTML = COPY_SVG;
        copyBtn.addEventListener('click', () => {
            void navigator.clipboard
                .writeText(GEO_ENDPOINT)
                .then(() => {
                    copyBtn.innerHTML = CHECK_SVG;
                    setTimeout(() => {
                        copyBtn.innerHTML = COPY_SVG;
                    }, 2000);
                })
                .catch(() => {
                    /* clipboard unavailable, no-op */
                });
        });

        endpoint.appendChild(url);
        endpoint.appendChild(copyBtn);
        panel.appendChild(titleName);
        panel.appendChild(titleSub);
        panel.appendChild(endpoint);
        this.appContainer.appendChild(panel);
    }
}

export { UI };
