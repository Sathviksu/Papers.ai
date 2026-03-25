# Research Paper Understanding Engine

> Automated summarization, structured insight extraction, and knowledge visualization for academic literature — built for researchers, not chatbots.

---

## What it is

The Research Paper Understanding Engine is an intelligent document analysis system that transforms raw academic papers into structured, navigable, and queryable knowledge. Unlike general-purpose language models, every output is **grounded to its source** — no generation from memory, no hallucination, full citation traceability.

Upload a paper (or fifty), and the engine builds a persistent knowledge graph you can summarize, extract from, visualize, query, and export.

---

## Why it's different from a chatbot

| Capability | Regular chatbot | This engine |
|---|---|---|
| Input | Text prompt | Full PDF / DOC / LaTeX / arXiv |
| Processing | One-shot generation | Indexed, structured knowledge graph |
| Summarization | Generic paragraph | Section-level, claim-level, cited |
| Extraction | Best-effort recall | Typed structured fields |
| Visualization | None | Concept maps, timelines, matrices |
| Cross-paper reasoning | None | Contradiction detection, gap analysis |
| Grounding | Parametric memory | Every claim pinned to source line |

---

## Features

### Document ingestion (6)

- **Multi-format ingestion** — PDF, DOCX, LaTeX, HTML, arXiv links, DOI lookup; all normalised to a unified internal representation
- **Structural section parser** — detects abstract, introduction, methods, results, discussion, conclusion, and appendix, even when headings are non-standard
- **Figure & table extraction** — pulls all tables, charts, and images with captions and cross-references intact
- **Equation capture** — extracts mathematical expressions and links them to surrounding explanatory prose
- **Reference list parsing** — parses all bibliography entries, resolves DOIs where available, builds an internal citation map
- **Footnote & supplement linking** — inline footnotes and supplementary material tied to their parent claims in the main text

---

### Automated summarization (5)

- **Layered summaries** — three levels: 1-paragraph overview, section-by-section digest, and claim-level bullet points — all independently navigable
- **Citation-grounded output** — every summarized statement is pinned to the exact source sentence, paragraph, and page — fully verifiable
- **Audience-adaptive tone** — switches between expert, practitioner, and lay-audience modes with appropriate vocabulary and assumed knowledge
- **Executive briefing generator** — structured brief covering problem, approach, key finding, limitation, and implication — ready to share
- **Limitation auto-surfacing** — detects and highlights self-reported limitations, caveats, and scope boundaries directly from the paper

---

### Structured insight extraction (7)

- **Named entity extraction** — pulls people, institutions, datasets, tools, chemical names, gene identifiers, and domain-specific terms as typed objects
- **Hypothesis & claim mining** — identifies explicit hypotheses, research questions, and central claims; distinguished from background statements
- **Results & metrics extraction** — structured pull of numerical results, statistical significance values, confidence intervals, and performance benchmarks
- **Methodology decomposition** — extracts study design, sample size, data sources, algorithms, and evaluation criteria as structured fields
- **Dataset & baseline tracker** — identifies which datasets and comparison baselines were used, with version and source where present
- **Contribution classifier** — labels each contribution as theoretical, empirical, methodological, or applied
- **Future work extractor** — captures author-stated future directions, open problems, and suggested next experiments as a structured list

---

### Knowledge modeling (5)

- **Concept relationship graph** — builds a graph of all key concepts and their typed relationships (supports, contradicts, extends, applies) within the paper
- **Argument chain mapping** — traces the logical chain from problem statement through evidence to conclusion
- **Cross-paper graph merging** — when multiple papers are loaded, entities and claims are merged into a single queryable knowledge graph with provenance
- **Semantic deduplication** — recognises when two papers refer to the same concept under different names and collapses them into one node
- **Contradiction detection** — flags when two papers make opposing empirical claims about the same concept, surfacing the disagreement explicitly

---

### Knowledge visualization (6)

- **Interactive concept map** — force-directed graph of all key terms and their relationships; zoomable, filterable, clickable to source text
- **Methodology flowchart** — auto-generated step-by-step diagram of the research process derived from the Methods section
- **Citation network map** — visual map of which papers are cited, how they cluster by topic, and which sources carry the most argumentative weight
- **Multi-paper comparison matrix** — side-by-side structured table comparing datasets, methods, results, and limitations across all loaded papers
- **Research timeline** — chronological view of how a field has evolved based on the loaded paper set
- **Knowledge gap heatmap** — visual overlay showing which sub-topics are well-covered and which remain under-explored

---

### Intelligent querying (4)

- **Grounded Q&A** — every answer is pulled from the actual document and cited, never generated from model memory
- **Multi-hop reasoning** — answers questions that require chaining facts across multiple sections of a paper
- **Cross-paper querying** — ask one question against an entire paper set with citations per paper
- **Confidence scoring** — each answer carries a label: `directly stated`, `inferred`, or `not in documents`

---

### Research workflow (5)

- **Annotation layer** — attach personal notes to specific claims or sections; notes persist across sessions
- **Literature review drafter** — auto-generates a structured literature review from the loaded paper set, organised by theme with full citations
- **Gap & opportunity identifier** — surfaces explicit and implied research gaps from the loaded papers
- **Structured export** — exports extracted data as JSON, CSV, or Markdown; entities, claims, results, and citations as clean structured files
- **Semantic search** — search across all loaded papers by meaning, not just keywords

---

## Architecture overview

```
┌─────────────────────────────────────────────────────┐
│                   Input layer                       │
│   PDF · DOCX · LaTeX · arXiv · DOI · HTML          │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                 Parser layer                        │
│   Structure detection · Figure/table/equation       │
│   extraction · Reference resolution                 │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│              Knowledge graph layer                  │
│   Entity extraction · Claim mining · Relationship   │
│   typing · Cross-paper merging · Deduplication      │
└──────────┬───────────────────────┬──────────────────┘
           │                       │
┌──────────▼──────────┐ ┌──────────▼──────────────────┐
│  Summarization      │ │  Visualization engine        │
│  Layered · Cited    │ │  Concept maps · Timelines    │
│  Audience-adaptive  │ │  Matrices · Gap heatmaps     │
└──────────┬──────────┘ └──────────┬──────────────────┘
           │                       │
┌──────────▼───────────────────────▼──────────────────┐
│                  Query & export layer               │
│   Grounded Q&A · Semantic search · JSON/CSV/MD      │
└─────────────────────────────────────────────────────┘
```

---

## Getting started

### Prerequisites

- Python 3.10+
- Node.js 18+ (for the visualization frontend)
- An embedding model endpoint (OpenAI, Cohere, or self-hosted)
- A vector store (Chroma, Weaviate, or pgvector)

### Installation

```bash
git clone https://github.com/your-org/research-engine.git
cd research-engine
pip install -r requirements.txt
cp .env.example .env
```

### Configuration

```env
# .env
LLM_PROVIDER=anthropic          # anthropic | openai | local
LLM_MODEL=claude-sonnet-4-6
EMBEDDING_MODEL=text-embedding-3-large
VECTOR_STORE=chroma             # chroma | weaviate | pgvector
VECTOR_STORE_PATH=./data/vectors
EXPORT_DIR=./exports
```

### Running

```bash
# Start the engine
python -m research_engine serve

# Ingest a paper
python -m research_engine ingest --input paper.pdf

# Ingest from arXiv
python -m research_engine ingest --arxiv 2310.06825

# Launch the visualization UI
npm run dev --prefix ui/
```

---

## Usage examples

### Ingest and summarize

```python
from research_engine import Engine

engine = Engine()
doc = engine.ingest("attention_is_all_you_need.pdf")

# Layered summary
print(doc.summary.overview)        # 1-paragraph
print(doc.summary.by_section)      # section-by-section
print(doc.summary.claims)          # claim-level bullets with citations

# Executive briefing
print(doc.briefing())
```

### Extract structured data

```python
entities   = doc.extract.entities()       # named entities as typed objects
hypotheses = doc.extract.hypotheses()     # research questions and claims
results    = doc.extract.results()        # numerical results and metrics
methods    = doc.extract.methodology()    # study design as structured fields
```

### Cross-paper querying

```python
library = engine.load_collection("./papers/")

# Ask across all papers
answer = library.query("Which papers address catastrophic forgetting?")
print(answer.text)
print(answer.confidence)   # 'directly_stated' | 'inferred' | 'absent'
print(answer.citations)    # list of (paper, section, page) tuples

# Detect contradictions
conflicts = library.contradictions()
for c in conflicts:
    print(c.claim, c.paper_a, c.paper_b)
```

### Export

```python
doc.export.json("./exports/paper_knowledge.json")
doc.export.csv("./exports/results_table.csv")
doc.export.markdown("./exports/summary.md")
```

---

## Output formats

| Export type | Contents |
|---|---|
| `knowledge_graph.json` | All entities, relationships, and claims with source citations |
| `results_table.csv` | Numerical results, metrics, and statistical values |
| `comparison_matrix.csv` | Multi-paper side-by-side comparison |
| `literature_review.md` | Auto-generated literature review with citations |
| `summary.md` | Layered summary at all three levels |
| `entities.json` | All named entities as typed structured objects |

---

## Confidence levels

Every extracted claim and Q&A answer carries one of three confidence labels:

- `directly_stated` — the paper explicitly contains this information; exact source location provided
- `inferred` — the information is implied by the text but not stated verbatim; reasoning chain shown
- `not_in_documents` — the question cannot be answered from the loaded papers; no answer is fabricated

---

## Roadmap

- [ ] Real-time collaborative annotation across teams
- [ ] Domain-specific extraction schemas (biomedical, legal, financial)
- [ ] Automated systematic review generation (PRISMA-compliant)
- [ ] Browser extension for ingesting papers directly from journal pages
- [ ] Fine-tuned extraction models per domain
- [ ] Integration with reference managers (Zotero, Mendeley)
- [ ] Audio briefing generation from summaries

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

```bash
git checkout -b feature/your-feature
# make changes
git commit -m "feat: describe your change"
git push origin feature/your-feature
# open a pull request
```

---

## License

MIT — see [LICENSE](./LICENSE) for details.

---

*Built for researchers who need to read faster, understand deeper, and miss nothing.*
