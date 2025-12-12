/**
 * BM25 Search Algorithm
 *
 * Okapi BM25 is a ranking function used by search engines to estimate
 * the relevance of documents to a given search query.
 *
 * Formula: BM25(D,Q) = Σ IDF(qi) * (f(qi,D) * (k1+1)) / (f(qi,D) + k1 * (1 - b + b * |D|/avgdl))
 */

export interface BM25Config {
  k1: number;  // Term frequency saturation parameter (1.2 - 2.0)
  b: number;   // Length normalization parameter (0 - 1, typically 0.75)
}

export interface BM25Document {
  id: string;
  content: string;
  tokens?: string[];
  length?: number;
}

export interface BM25SearchResult {
  id: string;
  score: number;
  matchedTerms: string[];
}

const DEFAULT_BM25_CONFIG: BM25Config = {
  k1: 1.5,
  b: 0.75,
};

/**
 * BM25 Index for efficient text search
 */
export class BM25Index {
  private config: BM25Config;
  private documents: Map<string, BM25Document> = new Map();
  private tokenizedDocs: Map<string, string[]> = new Map();
  private docLengths: Map<string, number> = new Map();
  private avgDocLength: number = 0;
  private termFrequencies: Map<string, Map<string, number>> = new Map(); // term -> {docId -> count}
  private documentFrequencies: Map<string, number> = new Map(); // term -> doc count
  private totalDocs: number = 0;

  constructor(config?: Partial<BM25Config>) {
    this.config = { ...DEFAULT_BM25_CONFIG, ...config };
  }

  /**
   * Tokenize text into searchable terms
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1 && token.length < 50);
  }

  /**
   * Add a document to the index
   */
  addDocument(doc: BM25Document): void {
    const tokens = doc.tokens || this.tokenize(doc.content);
    const docLength = tokens.length;

    this.documents.set(doc.id, doc);
    this.tokenizedDocs.set(doc.id, tokens);
    this.docLengths.set(doc.id, docLength);

    // Count term frequencies for this document
    const termCounts = new Map<string, number>();
    for (const token of tokens) {
      termCounts.set(token, (termCounts.get(token) || 0) + 1);
    }

    // Update global term frequencies and document frequencies
    for (const [term, count] of termCounts) {
      if (!this.termFrequencies.has(term)) {
        this.termFrequencies.set(term, new Map());
      }
      this.termFrequencies.get(term)!.set(doc.id, count);

      // Update document frequency (how many docs contain this term)
      this.documentFrequencies.set(term, (this.documentFrequencies.get(term) || 0) + 1);
    }

    this.totalDocs++;

    // Update average document length
    this.updateAvgDocLength();
  }

  /**
   * Add multiple documents
   */
  addDocuments(docs: BM25Document[]): void {
    for (const doc of docs) {
      this.addDocument(doc);
    }
  }

  /**
   * Remove a document from the index
   */
  removeDocument(docId: string): boolean {
    if (!this.documents.has(docId)) {
      return false;
    }

    const tokens = this.tokenizedDocs.get(docId) || [];
    const termCounts = new Map<string, number>();

    for (const token of tokens) {
      termCounts.set(token, (termCounts.get(token) || 0) + 1);
    }

    // Update global indices
    for (const [term] of termCounts) {
      const termFreq = this.termFrequencies.get(term);
      if (termFreq) {
        termFreq.delete(docId);
        if (termFreq.size === 0) {
          this.termFrequencies.delete(term);
        }
      }

      const docFreq = this.documentFrequencies.get(term);
      if (docFreq !== undefined) {
        if (docFreq <= 1) {
          this.documentFrequencies.delete(term);
        } else {
          this.documentFrequencies.set(term, docFreq - 1);
        }
      }
    }

    this.documents.delete(docId);
    this.tokenizedDocs.delete(docId);
    this.docLengths.delete(docId);
    this.totalDocs--;

    this.updateAvgDocLength();
    return true;
  }

  /**
   * Update average document length
   */
  private updateAvgDocLength(): void {
    if (this.totalDocs === 0) {
      this.avgDocLength = 0;
      return;
    }

    let totalLength = 0;
    for (const length of this.docLengths.values()) {
      totalLength += length;
    }
    this.avgDocLength = totalLength / this.totalDocs;
  }

  /**
   * Calculate IDF for a term
   * IDF(t) = log((N - n(t) + 0.5) / (n(t) + 0.5) + 1)
   */
  private calculateIDF(term: string): number {
    const docFreq = this.documentFrequencies.get(term) || 0;
    return Math.log(
      (this.totalDocs - docFreq + 0.5) / (docFreq + 0.5) + 1
    );
  }

  /**
   * Calculate BM25 score for a document given a query
   */
  private calculateScore(docId: string, queryTerms: string[]): number {
    const docLength = this.docLengths.get(docId) || 0;
    const { k1, b } = this.config;
    let score = 0;

    for (const term of queryTerms) {
      const termFreqMap = this.termFrequencies.get(term);
      if (!termFreqMap) continue;

      const termFreq = termFreqMap.get(docId) || 0;
      if (termFreq === 0) continue;

      const idf = this.calculateIDF(term);
      const numerator = termFreq * (k1 + 1);
      const denominator = termFreq + k1 * (1 - b + b * (docLength / this.avgDocLength));

      score += idf * (numerator / denominator);
    }

    return score;
  }

  /**
   * Search documents with a query
   */
  search(query: string, limit: number = 10): BM25SearchResult[] {
    const queryTerms = this.tokenize(query);
    const queryTermSet = new Set(queryTerms);

    if (queryTerms.length === 0) {
      return [];
    }

    const results: BM25SearchResult[] = [];

    for (const docId of this.documents.keys()) {
      const score = this.calculateScore(docId, queryTerms);
      if (score > 0) {
        // Find matched terms
        const docTokens = new Set(this.tokenizedDocs.get(docId) || []);
        const matchedTerms = queryTerms.filter(term => docTokens.has(term));

        results.push({
          id: docId,
          score,
          matchedTerms: [...new Set(matchedTerms)],
        });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }

  /**
   * Get index statistics
   */
  getStats(): {
    totalDocuments: number;
    totalTerms: number;
    avgDocLength: number;
  } {
    return {
      totalDocuments: this.totalDocs,
      totalTerms: this.termFrequencies.size,
      avgDocLength: this.avgDocLength,
    };
  }

  /**
   * Clear the index
   */
  clear(): void {
    this.documents.clear();
    this.tokenizedDocs.clear();
    this.docLengths.clear();
    this.termFrequencies.clear();
    this.documentFrequencies.clear();
    this.totalDocs = 0;
    this.avgDocLength = 0;
  }

  /**
   * Export index for serialization
   */
  export(): {
    config: BM25Config;
    documents: [string, BM25Document][];
    stats: { totalDocs: number; avgDocLength: number };
  } {
    return {
      config: this.config,
      documents: [...this.documents.entries()],
      stats: {
        totalDocs: this.totalDocs,
        avgDocLength: this.avgDocLength,
      },
    };
  }

  /**
   * Import index from serialized data
   */
  import(data: {
    config: BM25Config;
    documents: [string, BM25Document][];
  }): void {
    this.clear();
    this.config = data.config;

    for (const [, doc] of data.documents) {
      this.addDocument(doc);
    }
  }
}

/**
 * Create a new BM25 index
 */
export function createBM25Index(config?: Partial<BM25Config>): BM25Index {
  return new BM25Index(config);
}
