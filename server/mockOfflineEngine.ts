export interface MockOfflineStatus {
  enabled: boolean;
  scenario: string;
  simulatedLatencyMs: number;
}

// In-memory toggle state for the server session (defaults to true for zero token burn testing)
let offlineMockActive = process.env.OFFLINE_MOCK_MODE !== 'false';
let currentScenario = 'clinical-gold-standard';
let simulatedLatency = 450;

export function isOfflineMockActive(): boolean {
  return offlineMockActive;
}

export function setOfflineMockActive(enabled: boolean, scenario = 'clinical-gold-standard', latency = 450): MockOfflineStatus {
  offlineMockActive = enabled;
  currentScenario = scenario;
  simulatedLatency = latency;
  return {
    enabled: offlineMockActive,
    scenario: currentScenario,
    simulatedLatencyMs: simulatedLatency,
  };
}

export function getOfflineMockStatus(): MockOfflineStatus {
  return {
    enabled: offlineMockActive,
    scenario: currentScenario,
    simulatedLatencyMs: simulatedLatency,
  };
}

export interface MockSynthesisParams {
  action: 'fact-check' | 'evidence-scan' | 'drug-reference' | 'critique' | 'propose-update';
  selectedText?: string;
  noteTitle?: string;
  noteContext?: string;
  clinicalQuestion?: string;
  drugName?: string;
}

export interface MockSynthesisResponse {
  success: boolean;
  action: string;
  text: string;
  webSources: Array<{ title: string; uri: string }>;
  isQuotaFallback: boolean;
  fallbackNotice: string;
  parsedStatus?: 'CURRENT & SUPPORTED' | 'REQUIRES QUALIFICATION' | 'OUTDATED / SUPERSEDED';
}

export async function generateMockSynthesis(params: MockSynthesisParams): Promise<MockSynthesisResponse> {
  const { action, selectedText = '', noteTitle = '', clinicalQuestion = '', drugName = '' } = params;
  const combined = `${noteTitle} ${selectedText} ${clinicalQuestion} ${drugName}`.toLowerCase();

  // Simulate realistic clinical pipeline latency
  if (simulatedLatency > 0) {
    await new Promise((resolve) => setTimeout(resolve, simulatedLatency));
  }

  const isSGLT2 = combined.includes('sglt2') || combined.includes('dapagliflozin') || combined.includes('empagliflozin') || combined.includes('heart failure') || combined.includes('kidney');
  const isDOAC = combined.includes('doac') || combined.includes('apixaban') || combined.includes('rivaroxaban') || combined.includes('anticoagula') || combined.includes('afib') || combined.includes('atrial');
  const isGLP1 = combined.includes('glp-1') || combined.includes('semaglutide') || combined.includes('tirzepatide') || combined.includes('flow') || combined.includes('ozempic');
  const isCKD = combined.includes('ckd') || combined.includes('kdigo') || combined.includes('finerenone') || combined.includes('egfr');
  const hasEgfr30Cutoff = combined.includes('30') && (combined.includes('egfr') || combined.includes('initiat') || combined.includes('ml/min'));

  let text = '';
  let parsedStatus: 'CURRENT & SUPPORTED' | 'REQUIRES QUALIFICATION' | 'OUTDATED / SUPERSEDED' | undefined = undefined;
  const webSources: Array<{ title: string; uri: string }> = [];

  if (action === 'fact-check') {
    if (isSGLT2 && (hasEgfr30Cutoff || combined.includes('initiat'))) {
      parsedStatus = 'OUTDATED / SUPERSEDED';
      text = `[OUTDATED / SUPERSEDED]

**Summary Verdict:**
The statement restricting SGLT2 inhibitor initiation strictly to patients with eGFR > 30 mL/min/1.73m² is outdated. Landmark clinical trials (**DAPA-CKD**, **EMPA-KIDNEY**) and **KDIGO 2024 / ADA 2025–2026** practice guidelines have updated the initiation cutoff down to **eGFR ≥ 20 mL/min/1.73m²**.

**Critical Practice Caveats & Nuances:**
1. **Continuation Rule:** Once initiated at eGFR ≥ 20 mL/min, therapy should be maintained even if eGFR falls below 20 mL/min until dialysis or kidney transplantation.
2. **Hemodynamic eGFR Dip:** An acute drop in eGFR up to 30% within 2–4 weeks is an expected hemodynamic effect (reduction of intraglomerular hyperfiltration) and should NOT lead to discontinuation.
3. **Perioperative Withholding:** Discontinue 3 to 4 days prior to elective surgery or prolonged fasting to prevent euglycemic diabetic ketoacidosis (euDKA).
4. **Broad GDMT Indication:** Class 1A recommendation across all heart failure phenotypes (HFrEF, HFmrEF, and HFpEF) regardless of ejection fraction or diabetes status.

**Authoritative Guidelines & Landmark Evidence:**
- **KDIGO 2024 Clinical Practice Guideline for CKD Management** (*Kidney Int.* 2024; 105:S117-S314)
- **ADA Standards of Care in Diabetes 2025/2026** (*Diabetes Care* 2025; 48:Suppl 1:S1-S320)
- **DELIVER Trial in HFpEF** (*N Engl J Med.* 2022; 387:1089-1098, PMID: 36027318)
- **EMPEROR-Preserved Trial** (*N Engl J Med.* 2021; 385:1451-1461, PMID: 34449189)

**Suggested Note Revision:**
"SGLT2 inhibitors (empagliflozin 10 mg or dapagliflozin 10 mg daily) are guideline-directed foundational therapy for heart failure across all ejection fractions. Under KDIGO 2024 and ADA 2026 guidelines, they can be safely initiated down to **eGFR ≥ 20 mL/min/1.73m²** and continued until dialysis. Withhold 3–4 days prior to elective surgery or prolonged fasting to prevent euglycemic DKA."`;

      webSources.push(
        { title: 'KDIGO 2024 CKD Practice Guideline (Kidney Int)', uri: 'https://pubmed.ncbi.nlm.nih.gov/38789311/' },
        { title: 'DELIVER Trial in Heart Failure (NEJM 2022)', uri: 'https://pubmed.ncbi.nlm.nih.gov/36027318/' },
        { title: 'EMPEROR-Preserved Trial (NEJM 2021)', uri: 'https://pubmed.ncbi.nlm.nih.gov/34449189/' }
      );
    } else if (isDOAC) {
      parsedStatus = 'REQUIRES QUALIFICATION';
      text = `[REQUIRES QUALIFICATION / NUANCE]

**Summary Verdict:**
DOAC dosing in patients with CKD and elderly patients requires calculation of **Cockcroft-Gault CrCl using actual body weight**, not automated laboratory eGFR (CKD-EPI). Relying on automated eGFR overestimates clearance in frail patients and risks severe bleeding.

**Critical Practice Caveats & Nuances:**
1. **Apixaban Nonvalvular AF Rule:** Maintain full dose (5 mg BID) unless the patient satisfies at least **2 of 3 criteria**:
   - Age ≥ 80 years
   - Body weight ≤ 60 kg
   - Serum Creatinine ≥ 1.5 mg/dL (133 µmol/L)
   Meeting renal impairment alone without a second criterion does NOT justify 2.5 mg BID dose reduction.
2. **ESRD / Hemodialysis:** While FDA labeling permits apixaban in hemodialysis (5 mg BID or 2.5 mg BID if age ≥80 or wt ≤60 kg), 2024 ACC/AHA guidelines emphasize careful shared decision-making.
3. **Rivaroxaban / Edoxaban:** Reduce rivaroxaban to 15 mg daily if CrCl is 15–50 mL/min. Avoid edoxaban if CrCl > 95 mL/min due to excess ischemic stroke risk.

**Authoritative Guidelines & Landmark Evidence:**
- **2023/2024 ACC/AHA/ACCP/HRS Guideline for Management of Atrial Fibrillation** (*Circulation* 2024; 149:e1-e156, PMID: 38031697)
- **FDA Prescribing Information: Eliquis (Apixaban)** (DailyMed, Revised 2024)

**Suggested Note Revision:**
"Always calculate Cockcroft-Gault CrCl using actual body weight for DOAC anticoagulation. For apixaban in nonvalvular AF, reduce to 2.5 mg BID only if at least 2 of 3 criteria are satisfied: Age ≥ 80, Weight ≤ 60 kg, or Serum Creatinine ≥ 1.5 mg/dL."`;

      webSources.push(
        { title: '2024 ACC/AHA Atrial Fibrillation Guideline (Circulation)', uri: 'https://pubmed.ncbi.nlm.nih.gov/38031697/' },
        { title: 'FDA Label: Eliquis (Apixaban)', uri: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=072b0cf6-eb6b-4e04-9844-3156cfeb91b5' }
      );
    } else if (isGLP1) {
      parsedStatus = 'CURRENT & SUPPORTED';
      text = `[CURRENT & SUPPORTED]

**Summary Verdict:**
Current clinical evidence strongly supports GLP-1 receptor agonists (specifically semaglutide 1.0 mg weekly) for renal and cardiovascular risk reduction in type 2 diabetes with chronic kidney disease, validated by the landmark **FLOW trial (2024)**.

**Critical Practice Caveats & Nuances:**
1. **Renal Outcomes:** FLOW demonstrated a **24% reduction** in major kidney disease events, kidney failure, or CV death in T2D with CKD (eGFR 20–50 or eGFR 50–75 with UACR > 300 mg/g).
2. **No Dose Adjustment for Renal Function:** Pharmacokinetics are not cleared renally; no dose titration is needed for low eGFR down to eGFR 15 mL/min.
3. **Perioperative Pulmonary Aspiration Risk:** ASA consensus recommends holding weekly GLP-1 RAs for **1 week prior to elective surgery** due to delayed gastric emptying.
4. **Heart Failure Spectrum:** STEP-HFpEF and STEP-HFpEF DM trials showed significant reductions in heart failure symptoms and weight in obesity-related HFpEF.

**Authoritative Guidelines & Landmark Evidence:**
- **FLOW Trial** (Perkovic V et al., *N Engl J Med.* 2024; 391:109-121, PMID: 38785209)
- **STEP-HFpEF Trial** (Kosiborod MN et al., *N Engl J Med.* 2023; 389:1069-1084, PMID: 37622681)
- **ADA Standards of Care in Diabetes 2025/2026** (Diabetes Care 2025)`;

      webSources.push(
        { title: 'FLOW Trial in CKD and T2D (NEJM 2024)', uri: 'https://pubmed.ncbi.nlm.nih.gov/38785209/' },
        { title: 'STEP-HFpEF Trial (NEJM 2023)', uri: 'https://pubmed.ncbi.nlm.nih.gov/37622681/' }
      );
    } else {
      parsedStatus = 'CURRENT & SUPPORTED';
      text = `[CURRENT & SUPPORTED]

**Summary Verdict:**
The statement reflects recognized evidence-based clinical practice and guideline standards. Recommendations are backed by randomized trials and specialist society consensus.

**Key Clinical Considerations:**
- Validate baseline organ function (renal Cockcroft-Gault CrCl and liver function tests) before therapeutic initiation.
- Check for common pharmacokinetic drug-drug interactions (CYP3A4 / P-gp substrate interactions).
- Schedule standard interval monitoring of clinical tolerance, electrolyte balance, and symptom relief at 4 to 12 weeks.

**Authoritative Evidence Sources:**
- **American College of Cardiology / AHA Clinical Practice Guidelines (2023–2025)**
- **KDIGO Clinical Practice Consensus Standards (2024)**

**Suggested Note Revision:**
${selectedText || 'Guidance is consistent with current standards. Ensure periodic re-evaluation of patient adherence and lab parameters.'}`;

      webSources.push(
        { title: 'ACC Practice Guidelines Hub', uri: 'https://www.acc.org/guidelines' },
        { title: 'PubMed Central Biomedical Evidence Base', uri: 'https://pubmed.ncbi.nlm.nih.gov/' }
      );
    }
  } else if (action === 'evidence-scan') {
    text = `### Landmark Trials & Evidence Base Synthesis

**1. Definitive Randomized Controlled Trials (RCTs):**
- **DAPA-HF (NEJM 2019; 381:1995-2008, PMID: 31535829):** Dapagliflozin 10 mg vs placebo in HFrEF. Primary endpoint (worsening HF or CV death) reduced by **26%** (HR 0.74, 95% CI 0.65–0.85; p < 0.001; NNT = 21). Benefits observed regardless of diabetes status.
- **EMPEROR-Preserved (NEJM 2021; 385:1451-1461, PMID: 34449189):** Empagliflozin 10 mg in HFpEF (EF > 40%). Primary composite endpoint reduced by **21%** (HR 0.79, 95% CI 0.69–0.90; p < 0.001; NNT = 31). First landmark trial establishing unequivocal benefit in preserved EF.
- **DELIVER (NEJM 2022; 387:1089-1098, PMID: 36027318):** Dapagliflozin in HFmrEF and HFpEF. Primary endpoint reduced by **18%** (HR 0.82, 95% CI 0.73–0.92; p < 0.001). Benefits consistent across all LVEF subcategories.
- **DAPA-CKD (NEJM 2020) & EMPA-KIDNEY (NEJM 2023):** Demonstrated 39% and 28% reductions respectively in CKD progression or CV death down to eGFR 20 mL/min/1.73m².
- **FLOW Trial (NEJM 2024; 391:109-121, PMID: 38785209):** Once-weekly semaglutide 1.0 mg showed 24% reduction in major renal events and 20% lower CV death in T2D with CKD.

**2. Major Society Guidelines:**
- **ACC/AHA/HFSA (2022/2024):** Class 1A recommendation for SGLT2 inhibitors as foundational 4-pillar GDMT across HFrEF, HFmrEF, and HFpEF.
- **KDIGO (2024 CKD Guideline):** Class 1A recommendation for patients with CKD and eGFR ≥ 20 mL/min/1.73m² with or without type 2 diabetes.
- **ADA Standards of Care (2025/2026):** Recommends SGLT2i + GLP-1 RA combination therapy for high-risk cardiorenal phenotypes.

**3. Current Practice Updates (2024–2026):**
- Rapid quadruple therapy sequencing: Initiation of SGLT2i on day 1 of hospitalization or outpatient encounter.
- Perioperative protocol: Discontinue 3–4 days prior to surgery requiring general anesthesia or prolonged fasting.`;

    webSources.push(
      { title: 'DAPA-HF Trial (NEJM 2019)', uri: 'https://pubmed.ncbi.nlm.nih.gov/31535829/' },
      { title: 'EMPEROR-Preserved Trial (NEJM 2021)', uri: 'https://pubmed.ncbi.nlm.nih.gov/34449189/' },
      { title: 'DELIVER Trial (NEJM 2022)', uri: 'https://pubmed.ncbi.nlm.nih.gov/36027318/' },
      { title: 'KDIGO 2024 CKD Guideline', uri: 'https://pubmed.ncbi.nlm.nih.gov/38789311/' }
    );
  } else if (action === 'drug-reference') {
    const targetDrug = drugName || (isSGLT2 ? 'Empagliflozin / Dapagliflozin' : isDOAC ? 'Apixaban' : isGLP1 ? 'Semaglutide' : 'Clinical Pharmacotherapy');
    text = `### Clinical Drug Monograph: ${targetDrug}

**1. Pharmacologic Class & Indications:**
- **Class:** Sodium-Glucose Cotransporter 2 (SGLT2) Inhibitors / Cardiorenal Metabolic Protective Agents.
- **Primary Indications:** Heart Failure across all ejection fractions (HFrEF, HFmrEF, HFpEF), Chronic Kidney Disease (CKD Stage 2–4 with proteinuria), and Type 2 Diabetes Mellitus with high CV risk.

**2. Dosing & Titration Protocols:**
- **Empagliflozin:** 10 mg orally once daily in the morning with or without food. No forced titration required (10 mg is the definitive therapeutic dose for HF & CKD).
- **Dapagliflozin:** 10 mg orally once daily in the morning.
- **Administration:** Does not require complex serum drug level monitoring or frequent lab titration unlike older inotropes or antiarrhythmics.

**3. Renal & Hepatic Dosing Adjustments:**
- **Renal Initiation:** Approved down to **eGFR ≥ 20 mL/min/1.73m²** under KDIGO 2024 / ADA 2026 guidelines.
- **Renal Continuation:** If eGFR subsequently declines below 20 mL/min, maintain treatment until initiation of dialysis or renal replacement therapy.
- **Intraglomerular Hemodynamics:** Expect an initial transient serum creatinine rise (eGFR decline of 2–4 mL/min or up to 30%) within 2–4 weeks; this signifies afferent arteriolar vasoconstriction and long-term nephron preservation.
- **Hepatic Impairment:** No dose modification required for mild to moderate hepatic impairment.

**4. FDA Boxed Warnings & Clinical Caveats:**
- **Euglycemic DKA (euDKA):** Can present with normal or mildly elevated blood glucose (< 250 mg/dL). Hold immediately during acute severe illness, dehydration, or septicemia.
- **Perioperative Protocol:** Discontinue **3 to 4 days prior** to elective surgical procedures.
- **Genital Mycotic Infections & Fournier's Gangrene:** Counsel patient on daily perineal hygiene and symptoms requiring prompt medical review.
- **Volume Depletion:** Consider reducing concomitant loop diuretic dosing by 25–50% if patient is euvolemic at initiation.

**5. Drug Interactions & Monitoring Schedule:**
- **Loop Diuretics (Furosemide, Torsemide):** Additive natriuresis and diuresis; monitor orthostatic vitals.
- **Insulin & Sulfonylureas:** Reduce concomitant insulin/SU dose to mitigate hypoglycemia when prescribed for T2D.
- **Laboratory Schedule:** Check baseline BMP (eGFR, K+, Na+) and repeat at 4 weeks post-initiation.`;

    webSources.push(
      { title: 'FDA Label: Jardiance (Empagliflozin)', uri: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=a00e574c-4734-4b82-aa86-dfda5bc6b8e3' },
      { title: 'FDA Label: Farxiga (Dapagliflozin)', uri: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=072b0cf6-eb6b-4e04-9844-3156cfeb91b5' }
    );
  } else if (action === 'critique') {
    text = `### Academic Attending Physician Note Critique

**1. Critical Evidence Deficits:**
- **Outdated Renal Cutoff:** The note still quotes an obsolete initiation threshold of eGFR > 30 mL/min. Under KDIGO 2024 and ADA 2026 consensus, therapy is initiated down to **eGFR ≥ 20 mL/min/1.73m²**.
- **Missing Perioperative Safety Warning:** No guidance is provided regarding holding the drug 3–4 days prior to surgery, posing a severe preventable risk of postoperative euglycemic DKA.
- **Initial Hemodynamic Dip Reassurance:** The note does not instruct junior trainees that an initial 10–25% rise in serum creatinine is expected and benign, leading to inappropriate drug discontinuation by on-call residents.

**2. Guideline Recency Assessment (2024–2026 Standards):**
- Missing citations for the **DELIVER (2022)** and **EMPEROR-Preserved (2021)** trials, as well as the 2023 ESC and 2024 ACC guidelines endorsing SGLT2 inhibitors as Class 1A for HFpEF.

**3. Actionable Recommendations for Co-Authoring:**
1. Revise eGFR initiation threshold from 30 to 20 mL/min/1.73m² with formal citation.
2. Insert a high-visibility Callout block: ` + "`> [!WARNING] Perioperative & Sick Day Rules`" + ` specifying the 3–4 day surgical hold.
3. Add a dedicated comparative summary table for Dapagliflozin vs Empagliflozin.`;

    webSources.push(
      { title: 'KDIGO 2024 Clinical Practice Guideline for CKD', uri: 'https://pubmed.ncbi.nlm.nih.gov/38789311/' },
      { title: 'ACC/AHA/HFSA 2022 Heart Failure Guideline', uri: 'https://pubmed.ncbi.nlm.nih.gov/35363949/' }
    );
  } else if (action === 'propose-update') {
    text = `### Clinical Rationale:
Updates outdated renal initiation threshold (from 30 down to 20 mL/min/1.73m²) in accordance with KDIGO 2024 and ADA 2025/2026 guidelines. Incorporates mandatory perioperative 3–4 day withholding instructions to prevent euglycemic diabetic ketoacidosis and clarifies the expected hemodynamic eGFR dip.

### Proposed Revised Paragraph:
> [!NOTE] 2025/2026 Guideline Consensus
> **SGLT2 inhibitors (Empagliflozin 10 mg or Dapagliflozin 10 mg once daily)** are Class 1A foundational therapy for heart failure across all ejection fractions (HFrEF, HFmrEF, and HFpEF). Under KDIGO 2024 and ADA 2026 guidelines, initiation is approved down to **eGFR ≥ 20 mL/min/1.73m²** and continued until kidney replacement therapy.
> 
> **Critical Practice Pearls:**
> - **Expected Hemodynamic Dip:** An acute eGFR decline of up to 30% within 2–4 weeks reflects reversible reduction in intraglomerular hyperfiltration and does not warrant cessation.
> - **Perioperative Protocol:** Withhold **3 to 4 days prior** to elective surgeries or prolonged fasting to minimize euglycemic DKA risk.
> - **Sick Day Management:** Temporarily pause during acute dehydrating illnesses, sepsis, or major trauma.

### Formatted Citations:
- KDIGO 2024 Clinical Practice Guideline for the Management of CKD. *Kidney Int.* 2024; 105:S117-S314. [PMID: 38789311](https://pubmed.ncbi.nlm.nih.gov/38789311/)
- Solomon SD, et al. Dapagliflozin in Heart Failure with Mildly Reduced or Preserved Ejection Fraction (DELIVER). *N Engl J Med.* 2022; 387:1089-1098. [PMID: 36027318](https://pubmed.ncbi.nlm.nih.gov/36027318/)
- American Diabetes Association. Standards of Care in Diabetes—2025. *Diabetes Care.* 2025; 48(Suppl 1):S1-S320.`;

    webSources.push(
      { title: 'KDIGO 2024 CKD Guideline', uri: 'https://pubmed.ncbi.nlm.nih.gov/38789311/' },
      { title: 'DELIVER Trial (NEJM 2022)', uri: 'https://pubmed.ncbi.nlm.nih.gov/36027318/' }
    );
  } else {
    text = `### Clinical Inquiry Response

Regarding your clinical query: "${clinicalQuestion || selectedText}"

**Evidence-Based Assessment:**
1. **Current Clinical Consensus:** Society guidelines recommend guideline-directed medical therapy (GDMT) tailored to patient phenotype, baseline organ function, and risk profile.
2. **Key Parameters to Monitor:** Baseline eGFR, serum electrolytes, blood pressure, and symptom trajectory.
3. **Guideline Citations:** Supported by current ACC/AHA, KDIGO, and ADA clinical practice recommendations.`;

    webSources.push(
      { title: 'PubMed Clinical Search', uri: 'https://pubmed.ncbi.nlm.nih.gov/' }
    );
  }

  return {
    success: true,
    action,
    text,
    webSources,
    isQuotaFallback: true,
    fallbackNotice: 'Offline Mock Engine Active: High-fidelity clinical guideline response generated without burning Gemini API tokens.',
    parsedStatus,
  };
}

export function generateMockPubMedArticles(term: string) {
  const cleanTerm = term.toLowerCase();
  if (cleanTerm.includes('sglt2') || cleanTerm.includes('dapa') || cleanTerm.includes('empa') || cleanTerm.includes('heart failure')) {
    return [
      {
        pmid: '31535829',
        title: 'Dapagliflozin in Patients with Heart Failure and Reduced Ejection Fraction (DAPA-HF)',
        authors: 'McMurray JJV, Solomon SD, Inzucchi SE, et al.',
        journal: 'N Engl J Med',
        pubdate: '2019 Nov 21',
        doi: '10.1056/NEJMoa1911303',
        url: 'https://pubmed.ncbi.nlm.nih.gov/31535829/',
        doiUrl: 'https://doi.org/10.1056/NEJMoa1911303',
      },
      {
        pmid: '34449189',
        title: 'Empagliflozin in Heart Failure with a Preserved Ejection Fraction (EMPEROR-Preserved)',
        authors: 'Anker SD, Butler J, Filippatos G, et al.',
        journal: 'N Engl J Med',
        pubdate: '2021 Oct 14',
        doi: '10.1056/NEJMoa2107038',
        url: 'https://pubmed.ncbi.nlm.nih.gov/34449189/',
        doiUrl: 'https://doi.org/10.1056/NEJMoa2107038',
      },
      {
        pmid: '36027318',
        title: 'Dapagliflozin in Heart Failure with Mildly Reduced or Preserved Ejection Fraction (DELIVER)',
        authors: 'Solomon SD, McMurray JJV, Claggett B, et al.',
        journal: 'N Engl J Med',
        pubdate: '2022 Sep 22',
        doi: '10.1056/NEJMoa2206286',
        url: 'https://pubmed.ncbi.nlm.nih.gov/36027318/',
        doiUrl: 'https://doi.org/10.1056/NEJMoa2206286',
      },
      {
        pmid: '38789311',
        title: 'Executive summary of the KDIGO 2024 Clinical Practice Guideline for the Management of Chronic Kidney Disease',
        authors: 'de Boer IH, Khunti K, Sadusky T, et al.',
        journal: 'Kidney Int',
        pubdate: '2024 Apr',
        doi: '10.1016/j.kint.2023.10.018',
        url: 'https://pubmed.ncbi.nlm.nih.gov/38789311/',
        doiUrl: 'https://doi.org/10.1016/j.kint.2023.10.018',
      },
    ];
  } else if (cleanTerm.includes('apixaban') || cleanTerm.includes('doac') || cleanTerm.includes('afib')) {
    return [
      {
        pmid: '38031697',
        title: '2023 ACC/AHA/ACCP/HRS Guideline for the Diagnosis and Management of Atrial Fibrillation',
        authors: 'Joglar JA, Chung MK, Armbruster AL, et al.',
        journal: 'Circulation',
        pubdate: '2024 Jan 2',
        doi: '10.1161/CIR.0000000000001193',
        url: 'https://pubmed.ncbi.nlm.nih.gov/38031697/',
        doiUrl: 'https://doi.org/10.1161/CIR.0000000000001193',
      },
      {
        pmid: '21875168',
        title: 'Apixaban versus Warfarin in Patients with Atrial Fibrillation (ARISTOTLE)',
        authors: 'Granger CB, Alexander JH, McMurray JJ, et al.',
        journal: 'N Engl J Med',
        pubdate: '2011 Sep 15',
        doi: '10.1056/NEJMoa1107039',
        url: 'https://pubmed.ncbi.nlm.nih.gov/21875168/',
        doiUrl: 'https://doi.org/10.1056/NEJMoa1107039',
      },
    ];
  } else if (cleanTerm.includes('semaglutide') || cleanTerm.includes('glp') || cleanTerm.includes('flow')) {
    return [
      {
        pmid: '38785209',
        title: 'Effects of Semaglutide on Chronic Kidney Disease in Patients with Type 2 Diabetes (FLOW)',
        authors: 'Perkovic V, Tuttle KR, Rossing P, et al.',
        journal: 'N Engl J Med',
        pubdate: '2024 Jul 11',
        doi: '10.1056/NEJMoa2404476',
        url: 'https://pubmed.ncbi.nlm.nih.gov/38785209/',
        doiUrl: 'https://doi.org/10.1056/NEJMoa2404476',
      },
      {
        pmid: '37622681',
        title: 'Semaglutide in Patients with Heart Failure with Preserved Ejection Fraction and Obesity (STEP-HFpEF)',
        authors: 'Kosiborod MN, Abildstrøm SZ, Borlaug BA, et al.',
        journal: 'N Engl J Med',
        pubdate: '2023 Sep 21',
        doi: '10.1056/NEJMoa2306963',
        url: 'https://pubmed.ncbi.nlm.nih.gov/37622681/',
        doiUrl: 'https://doi.org/10.1056/NEJMoa2306963',
      },
    ];
  }

  // Default fallback studies
  return [
    {
      pmid: '38789311',
      title: `Clinical Evidence Review: ${term}`,
      authors: 'Clinical Guideline Writing Committee, et al.',
      journal: 'Journal of the American College of Cardiology',
      pubdate: '2024',
      doi: '10.1016/j.jacc.2024.01.001',
      url: 'https://pubmed.ncbi.nlm.nih.gov/38789311/',
      doiUrl: 'https://doi.org/10.1016/j.jacc.2024.01.001',
    },
    {
      pmid: '36027318',
      title: `Randomized Multicenter Trial Outcomes for ${term}`,
      authors: 'International Clinical Investigation Group',
      journal: 'N Engl J Med',
      pubdate: '2023',
      doi: '10.1056/NEJMoa2206286',
      url: 'https://pubmed.ncbi.nlm.nih.gov/36027318/',
      doiUrl: 'https://doi.org/10.1056/NEJMoa2206286',
    },
  ];
}

export function generateMockFdaLabel(drug: string) {
  const clean = drug.toLowerCase();
  if (clean.includes('dapa') || clean.includes('farxiga')) {
    return {
      found: true,
      genericName: 'Dapagliflozin',
      brandName: 'FARXIGA',
      boxedWarning: undefined,
      indications: 'FARXIGA is indicated as an adjunct to diet and exercise to improve glycemic control in adults with type 2 diabetes mellitus; to reduce the risk of hospitalization for heart failure in adults with type 2 diabetes and cardiovascular disease; to reduce the risk of cardiovascular death and hospitalization for heart failure in adults with heart failure (NYHA class II-IV); and to reduce the risk of sustained eGFR decline, end-stage kidney disease, cardiovascular death, and hospitalization for heart failure in adults with chronic kidney disease.',
      dosageAndAdministration: 'Heart Failure & CKD: The recommended dose is 10 mg orally once daily. May be initiated down to eGFR >= 20 mL/min/1.73m2. No dosage titration required.',
      contraindications: 'Prior serious hypersensitivity reaction to dapagliflozin. Patients on dialysis.',
      warningsAndPrecautions: 'Ketoacidosis: Assess patients presenting with signs of ketoacidosis regardless of blood glucose. Hold for at least 3 days prior to surgery. Volume Depletion: Assess volume status and correct before initiation. Necrotizing Fasciitis of the Perineum (Fournier\'s Gangrene). Genital Mycotic Infections.',
    };
  } else if (clean.includes('empa') || clean.includes('jardiance')) {
    return {
      found: true,
      genericName: 'Empagliflozin',
      brandName: 'JARDIANCE',
      boxedWarning: undefined,
      indications: 'JARDIANCE is indicated to reduce the risk of cardiovascular death and hospitalization for heart failure in adults with heart failure; to reduce the risk of sustained decline in eGFR, end-stage kidney disease, and cardiovascular death in adults with chronic kidney disease; and to improve glycemic control in type 2 diabetes.',
      dosageAndAdministration: 'The recommended dose of JARDIANCE is 10 mg once daily in the morning, taken with or without food. Can be initiated in patients with eGFR >= 20 mL/min/1.73m2.',
      contraindications: 'Severe hypersensitivity reaction to empagliflozin; maintenance dialysis.',
      warningsAndPrecautions: 'Ketoacidosis (euglycemic DKA): Withhold 3-4 days before scheduled surgery. Volume depletion: Symptomatic hypotension may occur. Hypoglycemia when combined with insulin secretagogues.',
    };
  } else if (clean.includes('apixaban') || clean.includes('eliquis')) {
    return {
      found: true,
      genericName: 'Apixaban',
      brandName: 'ELIQUIS',
      boxedWarning: 'PREMATURE DISCONTINUATION INCREASES RISK OF THROMBOTIC EVENTS; SPINAL/EPIDURAL HEMATOMA RISK.',
      indications: 'ELIQUIS is indicated to reduce the risk of stroke and systemic embolism in patients with nonvalvular atrial fibrillation; for prophylaxis of deep vein thrombosis (DVT) following hip/knee replacement; and for treatment of DVT and pulmonary embolism.',
      dosageAndAdministration: 'Nonvalvular AF: 5 mg orally twice daily. Dose reduction to 2.5 mg twice daily is recommended for patients with at least 2 of the following: age >= 80 years, body weight <= 60 kg, or serum creatinine >= 1.5 mg/dL. Calculate Cockcroft-Gault CrCl using actual body weight.',
      contraindications: 'Active pathological bleeding; severe hypersensitivity to apixaban.',
      warningsAndPrecautions: 'Bleeding risk: Concomitant use of drugs affecting hemostasis increases bleeding risk. Reversal agent: Andexanet alfa is approved for life-threatening bleeding.',
    };
  }

  return {
    found: true,
    genericName: drug.toUpperCase(),
    brandName: `${drug.toUpperCase()} CLINICAL FORMULATION`,
    boxedWarning: undefined,
    indications: `Prescribed for evidence-based clinical indications associated with ${drug}. Consult clinical guidelines for full pharmacotherapeutic profile.`,
    dosageAndAdministration: 'Follow standard adult titration protocols based on organ function and body surface area.',
    contraindications: 'Severe hypersensitivity to active substance or excipients.',
    warningsAndPrecautions: 'Monitor routine renal and hepatic markers during therapy initiation and dose modification.',
  };
}
