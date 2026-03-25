# **App Name**: ResearchMind AI

## Core Features:

- User Authentication: Secure user login and registration using email and password.
- Paper Upload & Text Extraction: Allow users to upload PDF research papers. Files are stored, metadata indexed in MongoDB, and full text extracted using PDF parsing utilities.
- AI Summarization Engine: Generate comprehensive TLDR summaries, section-wise breakdowns, key contributions, limitations, and future research directions for uploaded papers using generative AI tools.
- AI Insight Extraction: Automatically extract structured research information such as research problem, methodology, datasets used, algorithms, evaluation metrics, and key results using NLP analysis tools.
- AI Knowledge Graph Generation: Identify key concepts within a paper and establish relationships between them (concepts, models, datasets, methods) to form a structured knowledge graph (nodes/edges) using AI tools.
- Interactive Knowledge Graph Viewer: Visualize the extracted knowledge graphs with an interactive React Flow interface, displaying nodes for concepts, models, datasets, and methods, connected by their relationships.
- Ask the Paper (AI Q&A): Enable users to ask specific questions about an uploaded research paper, providing precise, contextually relevant answers through a Retrieval Augmented Generation (RAG) tool.

## Style Guidelines:

- Primary color: A deep, professional blue (#2C2C80), providing a sense of intelligence and focus. Used for main headings and interactive elements.
- Background color: An exceptionally light blue-grey (#F5F6FB), creating a clean and spacious canvas for content, optimizing readability.
- Accent color: A vibrant, clear sky blue (#4CB2F0), used to highlight calls to action, important notifications, and to add a touch of clarity and modern feel.
- Headline and body text font: 'Inter' (sans-serif) for its high legibility, modern aesthetic, and suitability for data-rich interfaces and academic content.
- Code snippets font: 'Source Code Pro' (monospace) for clear display of programming code or technical text when applicable.
- Use a set of clear, line-based, vector icons that represent analytical processes, documents, and data structures. Focus on minimalism and immediate comprehension to support navigation and feature identification.
- Implement structured, grid-based layouts to ensure visual hierarchy and organized presentation of complex information. Utilize ample whitespace to reduce cognitive load and enhance focus on analytical outputs.
- Incorporate subtle and performant animations for transitions, data loading, and interactive elements within the knowledge graph. Animations should guide user attention and confirm actions without being distracting.