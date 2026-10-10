import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ClinicalNote } from '../types/clinical';
import { parseMarkdownBlocks, MarkdownParagraphBlock } from '../utils/markdownUtils';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  BookOpen,
  Edit3,
  GitCompare,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Sparkles,
  Search,
  Pill,
  Stethoscope,
  FileCheck,
  Copy,
  Check,
  FileText,
  Menu,
  PanelRight,
  Sun,
  Moon,
  X,
  AlertTriangle,
  Lightbulb,
  Info,
  HelpCircle,
  Send,
  MessageSquare,
} from 'lucide-react';

interface NoteEditorProps {
  note: ClinicalNote;
  onUpdateContent: (newContent: string) => void;
  onToggleReviewed: () => void;
  onNavigateWikiLink: (linkTitle: string) => void;
  onTriggerClinicalAction: (action: 'fact-check' | 'evidence-scan' | 'drug-reference' | 'critique' | 'propose-update', text: string) => void;
  onOpenCitationTab: () => void;
  proposedPatch?: {
    originalText: string;
    proposedText: string;
    rationale?: string;
  } | null;
  onApplyPatch?: () => void;
  onRejectPatch?: () => void;
  onOpenMobileVault?: () => void;
  onOpenMobileCopilot?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

interface FloatingToolbarState {
  text: string;
  top: number;
  left: number;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  onUpdateContent,
  onToggleReviewed,
  onNavigateWikiLink,
  onTriggerClinicalAction,
  onOpenCitationTab,
  proposedPatch,
  onApplyPatch,
  onRejectPatch,
  onOpenMobileVault,
  onOpenMobileCopilot,
  theme,
  onToggleTheme,
}) => {
  const [viewMode, setViewMode] = useState<'reader' | 'editor' | 'diff'>('reader');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [floatingToolbar, setFloatingToolbar] = useState<FloatingToolbarState | null>(null);
  const [showCustomAsk, setShowCustomAsk] = useState(false);
  const [customQuestionInput, setCustomQuestionInput] = useState('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);

  const blocks = useMemo(() => parseMarkdownBlocks(note.content), [note.content]);

  const lastCheckDate = new Date(note.lastChecked);
  const isStale = lastCheckDate.getTime() < Date.now() - 365 * 24 * 60 * 60 * 1000 || !note.reviewed;
  const daysSinceCheck = Math.floor((Date.now() - lastCheckDate.getTime()) / (1000 * 60 * 60 * 24));

  const handleCopy = () => {
    navigator.clipboard.writeText(note.content);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // Handle native text selection for the "Highlight to Ask" toolbar
  const handleSelection = () => {
    if (viewMode !== 'reader') return;
    const selection = window.getSelection();

    if (!selection || selection.isCollapsed) {
      if (!showCustomAsk) {
        setFloatingToolbar(null);
      }
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 3) {
      if (!showCustomAsk) {
        setFloatingToolbar(null);
      }
      return;
    }

    // Ensure selection originated within our article
    if (articleRef.current && selection.anchorNode && !articleRef.current.contains(selection.anchorNode)) {
      setFloatingToolbar(null);
      return;
    }

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        setFloatingToolbar(null);
        return;
      }

      const toolbarWidth = Math.min(480, window.innerWidth - 24);
      let top = rect.top - 52;
      // If too close to header, display right beneath the highlighted text
      if (top < 70) {
        top = rect.bottom + 10;
      }
      const left = Math.max(12, Math.min(window.innerWidth - toolbarWidth - 12, rect.left + rect.width / 2 - toolbarWidth / 2));

      setFloatingToolbar({
        text,
        top,
        left,
      });
      setShowCustomAsk(false);
    } catch {
      setFloatingToolbar(null);
    }
  };

  // Close floating toolbar on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!showCustomAsk) {
        setFloatingToolbar(null);
      }
    };
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [showCustomAsk]);

  // Bind mouseup, touchend, and keyup on article
  useEffect(() => {
    const article = articleRef.current;
    if (!article) return;

    const onSelectionTrigger = () => {
      setTimeout(handleSelection, 20);
    };

    article.addEventListener('mouseup', onSelectionTrigger);
    article.addEventListener('touchend', onSelectionTrigger);
    article.addEventListener('keyup', onSelectionTrigger);

    return () => {
      article.removeEventListener('mouseup', onSelectionTrigger);
      article.removeEventListener('touchend', onSelectionTrigger);
      article.removeEventListener('keyup', onSelectionTrigger);
    };
  }, [viewMode]);

  const handleAction = (
    action: 'fact-check' | 'evidence-scan' | 'drug-reference' | 'critique' | 'propose-update',
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!floatingToolbar) return;
    const selectedText = floatingToolbar.text;
    onTriggerClinicalAction(action, selectedText);
    if (onOpenMobileCopilot) onOpenMobileCopilot();
    setFloatingToolbar(null);
    setShowCustomAsk(false);
  };

  const handleCustomAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!floatingToolbar || !customQuestionInput.trim()) return;
    onTriggerClinicalAction('critique', `${floatingToolbar.text}\n\nClinical Question: ${customQuestionInput.trim()}`);
    if (onOpenMobileCopilot) onOpenMobileCopilot();
    setFloatingToolbar(null);
    setShowCustomAsk(false);
    setCustomQuestionInput('');
  };

  // Comprehensive, seamless inline Markdown renderer
  const renderFormattedInline = (rawText: string) => {
    const tokens: React.ReactNode[] = [];
    const inlineRegex = /(\[\[.*?\]\])|(\*\*.*?\*\*)|(\*.*?\*)|(`.*?`)|(\[.*?\]\(.*?\))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = inlineRegex.exec(rawText)) !== null) {
      if (match.index > lastIndex) {
        tokens.push(rawText.substring(lastIndex, match.index));
      }

      const matchedString = match[0];

      // 1. [[Wiki-Links]]
      if (matchedString.startsWith('[[')) {
        const rawLink = matchedString.slice(2, -2);
        const [targetNote, alias] = rawLink.split('|');
        const displayText = alias ? alias.trim() : targetNote.trim();

        tokens.push(
          <button
            key={`wiki-${match.index}`}
            onClick={(e) => {
              e.stopPropagation();
              onNavigateWikiLink(targetNote.trim());
            }}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-md bg-secondary text-secondary-foreground hover:bg-accent border border-border font-mono text-[11px] transition-colors cursor-pointer align-baseline"
          >
            <span className="text-muted-foreground font-semibold">[[</span>
            <span className="underline decoration-primary decoration-1 underline-offset-2">{displayText}</span>
            <span className="text-muted-foreground font-semibold">]]</span>
          </button>
        );
      }
      // 2. **Bold**
      else if (matchedString.startsWith('**') && matchedString.endsWith('**')) {
        const inner = matchedString.slice(2, -2);
        tokens.push(
          <strong key={`b-${match.index}`} className="font-semibold text-foreground">
            {inner}
          </strong>
        );
      }
      // 3. *Italics*
      else if (matchedString.startsWith('*') && matchedString.endsWith('*')) {
        const inner = matchedString.slice(1, -1);
        tokens.push(
          <em key={`i-${match.index}`} className="italic">
            {inner}
          </em>
        );
      }
      // 4. `Inline code`
      else if (matchedString.startsWith('`') && matchedString.endsWith('`')) {
        const inner = matchedString.slice(1, -1);
        tokens.push(
          <code
            key={`code-${match.index}`}
            className="font-mono text-xs bg-muted text-foreground px-1.5 py-0.5 rounded border border-border"
          >
            {inner}
          </code>
        );
      }
      // 5. [Link](url)
      else if (matchedString.startsWith('[')) {
        const linkMatch = matchedString.match(/^\[(.*?)\]\((.*?)\)$/);
        if (linkMatch) {
          tokens.push(
            <a
              key={`link-${match.index}`}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:opacity-80 font-medium"
            >
              {linkMatch[1]}
            </a>
          );
        } else {
          tokens.push(matchedString);
        }
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < rawText.length) {
      tokens.push(rawText.substring(lastIndex));
    }

    return tokens;
  };

  return (
    <main className="flex-1 h-full bg-background text-foreground flex flex-col min-w-0 overflow-hidden relative">
      {/* Mobile Top Bar */}
      <div className="lg:hidden px-3 py-2 bg-card border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {onOpenMobileVault && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenMobileVault}
              className="flex items-center gap-1.5 h-7 px-2 text-xs"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>Vault</span>
            </Button>
          )}
          <span className="text-xs font-semibold text-foreground truncate max-w-[130px] sm:max-w-[200px]">
            {note.title}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {onToggleTheme && (
            <Button
              variant="ghost"
              size="iconSm"
              onClick={onToggleTheme}
              className="h-7 w-7"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </Button>
          )}
          {onOpenMobileCopilot && (
            <Button
              variant="default"
              size="sm"
              onClick={onOpenMobileCopilot}
              className="flex items-center gap-1 h-7 px-2 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Copilot</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-border bg-card/60 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap">
            <span className="font-mono text-primary font-medium uppercase tracking-wider">
              {note.folder}
            </span>
            <span>/</span>
            <span className="truncate">{note.specialty}</span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-foreground truncate tracking-tight mt-0.5">
            {note.title}
          </h1>
        </div>

        {/* View Switcher & Action Tools */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* View Mode Toggle */}
          <div className="bg-muted p-0.5 rounded-md border border-border flex items-center text-xs">
            <button
              onClick={() => {
                setViewMode('reader');
                setFloatingToolbar(null);
              }}
              className={`px-2 py-0.5 rounded-sm flex items-center gap-1 transition-colors cursor-pointer text-xs ${
                viewMode === 'reader'
                  ? 'bg-background text-foreground font-medium shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span className="hidden sm:inline">Reader</span>
            </button>
            <button
              onClick={() => {
                setViewMode('editor');
                setFloatingToolbar(null);
              }}
              className={`px-2 py-0.5 rounded-sm flex items-center gap-1 transition-colors cursor-pointer text-xs ${
                viewMode === 'editor'
                  ? 'bg-background text-foreground font-medium shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            {proposedPatch && (
              <button
                onClick={() => {
                  setViewMode('diff');
                  setFloatingToolbar(null);
                }}
                className={`px-2 py-0.5 rounded-sm flex items-center gap-1 transition-colors cursor-pointer text-xs ${
                  viewMode === 'diff'
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium'
                    : 'text-amber-500 hover:text-amber-400'
                }`}
              >
                <GitCompare className="w-3 h-3" />
                <span>Diff</span>
              </button>
            )}
          </div>

          {/* Copy Button */}
          <Button
            variant="outline"
            size="iconSm"
            onClick={handleCopy}
            title="Copy Note Markdown"
          >
            {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>

          {/* Desktop Theme Toggle */}
          {onToggleTheme && (
            <Button
              variant="outline"
              size="iconSm"
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="hidden lg:flex"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </Button>
          )}

          {/* Desktop Copilot trigger if drawer */}
          {onOpenMobileCopilot && (
            <Button
              variant="outline"
              size="iconSm"
              onClick={onOpenMobileCopilot}
              className="lg:hidden text-primary"
              title="Open AI Clinical Copilot"
            >
              <PanelRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Clinical Audit & Evidence Freshness Ribbon */}
      <div className="px-4 sm:px-6 py-1.5 bg-muted/40 border-b border-border flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Review Audit Status */}
          <button
            onClick={onToggleReviewed}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer text-[11px] active:scale-95 ${
              note.reviewed
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                : 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20'
            }`}
          >
            {note.reviewed ? (
              <>
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>Verified</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3 h-3 text-destructive" />
                <span>Audit Pending</span>
              </>
            )}
          </button>

          {/* Staleness / Recency Check */}
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-mono ${
              isStale
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                : 'text-muted-foreground'
            }`}
          >
            <Clock className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Checked: {note.lastChecked}</span>
            {isStale && (
              <span className="font-semibold text-amber-600 dark:text-amber-400 ml-0.5 hidden sm:inline">
                ({daysSinceCheck}d ago)
              </span>
            )}
          </div>

          {/* Citations Count */}
          <button
            onClick={onOpenCitationTab}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-[10.5px]"
          >
            <FileText className="w-3 h-3 text-primary shrink-0" />
            <span className="font-mono">{note.citationsCount || 0} Citations</span>
          </button>
        </div>

        {/* Note-Level Fast Action */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground italic hidden md:inline">
            Highlight text to ask AI or synthesize
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onTriggerClinicalAction('critique', note.content);
              if (onOpenMobileCopilot) onOpenMobileCopilot();
            }}
            className="text-[10.5px] h-6 px-2"
          >
            <Sparkles className="w-3 h-3 mr-1 text-primary" />
            <span>Critique Note</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 select-text"
      >
        {viewMode === 'reader' && (
          <article
            ref={articleRef}
            className="max-w-3xl mx-auto text-foreground"
          >
            {/* Seamless, minimal Frontmatter header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-5 border-b border-border/70 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="font-mono text-[10px] py-0 px-1.5">
                  evidence: {note.evidenceLevel}
                </Badge>
                {note.tags.map((t) => (
                  <Badge
                    key={t}
                    variant="outline"
                    className="font-mono text-[10px] py-0 px-1.5"
                  >
                    #{t}
                  </Badge>
                ))}
              </div>
              <span className="font-mono text-[10.5px] text-muted-foreground truncate max-w-[200px]">
                {note.path}
              </span>
            </div>

            {/* Seamless, coherent single-page Markdown article flow */}
            <div>
              {blocks.map((block) => {
                if (block.type === 'frontmatter') return null;

                // Headings
                if (block.type === 'heading') {
                  if (block.headingLevel === 1) {
                    return (
                      <h1
                        key={block.id}
                        className="text-xl sm:text-2xl font-bold text-foreground tracking-tight pt-2 pb-2 border-b border-border mt-5 mb-3.5 first:mt-0"
                      >
                        {renderFormattedInline(block.cleanText)}
                      </h1>
                    );
                  }
                  if (block.headingLevel === 2) {
                    return (
                      <h2
                        key={block.id}
                        className="text-base sm:text-lg font-semibold text-foreground tracking-tight mt-6 mb-2.5"
                      >
                        {renderFormattedInline(block.cleanText)}
                      </h2>
                    );
                  }
                  return (
                    <h3
                      key={block.id}
                      className="text-sm sm:text-base font-semibold text-foreground tracking-tight mt-4 mb-2"
                    >
                      {renderFormattedInline(block.cleanText)}
                    </h3>
                  );
                }

                // Callouts (e.g. > [!NOTE], > [!WARNING])
                if (block.type === 'callout') {
                  const calloutType = block.calloutType || 'note';
                  const isWarning = calloutType === 'warning' || calloutType === 'alert';
                  const isTip = calloutType === 'tip' || calloutType === 'pearl';

                  return (
                    <div
                      key={block.id}
                      className={`my-3 p-3.5 rounded-r-lg border-l-3 text-[13.5px] sm:text-[14px] leading-relaxed font-serif-clinical ${
                        isWarning
                          ? 'bg-amber-500/10 border-amber-500 text-foreground'
                          : isTip
                          ? 'bg-emerald-500/10 border-emerald-500 text-foreground'
                          : 'bg-muted/50 border-primary text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-sans font-bold text-xs uppercase tracking-wider mb-1.5">
                        {isWarning ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        ) : isTip ? (
                          <Lightbulb className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Info className="w-3.5 h-3.5 text-primary" />
                        )}
                        <span>{block.calloutTitle || 'CLINICAL NOTE'}</span>
                      </div>
                      <div>{renderFormattedInline(block.cleanText)}</div>
                    </div>
                  );
                }

                // Tables
                if (block.type === 'table') {
                  const rows = block.rawText.split('\n').filter((r) => r.trim().startsWith('|'));
                  const headerRow = rows[0] || '';
                  const dataRows = rows.slice(2); // Skip separator row

                  const parseCells = (rowText: string) =>
                    rowText
                      .split('|')
                      .slice(1, -1)
                      .map((c) => c.trim());

                  const headers = parseCells(headerRow);

                  return (
                    <div key={block.id} className="my-3.5 overflow-x-auto rounded-md border border-border">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-muted text-foreground border-b border-border">
                          <tr>
                            {headers.map((h, i) => (
                              <th key={i} className="p-2.5 font-semibold">
                                {renderFormattedInline(h)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {dataRows.map((dr, ri) => (
                            <tr key={ri} className="hover:bg-muted/40">
                              {parseCells(dr).map((cell, ci) => (
                                <td key={ci} className="p-2.5">
                                  {renderFormattedInline(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                // Code block
                if (block.type === 'code') {
                  return (
                    <pre
                      key={block.id}
                      className="my-3 p-3 rounded-md bg-muted text-foreground font-mono text-xs overflow-x-auto border border-border"
                    >
                      <code>{block.cleanText}</code>
                    </pre>
                  );
                }

                // Divider (---)
                if (block.type === 'divider') {
                  return <hr key={block.id} className="my-5 border-border" />;
                }

                // Lists
                if (block.type === 'list') {
                  const listItems = block.rawText.split('\n').filter((l) => l.trim().length > 0);
                  const isNumbered = /^\s*\d+\.\s/.test(listItems[0] || '');

                  if (isNumbered) {
                    return (
                      <ol
                        key={block.id}
                        className="my-2.5 pl-6 list-decimal space-y-1 text-[14px] sm:text-[14.5px] font-serif-clinical leading-relaxed"
                      >
                        {listItems.map((item, idx) => (
                          <li key={idx}>
                            {renderFormattedInline(item.replace(/^\s*\d+\.\s+/, ''))}
                          </li>
                        ))}
                      </ol>
                    );
                  }

                  return (
                    <ul
                      key={block.id}
                      className="my-2.5 pl-6 list-disc space-y-1 text-[14px] sm:text-[14.5px] font-serif-clinical leading-relaxed"
                    >
                      {listItems.map((item, idx) => (
                        <li key={idx}>
                          {renderFormattedInline(item.replace(/^\s*[-*]\s+/, ''))}
                        </li>
                      ))}
                    </ul>
                  );
                }

                // Default cohesive paragraph
                return (
                  <p
                    key={block.id}
                    className="text-foreground text-[14.5px] sm:text-[15px] leading-[1.75] font-serif-clinical mb-3.5"
                  >
                    {renderFormattedInline(block.cleanText)}
                  </p>
                );
              })}
            </div>
          </article>
        )}

        {viewMode === 'editor' && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between text-xs text-muted-foreground pb-1.5 mb-1.5 border-b border-border font-mono">
              <span>RAW OBSIDIAN MARKDOWN</span>
              <span className="text-[10.5px] hidden sm:inline">Auto-syncs to vault</span>
            </div>
            <textarea
              value={note.content}
              onChange={(e) => onUpdateContent(e.target.value)}
              className="flex-1 w-full bg-card text-card-foreground font-mono-code text-xs leading-relaxed p-3 sm:p-4 border border-input rounded-lg focus:outline-none focus:border-ring resize-none min-h-[450px]"
            />
          </div>
        )}

        {viewMode === 'diff' && proposedPatch && (
          <div className="max-w-3xl mx-auto">
            <div className="p-3.5 bg-card border border-border rounded-lg mb-3">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                <GitCompare className="w-4 h-4 text-amber-500" />
                Proposed Knowledge Update Review
              </h3>
              <p className="text-xs text-muted-foreground mb-2.5">
                Review the AI-generated update against your current clinical note. No text is modified until you explicitly approve.
              </p>
              {proposedPatch.rationale && (
                <div className="p-2.5 bg-muted rounded-md text-xs text-foreground border border-border mb-2.5">
                  <span className="font-semibold text-primary">Rationale: </span>
                  {proposedPatch.rationale}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRejectPatch}
                >
                  Discard Proposal
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={onApplyPatch}
                  className="flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Apply Update
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono-code">
              <div className="p-3 bg-muted/60 border border-border rounded-lg">
                <div className="text-muted-foreground font-bold mb-1.5 pb-1 border-b border-border text-[11px]">
                  CURRENT VAULT TEXT
                </div>
                <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {proposedPatch.originalText}
                </div>
              </div>
              <div className="p-3 bg-card border border-primary/30 rounded-lg">
                <div className="text-primary font-bold mb-1.5 pb-1 border-b border-border text-[11px]">
                  PROPOSED REVISION & CITATIONS
                </div>
                <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {proposedPatch.proposedText}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating "Highlight to Ask" Toolbar (Desktop & Tablet) */}
      {floatingToolbar && (
        <div
          onMouseDown={(e) => {
            // Prevent selection from collapsing when clicking inside toolbar
            e.preventDefault();
            e.stopPropagation();
          }}
          style={{
            top: `${floatingToolbar.top}px`,
            left: `${floatingToolbar.left}px`,
          }}
          className="fixed z-50 bg-popover text-popover-foreground border border-border shadow-2xl rounded-full px-2 py-1.5 flex items-center gap-1 animate-in fade-in zoom-in-95 backdrop-blur-md select-none pointer-events-auto"
        >
          {!showCustomAsk ? (
            <div className="flex items-center gap-0.5 text-[11px]">
              <button
                onClick={(e) => handleAction('fact-check', e)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-accent text-foreground transition-colors cursor-pointer active:scale-95 font-medium whitespace-nowrap"
                title="Is this claim current with latest guidelines?"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Current?</span>
              </button>

              <div className="w-px h-3.5 bg-border shrink-0 mx-0.5" />

              <button
                onClick={(e) => handleAction('evidence-scan', e)}
                className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer active:scale-95 whitespace-nowrap"
                title="Find trials & PubMed citations"
              >
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Trials</span>
              </button>

              <button
                onClick={(e) => handleAction('drug-reference', e)}
                className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer active:scale-95 whitespace-nowrap"
                title="Drug monograph & openFDA"
              >
                <Pill className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Drug</span>
              </button>

              <button
                onClick={(e) => handleAction('critique', e)}
                className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer active:scale-95 whitespace-nowrap"
                title="Clinical critique & omitted caveats"
              >
                <Stethoscope className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Critique</span>
              </button>

              <button
                onClick={(e) => handleAction('propose-update', e)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer active:scale-95 ml-0.5 font-medium whitespace-nowrap shadow-xs"
                title="Propose revised section with citations"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Propose Diff</span>
              </button>

              <div className="w-px h-3.5 bg-border shrink-0 mx-0.5" />

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCustomAsk(true);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer active:scale-95 whitespace-nowrap"
                title="Ask custom question about highlighted text"
              >
                <MessageSquare className="w-3 h-3 text-primary" />
                <span>Ask...</span>
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFloatingToolbar(null);
                }}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ml-0.5 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleCustomAskSubmit} className="flex items-center gap-1.5 px-1 py-0.5 text-xs">
              <input
                type="text"
                autoFocus
                value={customQuestionInput}
                onChange={(e) => setCustomQuestionInput(e.target.value)}
                placeholder="Ask about highlighted text..."
                className="w-52 sm:w-64 bg-background text-foreground text-xs px-2.5 py-1 rounded-full border border-input focus:outline-none focus:border-ring placeholder:text-muted-foreground"
              />
              <Button type="submit" size="iconSm" variant="default" className="h-6 w-6 rounded-full shrink-0">
                <Send className="w-3 h-3" />
              </Button>
              <button
                type="button"
                onClick={() => setShowCustomAsk(false)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* Mobile Floating Bottom Action Ribbon when text is selected */}
      {floatingToolbar && (
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="lg:hidden fixed bottom-16 inset-x-3 z-50 bg-popover text-popover-foreground border border-border shadow-2xl rounded-xl p-2.5 backdrop-blur-md select-none animate-in slide-in-from-bottom duration-150"
        >
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border text-[11px]">
            <span className="font-medium text-foreground truncate max-w-[240px]">
              Highlighted: "{floatingToolbar.text.slice(0, 36)}..."
            </span>
            <button
              onClick={() => setFloatingToolbar(null)}
              className="text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[10.5px]">
            <button
              onClick={(e) => handleAction('fact-check', e)}
              className="flex items-center justify-center gap-1 py-1.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-medium active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Current?</span>
            </button>
            <button
              onClick={(e) => handleAction('evidence-scan', e)}
              className="flex items-center justify-center gap-1 py-1.5 rounded-md bg-secondary text-secondary-foreground border border-border active:scale-95 cursor-pointer"
            >
              <Search className="w-3 h-3" />
              <span>Trials</span>
            </button>
            <button
              onClick={(e) => handleAction('drug-reference', e)}
              className="flex items-center justify-center gap-1 py-1.5 rounded-md bg-secondary text-secondary-foreground border border-border active:scale-95 cursor-pointer"
            >
              <Pill className="w-3 h-3" />
              <span>Drug</span>
            </button>
            <button
              onClick={(e) => handleAction('critique', e)}
              className="flex items-center justify-center gap-1 py-1.5 rounded-md bg-secondary text-secondary-foreground border border-border active:scale-95 cursor-pointer"
            >
              <Stethoscope className="w-3 h-3" />
              <span>Critique</span>
            </button>
            <button
              onClick={(e) => handleAction('propose-update', e)}
              className="col-span-2 flex items-center justify-center gap-1 py-1.5 rounded-md bg-primary text-primary-foreground font-medium active:scale-95 cursor-pointer"
            >
              <FileCheck className="w-3 h-3" />
              <span>Propose Diff</span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
