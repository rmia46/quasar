import { useEffect, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { 
  Play, 
  RotateCcw, 
  Cpu, 
  FileText, 
  FolderOpen, 
  Save, 
  StepForward, 
  Code,
  Info,
  ChevronRight,
  Monitor,
  X,
  Circle
} from 'lucide-react';
import CodeEditor from './components/CodeEditor';
import RegisterView from './components/RegisterView';
import MemoryView from './components/MemoryView';
import Console from './components/Console';

interface SimulatorState {
  registers: number[];
  pc: number;
  current_line: number | null;
  memory_sample: number[];
  message: string;
}

const isTauri = () => !!(window as any).__TAURI_INTERNALS__;

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [mipsCode, setMipsCode] = useState('');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);
  
  const [consoleHeight, setConsoleHeight] = useState(180);
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const [state, setState] = useState<SimulatorState>({
    registers: new Array(32).fill(0),
    pc: 0,
    current_line: null,
    memory_sample: new Array(256).fill(0),
    message: ''
  });

  const updateTheme = useCallback(async () => {
    if (!isTauri()) return;
    try {
      const win = getCurrentWindow();
      const theme = await win.theme();
      setDarkMode(theme === 'dark');
      return await win.onThemeChanged(({ payload: theme }) => {
        setDarkMode(theme === 'dark');
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    let unlisten: any;
    updateTheme().then(u => unlisten = u);
    return () => { if (unlisten) unlisten(); };
  }, [updateTheme]);

  // File Operations
  const handleNewFile = () => {
    setMipsCode('');
    setFilePath(null);
    setIsModified(false);
    setState(prev => ({ ...prev, current_line: null }));
  };

  const handleOpenFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'MIPS Assembly', extensions: ['mips', 's', 'asm'] }]
      });
      if (selected && typeof selected === 'string') {
        const content = await readTextFile(selected);
        setMipsCode(content);
        setFilePath(selected);
        setIsModified(false);
        setState(prev => ({ ...prev, current_line: null }));
      }
    } catch (err) {
      console.error("Open Error:", err);
    }
  };

  const handleSaveFile = async () => {
    try {
      let path = filePath;
      if (!path) {
        path = await save({
          filters: [{ name: 'MIPS Assembly', extensions: ['mips', 's', 'asm'] }]
        });
      }
      
      if (path) {
        await writeTextFile(path, mipsCode);
        setFilePath(path);
        setIsModified(false);
      }
    } catch (err) {
      console.error("Save Error:", err);
    }
  };

  const handleExit = async () => {
    const win = getCurrentWindow();
    await win.close();
  };

  const handleCodeChange = (newCode: string) => {
    setMipsCode(newCode);
    setIsModified(true);
  };

  // Simulator Operations
  const handleRun = async () => {
    if (!isTauri()) return;
    try {
      const result = await invoke<SimulatorState>('run_mips_code', { code: mipsCode });
      setState(result);
      if (isConsoleCollapsed) setIsConsoleCollapsed(false);
    } catch (err) {
      setState(prev => ({ ...prev, message: `Fatal Error: ${err}` }));
    }
  };

  const handleStep = async () => {
    if (!isTauri()) return;
    try {
      const result = await invoke<SimulatorState>('step_mips_code', { code: mipsCode });
      setState(result);
      if (isConsoleCollapsed) setIsConsoleCollapsed(false);
    } catch (err) {
      setState(prev => ({ ...prev, message: `Fatal Error: ${err}` }));
    }
  };

  const handleReset = async () => {
    if (!isTauri()) return;
    try {
      const result = await invoke<SimulatorState>('reset_simulator');
      setState(result);
    } catch (err) {
      console.error(err);
    }
  };

  // Resize Logic
  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);
  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newHeight = window.innerHeight - e.clientY - 31;
      if (newHeight > 100 && newHeight < 600) {
        setConsoleHeight(newHeight);
        setIsConsoleCollapsed(false);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const fileName = filePath ? filePath.split(/[\\/]/).pop() : 'untitled.mips';

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${darkMode ? 'dark' : ''} ${isResizing ? 'cursor-row-resize select-none' : ''}`}>
      
      {/* 1. Menu Bar */}
      <nav className="h-7 bg-[#f3f3f3] dark:bg-[#2d2d2d] border-b border-gray-300 dark:border-[#1e1e1e] flex items-center px-3 gap-1 transition-colors duration-200 shrink-0">
        <MenuButton label="File" items={[
          { label: 'New File', onClick: handleNewFile },
          { label: 'Open File...', onClick: handleOpenFile },
          { label: 'Save', onClick: handleSaveFile },
          { separator: true },
          { label: 'Exit', onClick: handleExit },
        ]} />
        <MenuButton label="Edit" items={[{ label: 'Undo' }, { label: 'Redo' }]} />
        <MenuButton label="Run" items={[
          { label: 'Run Simulation', onClick: handleRun },
          { label: 'Step Forward', onClick: handleStep },
          { label: 'Reset Engine', onClick: handleReset },
        ]} />
        <MenuButton label="Help" items={[{ label: 'About Quasar' }]} />
      </nav>

      {/* 2. Top Toolbar */}
      <div className="h-12 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between px-4 shrink-0 transition-colors duration-200 shadow-sm z-20">
        <div className="flex items-center gap-1">
          <ToolbarButton icon={<FileText size={16} />} label="New" onClick={handleNewFile} />
          <ToolbarButton icon={<FolderOpen size={16} />} label="Open" onClick={handleOpenFile} />
          <ToolbarButton icon={<Save size={16} />} label="Save" onClick={handleSaveFile} />
          <div className="w-px h-6 bg-gray-200 dark:bg-[#333] mx-2" />
          <ToolbarButton icon={<Play size={16} className="text-green-600 fill-green-600/20" />} label="Run" onClick={handleRun} primary />
          <ToolbarButton icon={<StepForward size={16} className="text-blue-500" />} label="Step" onClick={handleStep} />
          <ToolbarButton icon={<RotateCcw size={16} className="text-orange-500" />} label="Reset" onClick={handleReset} />
        </div>

        <div className="flex items-center gap-4 mr-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                <Cpu size={14} />
                MIPS32 R2000
            </div>
            <Info size={16} className="text-gray-400 cursor-help" />
        </div>
      </div>

      {/* 3. Main Workspace */}
      <main className="flex-1 flex overflow-hidden bg-gray-50 dark:bg-[#0d0d0d]">
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-hidden relative border-r border-gray-200 dark:border-[#2a2a2a] flex flex-col">
             {/* Tab Bar */}
             <div className="h-9 bg-gray-100 dark:bg-[#252526] flex items-center border-b border-gray-200 dark:border-[#1e1e1e]">
                <div className={`
                  flex items-center gap-3 text-[11px] font-medium h-full px-4 border-r border-gray-200 dark:border-[#1e1e1e] transition-colors
                  ${isModified ? 'bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400' : 'bg-white dark:bg-[#1e1e1e] text-gray-600 dark:text-gray-300'}
                `}>
                    <Code size={14} className={isModified ? 'text-blue-500' : 'text-gray-400'} />
                    <span>{fileName}{isModified ? '*' : ''}</span>
                    <button 
                      className="ml-1 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm transition-colors group"
                      onClick={handleNewFile}
                    >
                      {isModified ? (
                        <Circle size={10} fill="currentColor" className="text-blue-500" />
                      ) : (
                        <X size={12} className="text-gray-400 group-hover:text-red-500" />
                      )}
                    </button>
                </div>
             </div>
             <div className="flex-1 overflow-hidden">
                <CodeEditor 
                    onCodeChange={handleCodeChange} 
                    initialCode={mipsCode} 
                    theme={darkMode ? 'vs-dark' : 'light'} 
                    highlightedLine={state.current_line}
                />
             </div>
          </div>

          <div onMouseDown={startResizing} className="h-1.5 bg-gray-200 dark:bg-[#2a2a2a] hover:bg-blue-500 dark:hover:bg-blue-600 cursor-row-resize flex items-center justify-center transition-colors group z-10">
            <div className="w-12 h-1 bg-gray-400 dark:bg-[#444] group-hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <Console output={state.message} isCollapsed={isConsoleCollapsed} onToggle={() => setIsConsoleCollapsed(!isConsoleCollapsed)} height={consoleHeight} />
        </div>

        <aside className="w-80 flex flex-col shrink-0 overflow-hidden bg-gray-50 dark:bg-[#0d0d0d] p-4 gap-4 border-l border-gray-200 dark:border-[#2a2a2a]">
          <div className="flex-1 overflow-hidden">
            <RegisterView registers={state.registers} />
          </div>
          <div className="h-72 overflow-hidden">
            <MemoryView memory={state.memory_sample} />
          </div>
        </aside>
      </main>

      <footer className="h-6 bg-blue-600 dark:bg-[#007acc] flex items-center px-4 justify-between shrink-0 text-[10px] font-bold text-white uppercase tracking-wider z-20">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5"><Monitor size={12} />{isTauri() ? "Hardware Connected" : "Local Emulation Mode"}</span>
          <span className="flex items-center gap-1"><ChevronRight size={12} />PC: 0x{state.pc.toString(16).padStart(8, '0').toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-4 opacity-90">
          <span>{isModified ? "UNSAVED CHANGES" : "SAVED"}</span>
          <span>MIPS Assembly</span>
        </div>
      </footer>
    </div>
  );
}

// Simple Dropdown Menu Component
function MenuButton({ label, items }: { label: string, items: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <button className="text-[11px] px-3 py-1 hover:bg-gray-200 dark:hover:bg-[#3e3e3e] rounded text-gray-700 dark:text-gray-300 transition-colors cursor-pointer h-full">
        {label}
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full w-48 bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#454545] shadow-lg rounded-sm py-1 z-50 animate-in fade-in slide-in-from-top-1">
          {items.map((item, i) => item.separator ? (
            <div key={i} className="h-px bg-gray-200 dark:bg-[#454545] my-1 mx-2" />
          ) : (
            <button
              key={i}
              onClick={item.onClick}
              className="w-full text-left px-4 py-1.5 text-[11px] text-gray-700 dark:text-gray-300 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ToolbarButton({ icon, label, onClick, primary = false }: { icon: React.ReactNode; label: string; onClick?: () => void; primary?: boolean; }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all active:scale-95 cursor-pointer ${primary ? 'hover:bg-gray-100 dark:hover:bg-[#333] font-bold text-gray-800 dark:text-gray-200' : 'hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-600 dark:text-gray-400'}`} title={label}>
      {icon}
      <span className="text-[11px] font-medium hidden md:inline">{label}</span>
    </button>
  );
}

export default App;
