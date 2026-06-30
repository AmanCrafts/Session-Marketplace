import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "../../shared/components/Card";
import { Input, Textarea, Select } from "../../shared/components/Input";
import { Button } from "../../shared/components/Button";
import { PageHeader } from "../../shared/components/PageHeader";
import { useToast } from "../../shared/hooks/useToast";
import {
  useCreateSession,
  useCreatorSession,
  useUpdateSession,
} from "../sessions/useSessions";
import type { SessionWritePayload } from "../../shared/api/sessions";

const intString = z.string().refine(
  (v) => Number.isFinite(Number(v)) && Number.isInteger(Number(v)),
  "Must be an integer."
);

const positiveIntString = z.string().refine((v) => {
  const n = Number(v);
  return Number.isFinite(n) && Number.isInteger(n) && n >= 1;
}, "Must be ≥ 1.");

const nonNegNumberString = z.string().refine((v) => {
  const n = Number(v);
  return v === "" || (Number.isFinite(n) && n >= 0);
}, "Must be ≥ 0 or empty.");

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(160),
  description: z.string().max(2000).optional().or(z.literal("")),
  category: z.string().max(60).optional().or(z.literal("")),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  duration_minutes: intString,
  price: nonNegNumberString,
  currency: z.string().min(3).max(3),
  capacity: positiveIntString,
  scheduled_at: z.string().optional().or(z.literal("")),
  location_type: z.enum(["online", "in_person", "hybrid"]).optional(),
  status: z.enum(["draft", "published", "unpublished", "archived"]).optional(),
  thumbnail_url: z
    .string()
    .url("Must be a valid URL.")
    .optional()
    .or(z.literal("")),
  tags: z.string().optional().or(z.literal("")),
  images: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function SessionCreatePage() {
  return <SessionForm mode="create" />;
}

export function SessionEditPage() {
  const { id } = useParams<{ id: string }>();
  return <SessionForm mode="edit" sessionId={id!} />;
}

function SessionForm({
  mode,
  sessionId,
}: {
  mode: "create" | "edit";
  sessionId?: string;
}) {
  const navigate = useNavigate();
  const toast = useToast();

  const editing = mode === "edit";
  const { data: existing, isLoading: loadingExisting } = useCreatorSession(
    editing ? sessionId : undefined
  );

  const create = useCreateSession();
  const update = useUpdateSession(editing ? sessionId! : "");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      difficulty: "beginner",
      duration_minutes: "60",
      price: "0",
      currency: "USD",
      capacity: "1",
      scheduled_at: "",
      location_type: "online",
      status: "draft",
      thumbnail_url: "",
      tags: "",
      images: "",
    },
  });

  useEffect(() => {
    if (existing && editing) {
      form.reset({
        title: existing.title,
        description: existing.description,
        category: existing.category,
        difficulty: existing.difficulty,
        duration_minutes: String(existing.duration_minutes),
        price: String(existing.price),
        currency: existing.currency,
        capacity: String(existing.capacity),
        scheduled_at:
          existing.scheduled_at
            ? new Date(existing.scheduled_at).toISOString().slice(0, 16)
            : "",
        location_type: existing.location_type,
        status: existing.status,
        thumbnail_url: existing.thumbnail_url,
        tags: (existing.tags ?? []).map((t) => t.name).join(", "),
        images: (existing.images ?? []).map((i) => i.image_url).join("\n"),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload: SessionWritePayload = {
      title: values.title,
      description: values.description,
      category: values.category,
      difficulty: values.difficulty,
      duration_minutes: Number(values.duration_minutes),
      price: values.price === "" || values.price === undefined ? 0 : Number(values.price),
      currency: values.currency,
      capacity: Number(values.capacity),
      scheduled_at: values.scheduled_at
        ? new Date(values.scheduled_at).toISOString()
        : null,
      location_type: values.location_type,
      status: values.status,
      thumbnail_url: values.thumbnail_url,
      tags: (values.tags ?? "")
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean),
      images: (values.images ?? "")
        .split("\n")
        .map((u: string) => u.trim())
        .filter(Boolean),
    };
    try {
      if (editing) {
        await update.mutateAsync(payload);
        toast.success("Session updated.");
      } else {
        await create.mutateAsync(payload);
        toast.success("Session created.");
      }
      navigate("/creator/sessions");
    } catch (err) {
      toast.error(err);
    }
  });

  if (editing && loadingExisting) {
    return <div className="h-48 animate-pulse rounded-xl bg-slate-200" />;
  }

  const submitting = create.isPending || update.isPending;

  return (
    <div>
      <PageHeader
        eyebrow={editing ? "Edit session" : "New session"}
        title={editing ? "Update your session" : "Create a new session"}
        description="Fill in the basics and tweak advanced details as needed."
      />
      <Card padding="lg">
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            label="Title"
            placeholder="e.g. Designing APIs with Django"
            {...form.register("title")}
            error={form.formState.errors.title?.message}
          />
          <Textarea
            label="Description"
            placeholder="What will learners take away?"
            {...form.register("description")}
            error={form.formState.errors.description?.message}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Category"
              placeholder="backend, frontend, design…"
              {...form.register("category")}
            />
            <Select
              label="Difficulty"
              {...form.register("difficulty")}
              defaultValue="beginner"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
            <Select
              label="Format"
              {...form.register("location_type")}
              defaultValue="online"
            >
              <option value="online">Online</option>
              <option value="in_person">In person</option>
              <option value="hybrid">Hybrid</option>
            </Select>
            <Input
              label="Duration (minutes)"
              type="number"
              min={5}
              max={720}
              {...form.register("duration_minutes")}
              error={form.formState.errors.duration_minutes?.message}
            />
            <Input
              label="Capacity"
              type="number"
              min={1}
              {...form.register("capacity")}
              error={form.formState.errors.capacity?.message}
            />
            <Input
              label="Price"
              type="number"
              min={0}
              step="0.01"
              {...form.register("price")}
              error={form.formState.errors.price?.message}
            />
            <Input
              label="Currency"
              maxLength={3}
              {...form.register("currency")}
              error={form.formState.errors.currency?.message}
            />
            <Input
              label="Scheduled at"
              type="datetime-local"
              {...form.register("scheduled_at")}
            />
            <Input
              label="Thumbnail URL"
              type="url"
              placeholder="https://…"
              {...form.register("thumbnail_url")}
              error={form.formState.errors.thumbnail_url?.message}
            />
          </div>
          <Input
            label="Tags"
            placeholder="Comma-separated (e.g. backend, django, api)"
            {...form.register("tags")}
            hint="Tags are matched by name and created on demand."
          />
          <Textarea
            label="Gallery image URLs"
            placeholder="One per line"
            {...form.register("images")}
            hint="Optional. Add as many image URLs as you'd like."
          />
          <Select
            label="Status"
            {...form.register("status")}
            defaultValue="draft"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
            <option value="archived">Archived</option>
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editing ? "Save changes" : "Create session"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default SessionForm;
