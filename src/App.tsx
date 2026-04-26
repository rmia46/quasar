import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { 
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
  ChevronRight,
  Play,
  Book
} from 'lucide-react';
import { open, save, confirm } from '@tauri-apps/plugin-dialog';
import { readDir, writeTextFile, readTextFile, rename, remove } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import CodeEditor from './components/CodeEditor';
import RegisterView from './components/RegisterView';
import MemoryView from './components/MemoryView';
import Console from './components/Console';
import SettingsDialog from './components/SettingsDialog';
import HelpDialog from './components/HelpDialog';
import AboutDialog from './components/AboutDialog';
import FileExplorer from './components/FileExplorer';
import { QUASAR_DARK } from './theme/defaults';
import { applyTheme } from './theme/themeApplier';
import { ConfigService, Settings, DEFAULT_SETTINGS } from './services/configService';

interface SimulatorState {
  registers: number[];
  fp_registers: number[];
  hi: number;
  lo: number;
  pc: number;
  current_line: number | null;
  memory_sample: number[];
  message: string;
}

interface OpenFile {
  id: string;
  name: string;
  path: string | null;
  code: string;
  isModified: boolean;
}

function App() {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [consoleHeight, setConsoleHeight] = useState(180);
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(250);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(300);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'core' | 'cp1' | 'memory'>('core');
  
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [projectFiles, setProjectFiles] = useState<{name: string, path: string}[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS(QUASAR_DARK));

  const startResizingLeft = (mouseDownEvent: React.MouseEvent) => {
    const startX = mouseDownEvent.clientX;
    const startWidth = leftSidebarWidth;
    const onMouseMove = (mouseMoveEvent: MouseEvent) => {
      const newWidth = startWidth + (mouseMoveEvent.clientX - startX);
      if (newWidth > 150 && newWidth < 500) setLeftSidebarWidth(newWidth);
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const startResizingRight = (mouseDownEvent: React.MouseEvent) => {
    const startX = mouseDownEvent.clientX;
    const startWidth = rightSidebarWidth;
    const onMouseMove = (mouseMoveEvent: MouseEvent) => {
      const newWidth = startWidth - (mouseMoveEvent.clientX - startX);
      if (newWidth > 200 && newWidth < 600) setRightSidebarWidth(newWidth);
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const startResizingConsole = (mouseDownEvent: React.MouseEvent) => {
    const startY = mouseDownEvent.clientY;
    const startHeight = consoleHeight;
    const onMouseMove = (mouseMoveEvent: MouseEvent) => {
      const newHeight = startHeight - (mouseMoveEvent.clientY - startY);
      if (newHeight > 100 && newHeight < 600) setConsoleHeight(newHeight);
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

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
      tabBarRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const activeFile = useMemo(() => openFiles.find(f => f.id === activeFileId), [openFiles, activeFileId]);

  const [state, setState] = useState<SimulatorState>({
    registers: new Array(32).fill(0), fp_registers: new Array(32).fill(0),
    hi: 0, lo: 0, pc: 0, current_line: null, memory_sample: new Array(128).fill(0), message: ''
  });

  const [changedIndices, setChangedIndices] = useState<number[]>([]);
  const [changedFPIndices, setChangedFPIndices] = useState<number[]>([]);
  const [hiLoChanged, setHiLoChanged] = useState({ hi: false, lo: false });
  const [consoleOutput, setConsoleOutput] = useState('');

  const updateSimulatorState = useCallback((newState: SimulatorState) => {
    const changed: number[] = [];
    newState.registers.forEach((val, idx) => { if (val !== state.registers[idx]) changed.push(idx); });
    setChangedIndices(changed);
    const fpChanged: number[] = [];
    newState.fp_registers.forEach((val, idx) => { if (val !== state.fp_registers[idx]) fpChanged.push(idx); });
    setChangedFPIndices(fpChanged);
    setHiLoChanged({ hi: newState.hi !== state.hi, lo: newState.lo !== state.lo });
    if (newState.message) setConsoleOutput(prev => prev + (prev ? '\n' : '') + newState.message);
    setState(newState);
  }, [state.registers, state.fp_registers, state.hi, state.lo]);

  // Workspace Operations
  const refreshProjectFiles = useCallback(async (path: string) => {
    try {
      const entries = await readDir(path);
      const files = entries
        .filter(e => !e.isDirectory && (e.name.endsWith('.asm') || e.name.endsWith('.s') || e.name.endsWith('.mips')))
        .map(e => ({ name: e.name, path: `${path}/${e.name}` }));
      setProjectFiles(files);
    } catch (err) { console.error(err); }
  }, []);

  const handleOpenFolder = useCallback(async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === 'string') {
        setProjectPath(selected);
        await refreshProjectFiles(selected);
      }
    } catch (err) { console.error(err); }
  }, [refreshProjectFiles]);

  const handleProjectFileSelect = useCallback(async (path: string) => {
    try {
      const existing = openFiles.find(f => f.path === path);
      if (existing) { setActiveFileId(existing.id); return; }
      const content = await readTextFile(path);
      const name = path.split(/[\\/]/).pop() || 'file';
      const id = crypto.randomUUID();
      setOpenFiles(prev => [...prev, { id, name, path, code: content, isModified: false }]);
      setActiveFileId(id);
    } catch (err) { console.error(err); }
  }, [openFiles]);

  const handleNewFileSubmit = useCallback(async (name: string) => {
    if (!projectPath) return;
    const fullPath = await join(projectPath, name);
    try {
      await writeTextFile(fullPath, "# New MIPS File\n");
      await refreshProjectFiles(projectPath);
      await handleProjectFileSelect(fullPath);
    } catch (err) { console.error(err); }
  }, [projectPath, refreshProjectFiles, handleProjectFileSelect]);

  const closeFile = useCallback((id: string) => {
    setOpenFiles(prev => {
      const newFiles = prev.filter(f => f.id !== id);
      if (activeFileId === id) setActiveFileId(newFiles.length > 0 ? newFiles[newFiles.length - 1].id : null);
      return newFiles;
    });
  }, [activeFileId]);

  const handleRenameFile = useCallback(async (oldPath: string, newName: string) => {
    if (!projectPath) return;
    const dir = oldPath.substring(0, oldPath.lastIndexOf('/'));
    const newPath = await join(dir, newName);
    try {
      await rename(oldPath, newPath);
      setOpenFiles(prev => prev.map(f => f.path === oldPath ? { ...f, path: newPath, name: newName } : f));
      await refreshProjectFiles(projectPath);
    } catch (err) { console.error(err); }
  }, [projectPath, refreshProjectFiles]);

  const handleDeleteFile = useCallback(async (path: string) => {
    if (!projectPath) return;
    const name = path.split(/[\\/]/).pop() || 'file';
    const confirmed = await confirm(`Are you sure you want to delete ${name}?`, { title: 'Delete File', kind: 'warning' });
    if (!confirmed) return;

    try {
      await remove(path);
      const fileToClose = openFiles.find(f => f.path === path);
      if (fileToClose) closeFile(fileToClose.id);
      await refreshProjectFiles(projectPath);
    } catch (err) { console.error(err); }
  }, [projectPath, openFiles, refreshProjectFiles, closeFile]);

  const handleNewFile = useCallback(() => {
    if (openFiles.length === 0) untitledCounter.current = 1;
    const id = crypto.randomUUID();
    setOpenFiles(prev => [...prev, { id, name: `Untitled-${untitledCounter.current++}`, path: null, code: '', isModified: false }]);
    setActiveFileId(id);
  }, [openFiles.length]);

  const handleOpenFile = useCallback(async () => {
    try {
      const selected = await open({ multiple: false, filters: [{ name: 'MIPS Assembly', extensions: ['asm', 's', 'mips'] }] });
      if (selected && typeof selected === 'string') {
        const content = await readTextFile(selected);
        const name = selected.split(/[\\/]/).pop() || 'file';
        const id = crypto.randomUUID();
        setOpenFiles(prev => [...prev, { id, name, path: selected, code: content, isModified: false }]);
        setActiveFileId(id);
      }
    } catch (err) { console.error(err); }
  }, []);

  const handleSaveFile = useCallback(async () => {
    if (!activeFile) return;
    try {
      let path = activeFile.path;
      if (!path) {
        const selected = await save({ filters: [{ name: 'MIPS Assembly', extensions: ['asm', 's', 'mips'] }] });
        if (!selected) return;
        path = selected;
      }
      await writeTextFile(path, activeFile.code);
      const newName = path.split(/[\\/]/).pop() || activeFile.name;
      setOpenFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, path, name: newName, isModified: false } : f));
      if (projectPath && path.startsWith(projectPath)) await refreshProjectFiles(projectPath);
    } catch (err) { console.error(err); }
  }, [activeFile, projectPath, refreshProjectFiles]);

  const handleCodeChange = useCallback((newCode: string) => {
    setOpenFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, code: newCode, isModified: true } : f));
  }, [activeFileId]);

  const ensureSaved = useCallback(async (): Promise<boolean> => {
    if (!activeFile) return false;
    if (activeFile.isModified || !activeFile.path) {
      if (settings.autoSaveBeforeRun && activeFile.path) { await handleSaveFile(); return true; }
      return false; 
    }
    return true;
  }, [activeFile, handleSaveFile, settings.autoSaveBeforeRun]);

  const handleRun = useCallback(async () => {
    const isReady = await ensureSaved();
    if (!isReady) { setConsoleOutput(prev => prev + "\n[Error] Please save the file before running."); if (isConsoleCollapsed) setIsConsoleCollapsed(false); return; }
    if (!activeFile) return;
    try {
      const result = await invoke<SimulatorState>('load_and_run', { assembly: activeFile.code });
      updateSimulatorState(result);
      if (isConsoleCollapsed) setIsConsoleCollapsed(false);
    } catch (err: any) { setConsoleOutput(prev => prev + "\n[Load Error] " + err); if (isConsoleCollapsed) setIsConsoleCollapsed(false); }
  }, [activeFile, isConsoleCollapsed, ensureSaved, updateSimulatorState]);

  const handleStep = useCallback(async () => {
    const isReady = await ensureSaved();
    if (!isReady) { setConsoleOutput(prev => prev + "\n[Error] Please save the file before stepping."); if (isConsoleCollapsed) setIsConsoleCollapsed(false); return; }
    if (!activeFile) return;
    try {
      const result = await invoke<SimulatorState>('step_simulator', { assembly: activeFile.code });
      updateSimulatorState(result);
      if (isConsoleCollapsed) setIsConsoleCollapsed(false);
    } catch (err: any) { setConsoleOutput(prev => prev + "\n[Load Error] " + err); if (isConsoleCollapsed) setIsConsoleCollapsed(false); }
  }, [activeFile, isConsoleCollapsed, ensureSaved, updateSimulatorState]);

  const handleReset = useCallback(async () => {
    if (!isTauri()) return;
    try {
      const result = await invoke<SimulatorState>('reset_simulator');
      setChangedIndices([]); setChangedFPIndices([]); setHiLoChanged({ hi: false, lo: false });
      setConsoleOutput(''); setState(result);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'n') { e.preventDefault(); handleNewFile(); }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleSaveFile(); }
      if (e.ctrlKey && e.key === 'o') { e.preventDefault(); handleOpenFile(); }
      if (e.key === 'F5') { e.preventDefault(); handleRun(); }
      if (e.key === 'F10') { e.preventDefault(); handleStep(); }
      if (e.ctrlKey && e.key === 'r') { e.preventDefault(); handleReset(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewFile, handleSaveFile, handleOpenFile, handleRun, handleStep, handleReset]);

  const isTauri = () => (window as any).__TAURI_INTERNALS__ !== undefined;

  useEffect(() => {
    ConfigService.loadSettings(DEFAULT_SETTINGS(QUASAR_DARK)).then(loaded => setSettings(loaded));
  }, []);

  useEffect(() => { applyTheme(settings.theme); }, [settings.theme]);

  const handleLoadTheme = async () => {
    const selected = await open({ multiple: false, filters: [{ name: 'Quasar Theme', extensions: ['json'] }] });
    if (selected && typeof selected === 'string') {
      try {
        const content = await readTextFile(selected);
        const theme = JSON.parse(content);
        setSettings(prev => ({ ...prev, theme }));
      } catch (err) { console.error(err); }
    }
  };

  const handleMinimize = async () => { if (isTauri()) await getCurrentWindow().minimize(); };
  const handleMaximize = async () => { if (!isTauri()) return; const win = getCurrentWindow(); await win.toggleMaximize(); setIsMaximized(await win.isMaximized()); };
  const handleClose = async () => { if (isTauri()) await getCurrentWindow().close(); };

  useEffect(() => {
    if (!isTauri()) return;
    const unlisten = getCurrentWindow().onResized(async () => setIsMaximized(await getCurrentWindow().isMaximized()));
    return () => { unlisten.then(u => u()); };
  }, []);

  return (
    <div className={`flex flex-col h-screen overflow-hidden text-[var(--app-foreground)] select-none transition-all duration-300 ${!isMaximized ? 'rounded-xl border border-[var(--border)] shadow-2xl' : ''}`}>
      
      <header className="h-12 bg-[var(--toolbar-background)] border-b border-[var(--border)] flex items-center justify-between px-4 shrink-0 data-tauri-drag-region cursor-default">
        <div className="flex items-center gap-6 h-full" data-tauri-drag-region>
          <div className="flex items-center gap-2.5 mt-0.5" data-tauri-drag-region>
            <div className="w-6 h-6 bg-[var(--accent)]/10 rounded-lg flex items-center justify-center border border-[var(--accent)]/20" data-tauri-drag-region>
              <img src="/quasar-logo.svg" alt="Quasar" className="w-4 h-4" data-tauri-drag-region />
            </div>
            <span className="text-xs font-black tracking-widest text-[var(--accent)] uppercase" data-tauri-drag-region>Quasar</span>
          </div>
          <nav className="flex items-center h-full gap-1">
            <MenuButton label="File" items={[{ label: 'New File', icon: <FileText size={14}/>, shortcut: 'Ctrl+N', onClick: handleNewFile }, { label: 'Open File', icon: <FolderOpen size={14}/>, shortcut: 'Ctrl+O', onClick: handleOpenFile }, { label: 'Open Folder', icon: <FolderOpen size={14} className="text-orange-400"/>, onClick: handleOpenFolder }, { separator: true }, { label: 'Save', icon: <Save size={14}/>, shortcut: 'Ctrl+S', onClick: handleSaveFile }, { label: 'Settings', icon: <X size={14} className="rotate-45"/>, shortcut: 'Ctrl+,', onClick: () => setIsSettingsOpen(true) }]} />
            <MenuButton label="Edit" items={[{ label: 'Undo', icon: <Undo size={14}/>, shortcut: 'Ctrl+Z', onClick: () => editorRef.current?.trigger('keyboard', 'undo', {}) }, { label: 'Redo', icon: <Redo size={14}/>, shortcut: 'Ctrl+Y', onClick: () => editorRef.current?.trigger('keyboard', 'redo', {}) }, { separator: true }, { label: 'Copy', icon: <Copy size={14}/>, shortcut: 'Ctrl+C', onClick: () => {} }]} />
            <MenuButton label="Simulate" items={[{ label: 'Run', icon: <Play size={14} className="text-green-500"/>, shortcut: 'F5', onClick: handleRun }, { label: 'Step', icon: <StepForward size={14} className="text-blue-500"/>, shortcut: 'F10', onClick: handleStep }, { label: 'Reset', icon: <RefreshCw size={14} className="text-red-500"/>, shortcut: 'Ctrl+R', onClick: handleReset }]} />
            <MenuButton label="Help" items={[{ label: 'Documentation', icon: <Book size={14}/>, onClick: () => setIsHelpOpen(true) }, { label: 'About Quasar', icon: <HelpCircle size={14}/>, onClick: () => setIsAboutOpen(true) }]} />
          </nav>
        </div>

        {/* Spacer to make empty area draggable */}
        <div className="flex-1 h-full" data-tauri-drag-region />

        <div className="flex items-center gap-2">
          <button onClick={handleMinimize} className="w-8 h-8 flex items-center justify-center hover:bg-[var(--tab-active)] rounded-md transition-colors opacity-60 hover:opacity-100"><Minus size={16}/></button>
          <button onClick={handleMaximize} className="w-8 h-8 flex items-center justify-center hover:bg-[var(--tab-active)] rounded-md transition-colors opacity-60 hover:opacity-100"><Square size={12}/></button>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white rounded-md transition-all opacity-60 hover:opacity-100"><X size={16}/></button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden bg-[var(--app-background)] relative">
        <aside className="flex flex-col shrink-0 overflow-hidden bg-[var(--sidebar-background)] border-r border-[var(--border)]" style={{ width: `${leftSidebarWidth}px` }}>
          <div className="flex items-center h-9 bg-[var(--toolbar-background)] border-b border-[var(--border)] px-4 shrink-0">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Explorer</span>
          </div>
          <div className="flex-1 overflow-hidden p-4">
             <FileExplorer projectPath={projectPath} files={projectFiles} onOpenFolder={handleOpenFolder} onRefresh={() => projectPath && refreshProjectFiles(projectPath)} onFileSelect={handleProjectFileSelect} onNewFileSubmit={handleNewFileSubmit} onRenameFile={handleRenameFile} onDeleteFile={handleDeleteFile} />
          </div>
        </aside>

        <div onMouseDown={startResizingLeft} className="w-1 bg-[var(--border)] hover:bg-[var(--accent)] cursor-col-resize flex items-center justify-center transition-colors group z-10" />

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex flex-col min-h-0 bg-[var(--app-background)]">
             <div className="h-9 bg-[var(--sidebar-background)] border-b border-[var(--border)] flex items-center shrink-0 overflow-hidden px-1">
                {showTabArrows && <button onClick={() => scrollTabs('left')} className="h-full px-1.5 flex items-center justify-center text-[var(--app-foreground)] opacity-40 hover:opacity-100 hover:bg-[var(--tab-active)] transition-all border-r border-[var(--border)] z-10 bg-[var(--sidebar-background)]"><ChevronLeft size={14} /></button>}
                <div ref={tabBarRef} className="flex-1 flex items-center overflow-x-auto no-scrollbar h-full scroll-smooth">
                  {openFiles.map(file => (
                    <div key={file.id} onClick={() => setActiveFileId(file.id)} className={`flex items-center gap-3 text-[11px] font-medium h-full px-4 border-r border-[var(--border)] transition-colors cursor-pointer min-w-[140px] max-w-[200px] shrink-0 ${activeFileId === file.id ? 'bg-[var(--tab-active)] text-[var(--app-foreground)]' : 'bg-[var(--tab-inactive)] text-[var(--app-foreground)] opacity-50 hover:opacity-100'}`}>
                        <Code size={14} className={file.isModified ? 'text-[var(--accent)]' : 'opacity-50'} />
                        <span className="truncate flex-1">{file.name}{file.isModified ? '*' : ''}</span>
                        <button className="ml-1 p-0.5 hover:bg-[var(--app-background)] opacity-50 hover:opacity-100 rounded-sm transition-colors group" onClick={(e) => { e.stopPropagation(); closeFile(file.id); }}>{file.isModified ? <Circle size={8} fill="currentColor" className="text-[var(--accent)]" /> : <X size={12} className="group-hover:text-red-500" />}</button>
                    </div>
                  ))}
                </div>
                {showTabArrows && <button onClick={() => scrollTabs('right')} className="h-full px-1.5 flex items-center justify-center text-[var(--app-foreground)] opacity-40 hover:opacity-100 hover:bg-[var(--tab-active)] transition-all border-l border-[var(--border)] z-10 bg-[var(--sidebar-background)]"><ChevronRight size={14} /></button>}
                <button onClick={handleNewFile} title="New File (Ctrl+N)" className="px-3 h-full flex items-center justify-center text-[var(--app-foreground)] opacity-50 hover:opacity-100 hover:bg-[var(--tab-active)] transition-colors border-l border-[var(--border)] shrink-0 bg-[var(--sidebar-background)]"><X size={14} className="rotate-45" /></button>
             </div>
             <div className="flex-1 overflow-hidden">
                {openFiles.length > 0 ? (
                  <CodeEditor activeFileId={activeFileId || ''} onMount={(editor) => { editorRef.current = editor; }} onCodeChange={handleCodeChange} initialCode={activeFile?.code || ''} theme={settings.theme} fontSize={settings.fontSize} tabSize={settings.tabSize} highlightedLine={state.current_line} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-[var(--app-background)]">
                    <div className="w-20 h-20 bg-[var(--accent)]/10 rounded-3xl flex items-center justify-center mb-6 border border-[var(--accent)]/20"><img src="/quasar-logo.svg" alt="Quasar" className="w-12 h-12 opacity-40" /></div>
                    <h2 className="text-xl font-bold text-[var(--app-foreground)] opacity-80 mb-2">Welcome to Quasar</h2>
                    <p className="text-sm text-[var(--app-foreground)] opacity-40 max-w-[280px] mb-8">No active files open. Open a folder to start a workspace or create a new file.</p>
                    <div className="flex gap-3">
                      <button onClick={handleNewFile} className="px-6 py-2.5 bg-[var(--accent)] text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[var(--accent)]/20 active:scale-95">New File</button>
                      <button onClick={handleOpenFolder} className="px-6 py-2.5 bg-[var(--sidebar-background)] border border-[var(--border)] text-[var(--app-foreground)] text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-[var(--tab-active)] transition-all active:scale-95">Open Workspace</button>
                    </div>
                  </div>
                )}
             </div>
          </div>
          <div onMouseDown={startResizingConsole} className="h-1 bg-[var(--border)] hover:bg-[var(--accent)] cursor-row-resize flex items-center justify-center transition-colors group z-10"></div>
          <Console output={consoleOutput} isCollapsed={isConsoleCollapsed} onToggle={() => setIsConsoleCollapsed(!isConsoleCollapsed)} height={consoleHeight} />
        </div>

        <div onMouseDown={startResizingRight} className="w-1 bg-[var(--border)] hover:bg-[var(--accent)] cursor-col-resize flex items-center justify-center transition-colors group z-10" />

        <aside className="flex flex-col shrink-0 overflow-hidden bg-[var(--sidebar-background)] border-l border-[var(--border)]" style={{ width: `${rightSidebarWidth}px` }}>
          <div className="flex items-center h-9 bg-[var(--toolbar-background)] border-b border-[var(--border)] shrink-0">
            <button onClick={() => setActiveSidebarTab('core')} className={`flex-1 h-full text-[9px] font-black uppercase tracking-widest transition-all ${activeSidebarTab === 'core' ? 'text-[var(--accent)] bg-[var(--app-background)]' : 'text-[var(--app-foreground)] opacity-40 hover:opacity-100 hover:bg-[var(--tab-active)]'}`}>Core</button>
            <div className="w-px h-4 bg-[var(--border)]" />
            <button onClick={() => setActiveSidebarTab('cp1')} className={`flex-1 h-full text-[9px] font-black uppercase tracking-widest transition-all ${activeSidebarTab === 'cp1' ? 'text-[var(--accent)] bg-[var(--app-background)]' : 'text-[var(--app-foreground)] opacity-40 hover:opacity-100 hover:bg-[var(--tab-active)]'}`}>CP1</button>
            <div className="w-px h-4 bg-[var(--border)]" />
            <button onClick={() => setActiveSidebarTab('memory')} className={`flex-1 h-full text-[9px] font-black uppercase tracking-widest transition-all ${activeSidebarTab === 'memory' ? 'text-[var(--accent)] bg-[var(--app-background)]' : 'text-[var(--app-foreground)] opacity-40 hover:opacity-100 hover:bg-[var(--tab-active)]'}`}>Mem</button>
          </div>
          <div className="flex-1 overflow-hidden p-4">
            {activeSidebarTab === 'core' && <RegisterView registers={state.registers} fp_registers={[]} view="core" changedIndices={changedIndices} changedFPIndices={[]} hi={state.hi} lo={state.lo} hiLoChanged={hiLoChanged} />}
            {activeSidebarTab === 'cp1' && <RegisterView registers={[]} fp_registers={state.fp_registers} view="cp1" changedIndices={[]} changedFPIndices={changedFPIndices} hi={0} lo={0} hiLoChanged={{hi: false, lo: false}} />}
            {activeSidebarTab === 'memory' && <MemoryView memory={state.memory_sample} />}
          </div>
        </aside>
      </main>

      {isSettingsOpen && <SettingsDialog settings={settings} onUpdate={setSettings} onClose={() => setIsSettingsOpen(false)} onLoadTheme={handleLoadTheme} />}
      {isHelpOpen && <HelpDialog onClose={() => setIsHelpOpen(false)} />}
      {isAboutOpen && <AboutDialog onClose={() => setIsAboutOpen(true)} />}
    </div>
  );
}

function MenuButton({ label, items }: { label: string, items: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative h-full flex items-center" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <button className="text-[11px] px-2 h-7 hover:bg-[var(--accent)]/20 rounded-md text-[var(--app-foreground)] opacity-70 hover:opacity-100 transition-all cursor-pointer font-medium">{label}</button>
      {isOpen && (
        <div className="absolute left-0 top-[90%] w-52 bg-[var(--tab-inactive)] border border-[var(--border)] shadow-2xl rounded-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-xl">
          {items.map((item, i) => item.separator ? <div key={i} className="h-px bg-[var(--border)] my-1.5 mx-2" /> : (
            <button key={item.label} onClick={() => { item.onClick(); setIsOpen(false); }} className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] hover:bg-[var(--accent)] hover:text-white transition-colors text-left group">
              <div className="flex items-center gap-2.5">
                <span className="opacity-50 group-hover:opacity-100 transition-opacity">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </div>
              {item.shortcut && <span className="text-[9px] opacity-40 group-hover:opacity-100 font-mono">{item.shortcut}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const RefreshCw = ({ size, className }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
);

export default App;
