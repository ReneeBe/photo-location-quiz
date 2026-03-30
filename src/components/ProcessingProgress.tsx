import type { ProcessingStatus } from '../hooks/usePhotoProcessor';

interface Props {
  status: ProcessingStatus;
}

const STAGE_STEPS = ['gps', 'geocoding', 'categorizing', 'done'];

const STAGE_ICONS: Record<string, string> = {
  gps: '📍',
  geocoding: '🗺️',
  categorizing: '🤖',
  done: '✅',
};

export function ProcessingProgress({ status }: Props) {
  const pct = status.total > 0 ? Math.round((status.current / status.total) * 100) : 0;
  const stepIndex = STAGE_STEPS.indexOf(status.stage);

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      {/* Steps */}
      <div className="flex items-center gap-2">
        {['gps', 'geocoding', 'categorizing'].map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
              i < stepIndex ? 'bg-emerald-500/20 text-emerald-400' :
              i === stepIndex ? 'bg-violet-500/20 text-violet-400' :
              'bg-zinc-800 text-zinc-600'
            }`}>
              {i < stepIndex ? '✓' : STAGE_ICONS[step]}
            </div>
            {i < 2 && <div className={`w-8 h-px ${i < stepIndex ? 'bg-emerald-500/40' : 'bg-zinc-700'}`} />}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs flex flex-col gap-2">
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>{status.label}</span>
          <span>{status.current} / {status.total}</span>
        </div>
        {status.stage !== 'done' && (
          <p className="text-xs text-center text-emerald-500">
            {status.found} photo{status.found !== 1 ? 's' : ''} with GPS so far
          </p>
        )}
      </div>
    </div>
  );
}
