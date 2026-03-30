import type { Category, Photo } from '../types';
import { CATEGORY_LABELS } from '../types';

interface Props {
  photos: Photo[];
  selected: Set<Category>;
  onToggle: (cat: Category) => void;
  onPlay: () => void;
}

export function CategoryFilter({ photos, selected, onToggle, onPlay }: Props) {
  // Count photos per category
  const counts = photos.reduce<Partial<Record<Category, number>>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});

  const categories = Object.keys(counts) as Category[];
  const selectedCount = photos.filter((p) => selected.has(p.category)).length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm font-semibold text-zinc-200">
          Filter by category
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          {selectedCount} photos selected for quiz
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const isOn = selected.has(cat);
          return (
            <button
              key={cat}
              onClick={() => onToggle(cat)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                isOn
                  ? 'bg-violet-600/20 border border-violet-500/50 text-violet-300'
                  : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              {CATEGORY_LABELS[cat]}
              <span className={`text-xs rounded-full px-1.5 py-0.5 ${isOn ? 'bg-violet-500/30 text-violet-300' : 'bg-zinc-700 text-zinc-500'}`}>
                {counts[cat]}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onPlay}
        disabled={selectedCount === 0}
        className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
      >
        Play with {selectedCount} photo{selectedCount !== 1 ? 's' : ''} →
      </button>
    </div>
  );
}
