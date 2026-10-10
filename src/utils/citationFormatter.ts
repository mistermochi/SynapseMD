import { ClinicalCitation } from '../types/clinical';

export function formatCitationToMarkdown(cit: ClinicalCitation, index?: number): string {
  const numStr = index !== undefined ? `${index}. ` : '- ';
  let text = `${numStr}**${cit.title}**`;
  if (cit.authors) {
    text += ` — *${cit.authors}*`;
  }
  if (cit.publisher) {
    text += ` (${cit.publisher}, ${cit.year})`;
  }
  const badges: string[] = [];
  if (cit.sourceType) {
    badges.push(`[${cit.sourceType.toUpperCase().replace('_', ' ')}]`);
  }
  if (cit.pmid) {
    badges.push(`[PMID: ${cit.pmid}]`);
  }
  if (cit.doi) {
    badges.push(`[DOI: ${cit.doi}]`);
  }
  if (badges.length > 0) {
    text += `\n   ${badges.join(' ')}`;
  }
  if (cit.url) {
    text += `\n   Link: ${cit.url}`;
  }
  if (cit.relevanceStatement) {
    text += `\n   > Clinical note: ${cit.relevanceStatement}`;
  }
  return text;
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
