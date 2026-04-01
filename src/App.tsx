import { useEffect, useState, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { open, save, ask } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { 
  Play, 
  RotateCcw, 
  FileText, 
  FolderOpen, 
  Save, 
  StepForward, 
  Code,
  X,
  Circle,
  Undo,
  Redo,
  HelpCircle,
  Minus,
  Square,
  Copy,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import CodeEditor from './components/CodeEditor';
import RegisterView from './components/RegisterView';
import MemoryView from './components/MemoryView';
import Console from './components/Console';
import SettingsDialog from './components/SettingsDialog';
import HelpDialog from './components/HelpDialog';
import AboutDialog from './components/AboutDialog';
import { QUASAR_DARK } from './theme/defaults';
import { applyTheme } from './theme/themeApplier';
import { ConfigService, Settings, DEFAULT_SETTINGS } from './services/configService';

interface SimulatorState {
  registers: number[];
  hi: number;
  lo: number;
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
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const editorRef = useRef<any>(null);
  const untitledCounter = useRef(1);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const [showTabArrows, setShowTabArrows] = useState(false);

  const checkTabOverflow = useCallback(() => {
    if (tabBarRef.current) {
      const { scrollWidth, clientWidth } = tabBarRef.current;
      setShowTabArrows(scrollWidth > clientWidth);
    }
  }, []);

  useEffect(() => {
    checkTabOverflow();
    window.addEventListener('resize', checkTabOverflow);
    return () => window.removeEventListener('resize', checkTabOverflow);
  }, [openFiles, checkTabOverflow]);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabBarRef.current) {
      const scrollAmount = 200;
      tabBarRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Disable context menu
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS(QUASAR_DARK));

  // Window Controls
  const handleMinimize = async () => {
    if (!isTauri()) return;
    await getCurrentWindow().minimize();
  };

  const handleMaximize = async () => {
    if (!isTauri()) return;
    const win = getCurrentWindow();
    await win.toggleMaximize();
    setIsMaximized(await win.isMaximized());
  };

  const handleClose = async () => {
    if (!isTauri()) return;
    await getCurrentWindow().close();
  };

  // Listen for window resize to update maximized state
  useEffect(() => {
    if (!isTauri()) return;
    const win = getCurrentWindow();
    const unlisten = win.onResized(async () => {
      setIsMaximized(await win.isMaximized());
    });
    return () => {
      unlisten.then(u => u());
    };
  }, []);

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
    hi: 0,
    lo: 0,
    pc: 0,
    current_line: null,
    memory_sample: new Array(128).fill(0),
    message: ''
  });

  const [changedIndices, setChangedIndices] = useState<number[]>([]);
  const [hiLoChanged, setHiLoChanged] = useState({ hi: false, lo: false });
  const [consoleOutput, setConsoleOutput] = useState('');

  const updateSimulatorState = useCallback((newState: SimulatorState) => {
    const changed: number[] = [];
    newState.registers.forEach((val, idx) => {
      if (val !== state.registers[idx]) {
        changed.push(idx);
      }
    });
    setChangedIndices(changed);
    
    setHiLoChanged({
      hi: newState.hi !== state.hi,
      lo: newState.lo !== state.lo
    });
    
    if (newState.message) {
      setConsoleOutput(prev => prev + (prev ? '\n' : '') + newState.message);
    }
    
    setState(newState);
  }, [state.registers, state.hi, state.lo]);

  // File Operations
  const handleNewFile = useCallback(async () => {
    // Reset counter if starting from zero open files
    if (openFiles.length === 0) {
      untitledCounter.current = 1;
    }

    const id = generateId();
    const newFile: OpenFile = {
      id,
      path: null,
      name: `Untitled-${untitledCounter.current}.mips`,
      code: '',
      isModified: false,
    };
    untitledCounter.current += 1;
    setOpenFiles(prev => [...prev, newFile]);
    setActiveFileId(id);
    setState(prev => ({ ...prev, current_line: null }));
  }, [openFiles.length]);

  const hasInitialized = useRef(false);
  // Initialize with an untitled file only on first load
  useEffect(() => {
    if (!hasInitialized.current) {
      handleNewFile();
      hasInitialized.current = true;
    }
  }, [handleNewFile]);

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
    if (!activeFile) return false;

    try {
      let path = activeFile.path;
      if (!path) {
        path = await save({
          filters: [{ name: 'MIPS Assembly', extensions: ['mips', 's', 'asm'] }]
        });
        if (!path) return false;
      }

      const content = activeFile.code;
      await writeTextFile(path, content);
      const name = path.split(/[\\/]/).pop() || activeFile.name;

      setOpenFiles(prev => prev.map(f =>
        f.id === activeFileId ? { ...f, path, name, isModified: false } : f
      ));
      return true;
    } catch (err) {
      console.error("Save Error:", err);
      return false;
    }
  }, [activeFile, activeFileId]);

  const handleSaveFileAs = useCallback(async () => {
    if (!activeFile) return false;

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
        return true;
      }
      return false;
    } catch (err) {
      console.error("Save As Error:", err);
      return false;
    }
  }, [activeFile, activeFileId]);

  const closeFile = useCallback((idToRemove: string) => {
    const fileIndex = openFiles.findIndex(f => f.id === idToRemove);
    const newFiles = openFiles.filter(f => f.id !== idToRemove);
    
    setOpenFiles(newFiles);
    
    if (newFiles.length === 0) {
      setActiveFileId(null);
    } else if (activeFileId === idToRemove) {
      const nextIndex = Math.min(fileIndex, newFiles.length - 1);
      setActiveFileId(newFiles[nextIndex].id);
    }
  }, [openFiles, activeFileId]);

  const handleCodeChange = useCallback((newCode: string) => {
    setOpenFiles(prev => prev.map(f =>
      f.id === activeFileId ? { ...f, code: newCode, isModified: true } : f
    ));
  }, [activeFileId]);

  const ensureSaved = useCallback(async () => {
    if (!activeFile) return false;
    
    // Case 1: File already exists on disk
    if (activeFile.path) {
      if (activeFile.isModified) {
        if (settings.autoSaveBeforeRun) {
          return await handleSaveFile();
        } else {
          const shouldSave = await ask(
            'The current file has unsaved changes. Save now and run?',
            { title: 'Save Required', kind: 'warning', okLabel: 'Save & Run', cancelLabel: 'Cancel' }
          );
          if (shouldSave) return await handleSaveFile();
          return false;
        }
      }
      return true;
    } 
    
    // Case 2: Untitled file (no path)
    const shouldSave = await ask(
      'The current file is not saved. You must save it to disk before running. Save now?',
      { title: 'Save Required', kind: 'warning', okLabel: 'Save', cancelLabel: 'Cancel' }
    );
    if (shouldSave) {
      return await handleSaveFile();
    }
    return false;
  }, [activeFile, handleSaveFile, settings.autoSaveBeforeRun]);

  // Simulator Operations
  const handleRun = useCallback(async () => {
    if (!isTauri()) return;
    if (!(await ensureSaved())) return;

    try {
      const code = activeFile?.code || '';
      const result = await invoke<SimulatorState>('run_mips_code', { code });
      updateSimulatorState(result);
      if (isConsoleCollapsed) setIsConsoleCollapsed(false);
    } catch (err) {
      setState(prev => ({ ...prev, message: `Fatal Error: ${err}` }));
    }
  }, [activeFile, isConsoleCollapsed, ensureSaved, updateSimulatorState]);

  const handleStep = useCallback(async () => {
    if (!isTauri()) return;
    if (!(await ensureSaved())) return;

    try {
      const code = activeFile?.code || '';
      const result = await invoke<SimulatorState>('step_mips_code', { code });
      updateSimulatorState(result);
      if (isConsoleCollapsed) setIsConsoleCollapsed(false);
    } catch (err) {
      setState(prev => ({ ...prev, message: `Fatal Error: ${err}` }));
    }
  }, [activeFile, isConsoleCollapsed, ensureSaved, updateSimulatorState]);

  const handleReset = useCallback(async () => {
    if (!isTauri()) return;
    try {
      const result = await invoke<SimulatorState>('reset_simulator');
      setChangedIndices([]);
      setHiLoChanged({ hi: false, lo: false });
      setConsoleOutput('');
      setState(result);
    } catch (err) {
      console.error(err);
    }
  }, []);

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
      // Ctrl+O to open file
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        handleOpenFile();
      }
      // F5 to run
      if (e.key === 'F5') {
        e.preventDefault();
        handleRun();
      }
      // F10 to step
      if (e.key === 'F10') {
        e.preventDefault();
        handleStep();
      }
      // F1 to help
      if (e.key === 'F1') {
        e.preventDefault();
        setIsHelpOpen(true);
      }
      // Ctrl+R to reset
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSaveFile, handleNewFile, handleOpenFile, handleRun, handleStep, handleReset]);

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
    const updateTitle = async () => {
      try {
        const win = getCurrentWindow();
        await win.setTitle(`Quasar - ${activeFileName}${isModified ? '*' : ''}`);
      } catch (e) {
        console.warn("Failed to set window title:", e);
      }
    };
    updateTitle();
  }, [activeFileName, isModified]);

  return (
    <div className={`flex flex-col h-screen overflow-hidden transition-all duration-300 ${!isMaximized ? 'rounded-xl border border-[var(--border)] shadow-2xl' : ''} ${isResizing ? 'cursor-row-resize select-none' : ''} bg-[var(--app-background)]`}>
      
      {/* 1. Custom Title Bar / Menu Bar */}
      <nav data-tauri-drag-region className="h-10 bg-[var(--toolbar-background)] border-b border-[var(--border)] flex items-center justify-between px-4 transition-colors duration-200 shrink-0 select-none shadow-sm relative z-50 cursor-default">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2.5 mr-6 group cursor-pointer relative top-[2px]" onClick={() => setIsHelpOpen(true)}>
            <div className="w-8 h-8 flex items-center justify-center group-hover:rotate-12 transition-transform duration-500 overflow-hidden">
              <img src="/quasar-logo.svg" alt="Quasar Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-black tracking-tight opacity-90 uppercase" style={{ color: '#ff892f' }}>Quasar</span>
          </div>

          <MenuButton label="File" items={[
            { label: 'New File', onClick: handleNewFile, shortcut: 'Ctrl+N' },
            { label: 'Open File...', onClick: handleOpenFile, shortcut: 'Ctrl+O' },
            { label: 'Save', onClick: handleSaveFile, shortcut: 'Ctrl+S' },
            { label: 'Save As...', onClick: handleSaveFileAs, shortcut: 'Ctrl+Shift+S' },
            { separator: true },
            { label: 'Exit', onClick: handleClose, shortcut: 'Alt+F4' },
          ]} />
          <MenuButton label="Edit" items={[
            { label: 'Undo', onClick: handleUndo, shortcut: 'Ctrl+Z' }, 
            { label: 'Redo', onClick: handleRedo, shortcut: 'Ctrl+Y' }
          ]} />
          <MenuButton label="Run" items={[
            { label: 'Run Simulation', onClick: handleRun, shortcut: 'F5' },
            { label: 'Step Forward', onClick: handleStep, shortcut: 'F10' },
            { label: 'Reset Engine', onClick: handleReset, shortcut: 'Ctrl+R' },
          ]} />
        <MenuButton label="Settings" items={[
          { label: 'Preferences...', onClick: () => setIsSettingsOpen(true), shortcut: 'Ctrl+,' },
          { separator: true },
          { label: 'Load Theme...', onClick: handleLoadTheme },
        ]} />
          <MenuButton label="Help" items={[
            { label: 'Documentation', onClick: () => setIsHelpOpen(true), shortcut: 'F1' },
            { label: 'About Quasar', onClick: () => setIsAboutOpen(true) }
          ]} />
        </div>

        {/* Window Title (Visible on frameless windows) */}
        <div className="absolute left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--app-foreground)] opacity-50 pointer-events-none whitespace-nowrap hidden lg:block">
          {activeFileName}{isModified ? '*' : ''}
        </div>

        <div className="flex items-center gap-1 h-full py-1.5">
          <WindowControlButton icon={<Minus size={14} />} onClick={handleMinimize} />
          <WindowControlButton icon={isMaximized ? <Copy size={12} /> : <Square size={12} />} onClick={handleMaximize} />
          <WindowControlButton icon={<X size={14} />} onClick={handleClose} isClose />
        </div>
      </nav>

      {/* 2. Top Toolbar */}
      <div className="h-14 bg-[var(--app-background)] border-b border-[var(--border)] flex items-center justify-between px-6 shrink-0 transition-colors duration-200 z-40">
        <div className="flex items-center gap-2">
          <ToolbarButton icon={<FileText size={18} />} label="New" onClick={handleNewFile} />
          <ToolbarButton icon={<FolderOpen size={18} />} label="Open" onClick={handleOpenFile} />
          <ToolbarButton icon={<Save size={18} />} label="Save" onClick={handleSaveFile} />
          <div className="w-px h-6 bg-[var(--border)] mx-3" />
          <ToolbarButton icon={<Undo size={18} />} label="Undo" onClick={handleUndo} />
          <ToolbarButton icon={<Redo size={18} />} label="Redo" onClick={handleRedo} />
          <div className="w-px h-6 bg-[var(--border)] mx-3" />
          <ToolbarButton icon={<Play size={18} className="text-green-500 fill-green-500/10" />} label="Run" onClick={handleRun} />
          <ToolbarButton icon={<StepForward size={18} className="text-[var(--accent)]" />} label="Step" onClick={handleStep} />
          <ToolbarButton icon={<RotateCcw size={18} className="text-[var(--accent)]" />} label="Reset" onClick={handleReset} />
        </div>

        <div className="flex items-center gap-4">
            <ToolbarButton icon={<HelpCircle size={18} />} label="Help" onClick={() => setIsHelpOpen(true)} />
            <div className="flex items-center gap-2 text-[10px] font-black text-[var(--accent)] dark:text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-3 py-1.5 rounded-full uppercase tracking-widest">
                MIPS32 R2000
            </div>
        </div>
      </div>

      {/* 3. Main Workspace */}
      <main className="flex-1 flex overflow-hidden bg-[var(--app-background)] text-[var(--app-foreground)]">
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-hidden relative border-r border-[var(--border)] flex flex-col">
             {/* Tab Bar */}
             <div className="h-9 bg-[var(--sidebar-background)] flex items-center border-b border-[var(--border)] group/tabbar">
                {showTabArrows && (
                  <button 
                    onClick={() => scrollTabs('left')}
                    className="h-full px-1.5 flex items-center justify-center text-[var(--app-foreground)] opacity-40 hover:opacity-100 hover:bg-[var(--tab-active)] transition-all border-r border-[var(--border)] z-10 bg-[var(--sidebar-background)]"
                  >
                    <ChevronLeft size={14} />
                  </button>
                )}
                
                <div 
                  ref={tabBarRef}
                  className="flex-1 flex items-center overflow-x-auto no-scrollbar h-full scroll-smooth"
                >
                  {openFiles.map(file => (
                    <div 
                      key={file.id}
                      onClick={() => setActiveFileId(file.id)}
                      className={`
                        flex items-center gap-3 text-[11px] font-medium h-full px-4 border-r border-[var(--border)] transition-colors cursor-pointer min-w-[140px] max-w-[200px] shrink-0
                        ${activeFileId === file.id 
                          ? 'bg-[var(--tab-active)] text-[var(--app-foreground)]' 
                          : 'bg-[var(--tab-inactive)] text-[var(--app-foreground)] opacity-50 hover:opacity-100'}
                      `}
                    >
                        <Code size={14} className={file.isModified ? 'text-[var(--accent)]' : 'opacity-50'} />
                        <span className="truncate flex-1">{file.name}{file.isModified ? '*' : ''}</span>
                        <button 
                          className="ml-1 p-0.5 hover:bg-[var(--app-background)] opacity-50 hover:opacity-100 rounded-sm transition-colors group"
                          onClick={(e) => {
                            e.stopPropagation();
                            closeFile(file.id);
                          }}
                        >
                          {file.isModified ? (
                            <Circle size={8} fill="currentColor" className="text-[var(--accent)]" />
                          ) : (
                            <X size={12} className="group-hover:text-red-500" />
                          )}
                        </button>
                    </div>
                  ))}
                </div>

                {showTabArrows && (
                  <button 
                    onClick={() => scrollTabs('right')}
                    className="h-full px-1.5 flex items-center justify-center text-[var(--app-foreground)] opacity-40 hover:opacity-100 hover:bg-[var(--tab-active)] transition-all border-l border-[var(--border)] z-10 bg-[var(--sidebar-background)]"
                  >
                    <ChevronRight size={14} />
                  </button>
                )}

                <button 
                  onClick={handleNewFile}
                  title="New File (Ctrl+N)"
                  className="px-3 h-full flex items-center justify-center text-[var(--app-foreground)] opacity-50 hover:opacity-100 hover:bg-[var(--tab-active)] transition-colors border-l border-[var(--border)] shrink-0 bg-[var(--sidebar-background)]"
                >
                  <X size={14} className="rotate-45" />
                </button>
             </div>
             <div className="flex-1 overflow-hidden">
                {openFiles.length > 0 ? (
                  <CodeEditor 
                      activeFileId={activeFileId || ''}
                      onMount={(editor) => { editorRef.current = editor; }}
                      onCodeChange={handleCodeChange} 
                      initialCode={activeFile?.code || ''} 
                      theme={settings.theme} 
                      fontSize={settings.fontSize}
                      tabSize={settings.tabSize}
                      highlightedLine={state.current_line}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-[var(--app-background)]">
                    <div className="w-20 h-20 bg-[var(--accent)]/10 rounded-3xl flex items-center justify-center mb-6 border border-[var(--accent)]/20">
                      <img src="/quasar-logo.svg" alt="Quasar" className="w-12 h-12 opacity-40" />
                    </div>
                    <h2 className="text-xl font-bold text-[var(--app-foreground)] opacity-80 mb-2">Welcome to Quasar</h2>
                    <p className="text-sm text-[var(--app-foreground)] opacity-40 max-w-[280px] mb-8">
                      No active files open. Create a new file or open an existing one to get started.
                    </p>
                    <div className="flex gap-3">
                      <button 
                        onClick={handleNewFile}
                        className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent)] text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[var(--accent)]/20 active:scale-95"
                      >
                        New File
                      </button>
                      <button 
                        onClick={handleOpenFile}
                        className="px-6 py-2.5 bg-[var(--sidebar-background)] border border-[var(--border)] text-[var(--app-foreground)] text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-[var(--tab-active)] transition-all active:scale-95"
                      >
                        Open File
                      </button>
                    </div>
                  </div>
                )}
             </div>
          </div>

          <div onMouseDown={startResizing} className="h-1 bg-[var(--border)] hover:bg-[var(--accent)] cursor-row-resize flex items-center justify-center transition-colors group z-10">
          </div>

          <Console output={consoleOutput} isCollapsed={isConsoleCollapsed} onToggle={() => setIsConsoleCollapsed(!isConsoleCollapsed)} height={consoleHeight} />
        </div>

        <aside className="w-80 flex flex-col shrink-0 overflow-hidden bg-[var(--sidebar-background)] p-4 gap-4 border-l border-[var(--border)]">
          <div className="flex-1 overflow-hidden">
            <RegisterView registers={state.registers} changedIndices={changedIndices} hi={state.hi} lo={state.lo} hiLoChanged={hiLoChanged} />
          </div>
          <div className="h-72 overflow-hidden">
            <MemoryView memory={state.memory_sample} />
          </div>
        </aside>
      </main>

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

      {/* About Dialog */}
      {isAboutOpen && (
        <AboutDialog onClose={() => setIsAboutOpen(false)} />
      )}
    </div>
  );
}

// Simple Dropdown Menu Component
function MenuButton({ label, items }: { label: string, items: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative h-full" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <button className="text-[11px] px-3 h-full hover:bg-[var(--accent)]/10 rounded-md text-[var(--app-foreground)] opacity-70 hover:opacity-100 transition-all cursor-pointer font-medium">
        {label}
      </button>
      {isOpen && (
        <div className="absolute left-0 top-[90%] w-52 bg-[var(--tab-inactive)] border border-[var(--border)] shadow-2xl rounded-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-xl">
          {items.map((item, i) => item.separator ? (
            <div key={i} className="h-px bg-[var(--border)] my-1.5 mx-3" />
          ) : (
            <button
              key={i}
              onClick={() => {
                item.onClick?.();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-[11px] text-[var(--app-foreground)] opacity-70 hover:opacity-100 hover:bg-[var(--accent)] hover:text-white transition-all cursor-pointer flex items-center justify-between group"
            >
              <span>{item.label}</span>
              {item.shortcut && <span className="text-[9px] opacity-40 group-hover:opacity-100 font-mono tracking-tighter">{item.shortcut}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ToolbarButton({ icon, label, onClick, primary = false }: { icon: React.ReactNode; label: string; onClick?: () => void; primary?: boolean; }) {
  return (
    <button 
      onClick={onClick} 
      className={`
        flex flex-col items-center justify-center gap-1 w-14 h-11 rounded-xl transition-all active:scale-90 cursor-pointer group
        ${primary 
          ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20 hover:bg-[var(--accent)]' 
          : 'hover:bg-[var(--accent)]/5 text-[var(--app-foreground)] opacity-60 hover:opacity-100 border border-transparent hover:border-[var(--accent)]/10'}
      `} 
      title={label}
    >
      <div className={`${primary ? '' : 'group-hover:scale-110 transition-transform duration-200'}`}>
        {icon}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-tighter hidden md:inline opacity-60 group-hover:opacity-100">{label}</span>
    </button>
  );
}

function WindowControlButton({ icon, onClick, isClose = false }: { icon: React.ReactNode; onClick: () => void; isClose?: boolean; }) {
  return (
    <button 
      onClick={onClick} 
      className={`
        h-7 w-10 flex items-center justify-center rounded-lg transition-all duration-200
        ${isClose 
          ? 'hover:bg-red-500 hover:text-white text-red-500/70' 
          : 'hover:bg-[var(--accent)]/10 text-[var(--app-foreground)] opacity-40 hover:opacity-100'}
      `}
    >
      {icon}
    </button>
  );
}

export default App;
