import { FdaDrugLabel, KnowledgeGapCluster, PubMedArticle, SynthesisResult } from '../types/clinical';

export async function synthesizeClinicalEvidence(params: {
  action: 'fact-check' | 'evidence-scan' | 'drug-reference' | 'critique' | 'propose-update';
  selectedText?: string;
  noteTitle?: string;
  noteContext?: string;
  clinicalQuestion?: string;
  drugName?: string;
}): Promise<SynthesisResult> {
  const response = await fetch('/api/clinical/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Server error' }));
    const rawError = err.error || `Synthesis failed (${response.status})`;
    if (rawError.includes('429') || rawError.includes('quota') || rawError.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('Gemini API quota rate-limit encountered (429). Using SynapseMD offline clinical guideline engine.');
    }
    throw new Error(rawError);
  }

  const data = await response.json();
  const text: string = data.text || '';

  // Extract structured claim status if available
  let parsedStatus: SynthesisResult['parsedStatus'] = undefined;
  if (text.includes('[CURRENT & SUPPORTED]')) {
    parsedStatus = 'CURRENT & SUPPORTED';
  } else if (text.includes('[REQUIRES QUALIFICATION') || text.includes('[REQUIRES QUALIFICATION / NUANCE]')) {
    parsedStatus = 'REQUIRES QUALIFICATION';
  } else if (text.includes('[OUTDATED') || text.includes('[OUTDATED / SUPERSEDED]')) {
    parsedStatus = 'OUTDATED / SUPERSEDED';
  }

  return {
    action: params.action,
    text,
    webSources: data.webSources || [],
    parsedStatus,
    isQuotaFallback: data.isQuotaFallback,
    fallbackNotice: data.fallbackNotice,
  };
}

export async function searchPubMedArticles(term: string, retmax = 5): Promise<PubMedArticle[]> {
  const response = await fetch(`/api/pubmed/search?term=${encodeURIComponent(term)}&retmax=${retmax}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Search failed' }));
    throw new Error(err.error || 'Failed to query PubMed');
  }
  const data = await response.json();
  return data.articles || [];
}

export async function fetchFdaDrugLabel(drugName: string): Promise<FdaDrugLabel> {
  const response = await fetch(`/api/openfda/label?drug=${encodeURIComponent(drugName)}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'FDA lookup failed' }));
    throw new Error(err.error || 'Drug label not found');
  }
  return await response.json();
}

export async function analyzeClinicalGaps(
  questions: Array<{ question: string; category?: string }>,
  vaultNoteTitles: string[]
): Promise<KnowledgeGapCluster[]> {
  const response = await fetch('/api/clinical/analyze-gaps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questions, vaultNoteTitles }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Analysis failed' }));
    throw new Error(err.error || 'Knowledge gap analysis failed');
  }

  const data = await response.json();
  return data.analysis?.clusters || [];
}

export interface MockModeStatus {
  enabled: boolean;
  scenario: string;
  simulatedLatencyMs: number;
}

export async function getMockOfflineStatus(): Promise<MockModeStatus> {
  const res = await fetch('/api/mock/status');
  if (!res.ok) return { enabled: true, scenario: 'clinical-gold-standard', simulatedLatencyMs: 450 };
  return await res.json();
}

export async function toggleMockOfflineMode(enabled?: boolean, scenario = 'clinical-gold-standard'): Promise<MockModeStatus> {
  const res = await fetch('/api/mock/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled, scenario }),
  });
  if (!res.ok) throw new Error('Failed to toggle offline simulation mode');
  return await res.json();
}
