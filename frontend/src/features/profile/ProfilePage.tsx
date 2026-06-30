import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "../../shared/components/Card";
import { Input, Textarea } from "../../shared/components/Input";
import { Button } from "../../shared/components/Button";
import { PageHeader } from "../../shared/components/PageHeader";
import { Avatar } from "../../shared/components/Avatar";
import { ApiError } from "../../shared/api/axios";
import { useProfile, useUpdateProfile } from "./useProfile";
import { useAuth } from "../auth/useAuth";
import { useToast } from "../../shared/hooks/useToast";
import { useQueryClient } from "@tanstack/react-query";

const schema = z.object({
  full_name: z.string().max(120).optional().or(z.literal("")),
  avatar_url: z.string().url("Must be a valid URL.").optional().or(z.literal("")),
  bio: z.string().max(800).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function ProfilePage() {
  const { identity } = useAuth();
  const qc = useQueryClient();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const toast = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: profile?.full_name ?? "",
      avatar_url: profile?.avatar_url ?? "",
      bio: profile?.bio ?? "",
    },
    values: profile
      ? {
          full_name: profile.full_name ?? "",
          avatar_url: profile.avatar_url ?? "",
          bio: profile.bio ?? "",
        }
      : undefined,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload: FormValues = {
        full_name: values.full_name?.trim(),
        avatar_url: values.avatar_url?.trim(),
        bio: values.bio?.trim(),
      };
      await updateProfile.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err);
      if (err instanceof ApiError) {
        form.setError("root", { message: err.message });
      }
    }
  });

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-xl bg-slate-200" />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Update your display name, avatar, and bio. These appear across the marketplace."
      />
      <Card padding="lg" className="mb-6 flex items-center gap-4">
        <Avatar
          src={form.watch("avatar_url") || undefined}
          name={form.watch("full_name") || identity?.user.email || "You"}
          size="lg"
        />
        <div>
          <div className="text-sm font-semibold text-slate-900">
            {form.watch("full_name") || identity?.user.email}
          </div>
          <div className="text-xs text-slate-500">
            {identity?.user.email}
          </div>
          <div className="mt-1 text-xs uppercase tracking-wide text-slate-400">
            Role: {identity?.user.role}
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            label="Display name"
            placeholder="Your name on Sessions Marketplace"
            {...form.register("full_name")}
            error={form.formState.errors.full_name?.message}
          />
          <Input
            label="Avatar URL"
            placeholder="https://…"
            {...form.register("avatar_url")}
            error={form.formState.errors.avatar_url?.message}
          />
          <Textarea
            label="Short bio"
            placeholder="Tell learners a bit about you."
            {...form.register("bio")}
            error={form.formState.errors.bio?.message}
            hint={`${form.watch("bio")?.length ?? 0} / 800`}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={updateProfile.isPending}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
