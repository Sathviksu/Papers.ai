import { askPaperQnA } from './src/ai/flows/ask-paper-qna.js';

async function run() {
  try {
    const input = {
      question: "What are the main datasets used?",
      context: "The study utilized the extremely large XYZ dataset for training..."
    };
    const result = await askPaperQnA(input);
    console.log("SUCCESS:");
    console.log(result);
  } catch (err) {
    console.log("ERROR:");
    console.dir(err, { depth: null });
  }
}

run();
