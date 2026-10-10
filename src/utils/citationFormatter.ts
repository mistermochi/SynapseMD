import { ClinicalCitation } from '../types/clinical';

function getCitationDisplayTitle(cit: ClinicalCitation): string {
  const parentheticalMatch = cit.title.match(/\(([^)]+)\)$/);
  if (parentheticalMatch?.[1]) {
    return parentheticalMatch[1];
  }

  if (!cit.publisher && !cit.year) {
    return cit.title;
  }

  return cit.title;
}

export function formatCitationToMarkdown(cit: ClinicalCitation, index?: number): string {
  const numStr = index !== undefined ? `${index}. ` : '- ';
  const isVerified = cit.verificationStatus === 'user-verified';
  const name = getCitationDisplayTitle(cit);
  const citationText = [name, cit.publisher, cit.year].filter(Boolean).join('. ');
  const titleMarkup = cit.url && isVerified ? `[${citationText}](${cit.url})` : `**${citationText}**`;

  return `${numStr}${titleMarkup}`;
}

export function generateVancouverCitation(cit: ClinicalCitation, index: number): string {
  const authors = cit.authors || 'Author unspecified';
  const journal = cit.publisher || 'Journal';
  const year = cit.year || new Date().getFullYear();
  let line = `${index}. ${authors}. ${cit.title}. *${journal}*. ${year};`;
  if (cit.pmid) line += ` PMID: ${cit.pmid}.`;
  if (cit.doi) line += ` doi:${cit.doi}.`;
  return line;
}
