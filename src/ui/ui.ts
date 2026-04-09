import { AppEvent, eventBus } from '@/event/event';
import { getDOMElementById } from './dom';
import { WorldMap } from './world-map';
import { ThemeManager } from './theme';
import { MOON_SVG, SUN_SVG, COPY_SVG, CHECK_SVG, GITHUB_SVG, DOCS_SVG } from './icon';
import { selectedChain, GEO_ENDPOINTS, CHAIN_LABELS, CHAIN_SUBTITLES } from '@/data/chain-store';
import type { Chain } from '@/data/node';

class UI {
    private readonly appContainer: HTMLDivElement;
    private readonly map: WorldMap;
    private readonly themeManager: ThemeManager;
    private unsubChain: (() => void) | null = null;
    private readonly onResize = (): void => {
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
        this.unsubChain?.();
        this.unsubChain = null;
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

        const titleRow = document.createElement('div');
        titleRow.className = 'info-title-row';

        const titleName = document.createElement('div');
        titleName.className = 'info-title-name';
        titleName.textContent = 'DeServe.network';

        const docsLink = document.createElement('a');
        docsLink.className = 'info-github-link';
        docsLink.href = 'https://docs.deserve.network';
        docsLink.target = '_blank';
        docsLink.rel = 'noopener noreferrer';
        docsLink.setAttribute('aria-label', 'Documentation');
        docsLink.innerHTML = DOCS_SVG;

        const githubLink = document.createElement('a');
        githubLink.className = 'info-github-link';
        githubLink.href = 'https://github.com/helikon-labs/deserve-web';
        githubLink.target = '_blank';
        githubLink.rel = 'noopener noreferrer';
        githubLink.setAttribute('aria-label', 'GitHub repository');
        githubLink.innerHTML = GITHUB_SVG;

        const linkRow = document.createElement('div');
        linkRow.className = 'info-link-row';
        linkRow.appendChild(docsLink);
        linkRow.appendChild(githubLink);

        titleRow.appendChild(titleName);
        titleRow.appendChild(linkRow);

        const chainSwitcher = document.createElement('div');
        chainSwitcher.className = 'chain-switcher';
        const chains: Chain[] = ['asset-hub', 'coretime'];
        const tabs = new Map<Chain, HTMLButtonElement>();
        for (const chain of chains) {
            const tab = document.createElement('button');
            tab.className = 'chain-tab';
            tab.textContent = CHAIN_LABELS[chain];
            tab.addEventListener('click', () => {
                selectedChain.set(chain);
            });
            tabs.set(chain, tab);
            chainSwitcher.appendChild(tab);
        }

        const titleSub = document.createElement('div');
        titleSub.className = 'info-title-sub';

        const endpoint = document.createElement('div');
        endpoint.className = 'info-endpoint';

        const url = document.createElement('span');
        url.className = 'info-url';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-button';
        copyBtn.setAttribute('aria-label', 'Copy endpoint URL');
        copyBtn.innerHTML = COPY_SVG;

        endpoint.appendChild(url);
        endpoint.appendChild(copyBtn);
        panel.appendChild(titleRow);
        panel.appendChild(chainSwitcher);
        panel.appendChild(titleSub);
        panel.appendChild(endpoint);
        this.appContainer.appendChild(panel);

        const updateForChain = (chain: Chain): void => {
            tabs.forEach((tab, c) => {
                tab.classList.toggle('active', c === chain);
            });
            titleSub.textContent = CHAIN_SUBTITLES[chain];
            const geoEndpoint = GEO_ENDPOINTS[chain];
            url.textContent = geoEndpoint;
            copyBtn.onclick = () => {
                void navigator.clipboard
                    .writeText(geoEndpoint)
                    .then(() => {
                        copyBtn.innerHTML = CHECK_SVG;
                        setTimeout(() => {
                            copyBtn.innerHTML = COPY_SVG;
                        }, 2000);
                    })
                    .catch(() => {
                        /* clipboard unavailable, no-op */
                    });
            };
        };

        this.unsubChain = selectedChain.subscribe(updateForChain);
    }
}

export { UI };
