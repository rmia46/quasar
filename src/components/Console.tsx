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
      className="bg-gray-50 dark:bg-[#0a0a0a] border-t border-gray-300 dark:border-[#2a2a2a] flex flex-col overflow-hidden transition-colors duration-200"
      style={{ height: isCollapsed ? '32px' : `${height}px` }}
    >
      {/* Console Header / Toggle Bar */}
      <div 
        className="flex items-center justify-between px-4 py-1.5 bg-gray-100 dark:bg-[#1a1a1a] border-b border-gray-300 dark:border-[#2a2a2a] cursor-pointer select-none"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <Terminal size={12} className="text-gray-500 dark:text-gray-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">
            Console Output
          </span>
        </div>
        <button className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
          {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Console Content */}
      {!isCollapsed && (
        <div className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed">
          <pre className="text-gray-800 dark:text-gray-300 whitespace-pre-wrap">
            {output || <span className="text-gray-400 italic opacity-50">Ready for simulation...</span>}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Console;
