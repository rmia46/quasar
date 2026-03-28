export interface ThemeColors {
  "app.background": string;
  "app.foreground": string;
  "tab.active": string;
  "tab.inactive": string;
  "tab.border": string;
  "toolbar.background": string;
  "sidebar.background": string;
  "border": string;
  "console.background": string;
  "console.foreground": string;
}

export interface EditorTheme {
  background: string;
  foreground: string;
  tokens: {
    token: string;
    foreground: string;
    fontStyle?: string;
  }[];
}

export interface AppTheme {
  name: string;
  type: 'dark' | 'light';
  colors: ThemeColors;
  editor: EditorTheme;
}

export const QUASAR_DARK: AppTheme = {
  name: "Quasar Dark",
  type: "dark",
  colors: {
    "app.background": "#0d0d0d",
    "app.foreground": "#d4d4d4",
    "tab.active": "#1e1e1e",
    "tab.inactive": "#252526",
    "tab.border": "#1e1e1e",
    "toolbar.background": "#1a1a1a",
    "sidebar.background": "#0d0d0d",
    "border": "#2a2a2a",
    "console.background": "#0a0a0a",
    "console.foreground": "#cccccc",
  },
  editor: {
    background: "#1e1e1e",
    foreground: "#d4d4d4",
    tokens: [
      { token: 'comment', foreground: '6A9955' },
      { token: 'variable', foreground: '4FC1FF' },
      { token: 'keyword', foreground: 'C586C0' },
      { token: 'tag', foreground: 'FFD700' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'string', foreground: 'CE9178' },
    ]
  }
};

export const QUASAR_LIGHT: AppTheme = {
  name: "Quasar Light",
  type: "light",
  colors: {
    "app.background": "#f3f3f3",
    "app.foreground": "#333333",
    "tab.active": "#ffffff",
    "tab.inactive": "#e8e8e8",
    "tab.border": "#ddd",
    "toolbar.background": "#ffffff",
    "sidebar.background": "#f3f3f3",
    "border": "#ddd",
    "console.background": "#ffffff",
    "console.foreground": "#333333",
  },
  editor: {
    background: "#ffffff",
    foreground: "#000000",
    tokens: [
      { token: 'comment', foreground: '008000' },
      { token: 'variable', foreground: '0000FF' },
      { token: 'keyword', foreground: 'AF00DB' },
      { token: 'tag', foreground: '808000' },
      { token: 'number', foreground: '098677' },
      { token: 'string', foreground: 'A31515' },
    ]
  }
};
