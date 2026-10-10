import React, { useState } from 'react';
import { FdaDrugLabel } from '../types/clinical';
import { fetchFdaDrugLabel, synthesizeClinicalEvidence } from '../services/api';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Pill,
  Search,
  ExternalLink,
  Loader2,
  Plus,
  ShieldAlert,
  Activity,
} from 'lucide-react';

interface DrugReferenceViewProps {
  initialDrugName?: string;
  onInsertToNote: (markdownText: string) => void;
}

export const DrugReferenceView: React.FC<DrugReferenceViewProps> = ({
  initialDrugName = '',
  onInsertToNote,
}) => {
  const [drugQuery, setDrugQuery] = useState(initialDrugName || 'Dapagliflozin');
  const [isLoading, setIsLoading] = useState(false);
  const [fdaLabel, setFdaLabel] = useState<FdaDrugLabel | null>(null);
  const [geminiMonograph, setGeminiMonograph] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (drugName?: string) => {
    const target = (drugName || drugQuery).trim();
    if (!target) return;

    setIsLoading(true);
    setError(null);
    setFdaLabel(null);
    setGeminiMonograph(null);

    try {
      const [fdaRes, geminiRes] = await Promise.allSettled([
        fetchFdaDrugLabel(target),
        synthesizeClinicalEvidence({
          action: 'drug-reference',
          drugName: target,
          selectedText: target,
        }),
      ]);

      if (fdaRes.status === 'fulfilled' && fdaRes.value.found) {
        setFdaLabel(fdaRes.value);
      }

      if (geminiRes.status === 'fulfilled') {
        setGeminiMonograph(geminiRes.value.text);
      } else {
        throw new Error('Failed to retrieve clinical monograph');
      }
    } catch (err: any) {
      setError(err?.message || 'Drug lookup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertMonograph = () => {
    if (!geminiMonograph) return;
    const textToInsert = `\n\n## Clinical Monograph: ${drugQuery}\n${geminiMonograph}\n`;
    onInsertToNote(textToInsert);
  };

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Search Header */}
      <div className="p-3 bg-card border border-border rounded-lg space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Pill className="w-3.5 h-3.5 text-primary" />
            Drug Monograph & openFDA
          </span>
          <Badge variant="outline" className="text-[9.5px]">
            FDA Labels
          </Badge>
        </div>

        <div className="flex gap-1.5">
          <input
            type="text"
            placeholder="Search drug, e.g. Dapagliflozin, Semaglutide..."
            value={drugQuery}
            onChange={(e) => setDrugQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            className="flex-1 bg-background border border-input rounded-md px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
          />
          <Button
            onClick={() => handleLookup()}
            disabled={isLoading}
            size="sm"
            className="shrink-0"
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3 mr-1" />}
            Lookup
          </Button>
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap items-center gap-1 pt-0.5 text-[10.5px]">
          <span className="text-muted-foreground mr-0.5">Presets:</span>
          {['Dapagliflozin', 'Semaglutide', 'Apixaban', 'Finerenone', 'Spironolactone'].map((d) => (
            <button
              key={d}
              onClick={() => {
                setDrugQuery(d);
                handleLookup(d);
              }}
              className="px-2 py-0.5 rounded bg-muted hover:bg-accent text-foreground border border-border cursor-pointer transition-colors active:scale-95 text-[10px]"
            >
              {d}
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      {/* Main Content Results */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {/* FDA Boxed Warning Banner if present */}
        {fdaLabel && fdaLabel.boxedWarning && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive space-y-1">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wide text-xs">
              <ShieldAlert className="w-3.5 h-3.5" />
              FDA Boxed Warning
            </div>
            <p className="leading-relaxed whitespace-pre-wrap font-mono-code text-[10.5px]">
              {fdaLabel.boxedWarning.slice(0, 450)}...
            </p>
          </div>
        )}

        {/* FDA Labeling Quick Summary */}
        {fdaLabel && fdaLabel.found && (
          <div className="p-3 rounded-lg bg-card border border-border text-xs space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-foreground text-xs">{fdaLabel.brandName}</h5>
                <span className="text-muted-foreground font-mono text-[10.5px]">{fdaLabel.genericName}</span>
              </div>
              {fdaLabel.packageInsertUrl && (
                <a
                  href={fdaLabel.packageInsertUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-[10.5px] flex items-center gap-1"
                >
                  <span>DailyMed</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {fdaLabel.dosageAndAdministration && (
              <div className="space-y-0.5 pt-0.5">
                <span className="font-semibold text-foreground text-[10.5px]">
                  FDA Dosing & Administration:
                </span>
                <p className="text-muted-foreground text-[10.5px] leading-relaxed line-clamp-4">
                  {fdaLabel.dosageAndAdministration}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Synthesized Monograph */}
        {geminiMonograph && (
          <div className="p-3 rounded-lg bg-card border border-border space-y-2 shadow-2xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-border">
              <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-primary" />
                Clinical Monograph
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleInsertMonograph}
                className="h-6 text-[10px] px-2"
              >
                <Plus className="w-3 h-3 mr-0.5 text-primary" />
                Insert to Note
              </Button>
            </div>

            <div className="text-xs text-foreground font-serif-clinical leading-relaxed whitespace-pre-wrap">
              {geminiMonograph}
            </div>
          </div>
        )}

        {!isLoading && !geminiMonograph && !fdaLabel && (
          <div className="p-6 text-center text-muted-foreground text-xs">
            Enter any drug to review FDA warnings, renal titration cutoffs, and interactions.
          </div>
        )}
      </div>
    </div>
  );
};
