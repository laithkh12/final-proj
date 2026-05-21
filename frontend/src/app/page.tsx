import Link from 'next/link';
import { ArrowRight, CheckCircle, Users, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">TeamFlow</span>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-400 dark:hover:bg-slate-700"
          >
            Sign in
          </Link>
          <Link
            href="/login?mode=signup"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-12 text-center lg:pt-20">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-6xl">
          Team project management,
          <span className="text-indigo-600 dark:text-indigo-400"> simplified</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          Create workspaces, manage projects, assign tasks, collaborate with comments, and track every change — all in one platform built for modern teams.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/login?mode=signup"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700"
          >
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-400 dark:hover:bg-slate-700"
          >
            Sign in
          </Link>
        </div>

        <div className="mt-20 grid gap-6 text-left sm:grid-cols-3">
          {[
            { icon: Users, title: 'Workspaces & Teams', desc: 'Organize members with roles and invite collaborators.' },
            { icon: Zap, title: 'Tasks & Projects', desc: 'Kanban-style statuses, priorities, due dates, and assignments.' },
            { icon: CheckCircle, title: 'Activity Tracking', desc: 'Full audit trail of changes across your workspace.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Icon className="mb-4 h-8 w-8 text-indigo-600" />
              <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
