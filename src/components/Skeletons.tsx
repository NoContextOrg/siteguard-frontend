// Shared skeleton loading components

export const SkeletonCard = () => (
  <div className="bg-white p-6 rounded-xl border-l-8 border-l-slate-200 shadow-sm animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-3 w-24 bg-slate-200 rounded" />
        <div className="h-8 w-16 bg-slate-200 rounded" />
      </div>
      <div className="h-8 w-8 bg-slate-200 rounded-full" />
    </div>
    <div className="mt-4 h-3 w-20 bg-slate-100 rounded" />
  </div>
);

export const SkeletonRow = ({ cols = 5 }: { cols?: number }) => (
  <tr className="border-b border-slate-50">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-3 bg-slate-200 rounded animate-pulse" style={{ width: `${60 + (i % 3) * 20}%` }} />
      </td>
    ))}
  </tr>
);

export const SkeletonChart = () => (
  <div className="animate-pulse space-y-3 pt-2">
    <div className="flex items-end gap-2 h-48">
      {[60, 80, 45, 90, 55, 70, 40].map((h, i) => (
        <div key={i} className="flex-1 bg-slate-200 rounded-t" style={{ height: `${h}%` }} />
      ))}
    </div>
    <div className="flex gap-4 justify-center">
      <div className="h-3 w-16 bg-slate-200 rounded" />
      <div className="h-3 w-16 bg-slate-200 rounded" />
    </div>
  </div>
);

export const SkeletonListItem = () => (
  <div className="flex items-center justify-between p-2 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-slate-200" />
      <div className="space-y-2">
        <div className="h-3 w-24 bg-slate-200 rounded" />
        <div className="h-2 w-16 bg-slate-100 rounded" />
      </div>
    </div>
    <div className="h-5 w-16 bg-slate-100 rounded" />
  </div>
);

export const SkeletonPie = () => (
  <div className="animate-pulse flex flex-col items-center justify-center space-y-6 pt-4">
    <div className="relative w-40 h-40 rounded-full border-[20px] border-slate-200 flex items-center justify-center">
      <div className="h-6 w-12 bg-slate-100 rounded" />
    </div>
    <div className="grid grid-cols-2 gap-4 w-full px-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-200" />
            <div className="h-2 w-16 bg-slate-100 rounded" />
          </div>
          <div className="h-2 w-4 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  </div>
);
