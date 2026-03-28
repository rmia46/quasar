import { useEffect, useState, useCallback, useRef } from 'react';
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
  Circle,
  Undo,
  Redo,
  HelpCircle
} from 'lucide-react';
import CodeEditor from './components/CodeEditor';
import RegisterView from './components/RegisterView';
import MemoryView from './components/MemoryView';
import Console from './components/Console';
import SettingsDialog from './components/SettingsDialog';
import HelpDialog from './components/HelpDialog';
import { QUASAR_DARK, QUASAR_LIGHT } from './theme/defaults';
import { applyTheme } from './theme/themeApplier';
import { ConfigService, Settings, DEFAULT_SETTINGS } from './services/configService';

interface SimulatorState {
  registers: number[];
  pc: number;
  current_line: number | null;
  memory_sample: number[];
  message: string;
}

const isTauri = () => !!(window as any).__TAURI_INTERNALS__;

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 11);
};

interface OpenFile {
  id: string;
  path: string | null;
  name: string;
  code: string;
  isModified: boolean;
}

function App() {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [consoleHeight, setConsoleHeight] = useState(180);
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const editorRef = useRef<any>(null);

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS(QUASAR_DARK));

  // Initialize Settings from File System
  useEffect(() => {
    ConfigService.loadSettings(DEFAULT_SETTINGS(QUASAR_DARK)).then(loaded => {
      setSettings(loaded);
    });
  }, []);

  // Apply and Persist theme on change
  useEffect(() => {
    applyTheme(settings.theme);
    ConfigService.saveSettings(settings);
  }, [settings]);

  const handleLoadTheme = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Quasar Theme', extensions: ['json', 'qtheme'] }]
      });
      if (selected && typeof selected === 'string') {
        const content = await readTextFile(selected);
        const theme = JSON.parse(content);
        // Basic validation
        if (theme.name && theme.colors && theme.editor) {
          setSettings(prev => ({ ...prev, theme }));
        } else {
          alert("Invalid theme file format");
        }
      }
    } catch (err) {
      console.error("Load Theme Error:", err);
    }
  };

  const handleUndo = () => editorRef.current?.trigger('keyboard', 'undo', {});
  const handleRedo = () => editorRef.current?.trigger('keyboard', 'redo', {});

  const [state, setState] = useState<SimulatorState>({
    registers: new Array(32).fill(0),
    pc: 0,
    current_line: null,
    memory_sample: new Array(256).fill(0),
    message: ''
  });

  // File Operations
  const handleNewFile = useCallback(async () => {
    const id = generateId();
    const newFile: OpenFile = {
      id,
      path: null,
      name: `Untitled-${openFiles.length + 1}.mips`,
      code: '',
      isModified: false,
    };
    setOpenFiles(prev => [...prev, newFile]);
    setActiveFileId(id);
    setState(prev => ({ ...prev, current_line: null }));
  }, [openFiles.length]);

  // Initialize with an untitled file if empty
  useEffect(() => {
    if (openFiles.length === 0) {
      handleNewFile();
    }
  }, [openFiles.length, handleNewFile]);

  const activeFile = openFiles.find(f => f.id === activeFileId);
  const isModified = activeFile?.isModified || false;

  const handleOpenFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'MIPS Assembly', extensions: ['mips', 's', 'asm'] }]
      });
      if (selected && typeof selected === 'string') {
        // Check if file is already open
        const alreadyOpen = openFiles.find(f => f.path === selected);
        if (alreadyOpen) {
          setActiveFileId(alreadyOpen.id);
          return;
        }

        const content = await readTextFile(selected);
        const name = selected.split(/[\\/]/).pop() || 'unknown.mips';
        const id = generateId();
        const newFile: OpenFile = {
          id,
          path: selected,
          name,
          code: content,
          isModified: false,
        };
        setOpenFiles(prev => [...prev, newFile]);
        setActiveFileId(id);
        setState(prev => ({ ...prev, current_line: null }));
      }
    } catch (err) {
      console.error("Open Error:", err);
    }
  };

  const handleSaveFile = useCallback(async () => {
    if (!activeFile) return;

    try {
      let path = activeFile.path;
      if (!path) {
        path = await save({
          filters: [{ name: 'MIPS Assembly', extensions: ['mips', 's', 'asm'] }]
        });
        if (!path) return;
      }

      const content = activeFile.code;
      await writeTextFile(path, content);
      const name = path.split(/[\\/]/).pop() || activeFile.name;

      setOpenFiles(prev => prev.map(f =>
        f.id === activeFileId ? { ...f, path, name, isModified: false } : f
      ));
    } catch (err) {
      console.error("Save Error:", err);
    }
  }, [activeFile, activeFileId]);

  const handleSaveFileAs = useCallback(async () => {
    if (!activeFile) return;

    try {
      const path = await save({
        filters: [{ name: 'MIPS Assembly', extensions: ['mips', 's', 'asm'] }]
      });

      if (path) {
        const content = activeFile.code;
        await writeTextFile(path, content);
        const name = path.split(/[\\/]/).pop() || activeFile.name;

        setOpenFiles(prev => prev.map(f =>
          f.id === activeFileId ? { ...f, path, name, isModified: false } : f
        ));
      }
    } catch (err) {
      console.error("Save As Error:", err);
    }
  }, [activeFile, activeFileId]);

  const closeFile = useCallback((idToRemove: string) => {
    const fileIndex = openFiles.findIndex(f => f.id === idToRemove);
    const newFiles = openFiles.filter(f => f.id !== idToRemove);
    
    if (newFiles.length === 0) {
      const id = generateId();
      setOpenFiles([{ id, path: null, name: 'Untitled-1.mips', code: '', isModified: false }]);
      setActiveFileId(id);
    } else {
      setOpenFiles(newFiles);
      if (activeFileId === idToRemove) {
        const nextIndex = Math.min(fileIndex, newFiles.length - 1);
        setActiveFileId(newFiles[nextIndex].id);
      }
    }
  }, [openFiles, activeFileId]);

  const handleExit = async () => {
    const win = getCurrentWindow();
    await win.close();
  };

  const handleCodeChange = useCallback((newCode: string) => {
    setOpenFiles(prev => prev.map(f =>
      f.id === activeFileId ? { ...f, code: newCode, isModified: true } : f
    ));
  }, [activeFileId]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S to save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSaveFile();
      }
      // Ctrl+N to create new file
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        handleNewFile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSaveFile, handleNewFile]);

  // Simulator Operations
  const handleRun = async () => {
    if (!isTauri()) return;
    try {
      const code = activeFile?.code || '';
      const result = await invoke<SimulatorState>('run_mips_code', { code });
      setState(result);
      if (isConsoleCollapsed) setIsConsoleCollapsed(false);
    } catch (err) {
      setState(prev => ({ ...prev, message: `Fatal Error: ${err}` }));
    }
  };

  const handleStep = async () => {
    if (!isTauri()) return;
    try {
      const code = activeFile?.code || '';
      const result = await invoke<SimulatorState>('step_mips_code', { code });
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

  const activeFileName = activeFile?.name || 'untitled.mips';

  // Update window title
  useEffect(() => {
    if (!isTauri()) return;
    const win = getCurrentWindow();
    win.setTitle(`Quasar - ${activeFileName}${isModified ? '*' : ''}`);
  }, [activeFileName, isModified]);

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${isResizing ? 'cursor-row-resize select-none' : ''}`}>
      
      {/* 1. Menu Bar */}
      <nav className="h-7 bg-[var(--toolbar-background)] border-b border-[var(--border)] flex items-center px-3 gap-1 transition-colors duration-200 shrink-0">
        <MenuButton label="File" items={[
          { label: 'New File', onClick: handleNewFile },
          { label: 'Open File...', onClick: handleOpenFile },
          { label: 'Save', onClick: handleSaveFile },
          { label: 'Save As...', onClick: handleSaveFileAs },
          { separator: true },
          { label: 'Exit', onClick: handleExit },
        ]} />
        <MenuButton label="Edit" items={[{ label: 'Undo' }, { label: 'Redo' }]} />
        <MenuButton label="Run" items={[
          { label: 'Run Simulation', onClick: handleRun },
          { label: 'Step Forward', onClick: handleStep },
          { label: 'Reset Engine', onClick: handleReset },
        ]} />
        <MenuButton label="Settings" items={[
          { label: 'Preferences...', onClick: () => setIsSettingsOpen(true) },
          { separator: true },
          { label: 'Load Theme...', onClick: handleLoadTheme },
          { label: 'Theme: Quasar Dark', onClick: () => setSettings(s => ({ ...s, theme: QUASAR_DARK })) },
          { label: 'Theme: Quasar Light', onClick: () => setSettings(s => ({ ...s, theme: QUASAR_LIGHT })) },
        ]} />
        <MenuButton label="Help" items={[
          { label: 'Documentation', onClick: () => setIsHelpOpen(true) },
          { label: 'About Quasar' }
        ]} />
      </nav>

      {/* 2. Top Toolbar */}
      <div className="h-12 bg-[var(--app-background)] border-b border-[var(--border)] flex items-center justify-between px-4 shrink-0 transition-colors duration-200 shadow-sm z-20">
        <div className="flex items-center gap-1">
          <ToolbarButton icon={<FileText size={16} />} label="New" onClick={handleNewFile} />
          <ToolbarButton icon={<FolderOpen size={16} />} label="Open" onClick={handleOpenFile} />
          <ToolbarButton icon={<Save size={16} />} label="Save" onClick={handleSaveFile} />
          <div className="w-px h-6 bg-[var(--border)] mx-2" />
          <ToolbarButton icon={<Undo size={16} />} label="Undo" onClick={handleUndo} />
          <ToolbarButton icon={<Redo size={16} />} label="Redo" onClick={handleRedo} />
          <div className="w-px h-6 bg-[var(--border)] mx-2" />
          <ToolbarButton icon={<Play size={16} className="text-green-600 fill-green-600/20" />} label="Run" onClick={handleRun} primary />
          <ToolbarButton icon={<StepForward size={16} className="text-blue-500" />} label="Step" onClick={handleStep} />
          <ToolbarButton icon={<RotateCcw size={16} className="text-orange-500" />} label="Reset" onClick={handleReset} />
        </div>

        <div className="flex items-center gap-4 mr-2">
            <ToolbarButton icon={<HelpCircle size={16} />} label="Help" onClick={() => setIsHelpOpen(true)} />
            <div className="flex items-center gap-2 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                <Cpu size={14} />
                MIPS32 R2000
            </div>
            <Info size={16} className="text-[var(--app-foreground)] opacity-50 cursor-help" />
        </div>
      </div>

      {/* 3. Main Workspace */}
      <main className="flex-1 flex overflow-hidden bg-[var(--app-background)] text-[var(--app-foreground)]">
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-hidden relative border-r border-[var(--border)] flex flex-col">
             {/* Tab Bar */}
             <div className="h-9 bg-[var(--sidebar-background)] flex items-center border-b border-[var(--border)] overflow-x-auto no-scrollbar">
                {openFiles.map(file => (
                  <div 
                    key={file.id}
                    onClick={() => setActiveFileId(file.id)}
                    className={`
                      flex items-center gap-3 text-[11px] font-medium h-full px-4 border-r border-[var(--border)] transition-colors cursor-pointer min-w-[120px] max-w-[200px]
                      ${activeFileId === file.id 
                        ? 'bg-[var(--tab-active)] text-[var(--app-foreground)]' 
                        : 'bg-[var(--tab-inactive)] text-[var(--app-foreground)] opacity-50 hover:opacity-100'}
                    `}
                  >
                      <Code size={14} className={file.isModified ? 'text-blue-500' : 'opacity-50'} />
                      <span className="truncate flex-1">{file.name}{file.isModified ? '*' : ''}</span>
                      <button 
                        className="ml-1 p-0.5 hover:bg-[var(--app-background)] opacity-50 hover:opacity-100 rounded-sm transition-colors group"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeFile(file.id);
                        }}
                      >
                        {file.isModified ? (
                          <Circle size={8} fill="currentColor" className="text-blue-500" />
                        ) : (
                          <X size={12} className="group-hover:text-red-500" />
                        )}
                      </button>
                  </div>
                ))}
                <button 
                  onClick={handleNewFile}
                  className="px-3 h-full flex items-center justify-center text-[var(--app-foreground)] opacity-50 hover:opacity-100 hover:bg-[var(--tab-active)] transition-colors"
                >
                  <X size={14} className="rotate-45" />
                </button>
             </div>
             <div className="flex-1 overflow-hidden">
                <CodeEditor 
                    key={activeFileId}
                    onMount={(editor) => { editorRef.current = editor; }}
                    onCodeChange={handleCodeChange} 
                    initialCode={activeFile?.code || ''} 
                    theme={settings.theme} 
                    fontSize={settings.fontSize}
                    tabSize={settings.tabSize}
                    highlightedLine={state.current_line}
                />
             </div>
          </div>

          <div onMouseDown={startResizing} className="h-1 bg-[var(--border)] hover:bg-blue-500 cursor-row-resize flex items-center justify-center transition-colors group z-10">
          </div>

          <Console output={state.message} isCollapsed={isConsoleCollapsed} onToggle={() => setIsConsoleCollapsed(!isConsoleCollapsed)} height={consoleHeight} />
        </div>

        <aside className="w-80 flex flex-col shrink-0 overflow-hidden bg-[var(--sidebar-background)] p-4 gap-4 border-l border-[var(--border)]">
          <div className="flex-1 overflow-hidden">
            <RegisterView registers={state.registers} />
          </div>
          <div className="h-72 overflow-hidden">
            <MemoryView memory={state.memory_sample} />
          </div>
        </aside>
      </main>

      <footer className="h-6 bg-blue-600 flex items-center px-4 justify-between shrink-0 text-[10px] font-bold text-white uppercase tracking-wider z-20">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5"><Monitor size={12} />{isTauri() ? "Hardware Connected" : "Local Emulation Mode"}</span>
          <span className="flex items-center gap-1"><ChevronRight size={12} />PC: 0x{state.pc.toString(16).padStart(8, '0').toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-4 opacity-90">
          <span>{isModified ? "UNSAVED CHANGES" : "SAVED"}</span>
          <span>MIPS Assembly</span>
        </div>
      </footer>

      {/* Settings Dialog */}
      {isSettingsOpen && (
        <SettingsDialog 
          settings={settings}
          onUpdate={setSettings}
          onClose={() => setIsSettingsOpen(false)}
          onLoadTheme={handleLoadTheme}
        />
      )}

      {/* Help Dialog */}
      {isHelpOpen && (
        <HelpDialog onClose={() => setIsHelpOpen(false)} />
      )}
    </div>
  );
}

// Simple Dropdown Menu Component
function MenuButton({ label, items }: { label: string, items: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <button className="text-[11px] px-3 py-1 hover:bg-[var(--tab-active)] rounded text-[var(--app-foreground)] opacity-80 hover:opacity-100 transition-colors cursor-pointer h-full">
        {label}
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full w-48 bg-[var(--tab-inactive)] border border-[var(--border)] shadow-lg rounded-sm py-1 z-50 animate-in fade-in slide-in-from-top-1">
          {items.map((item, i) => item.separator ? (
            <div key={i} className="h-px bg-[var(--border)] my-1 mx-2" />
          ) : (
            <button
              key={i}
              onClick={() => {
                item.onClick?.();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-1.5 text-[11px] text-[var(--app-foreground)] opacity-80 hover:opacity-100 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
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
    <button onClick={onClick} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all active:scale-95 cursor-pointer ${primary ? 'hover:bg-[var(--tab-active)] font-bold text-[var(--app-foreground)]' : 'hover:bg-[var(--tab-active)] text-[var(--app-foreground)] opacity-60 hover:opacity-100'}`} title={label}>
      {icon}
      <span className="text-[11px] font-medium hidden md:inline">{label}</span>
    </button>
  );
}

export default App;
