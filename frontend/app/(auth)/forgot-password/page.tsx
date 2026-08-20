"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeftIcon, Loader2Icon, MailCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordRequest } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/client";
import { flattenZodErrors, forgotPasswordSchema } from "@/lib/validation/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setErrors(flattenZodErrors(result.error));
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      const { message } = await forgotPasswordRequest(result.data);
      setSubmittedMessage(message);
    } catch (error) {
      setErrors({ _root: getApiErrorMessage(error, "Something went wrong. Please try again.") });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedMessage) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheckIcon className="size-5" />
        </div>
        <h1 className="text-lg font-semibold">Check your email</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{submittedMessage}</p>
        <Link
          href="/login"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeftIcon className="size-3.5" />
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 space-y-1">
        <h1 className="text-lg font-semibold">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        {errors._root && <p className="text-xs text-destructive">{errors._root}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
          Send reset link
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        <Link href="/login" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
          <ArrowLeftIcon className="size-3.5" />
          Back to log in
        </Link>
      </p>
    </div>
  );
}
