import React, { useState } from 'react';
import { ClinicalNote, SynthesisResult, ClinicalCitation, WorkEmailQuestion } from '../types/clinical';
import { synthesizeClinicalEvidence } from '../services/api';
import { DrugReferenceView } from './DrugReferenceView';
import { CitationManager } from './CitationManager';
import { KnowledgeGapInbox } from './KnowledgeGapInbox';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Sparkles,
  Pill,
  BookOpen,
  Inbox,
  Send,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ExternalLink,
  GitCompare,
  Search,
  Stethoscope,
  X,
  Zap,
  ZapOff,
} from 'lucide-react';

interface ClinicalCopilotPaneProps {
  note: ClinicalNote;
  notes: ClinicalNote[];
  selectedTextSnippet?: string;
  activeTab: 'evidence' | 'drugs' | 'citations' | 'inbox';
  onTabChange: (tab: 'evidence' | 'drugs' | 'citations' | 'inbox') => void;
  onProposePatch: (patch: { originalText: string; proposedText: string; rationale?: string }) => void;
  onAddCitationToNote: (citation: ClinicalCitation) => void;
  onToggleCitationVerification: (citationId: string) => void;
  onInsertMarkdownToNote: (markdown: string) => void;
  questions: WorkEmailQuestion[];
  onAddQuestion: (text: string) => void;
  onSelectTargetNote: (noteId: string) => void;
  onCloseMobileDrawer?: () => void;
  pendingActionTrigger?: {
    action: 'fact-check' | 'evidence-scan' | 'drug-reference' | 'critique' | 'propose-update';
    text: string;
    timestamp: number;
  } | null;
  isMockOffline?: boolean;
  onToggleMockOffline?: () => void;
}

export const ClinicalCopilotPane: React.FC<ClinicalCopilotPaneProps> = ({
  note,
  notes,
  selectedTextSnippet,
  activeTab,
  onTabChange,
  onProposePatch,
  onAddCitationToNote,
  onToggleCitationVerification,
  onInsertMarkdownToNote,
  questions,
  onAddQuestion,
  onSelectTargetNote,
  onCloseMobileDrawer,
  pendingActionTrigger,
  isMockOffline = true,
  onToggleMockOffline,
}) => {
  const [customQuestion, setCustomQuestion] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisResult, setSynthesisResult] = useState<SynthesisResult | null>(null);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);

  React.useEffect(() => {
    if (pendingActionTrigger && pendingActionTrigger.action !== 'drug-reference') {
      handleRunSynthesis(pendingActionTrigger.action, pendingActionTrigger.text);
    }
  }, [pendingActionTrigger?.timestamp]);

  const handleRunSynthesis = async (
    action: 'fact-check' | 'evidence-scan' | 'drug-reference' | 'critique' | 'propose-update',
    overrideSnippet?: string
  ) => {
    setIsSynthesizing(true);
    setSynthesisError(null);
    const targetText = overrideSnippet || selectedTextSnippet || note.content.slice(0, 1500);

    try {
      const res = await synthesizeClinicalEvidence({
        action,
        selectedText: targetText,
        noteTitle: note.title,
        noteContext: note.content,
        clinicalQuestion: customQuestion.trim() || undefined,
      });
      setSynthesisResult(res);

      if (action === 'propose-update') {
        onProposePatch({
          originalText: targetText,
          proposedText: res.text,
          rationale: 'Evidence-based revision incorporating updated clinical trials and guidelines.',
        });
      }
    } catch (err: any) {
      setSynthesisError(err?.message || 'Synthesis failed');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleCreatePatchFromCurrent = () => {
    if (!synthesisResult) return;
    const original = selectedTextSnippet || note.content.slice(0, 800);
    onProposePatch({
      originalText: original,
      proposedText: synthesisResult.text,
      rationale: 'Revision proposed by AI clinical copilot following evidence synthesis.',
    });
  };

  return (
    <aside className="w-full h-full bg-card border-l border-border text-card-foreground flex flex-col shrink-0 select-none">
      {/* Top Mobile Dismiss Header / Tabs */}
      <div className="p-2 border-b border-border bg-muted/40 flex items-center justify-between text-xs">
        <div className="grid grid-cols-4 gap-1 flex-1 mr-2 bg-muted p-0.5 rounded-md border border-border">
          <button
            onClick={() => onTabChange('evidence')}
            className={`py-1 px-1 sm:px-2 rounded-sm flex items-center justify-center gap-1 font-medium transition-colors cursor-pointer text-xs active:scale-95 ${
              activeTab === 'evidence'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="hidden sm:inline">Copilot</span>
            <span className="sm:hidden">AI</span>
          </button>

          <button
            onClick={() => onTabChange('drugs')}
            className={`py-1 px-1 sm:px-2 rounded-sm flex items-center justify-center gap-1 font-medium transition-colors cursor-pointer text-xs active:scale-95 ${
              activeTab === 'drugs'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Pill className="w-3 h-3 text-indigo-500" />
            <span>Drugs</span>
          </button>

          <button
            onClick={() => onTabChange('citations')}
            className={`py-1 px-1 sm:px-2 rounded-sm flex items-center justify-center gap-1 font-medium transition-colors cursor-pointer text-xs active:scale-95 ${
              activeTab === 'citations'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen className="w-3 h-3 text-cyan-500" />
            <span className="hidden sm:inline">Citations</span>
            <span className="sm:hidden">Refs</span>
          </button>

          <button
            onClick={() => onTabChange('inbox')}
            className={`py-1 px-1 sm:px-2 rounded-sm flex items-center justify-center gap-1 font-medium transition-colors cursor-pointer text-xs active:scale-95 relative ${
              activeTab === 'inbox'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Inbox className="w-3 h-3 text-amber-500" />
            <span className="hidden sm:inline">Q&A Gaps</span>
            <span className="sm:hidden">Gaps</span>
            {questions.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-destructive absolute top-1 right-1" />
            )}
          </button>
        </div>

        {onCloseMobileDrawer && (
          <Button
            variant="ghost"
            size="iconSm"
            onClick={onCloseMobileDrawer}
            className="lg:hidden shrink-0 text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-3 text-xs">
        {activeTab === 'evidence' && (
          <div className="h-full flex flex-col space-y-3">
            {/* Context Box */}
            <div className="p-3 bg-muted/50 border border-border rounded-lg space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground text-[10px] font-mono">
                <span className="flex items-center gap-1">
                  {selectedTextSnippet ? (
                    <Badge variant="default" className="text-[9px] py-0 px-1.5 font-sans">
                      Highlighted Excerpt
                    </Badge>
                  ) : (
                    <span>FULL NOTE TARGET</span>
                  )}
                </span>
                <span className="truncate max-w-[130px] sm:max-w-[170px]">{note.title}</span>
              </div>
              <p className="text-foreground text-[11.5px] line-clamp-3 italic font-serif-clinical bg-card p-2 rounded-md border border-border">
                "{selectedTextSnippet || note.content.slice(0, 180)}..."
              </p>
              <div className="text-[10px] text-muted-foreground">
                {selectedTextSnippet
                  ? 'AI synthesis focused on highlighted excerpt.'
                  : 'Highlight any paragraph in reader for targeted co-authoring.'}
              </div>
            </div>

            {/* Offline Mock Simulation Alert Banner */}
            {isMockOffline && (
              <div className="p-2 px-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between gap-2 text-[11px] text-emerald-700 dark:text-emerald-400">
                <div className="flex items-center gap-1.5 truncate">
                  <Zap className="w-3.5 h-3.5 text-emerald-500 shrink-0 fill-emerald-500/30" />
                  <span className="font-medium truncate">Offline Simulation Active (0 Tokens Burned)</span>
                </div>
                {onToggleMockOffline && (
                  <button
                    onClick={onToggleMockOffline}
                    className="text-[10px] font-mono underline hover:no-underline shrink-0 text-emerald-600 dark:text-emerald-300 cursor-pointer"
                  >
                    Switch to Live
                  </button>
                )}
              </div>
            )}

            {/* Structured Quick Actions */}
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                variant="outline"
                onClick={() => handleRunSynthesis('fact-check')}
                disabled={isSynthesizing}
                className="justify-start gap-1.5 text-[11px] h-8.5 font-normal"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">Is this current?</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleRunSynthesis('evidence-scan')}
                disabled={isSynthesizing}
                className="justify-start gap-1.5 text-[11px] h-8.5 font-normal"
              >
                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">Find Trials</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleRunSynthesis('critique')}
                disabled={isSynthesizing}
                className="justify-start gap-1.5 text-[11px] h-8.5 font-normal"
              >
                <Stethoscope className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">Critique</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleRunSynthesis('propose-update')}
                disabled={isSynthesizing}
                className="justify-start gap-1.5 text-[11px] h-8.5 font-normal"
              >
                <GitCompare className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">Propose Diff</span>
              </Button>
            </div>

            {/* Custom Clinical Query Input */}
            <div className="p-2 bg-muted/40 border border-border rounded-lg space-y-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ask specific medical question..."
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunSynthesis('fact-check')}
                  className="w-full bg-background border border-input rounded-md pl-2.5 pr-7 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                />
                <button
                  onClick={() => handleRunSynthesis('fact-check')}
                  disabled={isSynthesizing || !customQuestion.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-primary hover:text-primary/80 disabled:opacity-30 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Loading Indicator */}
            {isSynthesizing && (
              <div className="p-5 text-center space-y-1.5 bg-muted/30 rounded-lg border border-border animate-pulse">
                <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
                <p className="text-xs text-foreground font-medium">
                  Synthesizing trial evidence & checking guidelines...
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  Grounding via PubMed, ADA, KDIGO & Google Search
                </p>
              </div>
            )}

            {synthesisError && (
              <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{synthesisError}</span>
                </div>
                <button
                  onClick={() => handleRunSynthesis('fact-check')}
                  className="text-[11px] underline hover:text-foreground font-mono cursor-pointer"
                >
                  Retry with Offline Guideline Synthesizer
                </button>
              </div>
            )}

            {/* Synthesis Results Display */}
            {synthesisResult && !isSynthesizing && (
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {/* Fallback Notice Bar */}
                {synthesisResult.isQuotaFallback && (
                  <div className="p-2 bg-primary/10 border border-primary/20 rounded-md text-[11px] text-primary flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div className="leading-tight">
                      <span className="font-medium">Offline Clinical Engine:</span>{' '}
                      <span className="opacity-90">{synthesisResult.fallbackNotice || 'Evidence verified via SynapseMD Clinical Guidelines (KDIGO/ADA/ACC) & PubMed.'}</span>
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                {synthesisResult.parsedStatus && (
                  <div
                    className={`p-2.5 rounded-lg border flex items-center justify-between text-xs font-semibold ${
                      synthesisResult.parsedStatus === 'CURRENT & SUPPORTED'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : synthesisResult.parsedStatus === 'REQUIRES QUALIFICATION'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        : 'bg-destructive/10 text-destructive border-destructive/20'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {synthesisResult.parsedStatus === 'CURRENT & SUPPORTED' && (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                      {synthesisResult.parsedStatus === 'REQUIRES QUALIFICATION' && (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      {synthesisResult.parsedStatus === 'OUTDATED / SUPERSEDED' && (
                        <XCircle className="w-3.5 h-3.5 text-destructive" />
                      )}
                      <span>{synthesisResult.parsedStatus}</span>
                    </div>
                    <Badge variant="outline" className="text-[9.5px]">
                      Consensus Check
                    </Badge>
                  </div>
                )}

                {/* Synthesis Body */}
                <div className="p-3 bg-card rounded-lg border border-border space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] pb-1 border-b border-border">
                    <span className="font-semibold text-foreground">Evidence Synthesis Output</span>
                    <button
                      onClick={handleCreatePatchFromCurrent}
                      className="text-primary hover:underline flex items-center gap-1 text-[10.5px] cursor-pointer"
                    >
                      <GitCompare className="w-3 h-3" />
                      Review Diff
                    </button>
                  </div>
                  <div className="text-foreground text-xs font-serif-clinical leading-relaxed whitespace-pre-wrap select-text">
                    {synthesisResult.text}
                  </div>
                </div>

                {/* Grounded Web Sources */}
                {synthesisResult.webSources && synthesisResult.webSources.length > 0 && (
                  <div className="p-2.5 bg-muted/40 rounded-lg border border-border space-y-1">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                      Grounded Sources ({synthesisResult.webSources.length})
                    </span>
                    <div className="space-y-1">
                      {synthesisResult.webSources.map((s, idx) => (
                        <a
                          key={idx}
                          href={s.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-1 rounded bg-card hover:bg-accent text-foreground text-[10.5px] transition-colors border border-border"
                        >
                          <span className="truncate pr-2">{s.title}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 text-muted-foreground" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'drugs' && (
          <DrugReferenceView
            initialDrugName={note.tags.find((t) => ['sglt2i', 'glp1ra', 'doac', 'mra'].includes(t)) || ''}
            onInsertToNote={onInsertMarkdownToNote}
          />
        )}

        {activeTab === 'citations' && (
          <CitationManager
            note={note}
            onAddCitationToNote={onAddCitationToNote}
            onToggleVerification={onToggleCitationVerification}
          />
        )}

        {activeTab === 'inbox' && (
          <KnowledgeGapInbox
            questions={questions}
            notes={notes}
            onAddQuestion={onAddQuestion}
            onSelectTargetNote={onSelectTargetNote}
            onProposeSectionUpdate={(targetTitle, markdown, rationale) => {
              const target = notes.find(
                (n) => n.title.toLowerCase() === targetTitle.toLowerCase()
              );
              if (target) {
                onSelectTargetNote(target.id);
              }
              onProposePatch({
                originalText: '## (New Section from Knowledge Gap Engine)',
                proposedText: markdown,
                rationale,
              });
            }}
          />
        )}
      </div>
    </aside>
  );
};
