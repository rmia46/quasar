import React from 'react';

interface MemoryViewProps {
  memory: number[];
}

const MemoryView: React.FC<MemoryViewProps> = ({ memory }) => {
  // Group memory into 4-byte words
  const words: number[][] = [];
  for (let i = 0; i < memory.length; i += 4) {
    words.push(memory.slice(i, i + 4));
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111111] rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-[#2a2a2a]">
      <div className="bg-gray-50 dark:bg-[#1a1a1a] px-4 py-2 border-b border-gray-200 dark:border-[#2a2a2a]">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-400">Memory (0x0000 - 0x0100)</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 border-b border-gray-100 dark:border-[#2a2a2a]">
              <th className="py-1 px-2">Addr</th>
              <th className="py-1 px-2 text-center">Value (LE Word)</th>
            </tr>
          </thead>
          <tbody>
            {words.map((word, index) => {
              const addr = (index * 4).toString(16).padStart(4, '0').toUpperCase();
              const val = word.map(b => b.toString(16).padStart(2, '0')).reverse().join('').toUpperCase();
              return (
                <tr key={addr} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                  <td className="py-1 px-2 text-gray-400">0x{addr}</td>
                  <td className="py-1 px-2 text-center text-gray-800 dark:text-gray-300 font-medium">0x{val}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemoryView;
