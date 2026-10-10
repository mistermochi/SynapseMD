import React, { useState } from 'react';
import { ClinicalNote } from '../types/clinical';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Folder,
  FolderOpen,
  FileText,
  Search,
  Plus,
  Link2,
  Clock,
  Server,
  BookOpen,
  ChevronRight,
  ChevronDown,
  History,
  X,
  Sun,
  Moon,
  Zap,
  ZapOff,
} from 'lucide-react';

interface VaultExplorerProps {
  notes: ClinicalNote[];
  activeNoteId: string;
  onSelectNote: (noteId: string) => void;
  onCreateNote: (title: string, folder: string, specialty: string) => void;
  onOpenObsidianSync: () => void;
  onOpenHistory: () => void;
  obsidianApiConnected: boolean;
  staleCount: number;
  onCloseMobileDrawer?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  isMockOffline?: boolean;
  onToggleMockOffline?: () => void;
}

export const VaultExplorer: React.FC<VaultExplorerProps> = ({
  notes,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onOpenObsidianSync,
  onOpenHistory,
  obsidianApiConnected,
  staleCount,
  onCloseMobileDrawer,
  theme,
  onToggleTheme,
  isMockOffline,
  onToggleMockOffline,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'stale' | 'unreviewed' | 'citations'>('all');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    Cardiology: true,
    Endocrinology: true,
    Nephrology: true,
    'Hematology & Vascular': true,
    'Internal Medicine': true,
  });
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newFolder, setNewFolder] = useState('Cardiology');
  const [newSpecialty, setNewSpecialty] = useState('General Internal Medicine');

  const toggleFolder = (folder: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folder]: !prev[folder] }));
  };

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'stale') {
      const lastCheck = new Date(n.lastChecked).getTime();
      const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
      return lastCheck < oneYearAgo || !n.reviewed;
    }
    if (activeFilter === 'unreviewed') {
      return !n.reviewed;
    }
    if (activeFilter === 'citations') {
      return (n.citationsCount || 0) < 3;
    }
    return true;
  });

  const folders = Array.from(new Set(notes.map((n) => n.folder)));

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateNote(newTitle.trim(), newFolder, newSpecialty);
    setNewTitle('');
    setIsCreatingNote(false);
    if (onCloseMobileDrawer) onCloseMobileDrawer();
  };

  const handleNoteClick = (id: string) => {
    onSelectNote(id);
    if (onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  const activeNote = notes.find((n) => n.id === activeNoteId);

  return (
    <aside className="w-full h-full bg-sidebar border-r border-sidebar-border text-sidebar-foreground flex flex-col shrink-0 select-none">
      {/* Top Brand Bar */}
      <div className="p-3 border-b border-sidebar-border flex items-center justify-between bg-sidebar/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs">
            Ψ
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs tracking-tight text-sidebar-foreground">SynapseMD</span>
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-border">
                b0
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">Obsidian Vault</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Mock Offline Zero-Token Indicator & Toggle */}
          {onToggleMockOffline && (
            <button
              onClick={onToggleMockOffline}
              title={
                isMockOffline
                  ? 'Mock Offline Active (Zero Gemini Tokens Burned). Click to switch to Live Gemini API.'
                  : 'Live Gemini API Active. Click to switch to Mock Offline Mode.'
              }
              className={`p-1 px-1.5 rounded-md border text-[10px] font-mono transition-colors flex items-center gap-1 cursor-pointer ${
                isMockOffline
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'border-border bg-sidebar hover:bg-sidebar-accent text-muted-foreground'
              }`}
            >
              <Zap className={`w-3 h-3 ${isMockOffline ? 'text-emerald-500 fill-emerald-500' : 'text-muted-foreground'}`} />
              <span className="hidden sm:inline">{isMockOffline ? 'Mock' : 'Live'}</span>
            </button>
          )}

          {/* Light / Dark Mode Toggle */}
          {onToggleTheme && (
            <Button
              variant="ghost"
              size="iconSm"
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              )}
            </Button>
          )}

          {/* Obsidian API status button */}
          <button
            onClick={onOpenObsidianSync}
            title={obsidianApiConnected ? 'Obsidian REST API Connected' : 'Local Virtual Vault'}
            className="p-1 rounded-md border border-sidebar-border bg-sidebar hover:bg-sidebar-accent text-sidebar-foreground transition-colors flex items-center gap-1 text-xs cursor-pointer"
          >
            <Server className="w-3.5 h-3.5 text-primary" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {/* Close drawer on mobile */}
          {onCloseMobileDrawer && (
            <Button
              variant="ghost"
              size="iconSm"
              onClick={onCloseMobileDrawer}
              className="lg:hidden"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="p-2.5 border-b border-sidebar-border">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notes, [[links]]..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-input focus:border-ring rounded-md pl-8 pr-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-0.5 text-[11px] no-scrollbar">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2 py-0.5 rounded cursor-pointer transition-colors whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
            }`}
          >
            All ({notes.length})
          </button>
          <button
            onClick={() => setActiveFilter('stale')}
            className={`px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
              activeFilter === 'stale'
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
            }`}
          >
            <Clock className="w-2.5 h-2.5 text-amber-500" />
            Stale ({staleCount})
          </button>
          <button
            onClick={() => setActiveFilter('unreviewed')}
            className={`px-2 py-0.5 rounded cursor-pointer transition-colors whitespace-nowrap ${
              activeFilter === 'unreviewed'
                ? 'bg-destructive/20 text-destructive border border-destructive/30 font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
            }`}
          >
            Unreviewed
          </button>
        </div>
      </div>

      {/* Explorer Actions Bar */}
      <div className="px-3 py-1.5 bg-sidebar/50 border-b border-sidebar-border flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono text-[10px] uppercase tracking-wider">
          Vault Files ({filteredNotes.length})
        </span>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="iconSm"
            onClick={onOpenHistory}
            title="Vault Version Snapshots"
          >
            <History className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="iconSm"
            onClick={() => setIsCreatingNote(true)}
            title="Create New Clinical Note"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
          </Button>
        </div>
      </div>

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1.5 space-y-0.5 text-xs">
        {folders.map((folder) => {
          const folderNotes = filteredNotes.filter((n) => n.folder === folder);
          if (folderNotes.length === 0 && searchQuery) return null;
          const isExpanded = expandedFolders[folder] ?? true;

          return (
            <div key={folder} className="space-y-0.5">
              <button
                onClick={() => toggleFolder(folder)}
                className="w-full flex items-center justify-between px-2 py-1 text-sidebar-foreground hover:bg-sidebar-accent rounded transition-colors text-left cursor-pointer font-medium"
              >
                <div className="flex items-center gap-1.5 truncate">
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                  )}
                  {isExpanded ? (
                    <FolderOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 text-primary/80 shrink-0" />
                  )}
                  <span className="truncate text-xs">{folder}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">{folderNotes.length}</span>
              </button>

              {isExpanded && (
                <div className="pl-3.5 space-y-0.5 border-l border-sidebar-border ml-3 my-0.5">
                  {folderNotes.map((note) => {
                    const isSelected = note.id === activeNoteId;
                    const isStale =
                      new Date(note.lastChecked).getTime() < Date.now() - 365 * 24 * 60 * 60 * 1000 || !note.reviewed;

                    return (
                      <button
                        key={note.id}
                        onClick={() => handleNoteClick(note.id)}
                        className={`w-full group text-left px-2 py-1.5 rounded-md flex items-start justify-between gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium border border-border shadow-2xs'
                            : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                        }`}
                      >
                        <div className="flex items-start gap-1.5 min-w-0">
                          <FileText
                            className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                              isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                            }`}
                          />
                          <div className="min-w-0">
                            <span className="block truncate text-[11.5px] leading-snug">
                              {note.title}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5 text-[9.5px] text-muted-foreground font-mono">
                              <span>{note.evidenceLevel}</span>
                              <span>•</span>
                              <span>{note.citationsCount} refs</span>
                            </div>
                          </div>
                        </div>

                        {/* Status indicators */}
                        <div className="flex items-center gap-1 shrink-0 mt-0.5">
                          {isStale && (
                            <span
                              title="Stale / Outdated (>1 yr)"
                              className="w-1.5 h-1.5 rounded-full bg-amber-500"
                            />
                          )}
                          {!note.reviewed && (
                            <Badge variant="destructive" className="text-[8.5px] px-1 py-0 h-3.5">
                              Audit
                            </Badge>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filteredNotes.length === 0 && (
          <div className="p-4 text-center text-muted-foreground text-xs">
            No notes match your filter.
          </div>
        )}
      </div>

      {/* Backlinks & Graph Drawer Footer */}
      {activeNote && (
        <div className="p-2.5 border-t border-sidebar-border bg-sidebar/50 text-xs shrink-0">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="flex items-center gap-1 font-semibold text-[10.5px]">
              <Link2 className="w-3 h-3 text-primary" />
              Graph Backlinks ({activeNote.backlinks?.length || 0})
            </span>
          </div>
          <div className="space-y-0.5">
            {activeNote.backlinks && activeNote.backlinks.length > 0 ? (
              activeNote.backlinks.map((link) => {
                const target = notes.find((n) => n.title === link);
                return (
                  <button
                    key={link}
                    onClick={() => target && handleNoteClick(target.id)}
                    className="w-full text-left truncate text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer py-0.5"
                  >
                    <span>[[{link}]]</span>
                  </button>
                );
              })
            ) : (
              <p className="text-[10px] text-muted-foreground italic">No incoming backlinks to this note.</p>
            )}
          </div>
        </div>
      )}

      {/* New Note Dialog */}
      {isCreatingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card text-card-foreground border border-border rounded-xl max-w-md w-full p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2.5">
              <BookOpen className="w-4 h-4 text-primary" />
              Create New Clinical Note
            </h3>
            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-foreground mb-1 font-medium">Note Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SGLT2 Inhibitors in HFpEF (DELIVER)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-background border border-input focus:border-ring rounded-md px-2.5 py-1.5 text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-foreground mb-1 font-medium">Folder / Category</label>
                <select
                  value={newFolder}
                  onChange={(e) => setNewFolder(e.target.value)}
                  className="w-full bg-background border border-input focus:border-ring rounded-md px-2.5 py-1.5 text-foreground focus:outline-none"
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Endocrinology">Endocrinology</option>
                  <option value="Nephrology">Nephrology</option>
                  <option value="Hematology & Vascular">Hematology & Vascular</option>
                  <option value="Internal Medicine">Internal Medicine</option>
                  <option value="Infectious Disease">Infectious Disease</option>
                </select>
              </div>

              <div>
                <label className="block text-foreground mb-1 font-medium">Specialty</label>
                <input
                  type="text"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  className="w-full bg-background border border-input focus:border-ring rounded-md px-2.5 py-1.5 text-foreground focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreatingNote(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="default" size="sm">
                  Create Note
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
