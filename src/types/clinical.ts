export interface ClinicalCitation {
  id: string;
  title: string;
  authors?: string;
  sourceType: 'guideline' | 'RCT' | 'systematic_review' | 'drug_label' | 'meta_analysis' | 'patient_info';
  publisher: string;
  year: string | number;
  url?: string;
  doi?: string;
  pmid?: string;
  relevanceStatement: string;
  confidence: 'High' | 'Moderate' | 'Low';
  verificationStatus: 'unverified' | 'user-verified' | 'rejected';
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface NoteMetadata {
  id: string;
  title: string;
  path: string; // e.g. "Cardiology/SGLT2 Inhibitors & Heart Failure.md"
  folder: string;
  tags: string[];
  specialty: string;
  reviewed: boolean;
  lastChecked: string; // YYYY-MM-DD
  evidenceLevel: 'Level A' | 'Level B' | 'Level C' | 'Expert Consensus';
  citationsCount: number;
}

export interface ClinicalNote extends NoteMetadata {
  content: string; // Raw markdown
  citations: ClinicalCitation[];
  backlinks: string[]; // Note titles linking to this
  outlinks: string[]; // Note titles linked from this ([[...]])
}

export interface NoteSnapshot {
  id: string;
  noteId: string;
  timestamp: string;
  reason: string;
  content: string;
}

export interface FdaDrugLabel {
  found: boolean;
  brandName?: string;
  genericName?: string;
  manufacturer?: string;
  boxedWarning?: string | null;
  indicationsAndUsage?: string | null;
  dosageAndAdministration?: string | null;
  contraindications?: string | null;
  warningsAndPrecautions?: string | null;
  drugInteractions?: string | null;
  packageInsertUrl?: string;
}

export interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  pubdate: string;
  doi?: string;
  url: string;
  doiUrl?: string;
}

export interface WorkEmailQuestion {
  id: string;
  timestamp: string;
  question: string;
  contextSnippet?: string;
  category: 'drug_dosing' | 'guideline_update' | 'diagnostic_cutoff' | 'evidence_appraisal' | 'safety_caveat';
  deidentified: boolean;
  linkedNoteId?: string;
  status: 'new' | 'analyzed' | 'converted_to_update' | 'dismissed';
}

export interface KnowledgeGapCluster {
  topic: string;
  deficitSummary: string;
  priority: 'High' | 'Medium' | 'Low';
  frequency: number;
  targetNote: string;
  isNewNote: boolean;
  suggestedSectionHeading: string;
  proposedDraftMarkdown: string;
  rationale: string;
  suggestedSources: string[];
}

export interface SynthesisResult {
  action: string;
  text: string;
  webSources?: Array<{ title: string; uri: string }>;
  parsedStatus?: 'CURRENT & SUPPORTED' | 'REQUIRES QUALIFICATION' | 'OUTDATED / SUPERSEDED';
  proposedText?: string;
  rationale?: string;
  isQuotaFallback?: boolean;
  fallbackNotice?: string;
}
