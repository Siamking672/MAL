import type { LucideIcon } from "lucide-react";

export function StatCard({ label, value, icon: Icon, hint }: { label: string; value: string | number; icon: LucideIcon; hint?: string }) {
  return (
    <div className="card-glass rounded-3xl p-5 transition hover:-translate-y-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
          <Icon size={20} />
        </div>
      </div>
      {hint ? <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
}
