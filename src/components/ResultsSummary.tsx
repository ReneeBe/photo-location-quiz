import type { QuizAnswer } from '../types';
import { formatDistance } from '../lib/scoring';

interface Props {
  answers: QuizAnswer[];
  onRestart: () => void;
}

export function ResultsSummary({ answers, onRestart }: Props) {
  const total = answers.reduce((s, a) => s + a.points, 0);
  const maxPossible = answers.length * 5000;
  const pct = Math.round((total / maxPossible) * 100);
  const correct = answers.filter((a) => a.chosenIndex === a.question.correctIndex).length;

  const medal = pct >= 90 ? '🥇' : pct >= 70 ? '🥈' : pct >= 50 ? '🥉' : '📍';

  return (
    <div className="flex flex-col gap-6">
      {/* Score */}
      <div className="flex flex-col items-center gap-2 py-4">
        <span className="text-5xl">{medal}</span>
        <p className="text-3xl font-bold text-white">{total.toLocaleString()}</p>
        <p className="text-sm text-zinc-400">out of {maxPossible.toLocaleString()} possible points</p>
        <p className="text-sm text-zinc-400">{correct} / {answers.length} correct</p>
      </div>

      {/* Breakdown */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Breakdown</p>
        {answers.map((a, i) => {
          const isCorrect = a.chosenIndex === a.question.correctIndex;
          const chosen = a.question.options[a.chosenIndex];
          const correct = a.question.options[a.question.correctIndex];
          return (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <img
                src={a.question.photo.objectUrl}
                className="w-12 h-12 rounded-lg object-cover shrink-0"
                alt=""
              />
              <div className="flex flex-col flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-200 truncate">
                  {correct.city}, {correct.country}
                </p>
                {!isCorrect && (
                  <p className="text-xs text-zinc-500 truncate">
                    You guessed: {chosen.city} · {formatDistance(a.distanceKm)} away
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className={`text-sm font-bold ${isCorrect ? 'text-emerald-400' : 'text-zinc-400'}`}>
                  +{a.points.toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onRestart}
        className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors"
      >
        Play Again
      </button>
    </div>
  );
}
