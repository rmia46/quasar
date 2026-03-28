import React, { useState } from 'react';
import { X, HelpCircle, Book, Keyboard, Palette, Cpu } from 'lucide-react';

interface HelpDialogProps {
  onClose: () => void;
}

const HelpDialog: React.FC<HelpDialogProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'intro' | 'shortcuts' | 'themes' | 'mips'>('intro');

  const tabs = [
    { id: 'intro', label: 'Getting Started', icon: <Book size={14} /> },
    { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard size={14} /> },
    { id: 'themes', label: 'Theming', icon: <Palette size={14} /> },
    { id: 'mips', label: 'MIPS Reference', icon: <Cpu size={14} /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[var(--app-background)] border border-[var(--border)] w-[750px] h-[550px] rounded-xl shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Sidebar */}
        <aside className="w-[200px] bg-[var(--sidebar-background)] border-r border-[var(--border)] flex flex-col">
          <div className="px-6 py-5 flex items-center gap-2 border-b border-[var(--border)]">
            <HelpCircle size={18} className="text-blue-500" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--app-foreground)] opacity-70">Help Center</h2>
          </div>
          
          <nav className="flex-1 p-3 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[11px] font-bold transition-all
                  ${activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'text-[var(--app-foreground)] opacity-50 hover:opacity-100 hover:bg-[var(--tab-active)]'}
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex flex-col bg-[var(--app-background)]">
          <header className="px-8 py-5 flex items-center justify-between border-b border-[var(--border)]">
            <h3 className="text-sm font-bold text-[var(--app-foreground)] capitalize">
              {tabs.find(t => t.id === activeTab)?.label}
            </h3>
            <button onClick={onClose} className="text-[var(--app-foreground)] opacity-30 hover:opacity-100 hover:text-red-500 transition-all">
              <X size={20} />
            </button>
          </header>

          <div className="flex-1 p-8 overflow-y-auto space-y-6 text-[var(--app-foreground)] leading-relaxed custom-scrollbar">
            
            {activeTab === 'intro' && (
              <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                <section className="space-y-3">
                  <h4 className="text-lg font-bold text-blue-500">Welcome to Quasar</h4>
                  <p className="text-sm opacity-70 leading-relaxed">
                    Quasar is a modern, lightweight MIPS32 R2000 Integrated Development Environment (IDE). 
                    It allows you to write, debug, and simulate MIPS assembly code with real-time feedback.
                  </p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <section className="space-y-3">
                    <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500/50">1. Preparation</h5>
                    <ul className="space-y-2 text-xs opacity-70 list-disc pl-4">
                      <li><span className="font-bold text-[var(--app-foreground)]">Write:</span> Type your MIPS assembly directly in the editor.</li>
                      <li><span className="font-bold text-[var(--app-foreground)]">Save:</span> Files must be saved before running. Use <span className="font-mono bg-[var(--sidebar-background)] px-1 rounded">Ctrl+S</span> or enable "Auto-Save before Run" in Settings.</li>
                    </ul>
                  </section>

                  <section className="space-y-3">
                    <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500/50">2. Stepping Loop</h5>
                    <ul className="space-y-2 text-xs opacity-70 list-disc pl-4">
                      <li><span className="font-bold text-[var(--app-foreground)]">Trigger:</span> Use the <span className="text-blue-500 font-bold">Step</span> button or <span className="font-mono bg-[var(--sidebar-background)] px-1 rounded">F10</span>.</li>
                      <li><span className="font-bold text-[var(--app-foreground)]">Highlight:</span> A blue bar shows the line currently being executed.</li>
                      <li><span className="font-bold text-[var(--app-foreground)]">Glow:</span> Modified registers will <span className="text-orange-500 font-bold">glow orange</span> in the sidebar.</li>
                    </ul>
                  </section>

                  <section className="space-y-3">
                    <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500/50">3. Branching</h5>
                    <ul className="space-y-2 text-xs opacity-70 list-disc pl-4">
                      <li>Logic like <span className="font-mono bg-[var(--sidebar-background)] px-1 rounded">beq</span>, <span className="font-mono bg-[var(--sidebar-background)] px-1 rounded">bne</span>, or <span className="font-mono bg-[var(--sidebar-background)] px-1 rounded">j</span> will cause the blue highlight to jump to the target label target.</li>
                    </ul>
                  </section>

                  <section className="space-y-3">
                    <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500/50">4. Resetting</h5>
                    <ul className="space-y-2 text-xs opacity-70 list-disc pl-4">
                      <li>Click <span className="text-orange-500 font-bold">Reset</span> or <span className="font-mono bg-[var(--sidebar-background)] px-1 rounded">Ctrl+R</span> to clear registers, memory, and move back to line 1.</li>
                    </ul>
                  </section>
                </div>

                <section className="p-4 bg-blue-600/5 border border-blue-600/20 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Book size={48} />
                  </div>
                  <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500 mb-2">Pro-Tip</h5>
                  <p className="text-xs opacity-70 leading-relaxed">
                    If you are stepping through a long loop and get bored, you can click <span className="font-bold text-green-500">Run (F5)</span> at any point to execute the rest of the program at full speed!
                  </p>
                </section>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { keys: 'Ctrl + N', desc: 'Create a new file' },
                    { keys: 'Ctrl + S', desc: 'Save active file' },
                    { keys: 'Ctrl + Z', desc: 'Undo last edit' },
                    { keys: 'Ctrl + Y', desc: 'Redo last edit' },
                    { keys: 'F5', desc: 'Run simulation' },
                    { keys: 'F10', desc: 'Step forward' },
                  ].map(sh => (
                    <div key={sh.keys} className="flex items-center justify-between p-3 bg-[var(--sidebar-background)] border border-[var(--border)] rounded-lg">
                      <span className="text-xs font-bold text-blue-500 font-mono">{sh.keys}</span>
                      <span className="text-xs opacity-60">{sh.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'themes' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                <section className="space-y-3">
                  <h4 className="text-sm font-bold">Custom Theme Plugins</h4>
                  <p className="text-xs opacity-70">
                    Quasar supports external theme plugins via JSON files. A theme file defines both the IDE 
                    interface colors and the code highlighting rules.
                  </p>
                  <div className="p-4 bg-[var(--sidebar-background)] border border-[var(--border)] rounded-lg font-mono text-[10px] opacity-80 overflow-x-auto">
                    <pre>{`{
  "name": "Custom Theme",
  "type": "dark",
  "colors": {
    "app.background": "#121212",
    ...
  },
  "editor": {
    "tokens": [...]
  }
}`}</pre>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'mips' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                <section className="space-y-4">
                  <h4 className="text-sm font-bold text-blue-500">Supported Instructions</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-[10px] font-bold uppercase opacity-40 mb-2">Arithmetic</h5>
                      <div className="text-xs opacity-70">add, addu, sub, subu, addi, lui</div>
                    </div>
                    <div>
                      <h5 className="text-[10px] font-bold uppercase opacity-40 mb-2">Logical</h5>
                      <div className="text-xs opacity-70">and, or, xor, nor, andi, ori, xori</div>
                    </div>
                    <div>
                      <h5 className="text-[10px] font-bold uppercase opacity-40 mb-2">Memory</h5>
                      <div className="text-xs opacity-70">lw, sw, lb, sb, lh, sh</div>
                    </div>
                    <div>
                      <h5 className="text-[10px] font-bold uppercase opacity-40 mb-2">Control Flow</h5>
                      <div className="text-xs opacity-70">j, jal, jr, beq, bne, slt, sltu</div>
                    </div>
                  </div>
                </section>
                <section className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-2">Special Note</p>
                  <p className="text-xs opacity-70">
                    Use <span className="font-bold">syscall</span> with $v0=1 to print integers and $v0=10 to exit.
                  </p>
                </section>
              </div>
            )}

          </div>

          <footer className="px-8 py-4 bg-[var(--sidebar-background)] border-t border-[var(--border)] flex justify-end">
             <button 
              onClick={onClose}
              className="px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-blue-600/20"
            >
              Close
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default HelpDialog;
