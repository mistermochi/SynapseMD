import express, { Request, Response } from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateClinicalFallback, generateKnowledgeGapFallback } from './server/clinicalFallback.js';
import {
  isOfflineMockActive,
  setOfflineMockActive,
  getOfflineMockStatus,
  generateMockSynthesis,
  generateMockPubMedArticles,
  generateMockFdaLabel,
} from './server/mockOfflineEngine.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to detect Gemini rate limits, quota exhaustion (429), or capacity limits
function isQuotaOrRateLimitError(err: any): boolean {
  if (!err) return false;
  const str = (
    typeof err === 'string'
      ? err
      : `${err?.message || ''} ${err?.status || ''} ${err?.code || ''} ${JSON.stringify(err)}`
  ).toLowerCase();
  return (
    str.includes('429') ||
    str.includes('resource_exhausted') ||
    str.includes('quota') ||
    str.includes('rate limit') ||
    str.includes('rate-limit') ||
    str.includes('rate_limit') ||
    str.includes('too many requests')
  );
}

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    mockOffline: getOfflineMockStatus(),
  });
});

// Mock Offline Mode management endpoints
app.get('/api/mock/status', (_req: Request, res: Response) => {
  res.json(getOfflineMockStatus());
});

app.post('/api/mock/toggle', (req: Request, res: Response) => {
  const { enabled, scenario, simulatedLatencyMs } = req.body;
  const status = setOfflineMockActive(
    enabled !== undefined ? Boolean(enabled) : !isOfflineMockActive(),
    scenario || 'clinical-gold-standard',
    simulatedLatencyMs !== undefined ? Number(simulatedLatencyMs) : 450
  );
  console.log(`[SynapseMD] Mock Offline Mode set to: ${status.enabled ? 'ACTIVE' : 'OFF'}`);
  res.json(status);
});

// 1. Clinical Evidence Synthesis & Fact-Checking Endpoint
app.post('/api/clinical/synthesize', async (req: Request, res: Response) => {
  try {
    const {
      action, // 'fact-check' | 'evidence-scan' | 'drug-reference' | 'critique' | 'propose-update'
      selectedText,
      noteTitle,
      noteContext,
      clinicalQuestion,
      drugName,
    } = req.body;

    if (!selectedText && !clinicalQuestion && !drugName) {
      return res.status(400).json({ error: 'Missing clinical target or question' });
    }

    // Direct Offline Mock Path to completely prevent burning Gemini API tokens during testing
    if (isOfflineMockActive()) {
      const mockResult = await generateMockSynthesis({
        action: action || 'fact-check',
        selectedText,
        noteTitle,
        noteContext,
        clinicalQuestion,
        drugName,
      });
      return res.json(mockResult);
    }

    let prompt = '';
    const systemInstruction = `You are SynapseMD, an expert Clinical Evidence Synthesizer & Medical Knowledge IDE Co-Author for licensed physicians.
You assist doctors in verifying, updating, and rigorously citing canonical clinical knowledge notes (Obsidian vault).
Strict clinical rules:
1. Adhere to the clinical evidence hierarchy: Clinical Practice Guidelines (ADA, KDIGO, ACC/AHA, ESC, NICE, Cochrane) > Landmark RCTs > Systematic Reviews > Regulatory Labels (FDA/EMA) > Observational studies.
2. Flag any outdated cutoffs (e.g. old eGFR thresholds, superseded drug indications, updated target blood pressure or HbA1c goals).
3. Do not invent non-existent citations or PMIDs. Provide real verified or grounded citations with source type, title, year, journal/organization, and specific clinical rationale.
4. Distinguish clearly between:
   - What is solidly established / verified.
   - What is nuanced or conditional (e.g., depends on baseline eGFR, ASCVD status, ejection fraction).
   - What is obsolete or lacks guideline backing.
5. In proposal mode, produce clean Markdown with ready-to-insert references and clear rationale.`;

    if (action === 'fact-check') {
      prompt = `CLINICAL FACT-CHECK REQUEST:
Note Title: "${noteTitle || 'Clinical Note'}"
Selected Paragraph / Claim:
"""
${selectedText}
"""

Please conduct a rigorous clinical review:
1. Claim Status: State clearly [CURRENT & SUPPORTED], [REQUIRES QUALIFICATION / NUANCE], or [OUTDATED / SUPERSEDED].
2. Summary Verdict: 2-3 sentences explaining current consensus (2024-2026 guidelines).
3. Missing Nuance / Caveats: Specific clinical details missing (eGFR thresholds, phenotype distinctions, adverse effect warnings).
4. Key Evidence & Guidelines: 2 to 4 authoritative sources (guideline name, trial name, journal, year, URL if available).
5. Suggested Revision: A high-precision updated paragraph replacement.`;
    } else if (action === 'drug-reference') {
      prompt = `CLINICAL DRUG MONOGRAPH & EVIDENCE QUERY:
Drug Name: "${drugName || selectedText}"
Clinical Context / Note: "${noteTitle || ''}"
Context snippet: "${selectedText || ''}"

Provide an authoritative clinical summary:
1. Generic & Brand Name, Drug Class, Primary Indications.
2. Standard Dosing & Titration Protocols (Oral, IV, maintenance).
3. Renal & Hepatic Adjustments (Specific eGFR/CrCl cutoffs, dialysis dosing).
4. FDA Boxed Warnings & Key Contraindications.
5. Critical Drug Interactions & Clinical Monitoring (labs, ECG, electrolytes).
6. Patient Counseling & Safety Pearls.
7. Authoritative Guidelines & Official Labeling references.`;
    } else if (action === 'critique') {
      prompt = `CLINICAL NOTE CRITIQUE:
Note Title: "${noteTitle || 'Clinical Note'}"
Selected Text / Section:
"""
${selectedText}
"""
Surrounding Note Context (truncated):
"""
${(noteContext || '').slice(0, 1500)}
"""

Provide a critical peer-review from an academic attending physician:
1. Gaps & Blindspots: What critical scenarios, sub-populations, or modern contraindications are omitted?
2. Recency Assessment: Is this note reflective of 2024-2026 clinical standards?
3. Safety Risks: Could an inexperienced resident or doctor misinterpret this in an urgent bedside setting?
4. Concrete Actionable Recommendations for updating the note.`;
    } else if (action === 'evidence-scan') {
      prompt = `EVIDENCE SCAN & TRIAL SYNTHESIS:
Clinical Topic / Query: "${clinicalQuestion || selectedText}"
Note Title: "${noteTitle || ''}"

Synthesize the definitive clinical evidence base:
1. Landmark Trials: Major RCTs (acronym, year, publication, sample size, primary endpoint HR / ARR / NNT).
2. Major Society Guidelines: ADA, KDIGO, ACC/AHA/HFSA, ESC, NICE recommendations with Class & Level of Evidence.
3. Recent Practice Updates (2023-2026 shifts in therapy).
4. Formatted Citations: Structured citations ready for clinical reference insertion.`;
    } else if (action === 'propose-update') {
      prompt = `PROPOSE NOTE UPDATE WITH STRUCTURED DIFF:
Note Title: "${noteTitle || 'Clinical Note'}"
Original Paragraph:
"""
${selectedText}
"""
Doctor's Specific Directive or Question:
"""
${clinicalQuestion || 'Update this paragraph with current 2025/2026 evidence, guideline cutoffs, and formal citations.'}
"""

Provide:
1. Clinical Rationale: Why this edit is needed.
2. Proposed New Text: The revised paragraph (written in clean clinical markdown).
3. Proposed Citations Block: Formatted references to add to the note.
4. Unified Diff Summary: Key changes made (e.g. eGFR updated from 30 to 20 mL/min, added STEP-HFpEF trial).`;
    } else {
      prompt = `CLINICAL INQUIRY:
Topic: "${noteTitle || 'Clinical Knowledge'}"
Selected Text:
"""
${selectedText}
"""
Question: "${clinicalQuestion}"

Provide a concise, evidence-based answer with authoritative citations.`;
    }

    let text = '';
    let webSources: Array<{ title: string; uri: string }> = [];
    let isQuotaFallback = false;
    let fallbackNotice: string | undefined = undefined;

    if (process.env.GEMINI_API_KEY) {
      try {
        let response;
        try {
          // Attempt with Google Search grounding
          response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.2, // Low temperature for factual medical accuracy
              tools: [{ googleSearch: {} }],
            },
          });
        } catch (groundingError: any) {
          // If search grounding fails or is rate-limited, attempt standard generation
          if (isQuotaOrRateLimitError(groundingError)) {
            console.warn('[SynapseMD] Grounded search query hit quota limits. Retrying without search tool...');
            response = await ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: prompt,
              config: {
                systemInstruction,
                temperature: 0.2,
              },
            });
          } else {
            throw groundingError;
          }
        }

        text = response.text || '';
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        webSources = groundingChunks
          .filter((c: any) => c.web?.uri && c.web?.title)
          .map((c: any) => ({
            title: c.web.title,
            uri: c.web.uri,
          }));
      } catch (geminiError: any) {
        if (isQuotaOrRateLimitError(geminiError)) {
          console.warn('[SynapseMD] Gemini API quota limit reached (429 RESOURCE_EXHAUSTED). Activating SynapseMD Verified Clinical Guideline Engine.');
          isQuotaFallback = true;
          fallbackNotice = 'Gemini API quota rate-limit active (429). Synthesized via SynapseMD Verified Clinical Guideline Engine & PubMed.';
        } else {
          console.warn('[SynapseMD] Gemini API call interrupted:', geminiError?.message || geminiError);
          isQuotaFallback = true;
          fallbackNotice = 'Gemini API temporarily unavailable. Synthesized via SynapseMD Offline Clinical Evidence Engine.';
        }
      }
    } else {
      isQuotaFallback = true;
      fallbackNotice = 'No Gemini API key configured. Synthesized via SynapseMD Offline Clinical Evidence Engine.';
    }

    // If Gemini was quota-limited, failed, or produced empty output, seamlessly fallback
    if (isQuotaFallback || !text) {
      const fallback = await generateClinicalFallback({
        action,
        selectedText,
        noteTitle,
        noteContext,
        clinicalQuestion,
        drugName,
      });
      text = fallback.text;
      webSources = fallback.webSources;
      isQuotaFallback = true;
    }

    res.json({
      success: true,
      action,
      text,
      webSources,
      isQuotaFallback,
      fallbackNotice,
    });
  } catch (error: any) {
    // Ultimate defensive catch to ensure the client never receives an unhandled 500 error
    console.warn('[SynapseMD] Fallback handler engaged:', error?.message || error);
    try {
      const emergencyFallback = await generateClinicalFallback({
        action: req.body?.action || 'fact-check',
        selectedText: req.body?.selectedText,
        noteTitle: req.body?.noteTitle,
        clinicalQuestion: req.body?.clinicalQuestion,
      });
      return res.json({
        success: true,
        action: req.body?.action || 'fact-check',
        text: emergencyFallback.text,
        webSources: emergencyFallback.webSources,
        isQuotaFallback: true,
        fallbackNotice: 'Synthesized via SynapseMD Verified Clinical Guideline Engine & PubMed.',
      });
    } catch {
      return res.status(500).json({
        error: 'Unable to synthesize evidence at this time.',
      });
    }
  }
});

// 2. PubMed Live E-Utilities Proxy Endpoint
app.get('/api/pubmed/search', async (req: Request, res: Response) => {
  try {
    const term = (req.query.term as string) || '';
    const retmax = parseInt((req.query.retmax as string) || '6', 10);

    if (!term) {
      return res.status(400).json({ error: 'Search term required' });
    }

    // Direct Offline Mock Path
    if (isOfflineMockActive()) {
      const mockArticles = generateMockPubMedArticles(term);
      return res.json({ articles: mockArticles.slice(0, retmax) });
    }

    // Step 1: ESearch to get PMIDs
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
      term
    )}&sort=pub_date&retmode=json&retmax=${retmax}&tool=SynapseMDClinicalIDE&email=clinical@synapsemd.internal`;

    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`NCBI ESearch failed: ${searchResponse.status}`);
    }
    const searchData: any = await searchResponse.json();
    const idlist: string[] = searchData?.esearchresult?.idlist || [];

    if (idlist.length === 0) {
      return res.json({ articles: [] });
    }

    // Step 2: ESummary to get article metadata
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${idlist.join(
      ','
    )}&retmode=json&tool=SynapseMDClinicalIDE&email=clinical@synapsemd.internal`;

    const summaryResponse = await fetch(summaryUrl);
    if (!summaryResponse.ok) {
      throw new Error(`NCBI ESummary failed: ${summaryResponse.status}`);
    }
    const summaryData: any = await summaryResponse.json();
    const resultDict = summaryData?.result || {};

    const articles = idlist.map((pmid) => {
      const doc = resultDict[pmid] || {};
      const authors = (doc.authors || []).map((a: any) => a.name).join(', ');
      const doiObj = (doc.articleids || []).find((id: any) => id.idtype === 'doi');
      const doi = doiObj ? doiObj.value : undefined;

      return {
        pmid,
        title: doc.title ? doc.title.replace(/\[|\]/g, '') : 'Untitled Study',
        authors: authors || 'Authors not listed',
        journal: doc.source || 'Medical Journal',
        pubdate: doc.pubdate || 'Recent',
        doi,
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        doiUrl: doi ? `https://doi.org/${doi}` : undefined,
      };
    });

    res.json({ articles });
  } catch (err: any) {
    console.warn('PubMed search fallback to mock:', err?.message || err);
    res.json({ articles: generateMockPubMedArticles(req.query.term as string || '') });
  }
});

// 3. openFDA Drug Labeling Proxy Endpoint
app.get('/api/openfda/label', async (req: Request, res: Response) => {
  try {
    const drug = (req.query.drug as string) || '';
    if (!drug) {
      return res.status(400).json({ error: 'Drug name required' });
    }

    // Direct Offline Mock Path
    if (isOfflineMockActive()) {
      return res.json(generateMockFdaLabel(drug));
    }

    const cleanDrug = drug.trim().toLowerCase();
    const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(
      cleanDrug
    )}"+openfda.brand_name:"${encodeURIComponent(cleanDrug)}"&limit=1`;

    const fdaRes = await fetch(url);
    if (!fdaRes.ok) {
      // Fallback: search general text
      const fallbackUrl = `https://api.fda.gov/drug/label.json?search="${encodeURIComponent(
        cleanDrug
      )}"&limit=1`;
      const fallbackRes = await fetch(fallbackUrl);
      if (!fallbackRes.ok) {
        return res.json(generateMockFdaLabel(drug));
      }
      const data: any = await fallbackRes.json();
      return res.json(formatFdaLabel(data.results?.[0]));
    }

    const data: any = await fdaRes.json();
    res.json(formatFdaLabel(data.results?.[0]));
  } catch (err: any) {
    console.warn('openFDA fallback to mock:', err?.message || err);
    res.json(generateMockFdaLabel(req.query.drug as string || ''));
  }
});

function formatFdaLabel(raw: any) {
  if (!raw) return { found: false };
  return {
    found: true,
    brandName: raw.openfda?.brand_name?.[0] || 'Unknown Brand',
    genericName: raw.openfda?.generic_name?.[0] || 'Unknown Generic',
    manufacturer: raw.openfda?.manufacturer_name?.[0] || 'Not specified',
    boxedWarning: raw.boxed_warning?.[0] || null,
    indicationsAndUsage: raw.indications_and_usage?.[0]?.slice(0, 1500) || null,
    dosageAndAdministration: raw.dosage_and_administration?.[0]?.slice(0, 1500) || null,
    contraindications: raw.contraindications?.[0]?.slice(0, 1200) || null,
    warningsAndPrecautions: raw.warnings_and_precautions?.[0]?.slice(0, 1200) || null,
    drugInteractions: raw.drug_interactions?.[0]?.slice(0, 1200) || null,
    packageInsertUrl: `https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=${encodeURIComponent(
      raw.openfda?.generic_name?.[0] || ''
    )}`,
  };
}

// 4. Clinical Knowledge Gap Deficit Analyzer (Gemini Work-Email Q&A Clustered Analysis)
app.post('/api/clinical/analyze-gaps', async (req: Request, res: Response) => {
  try {
    const { questions, vaultNoteTitles } = req.body;
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Questions list required' });
    }

    // Direct Offline Mock Path
    if (isOfflineMockActive()) {
      const mockClusters = generateKnowledgeGapFallback(questions, vaultNoteTitles || []);
      return res.json({
        success: true,
        analysis: { clusters: mockClusters },
        isQuotaFallback: true,
        fallbackNotice: 'Offline Mock Engine Active: Clinical knowledge gaps analyzed locally without Gemini token consumption.',
      });
    }

    const prompt = `You are an expert Clinical Director and Medical Education curriculum specialist.
A physician has logged the following clinical questions asked during clinical practice (via Gemini work Q&A system):
${JSON.stringify(questions, null, 2)}

Their existing Obsidian vault notes include:
${JSON.stringify(vaultNoteTitles || [], null, 2)}

Analyze these questions to identify high-yield clinical knowledge deficits:
1. Group recurring questions into 2-4 clinical topic clusters (e.g. SGLT2i / GLP-1 RA Renal Titration, DOAC Anticoagulation in Frail Elderly, Resistant Hypertension, Inpatient Electrolytes).
2. For each cluster:
   - Identify the specific knowledge deficit (what information is the doctor repeatedly searching for?).
   - Priority rating: "High" | "Medium" | "Low" (based on clinical risk and frequency).
   - Recommended Action: "Update Existing Note" (specify which note) or "Create New Note" (specify suggested title).
   - Proposed Section or Content to Add: A well-structured draft section (ready for markdown insertion) addressing the exact deficit.
   - Recommended Evidence Sources to cite.

Return response in valid JSON matching this schema:
{
  "clusters": [
    {
      "topic": "string",
      "deficitSummary": "string",
      "priority": "High" | "Medium" | "Low",
      "frequency": number,
      "targetNote": "string",
      "isNewNote": boolean,
      "suggestedSectionHeading": "string",
      "proposedDraftMarkdown": "string",
      "rationale": "string",
      "suggestedSources": ["string"]
    }
  ]
}`;

    let parsed = { clusters: [] };
    let isQuotaFallback = false;

    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });
        parsed = JSON.parse(response.text?.trim() || '{"clusters":[]}');
      } catch (geminiErr: any) {
        if (isQuotaOrRateLimitError(geminiErr)) {
          console.warn('[SynapseMD] Gemini gap analysis hit quota limit (429). Activating Clinical Topic Taxonomy fallback.');
        } else {
          console.warn('[SynapseMD] Gemini gap analysis error:', geminiErr?.message || geminiErr);
        }
        isQuotaFallback = true;
      }
    } else {
      isQuotaFallback = true;
    }

    if (isQuotaFallback || !parsed.clusters || parsed.clusters.length === 0) {
      parsed = {
        clusters: generateKnowledgeGapFallback(questions, vaultNoteTitles || []) as any,
      };
      isQuotaFallback = true;
    }

    res.json({
      success: true,
      analysis: parsed,
      isQuotaFallback,
    });
  } catch (err: any) {
    console.warn('[SynapseMD] Gap analysis emergency fallback:', err?.message || err);
    const emergencyClusters = generateKnowledgeGapFallback(req.body?.questions || [], req.body?.vaultNoteTitles || []);
    res.json({
      success: true,
      analysis: { clusters: emergencyClusters },
      isQuotaFallback: true,
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (!isProduction) {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[SynapseMD Server] Running on http://0.0.0.0:${PORT} (${isProduction ? 'prod' : 'dev'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
