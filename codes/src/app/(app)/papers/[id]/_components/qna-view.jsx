'use client';
import { useState, useTransition, useRef, useEffect } from 'react';
import { Send, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/aurora/Button';
import { Input } from '@/components/aurora/Input';
import { ChatBubble } from '@/components/aurora/ChatBubble';
import { askQuestion } from '@/lib/actions';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

export function QnaView({ paperId, context, messages = [] }) {
  const [chatInput, setChatInput] = useState('');
  const { user } = useUser();
  const firestore = useFirestore();
  const [isPending, startTransition] = useTransition();
  const chatEndRef = useRef(null);

  const exampleQuestions = [
    'What was the main contribution?',
    'What dataset was used?',
    'Explain the methodology.',
  ];

  const handleQuestionSubmit = async (q) => {
    const questionText = q || chatInput;
    if (!questionText.trim() || isPending || !user || !firestore) return;

    const currentQuestion = questionText.trim();
    setChatInput('');

    // Instant Feedback: Save user message locally to the Paper document
    const paperRef = doc(firestore, `users/${user.uid}/papers/${paperId}`);
    
    updateDoc(paperRef, {
      chatHistory: arrayUnion({
        role: 'user',
        content: currentQuestion,
        isUser: true,
        timestamp: new Date().toISOString()
      })
    });

    startTransition(async () => {
      try {
        const answer = await askQuestion(context, currentQuestion);
        
        // Save bot answer to the Paper document
        await updateDoc(paperRef, {
          chatHistory: arrayUnion({
            role: 'assistant',
            content: answer,
            isUser: false,
            timestamp: new Date().toISOString()
          })
        });
      } catch (err) {
        console.error('[Q&A Error]', err);
        await updateDoc(paperRef, {
          chatHistory: arrayUnion({
            role: 'assistant',
            content: "Sorry, I'm having trouble processing that right now. Please try again.",
            isUser: false,
            timestamp: new Date().toISOString()
          })
        });
      }
    });
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending]);

  return (
    <div className="flex flex-col h-[600px] bg-[#F5F7FF] rounded-[24px] border border-aurora-border shadow-sm overflow-hidden relative">
      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col">
        <div className="flex items-center justify-center mb-8">
           <div className="bg-white px-4 py-1.5 rounded-full text-xs font-semibold text-aurora-text-low shadow-sm border border-aurora-border">
             Session persistent • Context: Full Paper
           </div>
        </div>
        
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-aurora-border">
              <Sparkles className="w-8 h-8 text-aurora-violet" />
            </div>
            <h3 className="text-lg font-bold text-aurora-text-high font-heading">Ask about this paper</h3>
            <p className="text-sm text-aurora-text-low max-w-xs mt-2">I've analyzed the full text and insights. What would you like to know?</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} isUser={msg.isUser} />
        ))}

        {isPending && (
          <div className="flex items-center gap-2 self-start animate-in fade-in duration-300">
            <div className="bg-white border border-aurora-border rounded-[18px] rounded-tl-sm px-5 py-3.5 shadow-sm flex items-center gap-1.5">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-2 h-2 bg-aurora-blue/60 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-aurora-border">
         <div className="flex gap-2 w-full max-w-4xl mx-auto overflow-x-auto pb-3 scrollbar-hide">
           {exampleQuestions.map((q) => (
             <button 
               key={q}
               onClick={() => handleQuestionSubmit(q)}
               className="whitespace-nowrap px-4 py-2 rounded-full bg-aurora-surface-2 text-xs font-semibold text-aurora-text-mid hover:bg-aurora-surface-3 transition-colors border border-aurora-border/50 shadow-sm"
             >
               {q}
             </button>
           ))}
         </div>
         
         <div className="relative w-full max-w-4xl mx-auto flex items-end gap-2">
           <Input 
             className="h-14 rounded-[20px] bg-aurora-surface-1 border border-aurora-border shadow-inner text-base pl-6 pr-14"
             placeholder="Ask anything about this paper..."
             value={chatInput}
             onChange={(e) => setChatInput(e.target.value)}
             disabled={isPending}
             onKeyDown={(e) => {
               if (e.key === 'Enter' && !e.shiftKey) {
                 e.preventDefault();
                 handleQuestionSubmit();
               }
             }}
           />
           <Button 
             size="icon" 
             className="absolute right-2 top-2 h-10 w-10 shrink-0 bg-gradient-to-r from-aurora-blue to-aurora-violet rounded-full shadow-md disabled:opacity-50"
             disabled={!chatInput.trim() || isPending}
             onClick={() => handleQuestionSubmit()}
           >
              {isPending ? <Sparkles className="h-4 w-4 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
           </Button>
         </div>
      </div>
    </div>
  );
}
