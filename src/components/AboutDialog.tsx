import React from 'react';
import { X, Globe, Heart, Command } from 'lucide-react';

interface AboutDialogProps {
  onClose: () => void;
}

const AboutDialog: React.FC<AboutDialogProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[var(--app-background)] border border-[var(--border)] w-[450px] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="relative h-32 bg-blue-600 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent scale-150" />
          </div>
          <div className="z-10 flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl p-2">
              <img src="/quasar-logo.svg" alt="Quasar Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center text-center space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tighter text-[var(--app-foreground)] uppercase">Quasar</h2>
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.3em]">MIPS32 R2000 Simulator</p>
          </div>

          <div className="inline-flex items-center px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Version 0.9.1 Beta</span>
          </div>

          <p className="text-sm text-[var(--app-foreground)] opacity-60 leading-relaxed max-w-[300px]">
            A modern, high-performance assembly environment designed for learning and debugging MIPS architecture.
          </p>

          <div className="w-full h-px bg-[var(--border)]" />

          <div className="flex items-center gap-4">
            <button className="p-2 bg-[var(--sidebar-background)] border border-[var(--border)] rounded-xl text-[var(--app-foreground)] opacity-60 hover:opacity-100 hover:border-blue-500/50 transition-all cursor-pointer">
              <Command size={18} />
            </button>
            <button className="p-2 bg-[var(--sidebar-background)] border border-[var(--border)] rounded-xl text-[var(--app-foreground)] opacity-60 hover:opacity-100 hover:border-blue-500/50 transition-all cursor-pointer">
              <Globe size={18} />
            </button>
          </div>

          <div className="text-[9px] font-bold text-[var(--app-foreground)] opacity-30 uppercase tracking-widest flex items-center gap-1.5 pt-2">
            Made with <Heart size={8} className="text-red-500 fill-red-500" /> for computer science
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutDialog;
