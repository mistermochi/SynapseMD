import React, { useState } from 'react';
import { ClinicalCitation, ClinicalNote, PubMedArticle } from '../types/clinical';
import { searchPubMedArticles } from '../services/api';
import { formatCitationToMarkdown } from '../utils/citationFormatter';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Search,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Check,
  Copy,
  Loader2,
  BookOpen,
} from 'lucide-react';

interface CitationManagerProps {
  note: ClinicalNote;
  onAddCitationToNote: (citation: ClinicalCitation) => void;
  onToggleVerification: (citationId: string) => void;
}

export const CitationManager: React.FC<CitationManagerProps> = ({
  note,
  onAddCitationToNote,
  onToggleVerification,
}) => {
  const [pubmedQuery, setPubmedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PubMedArticle[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSearchPubMed = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pubmedQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const articles = await searchPubMedArticles(pubmedQuery.trim(), 6);
      setSearchResults(articles);
      if (articles.length === 0) {
        setSearchError('No indexed articles found for this query.');
      }
    } catch (err: any) {
      setSearchError(err?.message || 'PubMed query failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddPubMedToVault = (art: PubMedArticle) => {
    const newCit: ClinicalCitation = {
      id: `cit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: art.title,
      authors: art.authors,
      sourceType: 'RCT',
      publisher: art.journal,
      year: art.pubdate,
      pmid: art.pmid,
      doi: art.doi,
      url: art.url,
      relevanceStatement: `Direct clinical citation from PubMed search for "${note.title}".`,
      confidence: 'High',
      verificationStatus: 'unverified',
    };
    onAddCitationToNote(newCit);
  };

  const handleCopyCitation = (cit: ClinicalCitation) => {
    const text = formatCitationToMarkdown(cit);
    navigator.clipboard.writeText(text);
    setCopiedId(cit.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Header Info */}
      <div className="p-3 bg-muted/50 border border-border rounded-lg text-xs space-y-1">
        <div className="flex items-center justify-between text-foreground">
          <span className="font-semibold flex items-center gap-1.5 text-xs">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            Clinical Citation Index
          </span>
          <Badge variant="outline" className="font-mono text-[9.5px]">
            {note.citations.length} Citations
          </Badge>
        </div>
        <p className="text-muted-foreground text-[11px]">
          All AI citations require explicit physician audit before being marked verified.
        </p>
      </div>

      {/* Live PubMed Search Box */}
      <div className="p-3 bg-card border border-border rounded-lg space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-primary" />
            PubMed / NCBI Search
          </span>
          <button
            onClick={() => {
              setPubmedQuery(note.title.replace('&', 'AND'));
              setTimeout(() => handleSearchPubMed(), 50);
            }}
            className="text-[10px] text-primary hover:underline cursor-pointer active:scale-95"
          >
            Auto-fill Note Topic
          </button>
        </div>

        <form onSubmit={handleSearchPubMed} className="flex gap-1.5">
          <input
            type="text"
            placeholder="Search trials, e.g. semaglutide FLOW, DAPA-HF..."
            value={pubmedQuery}
            onChange={(e) => setPubmedQuery(e.target.value)}
            className="flex-1 bg-background border border-input rounded-md px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
          />
          <Button
            type="submit"
            disabled={isSearching}
            size="sm"
            className="shrink-0"
          >
            {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3 mr-1" />}
            Query
          </Button>
        </form>

        {searchError && (
          <p className="text-[11px] text-destructive">{searchError}</p>
        )}

        {/* Live Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto pr-1">
            <span className="text-[10px] uppercase font-mono text-muted-foreground block">
              PubMed Results ({searchResults.length})
            </span>
            {searchResults.map((art) => (
              <div
                key={art.pmid}
                className="p-2 rounded-md bg-muted/40 border border-border text-xs space-y-1 hover:border-border/80 transition-colors"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <a
                    href={art.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground hover:underline transition-colors flex items-center gap-1 leading-snug text-xs"
                  >
                    <span>{art.title}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 text-muted-foreground" />
                  </a>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                  <span>{art.journal}</span>
                  <span>•</span>
                  <span>{art.pubdate}</span>
                  <span>•</span>
                  <span>PMID: {art.pmid}</span>
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[10px] text-muted-foreground truncate max-w-[170px]">
                    {art.authors}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddPubMedToVault(art)}
                    className="h-5.5 text-[10px] px-1.5"
                  >
                    <Plus className="w-3 h-3 mr-0.5" />
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Citations Attached to Active Note */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground pb-0.5">
          <span className="font-semibold text-foreground">
            Current References ({note.citations.length})
          </span>
        </div>

        {note.citations.map((cit, idx) => {
          const isVerified = cit.verificationStatus === 'user-verified';

          return (
            <div
              key={cit.id}
              className={`p-2.5 rounded-lg border text-xs space-y-1.5 transition-all shadow-2xs ${
                isVerified
                  ? 'bg-card border-border'
                  : 'bg-amber-500/5 border-amber-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="secondary" className="text-[9px] uppercase font-mono px-1.5 py-0 h-4">
                      {cit.sourceType.replace('_', ' ')}
                    </Badge>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Ref #{idx + 1}
                    </span>
                  </div>
                  <h5 className="font-semibold text-foreground leading-snug text-xs">
                    {cit.title}
                  </h5>
                </div>
              </div>

              {cit.authors && (
                <p className="text-[11px] text-muted-foreground italic">
                  {cit.authors} — {cit.publisher} ({cit.year})
                </p>
              )}

              {cit.relevanceStatement && (
                <div className="p-1.5 rounded bg-muted/60 text-[10.5px] text-foreground border-l-2 border-primary">
                  <span className="font-semibold text-primary">Relevance: </span>
                  {cit.relevanceStatement}
                </div>
              )}

              {/* Action Ribbon & Verification Toggle */}
              <div className="flex items-center justify-between pt-1 border-t border-border text-[11px]">
                <div className="flex items-center gap-2">
                  {cit.url && (
                    <a
                      href={cit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-[10.5px]"
                    >
                      <span>Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {cit.pmid && (
                    <span className="font-mono text-muted-foreground text-[10px]">
                      PMID:{cit.pmid}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={() => handleCopyCitation(cit)}
                    title="Copy Markdown citation"
                    className="h-6 w-6"
                  >
                    {copiedId === cit.id ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3 text-muted-foreground" />
                    )}
                  </Button>

                  {/* Physician verification toggle */}
                  <Button
                    variant={isVerified ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onToggleVerification(cit.id)}
                    className="h-5.5 text-[9.5px] px-1.5"
                  >
                    {isVerified ? (
                      <>
                        <ShieldCheck className="w-3 h-3 mr-0.5 text-primary-foreground" />
                        Verified
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-3 h-3 mr-0.5 text-amber-500" />
                        Verify
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {note.citations.length === 0 && (
          <div className="p-5 text-center text-muted-foreground text-xs">
            No citations added yet. Search PubMed above to cite trials or guidelines.
          </div>
        )}
      </div>
    </div>
  );
};
