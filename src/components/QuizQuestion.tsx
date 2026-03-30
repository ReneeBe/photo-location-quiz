import { useState } from 'react';
import type { QuizQuestion } from '../types';
import { haversineKm, calcPoints, formatDistance } from '../lib/scoring';

interface Props {
  question: QuizQuestion;
  questionNumber: number;
  total: number;
  score: number;
  onAnswer: (chosenIndex: number, distanceKm: number, points: number) => void;
}

export function QuizQuestionView({ question, questionNumber, total, score, onAnswer }: Props) {
  const [chosen, setChosen] = useState<number | null>(null);
  const { photo, options, correctIndex } = question;

  const correct = options[correctIndex];

  const handlePick = (i: number) => {
    if (chosen !== null) return;
    setChosen(i);
    const picked = options[i];
    const dist = haversineKm(picked.lat, picked.lon, correct.lat, correct.lon);
    const pts = i === correctIndex ? 5000 : calcPoints(dist);
    setTimeout(() => onAnswer(i, i === correctIndex ? 0 : dist, pts), 1200);
  };

  const getOptionStyle = (i: number) => {
    if (chosen === null) return 'bg-zinc-800 border-zinc-700 hover:border-violet-500 hover:bg-zinc-700 cursor-pointer';
    if (i === correctIndex) return 'bg-emerald-500/20 border-emerald-500 text-emerald-300';
    if (i === chosen) return 'bg-red-500/20 border-red-500 text-red-300 animate-shake';
    return 'bg-zinc-800/50 border-zinc-700 opacity-50';
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>Question {questionNumber} of {total}</span>
        <span className="font-mono font-bold text-violet-400">{score.toLocaleString()} pts</span>
      </div>

      {/* Photo */}
      <div className="relative rounded-2xl overflow-hidden bg-zinc-900 aspect-[4/3]">
        <img
          src={photo.objectUrl}
          alt="Where was this taken?"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-xs font-medium text-white">
          📍 Where was this taken?
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handlePick(i)}
            className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${getOptionStyle(i)}`}
          >
            <span className="font-semibold text-sm leading-snug">{opt.city}</span>
            <span className="text-xs text-zinc-400 mt-0.5">{opt.country}</span>
            {chosen !== null && i === chosen && i !== correctIndex && (
              <span className="text-xs text-red-400 mt-1">
                {formatDistance(haversineKm(opt.lat, opt.lon, correct.lat, correct.lon))} away
              </span>
            )}
            {chosen !== null && i === correctIndex && (
              <span className="text-xs text-emerald-400 mt-1">
                {i === chosen ? '🎯 Correct!' : '✓ correct answer'}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
