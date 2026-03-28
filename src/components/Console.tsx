import React from 'react';
import { Terminal, ChevronDown, ChevronUp } from 'lucide-react';

interface ConsoleProps {
  output: string;
  isCollapsed: boolean;
  onToggle: () => void;
  height: number;
}

const Console: React.FC<ConsoleProps> = ({ output, isCollapsed, onToggle, height }) => {
  return (
    <div 
      className="bg-[var(--console-background)] border-t border-[var(--border)] flex flex-col overflow-hidden transition-colors duration-200"
      style={{ height: isCollapsed ? '32px' : `${height}px` }}
    >
      {/* Console Header / Toggle Bar */}
      <div 
        className="flex items-center justify-between px-4 py-1.5 bg-[var(--toolbar-background)] border-b border-[var(--border)] cursor-pointer select-none"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <Terminal size={12} className="text-[var(--app-foreground)] opacity-50" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--app-foreground)] opacity-70">
            Console Output
          </span>
        </div>
        <button className="text-[var(--app-foreground)] opacity-50 hover:opacity-100 transition-colors">
          {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Console Content */}
      {!isCollapsed && (
        <div className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed">
          <pre className="text-[var(--console-foreground)] whitespace-pre-wrap">
            {output || <span className="opacity-40 italic">Ready for simulation...</span>}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Console;
