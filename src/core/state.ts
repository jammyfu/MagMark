export interface PageSetting {
    fontSize: number;
    lineHeight: number;
    letterSpacing: number;
}

export interface AppState {
    md: string;
    fontSize: number;
    lineHeight: number;
    letterSpacing: number;
    fontFamily: string;
    format: 'a4' | 'mobile' | 'desktop';
    viewMode: 'multi' | 'scroll';
    manualPagination: boolean;
    currentPage: number;
    totalPages: number;
    pageHtmls: { html: string; settings: PageSetting }[];
    pageOverrides: Record<number, PageSetting>;
    blockOverrides: Record<string, PageSetting>;
    selectedBlockId: string | null;
    isProcessing: boolean;
    theme: string;
}

export const initialState: AppState = {
    md: '',
    fontSize: 14,
    lineHeight: 1.75,
    letterSpacing: 0.01,
    fontFamily: "'Source Han Serif SC', 'Noto Serif SC', serif",
    format: 'a4',
    viewMode: 'multi',
    manualPagination: false,
    currentPage: 1,
    totalPages: 1,
    pageHtmls: [],
    pageOverrides: {},
    blockOverrides: {},
    selectedBlockId: null,
    isProcessing: false,
    theme: 'elite',
};

class StateManager {
    private state: AppState;
    private listeners: ((state: AppState) => void)[] = [];

    constructor() {
        this.state = { ...initialState };
    }

    getState() {
        return this.state;
    }

    setState(updates: Partial<AppState>) {
        this.state = { ...this.state, ...updates };
        this.notify();
    }

    subscribe(fn: (state: AppState) => void) {
        this.listeners.push(fn);
        return () => {
            this.listeners = this.listeners.filter(l => l !== fn);
        };
    }

    private notify() {
        this.listeners.forEach(fn => fn(this.state));
    }
}

export const store = new StateManager();
