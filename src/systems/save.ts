import { saveAs } from 'file-saver';

export interface GameSaveData {
    version: number;
    id: string; // ID único para o save
    seed: string;
    worldX: number;
    worldY: number;
    health: number;
    food: number;
}

export const CURRENT_VERSION = 1;

export class SaveSystem {
    private static readonly SAVE_KEY = 'flatcraft_save_data';
    // Changed SAVE_KEY to a prefix for multiple saves
    private static readonly SAVE_KEY_PREFIX = 'flatcraft_save_';
    private static readonly DEFAULT_SAVE_ID = 'default'; // For backward compatibility or single save

    public static save(data: Omit<GameSaveData, 'version' | 'id'> & { id?: string }) {
        // Verifica se está no navegador
        if (typeof window === 'undefined') return;

        try {
            // Tenta manter o ID atual se existir, ou usa o fornecido, ou gera um novo
            // If no ID is provided, we'll use a default ID or generate a new one if it's a new save.
            let id = data.id;
            if (!id) {
                // If no ID is provided, try to load the default save to get its ID, or generate a new one.
                const defaultSave = SaveSystem.loadById(SaveSystem.DEFAULT_SAVE_ID);
                id = defaultSave?.id || Math.random().toString(36).substring(2, 9).toUpperCase();
            }

            const payload: GameSaveData = { ...data, version: CURRENT_VERSION, id };
            const json = JSON.stringify(payload);
            const key = `${this.SAVE_KEY_PREFIX}${id}`;
            localStorage.setItem(key, json);
            console.log('Game saved successfully.');
        } catch (error) {
            console.error('Failed to save game (Quota exceeded?):', error);
        }
    }

    public static load(): GameSaveData | null {
        if (typeof window === 'undefined') return null;

        try {
            const json = localStorage.getItem(this.SAVE_KEY);
            if (!json) return null;

            const rawData = JSON.parse(json);

            // 1. Validação de Tipo (Type Guard simples)
            if (!SaveSystem.isValidSaveData(rawData)) {
                console.warn('Save data corrupted or invalid format.');
                return null;
            }

            // 2. Migração de Versão (Exemplo simples)
            if (rawData.version < CURRENT_VERSION) {
                console.log('Migrating save from v' + rawData.version);
                // Lógica de migração viria aqui
                rawData.version = CURRENT_VERSION;
            }

            return rawData;
        } catch (error) {
            console.error('Failed to load game:', error);
            return null;
        }
    }

    public static loadById(id: string): GameSaveData | null {
        if (typeof window === 'undefined') return null;

        try {
            const key = `${this.SAVE_KEY_PREFIX}${id}`;
            const json = localStorage.getItem(key);
            if (!json) return null;

            const rawData = JSON.parse(json);

            if (!SaveSystem.isValidSaveData(rawData)) {
                console.warn(`Save data for ID '${id}' corrupted or invalid format.`);
                return null;
            }

            // No version migration needed here, as load() handles it for the primary load.
            // For specific ID loads, we assume the data is already migrated or will be handled
            // by the main load logic if it becomes the active save.
            return rawData;
        } catch (error) {
            console.error(`Failed to load game for ID '${id}':`, error);
            return null;
        }
    }

    // Type Guard para garantir que o objeto tem o formato certo
    public static isValidSaveData(data: any): data is GameSaveData {
        return (
            data &&
            typeof data.id === 'string' &&
            typeof data.seed === 'string' &&
            typeof data.worldX === 'number' &&
            typeof data.worldY === 'number' &&
            typeof data.health === 'number' &&
            typeof data.food === 'number'
        );
    }

    public static clear() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(this.SAVE_KEY);
        }
    }

    /**
     * Gera um arquivo .json para o usuário baixar no computador usando FileSaver.
     */
    public static downloadSave(data: Omit<GameSaveData, 'version'>) {
        if (typeof window === 'undefined') return;

        try {
            const payload: GameSaveData = { ...data, version: CURRENT_VERSION };
            const json = JSON.stringify(payload, null, 2);
            const blob = new Blob([json], { type: 'application/json;charset=utf-8' });

            const fileName = `flatcraft_save_${data.id}.json`;
            saveAs(blob, fileName);

            console.log('Download initiated via FileSaver:', fileName);
        } catch (error) {
            console.error('Failed to download save file:', error);
        }
    }

    /**
     * Opcional: Permitir o usuário fazer upload do arquivo de volta (Import)
     */
    public static async importSaveFromFile(file: File): Promise<GameSaveData | null> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = e.target?.result as string;
                    const data = JSON.parse(json);

                    if (SaveSystem.isValidSaveData(data)) {
                        resolve(data);
                    } else {
                        console.error("Invalid save file structure");
                        resolve(null);
                    }
                } catch (err) {
                    console.error("Error parsing file", err);
                    resolve(null);
                }
            };
            reader.readAsText(file);
        });
    }
}