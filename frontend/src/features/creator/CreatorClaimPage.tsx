import { useState } from "react";
import { Card } from "../../shared/components/Card";
import { Button } from "../../shared/components/Button";
import { Input, Textarea } from "../../shared/components/Input";
import { useAuth } from "../auth/useAuth";
import { useToast } from "../../shared/hooks/useToast";

/**
 * Creator claim — a self-service form users send to request creator
 * access. The backend in this template doesn't expose a public
 * promote-self endpoint, so we surface a confirmation UX.
 *
 * In production this would POST to /api/me/role or contact an admin.
 */
export function CreatorClaimPage() {
  const toast = useToast();
  const { identity } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [reason, setReason] = useState("");
  const [topic, setTopic] = useState("");

  if (identity?.user.is_creator) {
    return (
      <Card padding="lg" className="mx-auto max-w-2xl text-center">
        <h1 className="text-xl font-semibold">You're already a creator</h1>
        <p className="mt-2 text-sm text-slate-500">
          Head over to your creator hub to start managing sessions.
        </p>
        <a href="/creator" className="btn-primary mt-4">
          Open creator hub
        </a>
      </Card>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Request received. An admin will grant access shortly.");
  };

  if (submitted) {
    return (
      <Card padding="lg" className="mx-auto max-w-2xl text-center">
        <h1 className="text-xl font-semibold">Request sent</h1>
        <p className="mt-2 text-sm text-slate-500">
          We'll email <strong>{identity?.user.email}</strong> once your
          creator role is approved.
        </p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card padding="lg">
        <h1 className="text-2xl font-bold">Request creator access</h1>
        <p className="mt-2 text-sm text-slate-500">
          Tell us a bit about what you'd like to teach. Admins review
          requests within 24 hours.
        </p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <Input
            label="Primary topic"
            placeholder="e.g. Backend engineering"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          />
          <Textarea
            label="Why do you want to teach?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          <div className="flex justify-end">
            <Button type="submit">Request access</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default CreatorClaimPage;
