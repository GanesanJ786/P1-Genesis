"use client";

import { useActionState } from "react";
import { saveBlogPost, type ActionResult } from "@/lib/actions/admin";
import { ImageUploader } from "./ImageUploader";
import { TextField, TextArea, SelectField, SubmitButton } from "./fields";
import type { Database } from "@/types/database.types";

type BlogRow = Database["public"]["Tables"]["blog_posts"]["Row"];

export function BlogForm({ post }: { post?: BlogRow }) {
  const action = saveBlogPost.bind(null, post?.id ?? null);
  const [state, formAction] = useActionState<ActionResult | null, FormData>(action, null);

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <TextField label="Title" name="title" required defaultValue={post?.title} />
      <TextField
        label="Slug (leave blank to auto-generate)"
        name="slug"
        defaultValue={post?.slug}
        placeholder="genesis-track-fest-2026-results"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Category"
          name="category"
          defaultValue={post?.category ?? "news"}
          options={[
            { value: "news", label: "News" },
            { value: "results", label: "Results" },
            { value: "stories", label: "Stories" },
            { value: "training", label: "Training" },
          ]}
        />
        <SelectField
          label="Status"
          name="status"
          defaultValue={post?.status ?? "draft"}
          options={[
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
          ]}
        />
      </div>

      <TextArea label="Excerpt (shown on listing page)" name="excerpt" defaultValue={post?.excerpt ?? ""} />
      <TextArea label="Body" name="body" rows={12} defaultValue={post?.body ?? ""} />

      <div>
        <p className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-sand">
          Cover image
        </p>
        <ImageUploader field="cover_image" folder="blog" defaultPath={post?.cover_image} />
      </div>

      {state?.error ? <p className="text-sm text-ember-bright">{state.error}</p> : null}
      <SubmitButton>{post ? "Update post" : "Create post"}</SubmitButton>
    </form>
  );
}
