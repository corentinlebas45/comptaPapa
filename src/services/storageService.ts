import { type Transaction, type AppData, type CategoryDef, PRESET_COLORS, DefaultCategories } from '../types.ts';

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
        let categories: CategoryDef[] | undefined = undefined;
        
        if (decodedData.categories && Array.isArray(decodedData.categories) && decodedData.categories.length > 0) {
             const firstCat = decodedData.categories[0];
             if (typeof firstCat === 'string') {
                 // Migration legacy string[] -> CategoryDef[]
                 categories = (decodedData.categories as unknown as string[]).map((name, index) => {
                     const defaultMatch = DefaultCategories.find(c => c.name === name);
                     return {
                         id: defaultMatch?.id || `cat_${Date.now()}_${index}`,
                         name,
                         color: defaultMatch?.color || PRESET_COLORS[index % PRESET_COLORS.length]
                     };
                 });
             } else {
                 categories = decodedData.categories as CategoryDef[];
             }
        }

        return {
            transactions: decodedData.transactions || [],
            initialBalance: decodedData.initialBalance || 0,
            categories
        };
    }

    try {
        const rawData = JSON.parse(encodedData);
        // ... (handle rawData similarly if needed, but usually encodedData covers it)
        // For simplicity let's assume rawData path is less critical or apply similar logic if needed.
        if (Array.isArray(rawData)) {
            return {
                transactions: rawData,
                initialBalance: 0,
                categories: undefined
            };
        } else if (rawData && typeof rawData === 'object') {
             // Basic migration for rawData path too just in case
            let categories: CategoryDef[] | undefined = undefined;
             if (rawData.categories && Array.isArray(rawData.categories) && rawData.categories.length > 0) {
                 if (typeof rawData.categories[0] === 'string') {
                      categories = (rawData.categories as string[]).map((name, index) => {
                        const defaultMatch = DefaultCategories.find(c => c.name === name);
                        return {
                            id: defaultMatch?.id || `cat_${Date.now()}_${index}`,
                            name,
                            color: defaultMatch?.color || PRESET_COLORS[index % PRESET_COLORS.length]
                        };
                     });
                 } else {
                     categories = rawData.categories;
                 }
             }

            return {
                transactions: rawData.transactions || [],
                initialBalance: rawData.initialBalance || 0,
                categories
            };
        }
    } catch (e) {}

    return { transactions: [], initialBalance: 0, categories: undefined };

    } catch (e) {
        console.error("Failed to load app data", e);
        return { transactions: [], initialBalance: 0, categories: undefined };
    }
};
