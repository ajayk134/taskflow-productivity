import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronDown,
  Timer,
  Coffee,
  Zap,
  X,
  Settings2,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const PRESETS = [
  { label: 'Pomodoro', work: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 },
  { label: 'Short Focus', work: 15 * 60, shortBreak: 3 * 60, longBreak: 10 * 60 },
  { label: 'Deep Work', work: 50 * 60, shortBreak: 10 * 60, longBreak: 20 * 60 },
  { label: 'Custom', work: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 },
];

const PHASES = { WORK: 'work', SHORT_BREAK: 'short_break', LONG_BREAK: 'long_break' };

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.1;
    osc.start();
    setTimeout(() => { osc.frequency.value = 600; }, 100);
    setTimeout(() => { osc.frequency.value = 800; }, 200);
    setTimeout(() => { osc.stop(); ctx.close(); }, 400);
  } catch {}
}

export default function FocusMode({ onClose, currentTask }) {
  const navigate = useNavigate();
  const [preset, setPreset] = useState(0);
  const [phase, setPhase] = useState(PHASES.WORK);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(PRESETS[0].work);
  const [totalTime, setTotalTime] = useState(PRESETS[0].work);
  const [sessionCount, setSessionCount] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [customWork, setCustomWork] = useState(25);
  const [customShort, setCustomShort] = useState(5);
  const [customLong, setCustomLong] = useState(15);
  const intervalRef = useRef(null);

  const currentPreset = preset === 3
    ? { work: customWork * 60, shortBreak: customShort * 60, longBreak: customLong * 60 }
    : PRESETS[preset];

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const switchPhase = useCallback((nextPhase) => {
    setPhase(nextPhase);
    setIsRunning(false);
    let duration;
    if (nextPhase === PHASES.WORK) duration = currentPreset.work;
    else if (nextPhase === PHASES.SHORT_BREAK) duration = currentPreset.shortBreak;
    else duration = currentPreset.longBreak;
    setTimeLeft(duration);
    setTotalTime(duration);
  }, [currentPreset]);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          if (soundEnabled) playNotificationSound();
          if (phase === PHASES.WORK) {
            setSessionCount((c) => c + 1);
            setTotalFocusTime((t) => t + totalTime);
            const newCount = sessionCount + 1;
            if (newCount % 4 === 0) {
              toast.success('Great work! Time for a long break.', { icon: '🎉' });
              switchPhase(PHASES.LONG_BREAK);
            } else {
              toast.success('Session complete! Take a short break.', { icon: '☕' });
              switchPhase(PHASES.SHORT_BREAK);
            }
          } else {
            toast.success('Break over! Ready to focus?', { icon: '💪' });
            switchPhase(PHASES.WORK);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning, phase, switchPhase, soundEnabled, totalTime, sessionCount]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        setIsRunning((r) => !r);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleReset = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setTimeLeft(currentPreset.work);
    setTotalTime(currentPreset.work);
    setPhase(PHASES.WORK);
  };

  const handleStop = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setSessionCount(0);
    setTotalFocusTime(0);
    setTimeLeft(currentPreset.work);
    setTotalTime(currentPreset.work);
    setPhase(PHASES.WORK);
  };

  const phaseLabel = phase === PHASES.WORK ? 'Focus Time' : phase === PHASES.SHORT_BREAK ? 'Short Break' : 'Long Break';
  const phaseColor = phase === PHASES.WORK ? 'from-blue-500 to-indigo-600' : phase === PHASES.SHORT_BREAK ? 'from-emerald-500 to-teal-600' : 'from-violet-500 to-purple-600';

  return (
    <div className="fixed inset-0 z-[80] bg-gray-950 flex flex-col items-center justify-center text-white">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        title="Exit (Esc)"
      >
        <X className="w-5 h-5" />
      </button>

      <button
        onClick={() => setShowSettings(!showSettings)}
        className="absolute top-6 right-16 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        <Settings2 className="w-5 h-5" />
      </button>

      {showSettings && (
        <div className="absolute top-16 right-6 w-72 bg-gray-800 rounded-xl border border-gray-700 p-4 shadow-xl z-10">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Timer Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Preset</label>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((p, i) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setPreset(i);
                      if (phase === PHASES.WORK) {
                        setTimeLeft(p.work);
                        setTotalTime(p.work);
                      }
                    }}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      preset === i ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            {preset === 3 && (
              <>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Work (min)</label>
                  <input
                    type="number"
                    value={customWork}
                    onChange={(e) => setCustomWork(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Short Break (min)</label>
                  <input
                    type="number"
                    value={customShort}
                    onChange={(e) => setCustomShort(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Long Break (min)</label>
                  <input
                    type="number"
                    value={customLong}
                    onChange={(e) => setCustomLong(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Sound notifications</span>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={clsx('p-1.5 rounded-lg transition-colors', soundEnabled ? 'text-blue-400' : 'text-gray-500')}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-8">
        <span className={clsx('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r text-white', phaseColor)}>
          {phase === PHASES.WORK ? <Zap className="w-3 h-3" /> : <Coffee className="w-3 h-3" />}
          {phaseLabel}
        </span>
      </div>

      {currentTask && (
        <div className="mb-8 px-6 py-3 bg-white/5 rounded-xl border border-white/10 max-w-md text-center">
          <p className="text-xs text-gray-400 mb-1">Current Task</p>
          <p className="text-sm font-medium text-gray-200 truncate">{currentTask.title || 'Untitled'}</p>
        </div>
      )}

      <div className="relative mb-10">
        <svg className="w-64 h-64 -rotate-90" viewBox="0 0 256 256">
          <circle cx="128" cy="128" r="120" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <circle
            cx="128" cy="128" r="120" fill="none"
            stroke="url(#timer-gradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
          <defs>
            <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className="text-blue-400" stopColor="currentColor" />
              <stop offset="100%" className="text-indigo-500" stopColor="currentColor" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-6xl font-light tracking-tight text-white font-mono">{formatTime(timeLeft)}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <button onClick={handleReset} className="p-3 rounded-xl bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white transition-colors" title="Reset">
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={clsx(
            'p-5 rounded-2xl transition-all duration-200 shadow-xl',
            isRunning
              ? 'bg-yellow-500 hover:bg-yellow-400 text-yellow-950'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white'
          )}
        >
          {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-0.5" />}
        </button>
        <button onClick={handleStop} className="p-3 rounded-xl bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white transition-colors" title="Stop">
          <Square className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-8 text-center">
        <div>
          <p className="text-2xl font-semibold text-white">{sessionCount}</p>
          <p className="text-xs text-gray-400">Sessions</p>
        </div>
        <div className="w-px h-10 bg-white/10" />
        <div>
          <p className="text-2xl font-semibold text-white">{Math.floor(totalFocusTime / 60)}m</p>
          <p className="text-xs text-gray-400">Focus Time</p>
        </div>
      </div>

      <p className="absolute bottom-6 text-xs text-gray-500">Press Space to {isRunning ? 'pause' : 'start'} · Esc to exit</p>
    </div>
  );
}
