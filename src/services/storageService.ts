import type { Transaction, AppData } from '../types.ts';

const STORAGE_KEY = 'mes_comptes_data_v1';

const encodeToBase64 = (data: AppData): string => {
    const jsonString = JSON.stringify(data);
    return btoa(unescape(encodeURIComponent(jsonString)));
};

const decodeFromBase64 = (encoded: string): AppData | null => {
    try {
        const jsonString = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to decode base64 data", e);
    return null;
    }
};

export const saveAppData = async (data: AppData): Promise<void> => {
    try {
        const encoded = encodeToBase64(data);
    if (window.electronAPI) {
        await window.electronAPI.saveData(encoded);
    } else {
        localStorage.setItem(STORAGE_KEY, encoded);
    }
    } catch (e) {
        console.error("Failed to save app data", e);
    }
};

export const loadAppData = async (): Promise<AppData> => {
    try {
        let encodedData: string | null = null;
    
    if (window.electronAPI) {
        encodedData = await window.electronAPI.loadData();
    } else {
        encodedData = localStorage.getItem(STORAGE_KEY);
    }

    if (!encodedData) {
        return { transactions: [], initialBalance: 0 };
    }

    // Tenter de décoder en base64
    const decodedData = decodeFromBase64(encodedData);
    
    if (decodedData) {
        return {
            transactions: decodedData.transactions || [],
            initialBalance: decodedData.initialBalance || 0,
            categories: decodedData.categories || []
        };
    }

    try {
        const rawData = JSON.parse(encodedData);
        if (Array.isArray(rawData)) {
            return {
                transactions: rawData,
                initialBalance: 0,
                categories: undefined
            };
        } else if (rawData && typeof rawData === 'object') {
            return {
                transactions: rawData.transactions || [],
                initialBalance: rawData.initialBalance || 0,
                categories: rawData.categories
            };
        }
    } catch (e) {}

    return { transactions: [], initialBalance: 0, categories: undefined };

    } catch (e) {
        console.error("Failed to load app data", e);
        return { transactions: [], initialBalance: 0, categories: undefined };
    }
};
