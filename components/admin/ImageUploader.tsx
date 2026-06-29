"use client";

import { useState } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { STORAGE_BUCKET } from "@/lib/constants";
import { mediaUrl } from "@/lib/storage";

/**
 * Drag/drop image uploader. Compresses to WebP client-side, uploads to the
 * public-media bucket via the authenticated browser client (RLS authorizes
 * staff), and stores the resulting path in a hidden input named `field`.
 */
export function ImageUploader({
  field,
  folder,
  defaultPath,
}: {
  field: string;
  folder: string;
  defaultPath?: string | null;
}) {
  const [path, setPath] = useState<string>(defaultPath ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preview = mediaUrl(path);

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (!isSupabaseConfigured) {
      setError("Supabase Storage isn't configured yet — add keys to .env.local.");
      return;
    }
    setBusy(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        fileType: "image/webp",
        useWebWorker: true,
      });
      const supabase = createClient();
      const filename = `${folder}/${crypto.randomUUID()}.webp`;
      const { error: upErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filename, compressed, {
          cacheControl: "3600",
          contentType: "image/webp",
          upsert: false,
        });
      if (upErr) throw upErr;
      setPath(filename);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input type="hidden" name={field} value={path} readOnly />
      {preview ? (
        <div className="relative w-fit">
          <div className="relative h-40 w-64 overflow-hidden rounded-lg border border-white/10">
            <Image src={preview} alt="Preview" fill className="object-cover" sizes="256px" />
          </div>
          <button
            type="button"
            onClick={() => setPath("")}
            className="absolute -right-2 -top-2 rounded-full bg-ember p-1 text-white"
            aria-label="Remove image"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label
          className="flex h-40 w-full max-w-md cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/5 text-sm text-sand transition-colors hover:border-ember"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
        >
          {busy ? (
            <Loader2 className="animate-spin text-ember" size={26} />
          ) : (
            <UploadCloud className="text-ember" size={26} />
          )}
          <span>{busy ? "Uploading…" : "Drag an image or click to upload"}</span>
          <span className="text-xs text-sand/60">Compressed to WebP automatically</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>
      )}
      {error ? <p className="mt-2 text-sm text-ember-bright">{error}</p> : null}
    </div>
  );
}
