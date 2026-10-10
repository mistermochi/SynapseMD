import React, { useState } from 'react';
import { KnowledgeGapCluster, WorkEmailQuestion, ClinicalNote } from '../types/clinical';
import { analyzeClinicalGaps } from '../services/api';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Inbox,
  Sparkles,
  FilePlus,
  ShieldCheck,
  Plus,
  Loader2,
  Layers,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface KnowledgeGapInboxProps {
  questions: WorkEmailQuestion[];
  notes: ClinicalNote[];
  onAddQuestion: (questionText: string, category?: WorkEmailQuestion['category']) => void;
  onSelectTargetNote: (noteId: string) => void;
  onProposeSectionUpdate: (targetNoteTitle: string, proposedMarkdown: string, rationale: string) => void;
}

export const KnowledgeGapInbox: React.FC<KnowledgeGapInboxProps> = ({
  questions,
  notes,
  onAddQuestion,
  onSelectTargetNote,
  onProposeSectionUpdate,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [clusters, setClusters] = useState<KnowledgeGapCluster[]>([
    {
      topic: 'SGLT2i & GLP-1 RA Renal Thresholds & Perioperative Safety',
      deficitSummary:
        'Repeated queries regarding eGFR initiation cutoffs (< 20 mL/min vs older 30 mL/min cutoff) and preoperative hold times to avoid euglycemic DKA and delayed gastric emptying.',
      priority: 'High',
      frequency: 4,
      targetNote: 'SGLT2 Inhibitors & Heart Failure',
      isNewNote: false,
      suggestedSectionHeading: '## 2025/2026 Updated Renal Initiation Cutoffs & Perioperative Protocols',
      proposedDraftMarkdown: `## 2025/2026 Updated Renal Initiation Cutoffs & Perioperative Protocols
Recent guideline updates from KDIGO 2024 and ADA 2026 have significantly revised renal initiation thresholds:
- **Initiation Threshold**: SGLT2 inhibitors may now be initiated down to **eGFR 20 mL/min/1.73m²** (previously held at 30).
- **Continuation**: Once initiated, continue therapy until kidney replacement therapy (dialysis or transplantation), even if eGFR falls below 20.
- **Perioperative Protocol**: Discontinue SGLT2 inhibitors **3 to 4 days prior** to elective surgeries or procedures involving prolonged fasting to mitigate euglycemic diabetic ketoacidosis (euDKA) risks.`,
      rationale:
        'Resolves recurring clinical uncertainty on eGFR cutoffs and surgery hold times; updates outdated local note cutoff.',
      suggestedSources: [
        'KDIGO 2024 Clinical Practice Guideline for CKD Management',
        'ADA Standards of Care in Diabetes 2026',
      ],
    },
    {
      topic: 'DOAC Anticoagulation in Extreme Renal Impairment & Dialysis',
      deficitSummary:
        'Doctor evaluating dose reduction rules for apixaban and rivaroxaban in frail patients with borderline creatinine and fluctuating eGFR.',
      priority: 'Medium',
      frequency: 2,
      targetNote: 'DOAC Dosing & Anticoagulation in CKD',
      isNewNote: false,
      suggestedSectionHeading: '## Cockcroft-Gault Audit vs CKD-EPI in DOAC Dosing',
      proposedDraftMarkdown: `## Cockcroft-Gault Audit vs CKD-EPI in DOAC Dosing
- **Critical Caution**: Hospital lab reported eGFR (CKD-EPI) systematically overestimates renal function in frail, elderly patients with low muscle mass.
- Always manually compute **Cockcroft-Gault CrCl using actual body weight** for DOAC dose reductions.
- In Apixaban, exact 2-of-3 criteria (Age >= 80, Wt <= 60 kg, Serum Cr >= 1.5 mg/dL) must be strictly met before dropping dose to 2.5 mg BID.`,
      rationale: 'Addresses bedside dosing confusion when serum creatinine is only mildly elevated in low body weight elderly.',
      suggestedSources: ['2024 ACC/AHA Atrial Fibrillation Guidelines', 'FDA Package Insert Apixaban'],
    },
  ]);

  const [newQuestionText, setNewQuestionText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const noteTitles = notes.map((n) => n.title);
      const res = await analyzeClinicalGaps(
        questions.map((q) => ({ question: q.question, category: q.category })),
        noteTitles
      );
      if (res && res.length > 0) {
        setClusters(res);
      }
    } catch (err: any) {
      setAnalysisError(err?.message || 'Deficit clustering analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    onAddQuestion(newQuestionText.trim());
    setNewQuestionText('');
    setShowAddModal(false);
  };

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Overview Banner */}
      <div className="p-3 bg-card border border-border rounded-lg space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Inbox className="w-3.5 h-3.5 text-primary" />
            <h4 className="font-semibold text-xs text-foreground">
              Work-Email Q&A Deficit Engine
            </h4>
          </div>
          <Badge variant="outline" className="flex items-center gap-1 text-[9.5px]">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            De-identified
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Questions asked to Gemini during shifts reveal bedside knowledge deficits and trigger proposed note updates.
        </p>

        <div className="pt-0.5 flex flex-wrap items-center gap-1.5">
          <Button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            size="sm"
            className="flex-1 min-w-[130px]"
          >
            {isAnalyzing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 mr-1" />
            )}
            Run Clustering
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="text-xs"
          >
            <Plus className="w-3.5 h-3.5 text-primary mr-1" />
            Log Question
          </Button>
        </div>

        {analysisError && <p className="text-xs text-destructive">{analysisError}</p>}
      </div>

      {/* Clustered Deficit Tasks Queue */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground pb-0.5">
          <span className="font-semibold text-foreground flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            Expansion Queue ({clusters.length})
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {questions.length} Queries
          </span>
        </div>

        {clusters.map((c, idx) => {
          const targetNoteObj = notes.find(
            (n) => n.title.toLowerCase() === c.targetNote.toLowerCase()
          );

          return (
            <div
              key={idx}
              className="p-3 rounded-lg bg-card border border-border space-y-2 hover:border-border/80 transition-all shadow-2xs"
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={c.priority === 'High' ? 'destructive' : 'warning'}
                      className="text-[9px] px-1 py-0 h-3.5"
                    >
                      {c.priority}
                    </Badge>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Asked {c.frequency}x
                    </span>
                  </div>
                  <h5 className="font-semibold text-foreground text-xs leading-snug">
                    {c.topic}
                  </h5>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {c.deficitSummary}
              </p>

              {/* Target note link */}
              <div className="p-1.5 rounded bg-muted/60 border border-border text-[10.5px] flex items-center justify-between">
                <span className="text-muted-foreground">Target Note:</span>
                <button
                  onClick={() => targetNoteObj && onSelectTargetNote(targetNoteObj.id)}
                  className="font-mono text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>[[{c.targetNote}]]</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* Action */}
              <div className="pt-0.5 flex flex-wrap items-center justify-between gap-1.5">
                <span className="text-[10px] text-muted-foreground italic truncate max-w-[170px]">
                  {c.suggestedSources.join(' • ')}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onProposeSectionUpdate(
                      c.targetNote,
                      c.proposedDraftMarkdown,
                      c.rationale
                    )
                  }
                  className="text-[10.5px] h-6 px-2 font-medium"
                >
                  <FilePlus className="w-3 h-3 mr-1 text-primary" />
                  Patch Note
                </Button>
              </div>
            </div>
          );
        })}

        {/* Logged Work Questions List */}
        <div className="pt-2 border-t border-border">
          <div className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            Recent Practice Inquiries
          </div>
          <div className="space-y-1">
            {questions.map((q) => (
              <div
                key={q.id}
                className="p-2 rounded-md bg-muted/40 border border-border text-xs space-y-0.5"
              >
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                  <span>{new Date(q.timestamp).toLocaleDateString()}</span>
                  <span className="capitalize">{q.category.replace('_', ' ')}</span>
                </div>
                <p className="text-foreground text-[11px] leading-snug">
                  "{q.question}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal to log a new question */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card text-card-foreground border border-border rounded-xl max-w-md w-full p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
              <Plus className="w-4 h-4 text-primary" />
              Log Stored Work Question
            </h3>
            <p className="text-xs text-muted-foreground mb-2.5">
              Enter a clinical inquiry asked during hospital shifts.
            </p>
            <form onSubmit={handleAddSubmit} className="space-y-2.5 text-xs">
              <div>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Can we continue empagliflozin if patient acute eGFR drops from 40 to 25 mL/min?"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="w-full bg-background border border-input focus:border-ring rounded-md p-2 text-foreground focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="default" size="sm">
                  Save Question
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
