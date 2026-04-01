import React from 'react';
import { X, Globe, Heart, Code } from 'lucide-react';

interface AboutDialogProps {
  onClose: () => void;
}

const AboutDialog: React.FC<AboutDialogProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[110] backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[var(--app-background)] border border-[var(--border)] w-[380px] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 pt-6 flex justify-end">
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-[var(--tab-active)] text-[var(--app-foreground)] opacity-40 hover:opacity-100 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-8 pb-10 flex flex-col items-center">
          {/* Logo Section */}
          <div className="w-24 h-24 mb-6 relative">
            <div className="absolute inset-0 bg-[var(--accent)]/10 blur-2xl rounded-full" />
            <div className="relative bg-[var(--toolbar-background)] border border-[var(--border)] rounded-[2rem] w-full h-full flex items-center justify-center shadow-sm">
              <img src="/quasar-logo.svg" alt="Quasar Logo" className="w-14 h-12 object-contain" />
            </div>
          </div>

          {/* Title & Version */}
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl font-black tracking-tight text-[var(--app-foreground)]">Quasar</h2>
            <div className="flex items-center justify-center gap-2.5">
              <span className="text-[10px] font-black px-2 py-0.5 bg-[var(--accent)] text-white rounded-md uppercase tracking-widest shadow-lg shadow-[var(--accent)]/20">
                v1.5.0
              </span>
              <span className="text-[10px] font-bold text-[var(--app-foreground)] opacity-40 uppercase tracking-widest">
                MIPS32 R2000 IDE
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-center text-xs text-[var(--app-foreground)] opacity-70 leading-relaxed mb-8 max-w-[280px]">
            A high-performance, modern assembly environment focused on minimalist design and developer experience.
          </p>

          {/* Links Grid */}
          <div className="grid grid-cols-2 gap-3 w-full mb-10">
            <a 
              href="https://github.com/rmia46/quasar" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 bg-[var(--toolbar-background)] border border-[var(--border)] rounded-2xl hover:border-[var(--accent)]/50 hover:bg-[var(--tab-active)] transition-all group no-underline"
            >
              <Code size={20} className="text-[var(--app-foreground)] opacity-60 group-hover:text-[var(--accent)] group-hover:opacity-100 transition-all" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--app-foreground)] opacity-60 group-hover:opacity-100">Source Code</span>
            </a>
            <a 
              href="https://github.com/rmia46" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 bg-[var(--toolbar-background)] border border-[var(--border)] rounded-2xl hover:border-[var(--accent)]/50 hover:bg-[var(--tab-active)] transition-all group no-underline"
            >
              <Globe size={20} className="text-[var(--app-foreground)] opacity-60 group-hover:text-[var(--accent)] group-hover:opacity-100 transition-all" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--app-foreground)] opacity-60 group-hover:opacity-100">Developer</span>
            </a>
          </div>

          {/* Footer */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-[10px] font-bold text-[var(--app-foreground)] opacity-50 uppercase tracking-widest">
              Built by <span className="text-[var(--app-foreground)] opacity-90">Roman Mia</span>
            </div>
            <div className="text-[8px] font-bold text-[var(--app-foreground)] opacity-30 uppercase tracking-[0.2em] flex items-center gap-1.5 mt-1">
              Made with <Heart size={8} className="text-red-500 fill-red-500" /> for computer science
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutDialog;
