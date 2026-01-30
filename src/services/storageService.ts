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
      // Mode Desktop - données encodées en base64
      await window.electronAPI.saveData(encoded);
    } else {
      // Mode Web - données encodées en base64
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
      // Mode Desktop
      encodedData = await window.electronAPI.loadData();
    } else {
      // Mode Web
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
        initialBalance: decodedData.initialBalance || 0
      };
    }

    // Tentative de rétro-compatibilité : si ce n'est pas du base64, essayer JSON direct
    try {
      const rawData = JSON.parse(encodedData);
      if (Array.isArray(rawData)) {
        return {
          transactions: rawData,
          initialBalance: 0
        };
      } else if (rawData && typeof rawData === 'object') {
        return {
          transactions: rawData.transactions || [],
          initialBalance: rawData.initialBalance || 0
        };
      }
    } catch (e) {
      // Ignore, ce n'est ni du base64 ni du JSON valide
    }

    return { transactions: [], initialBalance: 0 };

  } catch (e) {
    console.error("Failed to load app data", e);
    return { transactions: [], initialBalance: 0 };
  }
};
