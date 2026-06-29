"use client";

import Image from "next/image";
import { useActionState } from "react";
import { login, type LoginResult } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/admin/fields";

export default function LoginPage() {
  const [state, formAction] = useActionState<LoginResult | null, FormData>(
    login,
    null,
  );

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image
            src="/brand/genesis-emblem.png"
            alt="Genesis Sports Foundation"
            width={512}
            height={255}
            priority
            className="mx-auto mb-4 h-12 w-auto"
          />
          <h1 className="font-display text-3xl uppercase text-cream">
            Genesis<span className="text-ember"> Admin</span>
          </h1>
          <p className="mt-2 text-sm text-sand">
            Sign in to manage events, slides, and content.
          </p>
        </div>

        <form
          action={formAction}
          className="space-y-4 rounded-2xl border border-white/10 bg-ink-soft p-7"
        >
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs uppercase tracking-widest text-sand">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-white/15 bg-ink px-3.5 py-2.5 text-sm text-cream focus:border-ember focus:outline-none focus:ring-1 focus:ring-ember"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs uppercase tracking-widest text-sand">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-white/15 bg-ink px-3.5 py-2.5 text-sm text-cream focus:border-ember focus:outline-none focus:ring-1 focus:ring-ember"
            />
          </div>

          {state?.error ? (
            <p className="rounded-lg bg-ember/10 px-3 py-2 text-sm text-ember-bright">
              {state.error}
            </p>
          ) : null}

          <SubmitButton>Sign In</SubmitButton>
        </form>
      </div>
    </div>
  );
}
