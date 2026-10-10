import React, { useState, useEffect } from 'react';
import { ClinicalNote, NoteSnapshot, ClinicalCitation, WorkEmailQuestion } from './types/clinical';
import { INITIAL_VAULT_NOTES } from './data/initialVault';
import { INITIAL_WORK_QUESTIONS } from './data/initialQuestions';
import { VaultExplorer } from './components/VaultExplorer';
import { NoteEditor } from './components/NoteEditor';
import { ClinicalCopilotPane } from './components/ClinicalCopilotPane';
import { ObsidianSyncModal } from './components/ObsidianSyncModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { Sheet } from './components/ui/sheet';
import { replaceBlockInMarkdown, appendReferenceToMarkdown } from './utils/markdownUtils';
import { formatCitationToMarkdown } from './utils/citationFormatter';
import { getMockOfflineStatus, toggleMockOfflineMode } from './services/api';
import {
  FolderOpen,
  BookOpen,
  Sparkles,
  Pill,
  Inbox,
  Sun,
  Moon,
} from 'lucide-react';

export default function App() {
  const [notes, setNotes] = useState<ClinicalNote[]>(() => {
    const saved = localStorage.getItem('synapse_md_vault');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_VAULT_NOTES;
      }
    }
    return INITIAL_VAULT_NOTES;
  });

  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id || 'note-sglt2i-hf');
  const [selectedParagraphSnippet, setSelectedParagraphSnippet] = useState<string>('');
  const [copilotTab, setCopilotTab] = useState<'evidence' | 'drugs' | 'citations' | 'inbox'>('evidence');
  const [proposedPatch, setProposedPatch] = useState<{
    originalText: string;
    proposedText: string;
    rationale?: string;
  } | null>(null);

  const [snapshots, setSnapshots] = useState<NoteSnapshot[]>(() => {
    const saved = localStorage.getItem('synapse_md_snapshots');
    return saved ? JSON.parse(saved) : [];
  });

  const [workQuestions, setWorkQuestions] = useState<WorkEmailQuestion[]>(() => {
    const saved = localStorage.getItem('synapse_md_questions');
    return saved ? JSON.parse(saved) : INITIAL_WORK_QUESTIONS;
  });

  // Theme state for shadcn b0 (light: oklch(1 0 0), dark: oklch(0.145 0 0))
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('synapse_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('synapse_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Offline Mock Simulation Mode (Zero Gemini token consumption)
  const [isMockOffline, setIsMockOffline] = useState<boolean>(true);

  useEffect(() => {
    getMockOfflineStatus()
      .then((st) => setIsMockOffline(st.enabled))
      .catch(() => setIsMockOffline(true));
  }, []);

  const handleToggleMockOffline = async () => {
    try {
      const next = !isMockOffline;
      const res = await toggleMockOfflineMode(next);
      setIsMockOffline(res.enabled);
    } catch {
      setIsMockOffline((prev) => !prev);
    }
  };

  // Modals & Mobile Drawers
  const [isObsidianSyncOpen, setIsObsidianSyncOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [obsidianApiConnected, setObsidianApiConnected] = useState(true);
  const [isMobileVaultOpen, setIsMobileVaultOpen] = useState(false);
  const [isMobileCopilotOpen, setIsMobileCopilotOpen] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('synapse_md_vault', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('synapse_md_snapshots', JSON.stringify(snapshots));
  }, [snapshots]);

  useEffect(() => {
    localStorage.setItem('synapse_md_questions', JSON.stringify(workQuestions));
  }, [workQuestions]);

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];

  // Count stale notes (>1 year old or unreviewed)
  const staleCount = notes.filter((n) => {
    const lastCheck = new Date(n.lastChecked).getTime();
    return lastCheck < Date.now() - 365 * 24 * 60 * 60 * 1000 || !n.reviewed;
  }).length;

  const handleUpdateNoteContent = (newContent: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === activeNoteId ? { ...n, content: newContent } : n))
    );
  };

  const handleToggleReviewed = () => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === activeNoteId) {
          const nextReviewed = !n.reviewed;
          return {
            ...n,
            reviewed: nextReviewed,
            lastChecked: new Date().toISOString().slice(0, 10),
          };
        }
        return n;
      })
    );
  };

  const handleNavigateWikiLink = (linkTitle: string) => {
    const cleanTarget = linkTitle.toLowerCase().trim();
    const target = notes.find(
      (n) =>
        n.title.toLowerCase().trim() === cleanTarget ||
        n.title.toLowerCase().includes(cleanTarget)
    );
    if (target) {
      setActiveNoteId(target.id);
      setSelectedParagraphSnippet('');
    } else {
      handleCreateNote(linkTitle, activeNote.folder, activeNote.specialty);
    }
  };

  const handleCreateNote = (title: string, folder: string, specialty: string) => {
    const newId = `note-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: newId,
      title,
      path: `${folder}/${title}.md`,
      folder,
      tags: [folder.toLowerCase().replace(/\s+/g, '-')],
      specialty,
      reviewed: false,
      lastChecked: new Date().toISOString().slice(0, 10),
      evidenceLevel: 'Level B',
      citationsCount: 0,
      citations: [],
      backlinks: [activeNote.title],
      outlinks: [],
      content: `---
title: ${title}
reviewed: false
last_checked: ${new Date().toISOString().slice(0, 10)}
evidence_level: Level B
specialty: ${specialty}
tags: [${folder.toLowerCase().replace(/\s+/g, '-')}]
---

# ${title}

## Clinical Overview
Enter synthesized evidence for ${title}.

> [!NOTE]
> Linked from [[${activeNote.title}]].

## Key Trials & Guidelines
- Landmark evidence to be added.

## References
`,
    };

    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newId);
    setIsMobileVaultOpen(false);
  };

  const [pendingActionTrigger, setPendingActionTrigger] = useState<{
    action: 'fact-check' | 'evidence-scan' | 'drug-reference' | 'critique' | 'propose-update';
    text: string;
    timestamp: number;
  } | null>(null);

  const handleTriggerClinicalAction = (
    action: 'fact-check' | 'evidence-scan' | 'drug-reference' | 'critique' | 'propose-update',
    text: string
  ) => {
    setSelectedParagraphSnippet(text);
    if (action === 'drug-reference') {
      setCopilotTab('drugs');
    } else {
      setCopilotTab('evidence');
    }
    setPendingActionTrigger({ action, text, timestamp: Date.now() });
    setIsMobileCopilotOpen(true);
  };

  const handleProposePatch = (patch: {
    originalText: string;
    proposedText: string;
    rationale?: string;
  }) => {
    setProposedPatch(patch);
    setIsMobileCopilotOpen(false);
  };

  const handleApplyPatch = () => {
    if (!proposedPatch) return;

    const snapshot: NoteSnapshot = {
      id: `snap-${Date.now()}`,
      noteId: activeNote.id,
      timestamp: new Date().toISOString(),
      reason: proposedPatch.rationale || 'AI Clinical Evidence Patch applied',
      content: activeNote.content,
    };
    setSnapshots((prev) => [snapshot, ...prev]);

    let newContent = activeNote.content;
    if (proposedPatch.originalText.startsWith('## (New Section')) {
      newContent = activeNote.content.trim() + '\n\n' + proposedPatch.proposedText + '\n';
    } else {
      newContent = replaceBlockInMarkdown(
        activeNote.content,
        proposedPatch.originalText,
        proposedPatch.proposedText
      );
    }

    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeNote.id
          ? {
              ...n,
              content: newContent,
              lastChecked: new Date().toISOString().slice(0, 10),
              reviewed: false,
            }
          : n
      )
    );

    setProposedPatch(null);
  };

  const handleRejectPatch = () => {
    setProposedPatch(null);
  };

  const handleAddCitationToNote = (cit: ClinicalCitation) => {
    const updatedCitations = [cit, ...activeNote.citations];
    const citMarkdown = formatCitationToMarkdown(cit, updatedCitations.length);
    const updatedContent = appendReferenceToMarkdown(activeNote.content, citMarkdown);

    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeNote.id
          ? {
              ...n,
              citations: updatedCitations,
              citationsCount: updatedCitations.length,
              content: updatedContent,
            }
          : n
      )
    );
  };

  const handleToggleCitationVerification = (citationId: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === activeNote.id) {
          const updated = n.citations.map((c) => {
            if (c.id === citationId) {
              const nextStatus: ClinicalCitation['verificationStatus'] =
                c.verificationStatus === 'user-verified' ? 'unverified' : 'user-verified';
              return {
                ...c,
                verificationStatus: nextStatus,
                verifiedAt: nextStatus === 'user-verified' ? new Date().toISOString() : undefined,
                verifiedBy: nextStatus === 'user-verified' ? 'Attending Physician' : undefined,
              };
            }
            return c;
          });
          return { ...n, citations: updated };
        }
        return n;
      })
    );
  };

  const handleInsertMarkdownToNote = (markdownText: string) => {
    const updatedContent = activeNote.content.trim() + '\n' + markdownText;
    handleUpdateNoteContent(updatedContent);
  };

  const handleAddWorkQuestion = (questionText: string) => {
    const newQ: WorkEmailQuestion = {
      id: `wq-${Date.now()}`,
      timestamp: new Date().toISOString(),
      question: questionText,
      category: 'drug_dosing',
      deidentified: true,
      linkedNoteId: activeNote.id,
      status: 'new',
    };
    setWorkQuestions((prev) => [newQ, ...prev]);
  };

  const handleRevertSnapshot = (snapshot: NoteSnapshot) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === snapshot.noteId ? { ...n, content: snapshot.content } : n))
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans flex-col lg:flex-row transition-colors">
      {/* Pane 1: Desktop Obsidian Vault Explorer */}
      <div className="hidden lg:block w-76 xl:w-80 h-full shrink-0">
        <VaultExplorer
          notes={notes}
          activeNoteId={activeNoteId}
          onSelectNote={(id) => {
            setActiveNoteId(id);
            setSelectedParagraphSnippet('');
            setProposedPatch(null);
          }}
          onCreateNote={handleCreateNote}
          onOpenObsidianSync={() => setIsObsidianSyncOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          obsidianApiConnected={obsidianApiConnected}
          staleCount={staleCount}
          theme={theme}
          onToggleTheme={toggleTheme}
          isMockOffline={isMockOffline}
          onToggleMockOffline={handleToggleMockOffline}
        />
      </div>

      {/* Pane 2: Note Reader / Markdown Editor / Diff View */}
      <div className="flex-1 h-full min-w-0 flex flex-col overflow-hidden pb-14 lg:pb-0">
        <NoteEditor
          note={activeNote}
          onUpdateContent={handleUpdateNoteContent}
          onToggleReviewed={handleToggleReviewed}
          onNavigateWikiLink={handleNavigateWikiLink}
          onTriggerClinicalAction={handleTriggerClinicalAction}
          onOpenCitationTab={() => {
            setCopilotTab('citations');
            setIsMobileCopilotOpen(true);
          }}
          proposedPatch={proposedPatch}
          onApplyPatch={handleApplyPatch}
          onRejectPatch={handleRejectPatch}
          onOpenMobileVault={() => setIsMobileVaultOpen(true)}
          onOpenMobileCopilot={() => setIsMobileCopilotOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </div>

      {/* Pane 3: Desktop AI Clinical Evidence Copilot */}
      <div className="hidden lg:block w-92 xl:w-96 h-full shrink-0">
        <ClinicalCopilotPane
          note={activeNote}
          notes={notes}
          selectedTextSnippet={selectedParagraphSnippet}
          activeTab={copilotTab}
          onTabChange={setCopilotTab}
          onProposePatch={handleProposePatch}
          onAddCitationToNote={handleAddCitationToNote}
          onToggleCitationVerification={handleToggleCitationVerification}
          onInsertMarkdownToNote={handleInsertMarkdownToNote}
          questions={workQuestions}
          onAddQuestion={handleAddWorkQuestion}
          onSelectTargetNote={(id) => {
            setActiveNoteId(id);
            setSelectedParagraphSnippet('');
          }}
          pendingActionTrigger={pendingActionTrigger}
          isMockOffline={isMockOffline}
          onToggleMockOffline={handleToggleMockOffline}
        />
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 h-14 bg-card/95 backdrop-blur-md border-t border-border z-40 flex items-center justify-around px-2 select-none shadow-sm">
        <button
          onClick={() => setIsMobileVaultOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:text-foreground py-1 px-2.5 rounded-md active:scale-95 transition-colors cursor-pointer"
        >
          <FolderOpen className="w-4 h-4" />
          <span className="text-[10px] font-medium">Vault</span>
        </button>

        <button
          onClick={() => {
            setIsMobileVaultOpen(false);
            setIsMobileCopilotOpen(false);
          }}
          className="flex flex-col items-center justify-center gap-0.5 text-primary py-1 px-2.5 rounded-md active:scale-95 transition-colors cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-[10px] font-medium">Note</span>
        </button>

        <button
          onClick={() => {
            setCopilotTab('evidence');
            setIsMobileCopilotOpen(true);
          }}
          className="flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:text-foreground py-1 px-2.5 rounded-md active:scale-95 transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] font-medium">Copilot</span>
        </button>

        <button
          onClick={() => {
            setCopilotTab('drugs');
            setIsMobileCopilotOpen(true);
          }}
          className="flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:text-foreground py-1 px-2.5 rounded-md active:scale-95 transition-colors cursor-pointer"
        >
          <Pill className="w-4 h-4" />
          <span className="text-[10px] font-medium">Drugs</span>
        </button>

        <button
          onClick={() => {
            setCopilotTab('inbox');
            setIsMobileCopilotOpen(true);
          }}
          className="flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:text-foreground py-1 px-2.5 rounded-md active:scale-95 transition-colors cursor-pointer relative"
        >
          <Inbox className="w-4 h-4" />
          <span className="text-[10px] font-medium">Q&A Gaps</span>
          {workQuestions.length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-destructive absolute top-1.5 right-3" />
          )}
        </button>
      </nav>

      {/* Mobile Vault Explorer Sheet */}
      <Sheet
        isOpen={isMobileVaultOpen}
        onClose={() => setIsMobileVaultOpen(false)}
        side="left"
        className="w-[85vw] max-w-sm"
      >
        <VaultExplorer
          notes={notes}
          activeNoteId={activeNoteId}
          onSelectNote={(id) => {
            setActiveNoteId(id);
            setSelectedParagraphSnippet('');
            setProposedPatch(null);
            setIsMobileVaultOpen(false);
          }}
          onCreateNote={handleCreateNote}
          onOpenObsidianSync={() => setIsObsidianSyncOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          obsidianApiConnected={obsidianApiConnected}
          staleCount={staleCount}
          onCloseMobileDrawer={() => setIsMobileVaultOpen(false)}
          theme={theme}
          onToggleTheme={toggleTheme}
          isMockOffline={isMockOffline}
          onToggleMockOffline={handleToggleMockOffline}
        />
      </Sheet>

      {/* Mobile Clinical Copilot Sheet */}
      <Sheet
        isOpen={isMobileCopilotOpen}
        onClose={() => setIsMobileCopilotOpen(false)}
        side="right"
        className="w-[92vw] sm:w-[85vw] max-w-md"
      >
        <ClinicalCopilotPane
          note={activeNote}
          notes={notes}
          selectedTextSnippet={selectedParagraphSnippet}
          activeTab={copilotTab}
          onTabChange={setCopilotTab}
          onProposePatch={handleProposePatch}
          onAddCitationToNote={handleAddCitationToNote}
          onToggleCitationVerification={handleToggleCitationVerification}
          onInsertMarkdownToNote={handleInsertMarkdownToNote}
          questions={workQuestions}
          onAddQuestion={handleAddWorkQuestion}
          onSelectTargetNote={(id) => {
            setActiveNoteId(id);
            setSelectedParagraphSnippet('');
            setIsMobileCopilotOpen(false);
          }}
          onCloseMobileDrawer={() => setIsMobileCopilotOpen(false)}
          pendingActionTrigger={pendingActionTrigger}
          isMockOffline={isMockOffline}
          onToggleMockOffline={handleToggleMockOffline}
        />
      </Sheet>

      {/* Modals */}
      <ObsidianSyncModal
        isOpen={isObsidianSyncOpen}
        onClose={() => setIsObsidianSyncOpen(false)}
        notes={notes}
        onImportNotes={(newNotes) => setNotes((prev) => [...newNotes, ...prev])}
        apiConnected={obsidianApiConnected}
        onSetApiConnected={setObsidianApiConnected}
      />

      <VersionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        snapshots={snapshots.filter((s) => s.noteId === activeNote.id)}
        onRevertSnapshot={handleRevertSnapshot}
        noteTitle={activeNote.title}
      />
    </div>
  );
}
