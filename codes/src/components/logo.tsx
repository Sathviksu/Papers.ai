import { BrainCircuit } from 'lucide-react';

export const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center bg-primary rounded-md p-1.5">
        <BrainCircuit className="h-5 w-5 text-primary-foreground" />
      </div>
    </div>
  );
};
