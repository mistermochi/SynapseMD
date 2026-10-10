import { diffLines, diffWordsWithSpace, Change } from 'diff';

export interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export function computeLineDiff(oldText: string, newText: string): DiffPart[] {
  const changes: Change[] = diffLines(oldText, newText);
  return changes.map((c) => ({
    value: c.value,
    added: c.added,
    removed: c.removed,
  }));
}

export function computeWordDiff(oldText: string, newText: string): DiffPart[] {
  const changes: Change[] = diffWordsWithSpace(oldText, newText);
  return changes.map((c) => ({
    value: c.value,
    added: c.added,
    removed: c.removed,
  }));
}
