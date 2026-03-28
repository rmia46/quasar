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

  const categories = [
    { id: 'general', label: 'General', icon: <Monitor size={14} /> },
    { id: 'editor', label: 'Editor', icon: <CodeIcon size={14} /> },
    { id: 'themes', label: 'Appearance', icon: <Palette size={14} /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[var(--app-background)] border border-[var(--border)] w-[680px] h-[500px] rounded-xl shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Sidebar */}
        <aside className="w-[200px] bg-[var(--sidebar-background)] border-r border-[var(--border)] flex flex-col">
          <div className="px-6 py-5 flex items-center gap-2 border-b border-[var(--border)]">
            <SettingsIcon size={18} className="text-blue-500" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--app-foreground)] opacity-70">Settings</h2>
          </div>
          
          <nav className="flex-1 p-3 space-y-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[11px] font-bold transition-all
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

          <div className="p-4 text-[9px] font-bold text-[var(--app-foreground)] opacity-30 uppercase tracking-tighter text-center">
            Quasar MIPS IDE v0.1.0
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex flex-col bg-[var(--app-background)]">
          <header className="px-8 py-5 flex items-center justify-between border-b border-[var(--border)]">
            <h3 className="text-sm font-bold text-[var(--app-foreground)] capitalize">{activeCategory}</h3>
            <button onClick={onClose} className="text-[var(--app-foreground)] opacity-30 hover:opacity-100 hover:text-red-500 transition-all">
              <X size={20} />
            </button>
          </header>

          <div className="flex-1 p-8 overflow-y-auto space-y-8 custom-scrollbar">
            
            {activeCategory === 'general' && (
              <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                <section className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-500 opacity-80">Application Theme</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => onUpdate({ ...settings, theme: QUASAR_DARK })}
                      className={`p-3 border rounded-lg text-left transition-all ${settings.theme.name === QUASAR_DARK.name ? 'border-blue-500 bg-blue-500/5' : 'border-[var(--border)] opacity-60 hover:opacity-100'}`}
                    >
                      <div className="text-[11px] font-bold text-[var(--app-foreground)]">Dark Mode</div>
                      <div className="text-[9px] text-[var(--app-foreground)] opacity-50 mt-1">High contrast, low strain.</div>
                    </button>
                    <button 
                      onClick={() => onUpdate({ ...settings, theme: QUASAR_LIGHT })}
                      className={`p-3 border rounded-lg text-left transition-all ${settings.theme.name === QUASAR_LIGHT.name ? 'border-blue-500 bg-blue-500/5' : 'border-[var(--border)] opacity-60 hover:opacity-100'}`}
                    >
                      <div className="text-[11px] font-bold text-[var(--app-foreground)]">Light Mode</div>
                      <div className="text-[9px] text-[var(--app-foreground)] opacity-50 mt-1">Clear, classic look.</div>
                    </button>
                  </div>
                </section>
              </div>
            )}

            {activeCategory === 'editor' && (
              <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[11px] font-bold text-[var(--app-foreground)]">Font Size</h4>
                      <p className="text-[10px] text-[var(--app-foreground)] opacity-40 mt-1">Adjust the text size in the code editor.</p>
                    </div>
                    <input 
                      type="number" 
                      value={settings.fontSize} 
                      onChange={(e) => onUpdate({ ...settings, fontSize: parseInt(e.target.value) || 12 })}
                      className="w-20 bg-[var(--sidebar-background)] border border-[var(--border)] px-3 py-1.5 text-xs rounded-md text-[var(--app-foreground)] focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[11px] font-bold text-[var(--app-foreground)]">Tab Size</h4>
                      <p className="text-[10px] text-[var(--app-foreground)] opacity-40 mt-1">Choose the number of spaces for indentation.</p>
                    </div>
                    <select 
                      value={settings.tabSize} 
                      onChange={(e) => onUpdate({ ...settings, tabSize: parseInt(e.target.value) })}
                      className="w-32 bg-[var(--sidebar-background)] border border-[var(--border)] px-3 py-1.5 text-xs rounded-md text-[var(--app-foreground)] focus:outline-none focus:border-blue-500"
                    >
                      <option value={2}>2 spaces</option>
                      <option value={4}>4 spaces</option>
                      <option value={8}>8 spaces</option>
                    </select>
                  </div>
                </section>
              </div>
            )}

            {activeCategory === 'themes' && (
              <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-500 opacity-80">Custom Themes</h4>
                    <button 
                      onClick={onLoadTheme}
                      className="text-[10px] font-bold bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white px-4 py-1.5 rounded-full transition-all"
                    >
                      Import Plugin
                    </button>
                  </div>
                  <div className="p-4 border border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center gap-3 bg-[var(--sidebar-background)] opacity-60">
                    <Palette size={24} className="text-gray-400" />
                    <p className="text-[10px] text-[var(--app-foreground)] text-center">Active Theme: <span className="font-bold text-blue-500">{settings.theme.name}</span></p>
                  </div>
                  <p className="text-[9px] text-[var(--app-foreground)] opacity-40 italic">Themes loaded from .json plugin files apply app-wide styles including editor highlighting.</p>
                </section>
              </div>
            )}

          </div>

          <footer className="px-8 py-4 bg-[var(--sidebar-background)] border-t border-[var(--border)] flex justify-end gap-3">
             <button 
              onClick={onClose}
              className="px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              Close
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default SettingsDialog;
