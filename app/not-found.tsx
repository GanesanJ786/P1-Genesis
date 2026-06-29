import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-8xl text-ember">404</p>
      <h1 className="mt-4 font-display text-3xl uppercase text-cream">
        Off the Track
      </h1>
      <p className="mt-3 max-w-md text-sand">
        The page you&apos;re looking for has left the starting blocks. Let&apos;s
        get you back on course.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-ember px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-ember-bright"
      >
        Back to Home
      </Link>
    </main>
  );
}
