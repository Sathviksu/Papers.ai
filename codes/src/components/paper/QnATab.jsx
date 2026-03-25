'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, User, Bot, AlertCircle, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUser } from '@/firebase';

export default function QnATab({ paper, initialQA }) {
  const { user } = useUser();
  const [messages, setMessages] = useState(initialQA || []);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newQuery = {
      id: Math.random().toString(),
      question: input,
      isUser: true,
    };

    setMessages([...messages, newQuery]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const response = {
        id: Math.random().toString(),
        question: newQuery.question, // not rendered directly, but kept for structure tracking
        answer: 'This is a simulated AI response indicating that the specific detail requested was not definitively found in the text, but could be inferred from the context of Section 4.',
        confidence: 'Inferred',
        citedSection: 'Section 4: Experiments',
        citedPage: 6,
      };
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1500);
  };

  const getConfidenceColor = (conf) => {
    switch(conf) {
      case 'Directly Stated': return 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200';
      case 'Inferred': return 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200';
      case 'Not in Document': return 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200';
      default: return '';
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-50/50">
      
      {/* Header */}
      <div className="p-4 border-b bg-white flex items-center gap-3">
        <div className="p-2 bg-blue-100 text-[#1A56B0] rounded-lg">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold">Chat with Paper</h2>
          <p className="text-xs text-muted-foreground">Ask anything about "{paper?.title}"</p>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-6 max-w-4xl mx-auto py-4">
          
          {messages.map((msg) => {
            if (msg.isUser) {
              return (
                <div key={msg.id} className="flex gap-4 justify-end">
                  <div className="bg-[#1A56B0] text-white p-3 rounded-2xl rounded-tr-sm max-w-[80%] text-sm shadow-sm">
                    {msg.question}
                  </div>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-blue-200 text-blue-800 text-xs">
                      {user?.displayName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              );
            }

            return (
              <div key={msg.id} className="flex gap-4">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-slate-800 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2 max-w-[85%]">
                  <div className="bg-white border p-4 rounded-2xl rounded-tl-sm text-sm text-slate-700 shadow-sm leading-relaxed">
                    <div className="font-medium text-slate-800 mb-1 border-b pb-2 mb-2">
                      Q: {msg.question}
                    </div>
                    {msg.answer}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 pl-2">
                    <Badge variant="outline" className={`text-xs ${getConfidenceColor(msg.confidence)}`}>
                      {msg.confidence}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Source: {msg.citedSection} (Page {msg.citedPage})
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-4 animate-pulse">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-slate-800 text-white">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-white border p-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-1 items-center h-10 px-4">
                <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" />
                <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="E.g., What are the main limitations described in the methodology?"
            className="pr-12 py-6 rounded-full bg-slate-50 border-slate-200 focus-visible:ring-[#1A56B0]"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim() || isTyping}
            className="absolute right-1.5 h-9 w-9 rounded-full bg-[#1A56B0] hover:bg-[#154690]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-center text-[10px] text-muted-foreground mt-2">
          AI generated answers can be inaccurate. Always verify with the cited source.
        </p>
      </div>

    </div>
  );
}
