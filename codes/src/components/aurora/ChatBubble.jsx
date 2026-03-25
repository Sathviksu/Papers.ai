import { BrainCircuit, User } from 'lucide-react';
import { Badge } from '@/components/aurora/Badge';

export function ChatBubble({ message, isUser }) {
  return (
    <div className={`flex w-full gap-4 ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}>
      {!isUser && (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-aurora-blue to-aurora-cyan flex items-center justify-center shrink-0 shadow-sm border-2 border-white">
          <BrainCircuit className="w-5 h-5 text-white" />
        </div>
      )}
      
      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-5 py-4 rounded-[20px] shadow-sm text-[15px] leading-relaxed relative ${
          isUser 
            ? 'bg-gradient-to-br from-aurora-blue to-aurora-violet text-white rounded-tr-[4px]' 
            : 'bg-white border border-aurora-border text-aurora-text-high rounded-tl-[4px]'
        }`}>
          {message.content}
        </div>
        
        {/* Render badges if AI */}
        {!isUser && (message.confidence || message.citations) && (
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {message.confidence && (
              <Badge variant={message.confidence === 'Directly Stated' ? 'success' : message.confidence === 'Inferred' ? 'warning' : 'outline'} className="text-[10px] h-6">
                {message.confidence}
              </Badge>
            )}
            {message.citations?.map((cit, i) => (
              <Badge key={i} variant="neutral" className="text-[10px] h-6 cursor-pointer hover:bg-aurora-surface-3 transition-colors text-aurora-blue">
                {cit}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-9 h-9 rounded-full bg-aurora-surface-2 flex items-center justify-center shrink-0 border-2 border-white shadow-sm">
          <User className="w-5 h-5 text-aurora-text-mid" />
        </div>
      )}
    </div>
  );
}
