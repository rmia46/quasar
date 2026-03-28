import { appConfigDir, join } from '@tauri-apps/api/path';
import { readTextFile, writeTextFile, mkdir, exists } from '@tauri-apps/plugin-fs';
import { AppTheme } from '../theme/defaults';

export interface Settings {
  theme: AppTheme;
  fontSize: number;
  tabSize: number;
}

export const DEFAULT_SETTINGS: (darkTheme: AppTheme) => Settings = (darkTheme) => ({
  theme: darkTheme,
  fontSize: 14,
  tabSize: 4,
});

export class ConfigService {
  private static configPath: string | null = null;
  private static themesDir: string | null = null;

  static async init() {
    try {
      const configDir = await appConfigDir();
      
      // Ensure config directory exists
      if (!(await exists(configDir))) {
        await mkdir(configDir, { recursive: true });
      }

      this.configPath = await join(configDir, 'settings.json');
      this.themesDir = await join(configDir, 'themes');

      // Ensure themes directory exists
      if (!(await exists(this.themesDir))) {
        await mkdir(this.themesDir, { recursive: true });
      }
    } catch (e) {
      console.error("Failed to initialize config paths", e);
    }
  }

  static async loadSettings(defaultSettings: Settings): Promise<Settings> {
    if (!this.configPath) await this.init();
    
    try {
      if (await exists(this.configPath!)) {
        const content = await readTextFile(this.configPath!);
        return JSON.parse(content);
      }
    } catch (e) {
      console.error("Failed to load settings from file", e);
    }

    // Fallback to localStorage for migration
    const saved = localStorage.getItem('quasar-settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        await this.saveSettings(settings); // Migrate to file
        return settings;
      } catch (e) {}
    }

    return defaultSettings;
  }

  static async saveSettings(settings: Settings) {
    if (!this.configPath) await this.init();
    try {
      await writeTextFile(this.configPath!, JSON.stringify(settings, null, 2));
    } catch (e) {
      console.error("Failed to save settings", e);
    }
  }

  static async getThemesDir(): Promise<string> {
    if (!this.themesDir) await this.init();
    return this.themesDir!;
  }
}
