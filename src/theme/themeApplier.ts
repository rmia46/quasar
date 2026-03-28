import { AppTheme } from './defaults';

export const applyTheme = (theme: AppTheme) => {
  const root = document.documentElement;
  
  // Apply colors to CSS variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    // Convert 'app.background' to '--app-background'
    const cssVarName = `--${key.replace(/\./g, '-')}`;
    root.style.setProperty(cssVarName, value);
  });

  // Handle dark/light mode for system elements if needed
  if (theme.type === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};
