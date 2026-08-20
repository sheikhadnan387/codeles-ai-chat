import { Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles className="size-4.5" />
        </div>
        <span className="text-base font-semibold">Codeles AI</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
