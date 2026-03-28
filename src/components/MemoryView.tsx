import React from 'react';

interface MemoryViewProps {
  memory: number[];
}

const MemoryView: React.FC<MemoryViewProps> = React.memo(({ memory }) => {
  // Group memory into 4-byte words
  const words: number[][] = [];
  for (let i = 0; i < memory.length; i += 4) {
    words.push(memory.slice(i, i + 4));
  }

  return (
    <div className="flex flex-col h-full bg-[var(--app-background)] rounded-lg shadow-sm overflow-hidden border border-[var(--border)]">
      <div className="bg-[var(--toolbar-background)] px-4 py-2 border-b border-[var(--border)]">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--app-foreground)] opacity-70">Memory (0x0000 - 0x0080)</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[var(--app-foreground)] opacity-40 border-b border-[var(--border)]">
              <th className="py-1 px-2">Addr</th>
              <th className="py-1 px-2 text-center">Value (LE Word)</th>
            </tr>
          </thead>
          <tbody>
            {words.map((word, index) => {
              const addr = (index * 4).toString(16).padStart(4, '0').toUpperCase();
              const val = word.map(b => b.toString(16).padStart(2, '0')).reverse().join('').toUpperCase();
              return (
                <tr key={addr} className="hover:bg-[var(--toolbar-background)] transition-colors">
                  <td className="py-1 px-2 text-[var(--app-foreground)] opacity-40">0x{addr}</td>
                  <td className="py-1 px-2 text-center text-[var(--app-foreground)] font-medium">0x{val}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default MemoryView;
