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
    format: 'a4' | 'mobile' | 'desktop' | 'xiaohongshu';
    viewMode: 'multi' | 'scroll';
    manualPagination: boolean;
    showParagraphDividers: boolean;
    currentPage: number;
    totalPages: number;
    pageHtmls: { html: string; settings: PageSetting }[];
    pageOverrides: Record<number, PageSetting>;
    blockOverrides: Record<string, PageSetting>;
    selectedBlockId: string | null;
    isProcessing: boolean;
    theme: string;
    scale: number;
}

export const FORMAT_DEFAULT_SETTINGS: Record<AppState['format'], PageSetting> = {
    a4: {
        fontSize: 14,
        lineHeight: 1.75,
        letterSpacing: 0.01,
    },
    mobile: {
        fontSize: 16,
        lineHeight: 1.8,
        letterSpacing: 0.015,
    },
    desktop: {
        fontSize: 16,
        lineHeight: 1.75,
        letterSpacing: 0.01,
    },
    xiaohongshu: {
        fontSize: 36,
        lineHeight: 1.85,
        letterSpacing: 0.011,
    },
};

export function getFormatDefaultSetting(format: AppState['format']): PageSetting {
    return { ...FORMAT_DEFAULT_SETTINGS[format] };
}

export const initialState: AppState = {
    ...getFormatDefaultSetting('a4'),
    md: '',
    fontFamily: "'Source Han Serif SC', 'Noto Serif SC', serif",
    format: 'a4',
    viewMode: 'multi',
    manualPagination: false,
    showParagraphDividers: false,
    currentPage: 1,
    totalPages: 1,
    pageHtmls: [],
    pageOverrides: {},
    blockOverrides: {},
    selectedBlockId: null,
    isProcessing: false,
    theme: 'elite',
    scale: 1,
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
