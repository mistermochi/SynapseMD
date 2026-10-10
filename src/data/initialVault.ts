import { ClinicalNote } from '../types/clinical';

export const INITIAL_VAULT_NOTES: ClinicalNote[] = [
  {
    id: 'note-sglt2i-hf',
    title: 'SGLT2 Inhibitors & Heart Failure',
    path: 'Cardiology/SGLT2 Inhibitors & Heart Failure.md',
    folder: 'Cardiology',
    tags: ['cardiology', 'heart-failure', 'sglt2i', 'guidelines'],
    specialty: 'Cardiovascular Medicine',
    reviewed: false,
    lastChecked: '2023-11-14', // Flagged as stale (>2 years)
    evidenceLevel: 'Level A',
    citationsCount: 4,
    backlinks: ['CKD Staging & KDIGO 2024 Guidelines', 'Resistant Hypertension & MRA Therapy'],
    outlinks: ['CKD Staging & KDIGO 2024 Guidelines', 'GLP-1 Receptor Agonists in T2DM & CKD'],
    citations: [
      {
        id: 'cit-1',
        title: 'Dapagliflozin in Patients with Heart Failure and Reduced Ejection Fraction (DAPA-HF)',
        authors: 'McMurray JJV, et al.',
        sourceType: 'RCT',
        publisher: 'N Engl J Med',
        year: 2019,
        pmid: '31535829',
        doi: '10.1056/NEJMoa1911303',
        url: 'https://pubmed.ncbi.nlm.nih.gov/31535829/',
        relevanceStatement: 'Foundational trial demonstrating 26% reduction in CV death or worsening HF regardless of diabetes status.',
        confidence: 'High',
        verificationStatus: 'user-verified',
        verifiedAt: '2024-01-10T09:30:00Z',
        verifiedBy: 'Dr. M. Chen, MD',
      },
      {
        id: 'cit-2',
        title: 'Cardiovascular and Renal Outcomes with Empagliflozin in Heart Failure (EMPEROR-Reduced)',
        authors: 'Packer M, et al.',
        sourceType: 'RCT',
        publisher: 'N Engl J Med',
        year: 2020,
        pmid: '32865377',
        doi: '10.1056/NEJMoa2022190',
        url: 'https://pubmed.ncbi.nlm.nih.gov/32865377/',
        relevanceStatement: '25% lower risk of composite CV death or hospitalization for HF in HFrEF.',
        confidence: 'High',
        verificationStatus: 'user-verified',
        verifiedAt: '2024-01-10T09:32:00Z',
        verifiedBy: 'Dr. M. Chen, MD',
      },
      {
        id: 'cit-3',
        title: '2022 AHA/ACC/HFSA Guideline for the Management of Heart Failure',
        authors: 'Heidenreich PA, et al.',
        sourceType: 'guideline',
        publisher: 'Circulation',
        year: 2022,
        url: 'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001063',
        relevanceStatement: 'Class 1A recommendation for SGLT2i as foundational quadruple therapy in HFrEF.',
        confidence: 'High',
        verificationStatus: 'user-verified',
        verifiedAt: '2024-01-10T09:35:00Z',
        verifiedBy: 'Dr. M. Chen, MD',
      },
      {
        id: 'cit-4',
        title: 'Empagliflozin in Heart Failure with a Preserved Ejection Fraction (EMPEROR-Preserved)',
        authors: 'Anker SD, et al.',
        sourceType: 'RCT',
        publisher: 'N Engl J Med',
        year: 2021,
        pmid: '34449189',
        doi: '10.1056/NEJMoa2107038',
        url: 'https://pubmed.ncbi.nlm.nih.gov/34449189/',
        relevanceStatement: 'First agent to show reduction in CV death or HF hospitalizations in HFpEF (EF > 40%).',
        confidence: 'High',
        verificationStatus: 'unverified',
      },
    ],
    content: `---
title: SGLT2 Inhibitors & Heart Failure
reviewed: false
last_checked: 2023-11-14
evidence_level: Level A
specialty: Cardiovascular Medicine
tags: [cardiology, heart-failure, sglt2i, guidelines]
---

# SGLT2 Inhibitors & Heart Failure

Sodium-glucose cotransporter-2 (SGLT2) inhibitors are now recognized as one of the four foundational pillars of guideline-directed medical therapy (GDMT) for heart failure with reduced ejection fraction (HFrEF), alongside ARNI/ACEi, beta-blockers, and mineralocorticoid receptor antagonists (MRAs).

## Mechanism in Heart Failure
The cardiovascular benefits extend far beyond glycemic control through osmotic diuresis, reduction in preload and afterload, shift in myocardial fuel metabolism toward ketone oxidation, reduction in cardiac fibrosis, and preservation of renal microvascular hemodynamics.

## Clinical Indications & Evidence
SGLT2 inhibitors reduce cardiovascular events in T2DM. Initiation traditionally requires eGFR > 30 mL/min/1.73m². In heart failure with reduced ejection fraction, dapagliflozin 10 mg once daily or empagliflozin 10 mg once daily reduces cardiovascular death and hospitalizations for heart failure by ~25%.

> [!NOTE]
> Cross-reference with [[CKD Staging & KDIGO 2024 Guidelines]] regarding renal progression slowing and combination with [[GLP-1 Receptor Agonists in T2DM & CKD]].

## Dosing Protocols
- **Dapagliflozin**: 10 mg PO once daily (no dose titration required).
- **Empagliflozin**: 10 mg PO once daily (no dose titration required).
- **Renal Cutoffs**: In current local hospital policy, discontinue if eGFR drops below 30 mL/min.

## Safety & Adverse Effects
- Euglycemic Diabetic Ketoacidosis (euDKA): High risk during surgery, acute illness, or prolonged fasting. Hold 3-4 days prior to elective surgery.
- Genital Mycotic Infections: 3-5 fold increase; educate on proper hygiene.
- Acute kidney injury (AKI) transient dip: Initial serum creatinine rise of up to 30% is expected due to restoration of tubuloglomerular feedback and does not indicate parenchymal injury.

## References
1. [DAPA-HF. N Engl J Med. 2019](https://pubmed.ncbi.nlm.nih.gov/31535829/)
2. [EMPEROR-Reduced. N Engl J Med. 2020](https://pubmed.ncbi.nlm.nih.gov/32865377/)
3. [2022 AHA/ACC/HFSA HF Guideline. Circulation. 2022](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001063)
`,
  },
  {
    id: 'note-glp1ra-ckd',
    title: 'GLP-1 Receptor Agonists in T2DM & CKD',
    path: 'Endocrinology/GLP-1 Receptor Agonists in T2DM & CKD.md',
    folder: 'Endocrinology',
    tags: ['endocrinology', 'nephrology', 'glp1ra', 't2dm', 'ckd'],
    specialty: 'Endocrinology & Metabolism',
    reviewed: true,
    lastChecked: '2025-08-20',
    evidenceLevel: 'Level A',
    citationsCount: 3,
    backlinks: ['SGLT2 Inhibitors & Heart Failure', 'CKD Staging & KDIGO 2024 Guidelines'],
    outlinks: ['CKD Staging & KDIGO 2024 Guidelines', 'SGLT2 Inhibitors & Heart Failure'],
    citations: [
      {
        id: 'cit-glp1-1',
        title: 'Effects of Semaglutide on Chronic Kidney Disease in Patients with Type 2 Diabetes (FLOW Trial)',
        authors: 'Perkovic V, et al.',
        sourceType: 'RCT',
        publisher: 'N Engl J Med',
        year: 2024,
        pmid: '38785209',
        doi: '10.1056/NEJMoa2403347',
        url: 'https://pubmed.ncbi.nlm.nih.gov/38785209/',
        relevanceStatement: 'Primary endpoint stopped early for efficacy: 24% reduction in major kidney disease events and CV death.',
        confidence: 'High',
        verificationStatus: 'user-verified',
        verifiedAt: '2025-08-20T14:15:00Z',
        verifiedBy: 'Dr. M. Chen, MD',
      },
      {
        id: 'cit-glp1-2',
        title: 'Semaglutide and Cardiovascular Outcomes in Obesity without Diabetes (SELECT Trial)',
        authors: 'Lincoff AM, et al.',
        sourceType: 'RCT',
        publisher: 'N Engl J Med',
        year: 2023,
        pmid: '37952131',
        doi: '10.1056/NEJMoa2307563',
        url: 'https://pubmed.ncbi.nlm.nih.gov/37952131/',
        relevanceStatement: '20% reduction in MACE in overweight/obese patients with established CVD without diabetes.',
        confidence: 'High',
        verificationStatus: 'user-verified',
        verifiedAt: '2025-08-20T14:20:00Z',
        verifiedBy: 'Dr. M. Chen, MD',
      },
      {
        id: 'cit-glp1-3',
        title: 'Standards of Care in Diabetes—2025',
        authors: 'American Diabetes Association',
        sourceType: 'guideline',
        publisher: 'Diabetes Care',
        year: 2025,
        url: 'https://diabetesjournals.org/care/issue/48/Supplement_1',
        relevanceStatement: 'Strong recommendation for GLP-1 RA in T2DM with high CVD risk or CKD when eGFR >= 15 mL/min.',
        confidence: 'High',
        verificationStatus: 'user-verified',
        verifiedAt: '2025-08-20T14:22:00Z',
        verifiedBy: 'Dr. M. Chen, MD',
      },
    ],
    content: `---
title: GLP-1 Receptor Agonists in T2DM & CKD
reviewed: true
last_checked: 2025-08-20
evidence_level: Level A
specialty: Endocrinology & Metabolism
tags: [endocrinology, nephrology, glp1ra, t2dm, ckd]
---

# GLP-1 Receptor Agonists in T2DM & CKD

Glucagon-like peptide-1 receptor agonists (GLP-1 RAs) possess potent glucose-lowering, weight loss, cardiovascular risk reduction, and renal protective properties in patients with type 2 diabetes and chronic kidney disease.

## Landmark Evidence: FLOW & SELECT
The FLOW trial demonstrated that injectable semaglutide 1.0 mg weekly reduced major kidney disease progression events (eGFR decline >= 50%, kidney failure, or renal/CV death) by 24% (HR 0.76, 95% CI 0.66-0.88, p=0.0003) in patients with T2DM and CKD (eGFR 25-75 mL/min/1.73m² with albuminuria).

Cross-link to [[SGLT2 Inhibitors & Heart Failure]] regarding dual cardiorenal protection strategies.

## Renal Titration Guidelines
- Unlike SGLT2 inhibitors or metformin, **semaglutide and dulaglutide do not require dose adjustment for renal impairment** and can be initiated down to eGFR 15 mL/min/1.73m².
- Metformin must be dose-reduced at eGFR < 45 and discontinued at eGFR < 30.

## Titration Protocol (Injectable Semaglutide)
1. **Initiation**: 0.25 mg SC weekly for 4 weeks (tolerability priming, not glycemic efficacy).
2. **Maintenance 1**: 0.5 mg SC weekly for at least 4 weeks.
3. **Escalation**: 1.0 mg SC weekly (standard FLOW trial dose).
4. **Max dose for Glycemia/Obesity**: 2.0 mg weekly (Ozempic) or 2.4 mg weekly (Wegovy).

## Contraindications & Safety Warnings
> [!WARNING]
> Absolute contraindication: Personal or family history of Medullary Thyroid Carcinoma (MTC) or Multiple Endocrine Neoplasia syndrome type 2 (MEN 2).
> Relative contraindications: History of severe pancreatitis, severe diabetic gastroparesis.

## References
1. Perkovic V, et al. *FLOW Trial*. N Engl J Med 2024;391:109-121. [PMID: 38785209]
2. Lincoff AM, et al. *SELECT Trial*. N Engl J Med 2023;389:2221-2232. [PMID: 37952131]
3. American Diabetes Association. *Standards of Care in Diabetes—2025*. Diabetes Care 2025;48(Suppl. 1).
`,
  },
  {
    id: 'note-doac-ckd',
    title: 'DOAC Dosing & Anticoagulation in CKD',
    path: 'Hematology & Vascular/DOAC Dosing & Anticoagulation in CKD.md',
    folder: 'Hematology & Vascular',
    tags: ['anticoagulation', 'doac', 'ckd', 'afib', 'renal-dosing'],
    specialty: 'Cardiovascular & Hematology',
    reviewed: false,
    lastChecked: '2023-04-18', // Stale
    evidenceLevel: 'Level B',
    citationsCount: 2,
    backlinks: ['CKD Staging & KDIGO 2024 Guidelines'],
    outlinks: ['CKD Staging & KDIGO 2024 Guidelines'],
    citations: [
      {
        id: 'cit-doac-1',
        title: '2023 ACC/AHA/ACCP/HRS Guideline for the Diagnosis and Management of Atrial Fibrillation',
        authors: 'Joglar JA, et al.',
        sourceType: 'guideline',
        publisher: 'Circulation',
        year: 2024,
        doi: '10.1161/CIR.0000000000001193',
        url: 'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001193',
        relevanceStatement: 'Recommends DOACs over warfarin in eligible patients with AFib and non-end-stage CKD.',
        confidence: 'High',
        verificationStatus: 'unverified',
      },
      {
        id: 'cit-doac-2',
        title: 'Apixaban for Patients with Atrial Fibrillation on Hemodialysis: Results from the RENAL-AF Trial',
        authors: 'Pokorney SD, et al.',
        sourceType: 'RCT',
        publisher: 'Circulation',
        year: 2022,
        pmid: '36330752',
        url: 'https://pubmed.ncbi.nlm.nih.gov/36330752/',
        relevanceStatement: 'Small RCT comparing apixaban vs warfarin in ESRD patients on HD; showed high bleeding rates in both arms.',
        confidence: 'Moderate',
        verificationStatus: 'unverified',
      },
    ],
    content: `---
title: DOAC Dosing & Anticoagulation in CKD
reviewed: false
last_checked: 2023-04-18
evidence_level: Level B
specialty: Cardiovascular & Hematology
tags: [anticoagulation, doac, ckd, afib, renal-dosing]
---

# DOAC Dosing & Anticoagulation in CKD

Direct Oral Anticoagulants (DOACs) are preferred over Vitamin K Antagonists (warfarin) for stroke prevention in nonvalvular atrial fibrillation (NVAF) due to predictable pharmacokinetics, lack of INR monitoring, and ~50% reduction in intracranial hemorrhage.

## Renal Clearance by Agent
- **Dabigatran**: 80% renal excretion (highest risk in renal impairment; avoid if CrCl < 30 mL/min).
- **Rivaroxaban**: 35% active renal clearance.
- **Edoxaban**: 50% renal elimination.
- **Apixaban**: 27% renal clearance (safest DOAC profile across CKD stages 3-4).

## Dose Reduction Criteria
### Apixaban (Standard: 5 mg BID)
Reduce to **2.5 mg BID** if patient meets AT LEAST TWO of the ABC criteria:
- **A**ge >= 80 years
- **B**ody weight <= 60 kg
- Serum **C**reatinine >= 1.5 mg/dL (133 umol/L)

### Rivaroxaban (Standard: 20 mg daily with dinner)
- CrCl 15-49 mL/min: Reduce to **15 mg once daily** taken with evening meal.
- CrCl < 15 mL/min: Not recommended / contraindicated in European labeling.

> [!WARNING]
> In patients with fluctuating renal function or acute decompensation, calculate CrCl using the Cockcroft-Gault formula with actual body weight, not eGFR CKD-EPI, as all pivotal DOAC trials utilized Cockcroft-Gault!

See [[CKD Staging & KDIGO 2024 Guidelines]] for staging definitions.
`,
  },
  {
    id: 'note-ckd-kdigo',
    title: 'CKD Staging & KDIGO 2024 Guidelines',
    path: 'Nephrology/CKD Staging & KDIGO 2024 Guidelines.md',
    folder: 'Nephrology',
    tags: ['nephrology', 'kdigo', 'ckd', 'albuminuria', 'finerenone'],
    specialty: 'Nephrology',
    reviewed: true,
    lastChecked: '2026-02-10',
    evidenceLevel: 'Level A',
    citationsCount: 2,
    backlinks: ['SGLT2 Inhibitors & Heart Failure', 'GLP-1 Receptor Agonists in T2DM & CKD', 'DOAC Dosing & Anticoagulation in CKD'],
    outlinks: ['SGLT2 Inhibitors & Heart Failure', 'GLP-1 Receptor Agonists in T2DM & CKD', 'Resistant Hypertension & MRA Therapy'],
    citations: [
      {
        id: 'cit-kdigo-1',
        title: 'KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease',
        authors: 'Kidney Disease: Improving Global Outcomes (KDIGO) CKD Work Group',
        sourceType: 'guideline',
        publisher: 'Kidney Int',
        year: 2024,
        url: 'https://kdigo.org/guidelines/ckd-evaluation-and-management/',
        relevanceStatement: 'Updated comprehensive guideline emphasizing early multi-targeted therapy: SGLT2i, nsMRA, RASi, and GLP-1 RA.',
        confidence: 'High',
        verificationStatus: 'user-verified',
        verifiedAt: '2026-02-10T11:00:00Z',
        verifiedBy: 'Dr. M. Chen, MD',
      },
      {
        id: 'cit-kdigo-2',
        title: 'Cardiovascular Events with Finerenone in Kidney Disease and Type 2 Diabetes (FIGARO-DKD)',
        authors: 'Pitt B, et al.',
        sourceType: 'RCT',
        publisher: 'N Engl J Med',
        year: 2021,
        pmid: '34449192',
        url: 'https://pubmed.ncbi.nlm.nih.gov/34449192/',
        relevanceStatement: 'Demonstrated reduction in CV death and HF hospitalizations across broader CKD stages with finerenone.',
        confidence: 'High',
        verificationStatus: 'user-verified',
        verifiedAt: '2026-02-10T11:05:00Z',
        verifiedBy: 'Dr. M. Chen, MD',
      },
    ],
    content: `---
title: CKD Staging & KDIGO 2024 Guidelines
reviewed: true
last_checked: 2026-02-10
evidence_level: Level A
specialty: Nephrology
tags: [nephrology, kdigo, ckd, albuminuria, finerenone]
---

# CKD Staging & KDIGO 2024 Guidelines

The KDIGO 2024 guideline classifies Chronic Kidney Disease by both glomerular filtration rate (GFR stage G1-G5) and persistent urinary albumin-to-creatinine ratio (uACR category A1-A3).

## The Modern 4-Pillar Nephroprotection Framework
1. **RAS Inhibition**: Maximum tolerated ACEi or ARB (never dual ACEi + ARB).
2. **SGLT2 Inhibitor**: [[SGLT2 Inhibitors & Heart Failure]] recommended for all patients with eGFR >= 20 mL/min/1.73m² and uACR >= 200 mg/g. Once initiated, continue until dialysis.
3. **Non-steroidal MRA (Finerenone)**: In T2DM with persistent albuminuria despite maximally tolerated RASi; lowers renal progression and CV mortality without hemodynamic hypoperfusion.
4. **GLP-1 Receptor Agonist**: [[GLP-1 Receptor Agonists in T2DM & CKD]] indicated for cardiovascular protection and albuminuria reduction down to eGFR 15.

Cross-reference with [[Resistant Hypertension & MRA Therapy]] for potassium management protocols.
`,
  },
  {
    id: 'note-resistant-htn',
    title: 'Resistant Hypertension & MRA Therapy',
    path: 'Internal Medicine/Resistant Hypertension & MRA Therapy.md',
    folder: 'Internal Medicine',
    tags: ['hypertension', 'mra', 'spironolactone', 'pathway-2', 'potassium'],
    specialty: 'Internal Medicine',
    reviewed: false,
    lastChecked: '2023-08-05', // Stale
    evidenceLevel: 'Level A',
    citationsCount: 1,
    backlinks: ['CKD Staging & KDIGO 2024 Guidelines'],
    outlinks: ['CKD Staging & KDIGO 2024 Guidelines'],
    citations: [
      {
        id: 'cit-htn-1',
        title: 'Spironolactone versus placebo, bisoprolol, and doxazosin to determine the optimal treatment for drug-resistant hypertension (PATHWAY-2)',
        authors: 'Williams B, et al.',
        sourceType: 'RCT',
        publisher: 'Lancet',
        year: 2015,
        pmid: '26392094',
        url: 'https://pubmed.ncbi.nlm.nih.gov/26392094/',
        relevanceStatement: 'Definitive trial proving spironolactone is superior to beta-blocker or alpha-blocker as 4th-line agent in resistant hypertension.',
        confidence: 'High',
        verificationStatus: 'unverified',
      },
    ],
    content: `---
title: Resistant Hypertension & MRA Therapy
reviewed: false
last_checked: 2023-08-05
evidence_level: Level A
specialty: Internal Medicine
tags: [hypertension, mra, spironolactone, pathway-2, potassium]
---

# Resistant Hypertension & MRA Therapy

Resistant hypertension is defined as blood pressure that remains above target (>130/80 mmHg) despite concurrent use of three antihypertensive drug classes at optimal doses, including a diuretic (typically thiazide/thiazide-like), a calcium channel blocker (CCB), and a RAS inhibitor (ACEi or ARB).

## Optimal 4th-Line Agent: PATHWAY-2
The PATHWAY-2 trial demonstrated that **Spironolactone (25-50 mg daily)** was clearly superior to bisoprolol, doxazosin, and placebo in reducing home and clinic systolic blood pressure, pointing to sodium retention/inappropriate aldosterone activity as the primary driver.

## Initiation Protocol & Safety Monitoring
- **Baseline Serum Potassium**: Must be < 4.5 mEq/L prior to starting.
- **Baseline eGFR**: Must be > 45 mL/min/1.73m² (higher hyperkalemia risk if eGFR 30-45).
- **Starting Dose**: Spironolactone 25 mg PO once daily.
- **Lab Check**: Mandatory serum potassium and creatinine at 1 week, 4 weeks, and every 3-6 months.

## Alternative in Men with Gynecomastia
Eplerenone 50 mg daily (more selective mineralocorticoid receptor antagonism, lacks anti-androgenic side effects).
`,
  },
];
