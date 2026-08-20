import { Sparkles } from "lucide-react";
import { SuggestedPrompts } from "./SuggestedPrompts";

interface WelcomeScreenProps {
  userName?: string;
  onSelectPrompt: (prompt: string) => void;
}

export function WelcomeScreen({ userName, onSelectPrompt }: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Sparkles className="size-6" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Codeles AI — How can I help you today?
          </h1>
          <p className="text-sm text-muted-foreground">
            {userName ? `Welcome back, ${userName}. ` : ""}
            Ask a question, paste some text, or try one of these to get started.
          </p>
        </div>
        <SuggestedPrompts onSelect={onSelectPrompt} />
      </div>
    </div>
  );
}
