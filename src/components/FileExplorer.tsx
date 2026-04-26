import React, { useState, useEffect, useRef } from 'react';
import { FolderOpen, FilePlus, RefreshCw, FileText, ChevronRight, Edit2, Trash2 } from 'lucide-react';

interface FileExplorerProps {
  projectPath: string | null;
  files: { name: string; path: string }[];
  onOpenFolder: () => void;
  onRefresh: () => void;
  onFileSelect: (path: string) => void;
  onNewFileSubmit: (name: string) => Promise<void>;
  onRenameFile: (oldPath: string, newName: string) => Promise<void>;
  onDeleteFile: (path: string) => Promise<void>;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ 
  projectPath, 
  files, 
  onOpenFolder, 
  onRefresh, 
  onFileSelect,
  onNewFileSubmit,
  onRenameFile,
  onDeleteFile
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, path: string } | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [createName, setCreateName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, path });
  };

  const startRename = (path: string, currentName: string) => {
    setRenamingPath(path);
    setNewName(currentName);
    setContextMenu(null);
  };

  const handleRenameSubmit = async (oldPath: string) => {
    if (newName && newName.trim() !== '') {
      await onRenameFile(oldPath, newName.trim());
    }
    setRenamingPath(null);
  };

  const handleCreateSubmit = async () => {
    if (createName && createName.trim() !== '') {
      await onNewFileSubmit(createName.trim());
    }
    setIsCreating(false);
    setCreateName('');
  };

  if (!projectPath) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-2xl flex items-center justify-center text-[var(--accent)]">
          <FolderOpen size={32} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-[var(--app-foreground)] opacity-80">No Workspace</h4>
          <p className="text-xs text-[var(--app-foreground)] opacity-40 mt-1">Open a folder to start working on a project.</p>
        </div>
        <button 
          onClick={onOpenFolder}
          className="px-6 py-2 bg-[var(--accent)] text-white text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-[var(--accent)]/20 active:scale-95"
        >
          Open Folder
        </button>
      </div>
    );
  }

  const folderName = projectPath.split(/[\\/]/).pop() || projectPath;

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <div className="flex items-center justify-between mb-4 group">
        <div className="flex items-center gap-2 overflow-hidden">
          <ChevronRight size={14} className="text-[var(--app-foreground)] opacity-30" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--app-foreground)] opacity-60 truncate">
            {folderName}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => { setIsCreating(true); setCreateName(''); }} 
            className="p-1 hover:bg-[var(--tab-active)] rounded text-[var(--app-foreground)] opacity-50 hover:opacity-100 transition-all"
            title="New File"
          >
            <FilePlus size={14} />
          </button>
          <button onClick={onRefresh} className="p-1 hover:bg-[var(--tab-active)] rounded text-[var(--app-foreground)] opacity-50 hover:opacity-100 transition-all"><RefreshCw size={14} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-0.5">
        {/* Creation Input */}
        {isCreating && (
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-[var(--tab-active)]">
            <FileText size={14} className="text-[var(--accent)]" />
            <input
              autoFocus
              placeholder="filename.asm"
              className="flex-1 bg-[var(--app-background)] border border-[var(--accent)] rounded px-1.5 py-0.5 text-xs text-[var(--app-foreground)] outline-none"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSubmit();
                if (e.key === 'Escape') setIsCreating(false);
              }}
              onBlur={handleCreateSubmit}
            />
          </div>
        )}

        {files.length === 0 && !isCreating ? (
          <div className="py-8 text-center text-[10px] uppercase tracking-widest text-[var(--app-foreground)] opacity-20 font-bold">Folder is empty</div>
        ) : (
          files.map(file => (
            <div 
              key={file.path}
              onContextMenu={(e) => handleContextMenu(e, file.path)}
              onClick={() => renamingPath !== file.path && onFileSelect(file.path)}
              className={`flex items-center gap-3 px-3 py-1.5 rounded-md hover:bg-[var(--tab-active)] cursor-pointer transition-all group ${renamingPath === file.path ? 'bg-[var(--tab-active)]' : ''}`}
            >
              <FileText size={14} className="text-[var(--app-foreground)] opacity-30 group-hover:text-[var(--accent)] group-hover:opacity-100 transition-colors" />
              {renamingPath === file.path ? (
                <input
                  autoFocus
                  className="flex-1 bg-[var(--app-background)] border border-[var(--border)] rounded px-1.5 py-0.5 text-xs text-[var(--app-foreground)] outline-none"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit(file.path);
                    if (e.key === 'Escape') setRenamingPath(null);
                  }}
                  onBlur={() => handleRenameSubmit(file.path)}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="text-xs text-[var(--app-foreground)] opacity-70 group-hover:opacity-100 truncate">
                  {file.name}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Custom Context Menu */}
      {contextMenu && (
        <div 
          ref={menuRef}
          className="fixed bg-[var(--tab-inactive)] border border-[var(--border)] shadow-2xl rounded-lg py-1.5 z-[100] w-36 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => startRename(contextMenu.path, files.find(f => f.path === contextMenu.path)?.name || '')}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] hover:bg-[var(--accent)] hover:text-white transition-colors text-left"
          >
            <Edit2 size={12} className="opacity-60" /> Rename
          </button>
          <button 
            onClick={() => { onDeleteFile(contextMenu.path); setContextMenu(null); }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] text-red-500 hover:bg-red-500 hover:text-white transition-colors text-left"
          >
            <Trash2 size={12} className="opacity-60" /> Delete
          </button>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-[var(--border)]">
        <button onClick={onOpenFolder} className="w-full flex items-center justify-center gap-2 py-2 border border-[var(--border)] border-dashed rounded-lg text-[9px] font-bold uppercase tracking-widest text-[var(--app-foreground)] opacity-40 hover:opacity-100 hover:bg-[var(--tab-active)] transition-all">Change Folder</button>
      </div>
    </div>
  );
};

export default FileExplorer;
