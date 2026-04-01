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
  "accent": string;
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
    "tab.active": "#1a1a1a",
    "tab.inactive": "#0d0d0d",
    "tab.border": "#1a1a1a",
    "toolbar.background": "#141414",
    "sidebar.background": "#0d0d0d",
    "border": "#222222",
    "console.background": "#050505",
    "console.foreground": "#a0a0a0",
    "accent": "#fe9442",
  },
  editor: {
    background: "#0d0d0d",
    foreground: "#d4d4d4",
    tokens: [
      { token: 'comment', foreground: '606060', fontStyle: 'italic' },
      { token: 'variable', foreground: '38bdf8' },
      { token: 'keyword', foreground: 'fe9442' },
      { token: 'tag', foreground: 'f472b6' },
      { token: 'number', foreground: '4ade80' },
      { token: 'string', foreground: 'fbbf24' },
      { token: 'directive', foreground: 'a78bfa' },
    ]
  }
};

export const QUASAR_LIGHT: AppTheme = {
  name: "Quasar Light",
  type: "light",
  colors: {
    "app.background": "#fcfcfc",
    "app.foreground": "#2d2d2d",
    "tab.active": "#ffffff",
    "tab.inactive": "#f3f3f3",
    "tab.border": "#e5e5e5",
    "toolbar.background": "#ffffff",
    "sidebar.background": "#f8f8f8",
    "border": "#e8e8e8",
    "console.background": "#fdfdfd",
    "console.foreground": "#444444",
    "accent": "#fe9442",
  },
  editor: {
    background: "#ffffff",
    foreground: "#2d2d2d",
    tokens: [
      { token: 'comment', foreground: '919191', fontStyle: 'italic' },
      { token: 'variable', foreground: '0284c7' },
      { token: 'keyword', foreground: 'fe9442' },
      { token: 'tag', foreground: 'db2777' },
      { token: 'number', foreground: '16a34a' },
      { token: 'string', foreground: 'd97706' },
      { token: 'directive', foreground: '7c3aed' },
    ]
  }
};
