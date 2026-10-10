import React from 'react';
import { computeLineDiff } from '../utils/diffUtils';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Check, X, ShieldCheck, AlertCircle } from 'lucide-react';

interface DiffViewerProps {
  originalText: string;
  proposedText: string;
  rationale?: string;
  onApply: () => void;
  onReject: () => void;
  title?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalText,
  proposedText,
  rationale,
  onApply,
  onReject,
  title = 'Proposed Note Modification',
}) => {
  const diffParts = computeLineDiff(originalText, proposedText);

  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg overflow-hidden shadow-sm my-3">
      {/* Header */}
      <div className="px-3.5 sm:px-4 py-2.5 bg-muted/60 border-b border-border flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <h4 className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">{title}</h4>
          <Badge variant="outline" className="text-[9px]">
            Audit Required
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onReject}
            className="text-xs h-7"
          >
            <X className="w-3.5 h-3.5 text-destructive mr-1" />
            Discard
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onApply}
            className="text-xs h-7"
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            Apply Patch
          </Button>
        </div>
      </div>

      {/* Rationale Banner */}
      {rationale && (
        <div className="px-3.5 py-2 bg-muted/40 border-b border-border text-xs text-foreground flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-600 dark:text-amber-400">Clinical Rationale: </span>
            <span className="text-muted-foreground">{rationale}</span>
          </div>
        </div>
      )}

      {/* Unified Diff View */}
      <div className="p-3 sm:p-4 bg-background font-mono-code text-xs leading-relaxed overflow-x-auto max-h-80 select-text">
        <div className="divide-y divide-border/40">
          {diffParts.map((part, index) => {
            if (part.added) {
              return (
                <div
                  key={index}
                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 sm:px-3 py-1.5 border-l-3 border-emerald-500 whitespace-pre-wrap flex items-start gap-2"
                >
                  <span className="text-emerald-500 font-bold select-none">+</span>
                  <span className="flex-1">{part.value}</span>
                </div>
              );
            }
            if (part.removed) {
              return (
                <div
                  key={index}
                  className="bg-destructive/10 text-destructive line-through px-2.5 sm:px-3 py-1.5 border-l-3 border-destructive whitespace-pre-wrap flex items-start gap-2"
                >
                  <span className="text-destructive font-bold select-none">-</span>
                  <span className="flex-1 opacity-80">{part.value}</span>
                </div>
              );
            }
            return (
              <div key={index} className="text-muted-foreground px-2.5 sm:px-3 py-1 whitespace-pre-wrap flex items-start gap-2">
                <span className="text-muted-foreground/60 select-none"> </span>
                <span className="flex-1">{part.value}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Notice Footer */}
      <div className="px-3.5 sm:px-4 py-1.5 bg-muted/30 border-t border-border text-[11px] text-muted-foreground flex flex-wrap items-center justify-between gap-1">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
          Automatic rollback snapshot saved prior to applying.
        </span>
        <span className="text-[10px]">Obsidian Local Patch</span>
      </div>
    </div>
  );
};
