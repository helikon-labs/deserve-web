type Theme = 'light' | 'dark';

const STORAGE_KEY = 'deserve-theme';

class ThemeManager {
    private current: Theme;

    constructor() {
        const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
        this.current = stored ?? 'dark';
        this.apply();
    }

    get theme(): Theme {
        return this.current;
    }

    toggle(): void {
        this.current = this.current === 'dark' ? 'light' : 'dark';
        this.apply();
        localStorage.setItem(STORAGE_KEY, this.current);
    }

    private systemTheme(): Theme {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    private apply(): void {
        document.documentElement.setAttribute('data-theme', this.current);
    }
}

export type { Theme };
export { ThemeManager };
