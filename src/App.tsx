import { useRef, useState } from 'react';
import type { Phase, Photo, Category, QuizQuestion, QuizAnswer, CityOption } from './types';
import { usePhotoProcessor } from './hooks/usePhotoProcessor';
import { generateDecoys } from './lib/gemini';
import { ProcessingProgress } from './components/ProcessingProgress';
import { CategoryFilter } from './components/CategoryFilter';
import { QuizQuestionView } from './components/QuizQuestion';
import { ResultsSummary } from './components/ResultsSummary';

const MAX_QUIZ = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [selectedCats, setSelectedCats] = useState<Set<Category>>(new Set());
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [buildingGame, setBuildingGame] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const { process, status, error: processError } = usePhotoProcessor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    setPhase('processing');
    const arr = Array.from(files);
    const photos = await process(arr);
    if (photos) {
      setAllPhotos(photos);
      const cats = new Set(photos.map((p) => p.category)) as Set<Category>;
      setSelectedCats(cats);
      setPhase('filter');
    } else {
      setPhase('setup');
    }
  };

  const handleAddMore = async (files: FileList) => {
    const previousPhotos = allPhotos;
    setPhase('processing');
    const arr = Array.from(files);
    const newPhotos = await process(arr);
    if (newPhotos) {
      const merged = [...previousPhotos, ...newPhotos];
      setAllPhotos(merged);
      // Add any new categories to selected set
      setSelectedCats((prev) => {
        const next = new Set(prev);
        newPhotos.forEach((p) => next.add(p.category));
        return next;
      });
    }
    setPhase('filter');
  };

  const toggleCat = (cat: Category) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const startGame = async () => {
    setBuildingGame(true);
    setBuildError(null);
    const pool = shuffle(allPhotos.filter((p) => selectedCats.has(p.category)));
    const selected = pool.slice(0, MAX_QUIZ);

    try {
      const qs: QuizQuestion[] = await Promise.all(
        selected.map(async (photo) => {
          const decoys = await generateDecoys(photo.city, photo.country, photo.lat, photo.lon);
          const correct: CityOption = { city: photo.city, country: photo.country, lat: photo.lat, lon: photo.lon };
          const allOptions = shuffle([correct, ...decoys.slice(0, 3)]);
          const correctIndex = allOptions.findIndex((o) => o.city === correct.city && o.country === correct.country);
          return { photo, options: allOptions, correctIndex };
        })
      );
      setQuestions(qs);
      setCurrentQ(0);
      setScore(0);
      setAnswers([]);
      setPhase('playing');
    } catch (e) {
      setBuildError(e instanceof Error ? e.message : 'Failed to build quiz');
    } finally {
      setBuildingGame(false);
    }
  };

  const handleAnswer = (chosenIndex: number, distanceKm: number, points: number) => {
    const answer: QuizAnswer = { question: questions[currentQ], chosenIndex, distanceKm, points };
    const newAnswers = [...answers, answer];
    const newScore = score + points;
    setScore(newScore);
    setAnswers(newAnswers);
    if (currentQ + 1 >= questions.length) {
      setTimeout(() => setPhase('results'), 300);
    } else {
      setTimeout(() => setCurrentQ((q) => q + 1), 300);
    }
  };

  const handleRestart = () => {
    setPhase('filter');
    setQuestions([]);
    setAnswers([]);
    setScore(0);
    setCurrentQ(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      <div className="max-w-md mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white tracking-tight">📍 Photo Location Quiz</h1>
          <p className="text-sm text-zinc-500 mt-1">Can you remember where you've been?</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

          {/* Setup */}
          {phase === 'setup' && (
            <div className="flex flex-col gap-5">
              {processError && (
                <p className="text-xs text-red-400 bg-red-950/50 border border-red-900 rounded-xl px-4 py-3">{processError}</p>
              )}

              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed border-zinc-700 hover:border-violet-500 hover:bg-zinc-800/50 cursor-pointer transition-all"
              >
                <span className="text-3xl">📱</span>
                <div className="text-center">
                  <p className="font-semibold text-zinc-200">Upload your photos</p>
                  <p className="text-xs text-zinc-500 mt-1">Up to 100 photos · needs GPS data</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); }}
                />
              </div>
            </div>
          )}

          {/* Processing */}
          {phase === 'processing' && status && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-zinc-200 text-center">Processing your photos</p>
              <ProcessingProgress status={status} />
            </div>
          )}

          {/* Filter */}
          {phase === 'filter' && (
            <div className="flex flex-col gap-5">
              {buildError && (
                <p className="text-xs text-red-400 bg-red-950/50 border border-red-900 rounded-xl px-4 py-3">{buildError}</p>
              )}
              <CategoryFilter
                photos={allPhotos}
                selected={selectedCats}
                onToggle={toggleCat}
                onPlay={startGame}
              />
              {buildingGame && (
                <p className="text-xs text-zinc-500 text-center animate-pulse">Building your quiz...</p>
              )}
              <button
                onClick={() => addMoreRef.current?.click()}
                className="w-full py-2.5 rounded-xl border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
              >
                + Add more photos
              </button>
              <input
                ref={addMoreRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => { if (e.target.files?.length) handleAddMore(e.target.files); e.target.value = ''; }}
              />
            </div>
          )}

          {/* Playing */}
          {phase === 'playing' && questions[currentQ] && (
            <QuizQuestionView
              key={currentQ}
              question={questions[currentQ]}
              questionNumber={currentQ + 1}
              total={questions.length}
              score={score}
              onAnswer={handleAnswer}
            />
          )}

          {/* Results */}
          {phase === 'results' && (
            <ResultsSummary answers={answers} onRestart={handleRestart} />
          )}

        </div>
      </div>
    </div>
  );
}
