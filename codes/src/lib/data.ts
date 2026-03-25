import type { Paper, Summary, Insights, KnowledgeGraph } from './types';

// In-memory store
// To prevent the in-memory store from being reset during development hot-reloads,
// we store it on the global object.
const globalForDb = global as unknown as {
  store: {
    papers: Map<string, Paper>;
    summaries: Map<string, Summary>;
    insights: Map<string, Insights>;
    knowledgeGraphs: Map<string, KnowledgeGraph>;
  } | undefined
}

const store = globalForDb.store ?? {
  papers: new Map(),
  summaries: new Map(),
  insights: new Map(),
  knowledgeGraphs: new Map(),
};

if (process.env.NODE_ENV !== 'production') {
  globalForDb.store = store;
}

// Sample Paper Text
const samplePaperText = `
Attention Is All You Need

Abstract
The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles, by over 2 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature. We show that the Transformer generalizes well to other tasks by applying it successfully to English constituency parsing both with large and limited training data.

Introduction
Recurrent neural networks, long short-term memory and gated recurrent neural networks in particular, have been firmly established as state of the art in sequence modeling and transduction problems such as language modeling and machine translation. Numerous efforts have since continued to push the boundaries of recurrent language models and encoder-decoder architectures.
Recurrent models typically factor computation along the symbol positions of the input and output sequences. Aligning the positions to steps in computation time, they generate a sequence of hidden states ht, as a function of the previous hidden state ht−1 and the input for position t. This inherently sequential nature precludes parallelization within training examples, which becomes critical at longer sequence lengths, as memory constraints limit batching across examples. Recent work has achieved significant improvements in computational efficiency through factorization tricks and conditional computation, while also improving model performance in case of the latter. The fundamental constraint of sequential computation, however, remains.
Attention mechanisms have become an integral part of compelling sequence modeling and transduction models in various tasks, allowing modeling of dependencies without regard to their distance in the input or output sequences. In all but a few cases, however, such attention mechanisms are used in conjunction with a recurrent network.
In this work we propose the Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention mechanism to draw global dependencies between input and output. The Transformer allows for significantly more parallelization and can reach a new state of the art in translation quality after being trained for as little as twelve hours on eight P100 GPUs.

Conclusion
In this work, we presented the Transformer, the first sequence transduction model based entirely on attention, replacing the recurrent layers most commonly used in encoder-decoder architectures with multi-headed self-attention. For translation tasks, the Transformer can be trained significantly faster than architectures based on recurrent or convolutional layers. On both WMT 2014 English-to-German and WMT 2014 English-to-French translation tasks, we achieve a new state of the art. In the former task our best model outperforms even all previously reported ensembles.
We are excited about the future of attention-based models and plan to apply them to other tasks. We plan to extend the Transformer to problems involving input and output modalities other than text and to investigate local, restricted attention mechanisms to handle large inputs and outputs such as images, audio and video. Making generation less sequential is another research goal of ours.
`;

// Seed data
const seedPapers: Paper[] = [
  {
    id: '1',
    title: 'Attention Is All You Need',
    authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Llion Jones', 'Aidan N. Gomez', 'Łukasz Kaiser', 'Illia Polosukhin'],
    publicationDate: '2017-06-12',
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms.',
    fileName: 'attention-is-all-you-need.pdf',
    status: 'pending',
    paperText: samplePaperText,
  },
  {
    id: '2',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
    authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee', 'Kristina Toutanova'],
    publicationDate: '2018-10-11',
    abstract: 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.',
    fileName: 'bert-pre-training.pdf',
    status: 'pending',
    paperText: 'BERT stands for Bidirectional Encoder Representations from Transformers. It is a language model that is designed to pre-train deep bidirectional representations from unlabeled text...',
  }
];

// Only seed data if the store is empty to avoid overwriting on hot-reloads
if (store.papers.size === 0) {
  seedPapers.forEach(paper => store.papers.set(paper.id, paper));
}


export const db = {
  getPapers: async () => Array.from(store.papers.values()).sort((a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime()),
  getPaper: async (id: string) => store.papers.get(id),
  createPaper: async (paperData: Pick<Paper, 'title' | 'authors' | 'publicationDate' | 'abstract' | 'fileName' | 'paperText'>) => {
    const id = (Date.now() + Math.random()).toString();
    const newPaper: Paper = {
      ...paperData,
      id,
      status: 'pending',
    };
    store.papers.set(id, newPaper);
    return newPaper;
  },
  updatePaper: async (id: string, updates: Partial<Paper>) => {
    const paper = store.papers.get(id);
    if (paper) {
      store.papers.set(id, { ...paper, ...updates });
    }
    return store.papers.get(id);
  },
  createSummary: async (summary: Omit<Summary, 'id'>) => {
    const id = (Date.now() + Math.random()).toString();
    const newSummary: Summary = { ...summary, id };
    store.summaries.set(id, newSummary);
    return newSummary;
  },
  getSummary: async (id: string) => store.summaries.get(id),
  createInsights: async (insights: Omit<Insights, 'id'>) => {
    const id = (Date.now() + Math.random()).toString();
    const newInsights: Insights = { ...insights, id };
    store.insights.set(id, newInsights);
    return newInsights;
  },
  getInsights: async (id: string) => store.insights.get(id),
  createKnowledgeGraph: async (kg: Omit<KnowledgeGraph, 'id'>) => {
    const id = (Date.now() + Math.random()).toString();
    const newKg: KnowledgeGraph = { ...kg, id };
    store.knowledgeGraphs.set(id, newKg);
    return newKg;
  },
  getKnowledgeGraph: async (id: string) => store.knowledgeGraphs.get(id),
};
