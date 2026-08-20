import { BarChart3Icon, CodeIcon, GraduationCapIcon, PenLineIcon, type LucideIcon } from "lucide-react";

interface SuggestedPrompt {
  icon: LucideIcon;
  label: string;
  prompt: string;
}

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    icon: PenLineIcon,
    label: "Write",
    prompt: "Write a short email to my team announcing a new product launch.",
  },
  {
    icon: CodeIcon,
    label: "Code",
    prompt: "Write a function that debounces a search input in TypeScript.",
  },
  {
    icon: BarChart3Icon,
    label: "Analyze",
    prompt: "Explain the pros and cons of a subscription vs. one-time pricing model.",
  },
  {
    icon: GraduationCapIcon,
    label: "Learn",
    prompt: "Explain how neural networks learn, in simple terms.",
  },
];

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-4">
      {SUGGESTED_PROMPTS.map(({ icon: Icon, label, prompt }) => (
        <button
          key={label}
          type="button"
          onClick={() => onSelect(prompt)}
          className="flex flex-col items-start gap-2.5 rounded-2xl border border-border bg-card p-3.5 text-left transition-colors hover:bg-accent"
        >
          <Icon className="size-4 text-primary" />
          <span className="text-sm font-medium">{label}</span>
          <span className="line-clamp-2 text-xs text-muted-foreground">{prompt}</span>
        </button>
      ))}
    </div>
  );
}
