export const MOCK_USER = {
  id: 'usr_1',
  name: 'Dr. Sarah Connor',
  email: 'sarah.connor@example.edu',
};

export const MOCK_STATS = {
  totalPapers: 142,
  summariesGenerated: 128,
  papersThisWeek: 7,
};

export const MOCK_PAPERS = [
  {
    id: 'p_1',
    title: 'Attention Is All You Need',
    authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit'],
    uploadDate: '2026-03-24',
    status: 'completed',
    tags: ['NLP', 'Transformers'],
  },
  {
    id: 'p_2',
    title: 'Direct Preference Optimization: Your Language Model is Secretly a Reward Model',
    authors: ['Rafael Rafailov', 'Archit Sharma', 'Eric Mitchell', 'Stefano Ermon'],
    uploadDate: '2026-03-23',
    status: 'completed',
    tags: ['Alignment', 'RLHF'],
  },
  {
    id: 'p_3',
    title: 'Generative Agents: Interactive Simulacra of Human Behavior',
    authors: ['Joon Sung Park', 'Joseph C. O\'Brien', 'Carrie J. Cai', 'Meredith Ringel Morris'],
    uploadDate: '2026-03-21',
    status: 'completed',
    tags: ['Agents', 'LLM'],
  },
  {
    id: 'p_4',
    title: 'Constitutional AI: Harmlessness from AI Feedback',
    authors: ['Yuntao Bai', 'Saurav Kadavath', 'Saurabh Garg', 'Amanda Askell'],
    uploadDate: '2026-03-20',
    status: 'processing',
    tags: ['Safety', 'Alignment'],
  },
  {
    id: 'p_5',
    title: 'Sparks of Artificial General Intelligence: Early experiments with GPT-4',
    authors: ['Sébastien Bubeck', 'Varun Chandrasekaran', 'Ronen Eldan', 'Johannes Gehrke'],
    uploadDate: '2026-03-15',
    status: 'completed',
    tags: ['AGI', 'Evaluation'],
  }
];

export const MOCK_SUMMARY = {
  paperId: 'p_1',
  overview: {
    expert: 'This paper introduces the Transformer, a novel network architecture based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. It achieves state-of-the-art results on WMT 2014 English-to-German and English-to-French translation tasks while being inherently parallelizable and requiring significantly less training time.',
    practitioner: 'The authors propose a new deep learning architecture called the "Transformer" that doesn\'t use traditional recurrent or convolutional layers. Instead, it relies completely on "attention mechanisms." This makes models much faster to train and achieved the best translation results at the time of publication.',
    beginner: 'This breakthrough paper changed how AI processes language. Instead of reading text word-by-word (like reading a book), the AI uses "attention" to look at all words at once to understand the context. This made AI much faster and smarter at translation.',
  },
  sections: [
    { title: 'Introduction', content: 'RNNs and LSTMs have established themselves as state of the art in sequence modeling. The Transformer is proposed as an architecture avoiding recurrence.', sourceSection: 'Section 1', page: 1 },
    { title: 'Model Architecture', content: 'The Transformer follows an encoder-decoder structure using stacked self-attention and point-wise, fully connected layers for both the encoder and decoder.', sourceSection: 'Section 3', page: 2 },
    { title: 'Self-Attention', content: 'An attention function maps a query and a set of key-value pairs to an output. They use Scaled Dot-Product Attention.', sourceSection: 'Section 3.2.1', page: 3 },
  ],
  claims: [
    { text: 'The Transformer dispenses with recurrence and convolutions entirely.', sourceSection: 'Abstract', page: 1 },
    { text: 'It speeds up training significantly due to better parallelization.', sourceSection: 'Section 1', page: 2 },
    { text: 'Achieved 28.4 BLEU on WMT 2014 English-to-German.', sourceSection: 'Section 6.1', page: 8 },
  ]
};

export const MOCK_EXTRACTIONS = {
  paperId: 'p_1',
  entities: [
    { name: 'Transformer', type: 'Architecture', sourceSection: 'Abstract' },
    { name: 'WMT 2014', type: 'Dataset', sourceSection: 'Section 6.1' },
    { name: 'Adam', type: 'Algorithm', sourceSection: 'Section 5.3' },
    { name: 'Google Brain', type: 'Institution', sourceSection: 'Authors' },
  ],
  methodology: [
    'Model follows an encoder-decoder architecture.',
    'Encoder consists of 6 identical layers, each with 2 sub-layers (multi-head self-attention, and position-wise feed-forward).',
    'Decoder has an additional sub-layer performing multi-head attention over encoder output.',
    'Uses sine and cosine functions of different frequencies for Positional Encoding.'
  ],
  results: [
    { metric: 'English-to-German BLEU', value: '28.4', sourceSection: 'Section 6.1' },
    { metric: 'English-to-French BLEU', value: '41.8', sourceSection: 'Section 6.1' },
    { metric: 'Training Cost (FLOPs)', value: '3.3 · 10^18', sourceSection: 'Table 2' },
  ],
  futureWork: [
    'Extending attention to efficiently handle large inputs (images, audio).',
    'Investigating local, restricted attention mechanisms.',
  ]
};

export const MOCK_QA = [
  {
    id: 'q_1',
    question: 'What is the main advantage of the Transformer over LSTMs?',
    answer: 'The main advantage is that the Transformer completely avoids recurrence, allowing for significantly more parallelization during training, which reduces training time and improves efficiency on modern hardware.',
    confidence: 'Directly Stated',
    citedSection: 'Section 1: Introduction',
    citedPage: 2
  },
  {
    id: 'q_2',
    question: 'Did they test this on image data?',
    answer: 'No, the paper focuses on machine translation tasks (English-to-German and English-to-French). However, in the Conclusion, they mention extending the Transformer to modalities other than text, such as images, audio, and video as future work.',
    confidence: 'Inferred',
    citedSection: 'Section 7: Conclusion',
    citedPage: 10
  }
];
