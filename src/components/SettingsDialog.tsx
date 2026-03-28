import React, { useState } from 'react';
import { X, Settings as SettingsIcon, Monitor, Palette, Code as CodeIcon } from 'lucide-react';
import { QUASAR_DARK, QUASAR_LIGHT } from '../theme/defaults';
import { Settings } from '../services/configService';

interface SettingsDialogProps {
  settings: Settings;
  onUpdate: (settings: Settings) => void;
  onClose: () => void;
  onLoadTheme: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ settings, onUpdate, onClose, onLoadTheme }) => {
  const [activeCategory, setActiveCategory] = useState<'general' | 'editor' | 'themes'>('general');
  const [localFontSize, setLocalFontSize] = useState(settings.fontSize.toString());

  const handleFontSizeChange = (value: string) => {
    setLocalFontSize(value);
    const parsed = parseInt(value);
    if (!isNaN(parsed) && parsed >= 8 && parsed <= 72) {
      onUpdate({ ...settings, fontSize: parsed });
    }
  };

  const handleFontSizeBlur = () => {
    let parsed = parseInt(localFontSize);
    if (isNaN(parsed)) parsed = 16; // Default fallback
    const clamped = Math.min(Math.max(parsed, 8), 72);
    setLocalFontSize(clamped.toString());
    onUpdate({ ...settings, fontSize: clamped });
  };

  const categories = [
    { id: 'general', label: 'General', icon: <Monitor size={16} /> },
    { id: 'editor', label: 'Editor', icon: <CodeIcon size={16} /> },
    { id: 'themes', label: 'Appearance', icon: <Palette size={16} /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[var(--app-background)] border border-[var(--border)] w-[750px] h-[580px] rounded-2xl shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Sidebar */}
        <aside className="w-[220px] bg-[var(--sidebar-background)] border-r border-[var(--border)] flex flex-col">
          <div className="px-7 py-6 flex items-center gap-3 border-b border-[var(--border)]">
            <SettingsIcon size={20} className="text-blue-500" />
            <h2 className="text-[12px] font-bold uppercase tracking-[0.2em] text-[var(--app-foreground)] opacity-70">Settings</h2>
          </div>
          
          <nav className="flex-1 p-4 space-y-1.5">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`
                  w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[12px] font-bold transition-all
                  ${activeCategory === cat.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'text-[var(--app-foreground)] opacity-50 hover:opacity-100 hover:bg-[var(--tab-active)]'}
                `}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </nav>

          <div className="p-5 text-[10px] font-bold text-[var(--app-foreground)] opacity-30 uppercase tracking-tighter text-center">
            Quasar MIPS IDE v1.0.0
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex flex-col bg-[var(--app-background)]">
          <header className="px-10 py-6 flex items-center justify-between border-b border-[var(--border)]">
            <h3 className="text-base font-bold text-[var(--app-foreground)] capitalize">{activeCategory}</h3>
            <button onClick={onClose} className="text-[var(--app-foreground)] opacity-30 hover:opacity-100 hover:text-red-500 transition-all">
              <X size={22} />
            </button>
          </header>

          <div className="flex-1 p-10 overflow-y-auto space-y-10 custom-scrollbar">
            
            {activeCategory === 'general' && (
              <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-300">
                <section className="space-y-5">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-blue-500 opacity-80">Automation</h4>
                  <div 
                    onClick={() => onUpdate({ ...settings, autoSaveBeforeRun: !settings.autoSaveBeforeRun })}
                    className="flex items-center justify-between p-5 bg-[var(--sidebar-background)] border border-[var(--border)] rounded-2xl cursor-pointer hover:border-blue-500/30 transition-all"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-[var(--app-foreground)]">Auto-Save before Run</h4>
                      <p className="text-[11px] text-[var(--app-foreground)] opacity-40 mt-1">Automatically save changes to disk before starting simulation.</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full relative transition-colors ${settings.autoSaveBeforeRun ? 'bg-blue-600' : 'bg-gray-600'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.autoSaveBeforeRun ? 'left-7' : 'left-1'}`} />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeCategory === 'editor' && (
              <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-300">
                <section className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--app-foreground)]">Font Size</h4>
                      <p className="text-[11px] text-[var(--app-foreground)] opacity-40 mt-1">Adjust the text size in the code editor (8-72px).</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <style dangerouslySetInnerHTML={{ __html: `
                        input[type=number]::-webkit-inner-spin-button, 
                        input[type=number]::-webkit-outer-spin-button { 
                          -webkit-appearance: none; 
                          margin: 0; 
                        }
                        input[type=number] {
                          -moz-appearance: textfield;
                        }
                      `}} />
                      <input 
                        type="text" 
                        value={localFontSize} 
                        onChange={(e) => handleFontSizeChange(e.target.value)}
                        onBlur={handleFontSizeBlur}
                        className="w-20 bg-[var(--sidebar-background)] border border-[var(--border)] px-4 py-2 text-sm font-bold rounded-xl text-[var(--app-foreground)] text-center focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
                      />
                      <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">px</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--app-foreground)]">Tab Size</h4>
                      <p className="text-[11px] text-[var(--app-foreground)] opacity-40 mt-1">Choose the number of spaces for indentation.</p>
                    </div>
                    <div className="flex bg-[var(--sidebar-background)] border border-[var(--border)] p-1 rounded-xl">
                      {[2, 4, 8].map((size) => (
                        <button
                          key={size}
                          onClick={() => onUpdate({ ...settings, tabSize: size })}
                          className={`
                            px-4 py-1.5 text-xs font-bold rounded-lg transition-all
                            ${settings.tabSize === size 
                              ? 'bg-blue-600 text-white shadow-md' 
                              : 'text-[var(--app-foreground)] opacity-50 hover:opacity-100'}
                          `}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeCategory === 'themes' && (
              <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-300">
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-blue-500 opacity-80">Color Themes</h4>
                    <button 
                      onClick={onLoadTheme}
                      className="text-[11px] font-bold bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white px-5 py-2 rounded-full transition-all"
                    >
                      Load Custom Theme...
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => onUpdate({ ...settings, theme: QUASAR_DARK })}
                      className={`p-4 border rounded-xl text-left transition-all group ${settings.theme.name === QUASAR_DARK.name ? 'border-blue-500 bg-blue-500/5' : 'border-[var(--border)] hover:border-blue-500/30 bg-[var(--sidebar-background)]'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[var(--app-foreground)]">Quasar Dark</span>
                        {settings.theme.name === QUASAR_DARK.name && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                      </div>
                      <div className="text-[10px] text-[var(--app-foreground)] opacity-40 mt-1">Default high-contrast dark theme.</div>
                    </button>

                    <button 
                      onClick={() => onUpdate({ ...settings, theme: QUASAR_LIGHT })}
                      className={`p-4 border rounded-xl text-left transition-all group ${settings.theme.name === QUASAR_LIGHT.name ? 'border-blue-500 bg-blue-500/5' : 'border-[var(--border)] hover:border-blue-500/30 bg-[var(--sidebar-background)]'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[var(--app-foreground)]">Quasar Light</span>
                        {settings.theme.name === QUASAR_LIGHT.name && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                      </div>
                      <div className="text-[10px] text-[var(--app-foreground)] opacity-40 mt-1">Clean and classic light theme.</div>
                    </button>

                    {settings.theme.name !== QUASAR_DARK.name && settings.theme.name !== QUASAR_LIGHT.name && (
                      <div className="p-4 border border-blue-500 bg-blue-500/5 rounded-xl text-left col-span-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-[var(--app-foreground)]">{settings.theme.name}</span>
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        </div>
                        <div className="text-[10px] text-[var(--app-foreground)] opacity-40 mt-1">Currently active plugin theme.</div>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-[var(--app-foreground)] opacity-40 italic">Note: Custom theme plugins are loaded from .json files and apply app-wide.</p>
                </section>
              </div>
            )}

          </div>

          <footer className="px-10 py-6 bg-[var(--sidebar-background)] border-t border-[var(--border)] flex justify-end">
             <button 
              onClick={onClose}
              className="px-10 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              Done
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default SettingsDialog;
