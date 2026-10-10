import React from 'react';
import { NoteSnapshot } from '../types/clinical';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { History, RotateCcw, X, Clock } from 'lucide-react';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: NoteSnapshot[];
  onRevertSnapshot: (snapshot: NoteSnapshot) => void;
  noteTitle: string;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  snapshots,
  onRevertSnapshot,
  noteTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-card text-card-foreground border border-border rounded-xl max-w-xl w-full p-4 sm:p-5 shadow-xl space-y-3 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2.5 border-b border-border">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary shrink-0" />
            <div className="min-w-0">
              <h3 className="font-semibold text-xs sm:text-sm text-foreground truncate">Vault Version History</h3>
              <p className="text-[10.5px] sm:text-xs text-muted-foreground truncate">
                Snapshots for "{noteTitle}"
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="iconSm"
            onClick={onClose}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {snapshots.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-xs">
              No previous version snapshots saved for this note yet. An automatic snapshot is captured each time an AI update proposal is accepted.
            </div>
          ) : (
            snapshots.map((snap) => (
              <div
                key={snap.id}
                className="p-2.5 bg-muted/40 border border-border rounded-lg space-y-1.5 hover:border-border/80 transition-colors"
              >
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-foreground">
                    <Clock className="w-3 h-3 text-primary" />
                    <span className="font-mono text-[10.5px]">
                      {new Date(snap.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onRevertSnapshot(snap);
                      onClose();
                    }}
                    className="h-6 text-[10px] px-2"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Restore Version
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground text-[11px]">
                  <span className="font-semibold text-foreground">Trigger: </span>
                  {snap.reason}
                </div>

                <div className="p-2 bg-background rounded-md text-xs font-mono-code text-muted-foreground max-h-24 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-border">
                  {snap.content.slice(0, 350)}...
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
