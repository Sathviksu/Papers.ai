'use client';
import { useState, useTransition, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { askQuestion } from '@/lib/actions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useUser, useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';

export function QnaView({ paperId }) {
  const [question, setQuestion] = useState('');
  const { user } = useUser();
  const firestore = useFirestore();
  const [isPending, startTransition] = useTransition();
  const scrollAreaRef = useRef(null);

  const messagesQuery = (user && firestore) ? query(
    collection(firestore, `users/${user.uid}/papers/${paperId}/chat`),
    orderBy('timestamp', 'asc')
  ) : null;

  const { data: messages = [] } = useCollection(messagesQuery);

  const exampleQuestions = [
    'What was the main contribution of this paper?',
    'What dataset was used for evaluation?',
    'Explain the methodology in simple terms.',
  ];

  const handleQuestionSubmit = async (q) => {
    if (!q.trim() || isPending || !user || !firestore) return;

    const chatRef = collection(firestore, `users/${user.uid}/papers/${paperId}/chat`);
    setQuestion('');

    // Save user message
    await addDoc(chatRef, {
      role: 'user',
      content: q,
      timestamp: serverTimestamp()
    });

    startTransition(async () => {
      const answer = await askQuestion(paperId, q);
      // Save bot answer
      await addDoc(chatRef, {
        role: 'assistant',
        content: answer,
        timestamp: serverTimestamp()
      });
    });
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isPending]);

  return (
    <Card className="h-[75vh] flex flex-col">
      <CardHeader>
        <CardTitle>Ask the Paper</CardTitle>
        <CardDescription>
          Ask a question about the paper and get an AI-powered answer.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-4',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback>
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-xl rounded-lg p-3',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isPending && (
              <div className="flex items-start gap-4">
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback>
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-xl rounded-lg p-3 bg-secondary space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            )}
            {messages.length === 0 && !isPending && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <Bot className="h-12 w-12 mb-4" />
                <p className="text-lg font-semibold">Ready to assist</p>
                <p>Try one of the example questions below or ask your own!</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {messages.length === 0 && !isPending && (
          <div className="flex flex-wrap items-center gap-2">
            {exampleQuestions.map((q) => (
              <Button
                key={q}
                variant="outline"
                size="sm"
                onClick={() => handleQuestionSubmit(q)}
              >
                {q}
              </Button>
            ))}
          </div>
        )}

        <div className="relative">
          <Textarea
            placeholder="e.g., What are the key contributions?"
            className="pr-16 resize-none"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleQuestionSubmit(question);
              }
            }}
            disabled={isPending}
          />

          <Button
            type="submit"
            size="icon"
            className="absolute top-1/2 right-3 -translate-y-1/2"
            onClick={() => handleQuestionSubmit(question)}
            disabled={!question.trim() || isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
