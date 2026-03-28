import React, { useMemo, useState, useRef } from 'react';
import { Terminal, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Info, Command, Copy, Check } from 'lucide-react';

interface ConsoleProps {
  output: string;
  isCollapsed: boolean;
  onToggle: () => void;
  height: number;
}

type LineType = 'error' | 'success' | 'info' | 'syscall' | 'default';

interface ParsedLine {
  content: string;
  type: LineType;
  timestamp: string;
}

const Console: React.FC<ConsoleProps> = ({ output, isCollapsed, onToggle, height }) => {
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const parsedLines = useMemo(() => {
    if (!output) return [];
    
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    return output.split('\n').filter(l => l.trim() !== '').map((line): ParsedLine => {
      let type: LineType = 'default';
      let content = line;

      if (line.toLowerCase().includes('error') || line.toLowerCase().includes('fatal') || line.toLowerCase().includes('timeout')) {
        type = 'error';
      } else if (line.toLowerCase().includes('completed') || line.toLowerCase().includes('success') || line.toLowerCase().includes('reset')) {
        type = 'success';
      } else if (line.includes('[Syscall') || line.includes('[Program Halted')) {
        type = 'syscall';
      } else if (line.startsWith('[') && line.endsWith(']')) {
        type = 'info';
      }

      return { content, type, timestamp: timeStr };
    });
  }, [output]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy console output', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();
      if (contentRef.current) {
        const range = document.createRange();
        range.selectNodeContents(contentRef.current);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
  };

  const getLineStyles = (type: LineType) => {
    switch (type) {
      case 'error': return 'text-red-500 bg-red-500/5 border-l-2 border-red-500';
      case 'success': return 'text-green-500 bg-green-500/5 border-l-2 border-green-500';
      case 'syscall': return 'text-blue-500 bg-blue-500/5 border-l-2 border-blue-500';
      case 'info': return 'text-orange-500 bg-orange-500/5 border-l-2 border-orange-500';
      default: return 'text-[var(--console-foreground)] border-l-2 border-transparent';
    }
  };

  const getIcon = (type: LineType) => {
    switch (type) {
      case 'error': return <AlertCircle size={12} />;
      case 'success': return <CheckCircle2 size={12} />;
      case 'syscall': return <Command size={12} />;
      case 'info': return <Info size={12} />;
      default: return <ChevronRight size={12} />;
    }
  };

  return (
    <div 
      className="bg-[var(--console-background)] border-t border-[var(--border)] flex flex-col overflow-hidden transition-colors duration-200"
      style={{ height: isCollapsed ? '32px' : `${height}px` }}
    >
      {/* Console Header / Toggle Bar */}
      <div 
        className="flex items-center justify-between px-4 py-1.5 bg-[var(--toolbar-background)] border-b border-[var(--border)] cursor-pointer select-none shrink-0"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <Terminal size={12} className="text-[var(--app-foreground)] opacity-50" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--app-foreground)] opacity-70">
            Console Output
          </span>
          {parsedLines.length > 0 && (
            <div className="flex items-center gap-2 ml-2">
              <span className="px-1.5 py-0.5 bg-blue-600/20 text-blue-500 text-[9px] font-black rounded-md">
                {parsedLines.length} LINES
              </span>
              <button 
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-all text-[9px] font-bold uppercase tracking-wider
                  ${copied 
                    ? 'bg-green-500/20 text-green-500' 
                    : 'bg-[var(--app-background)] border border-[var(--border)] text-[var(--app-foreground)] opacity-60 hover:opacity-100 hover:border-blue-500/50'}
                `}
              >
                {copied ? <Check size={10} /> : <Copy size={10} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}
        </div>
        <button className="text-[var(--app-foreground)] opacity-50 hover:opacity-100 transition-colors">
          {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Console Content */}
      {!isCollapsed && (
        <div 
          ref={contentRef}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          className="flex-1 overflow-y-auto font-mono text-[11px] custom-scrollbar bg-[var(--console-background)] focus:outline-none"
        >
          {parsedLines.length > 0 ? (
            <div className="flex flex-col">
              {parsedLines.map((line, i) => (
                <div key={i} className={`flex items-start gap-3 px-4 py-1.5 hover:bg-white/5 transition-colors group select-text ${getLineStyles(line.type)}`}>
                  <span className="text-[9px] opacity-50 select-none whitespace-nowrap mt-0.5 font-bold tracking-tighter">
                    [{line.timestamp}]
                  </span>
                  <span className="mt-0.5 opacity-50 select-none">
                    {getIcon(line.type)}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap break-all leading-relaxed font-medium select-text">
                    {line.content}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20 gap-3 grayscale">
              <Terminal size={32} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Ready for simulation...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ChevronRight = ({ size, className }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
);

export default Console;
