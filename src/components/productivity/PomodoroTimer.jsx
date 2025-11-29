import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw, Settings, Coffee, Brain, Timer } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function PomodoroTimer({ 
  open, 
  onClose, 
  task,
  onSessionComplete,
  settings = { work: 25, shortBreak: 5, longBreak: 15 }
}) {
  const [mode, setMode] = useState('work'); // work, short_break, long_break
  const [timeLeft, setTimeLeft] = useState(settings.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [customSettings, setCustomSettings] = useState(settings);
  const audioRef = useRef(null);

  const modes = {
    work: { label: 'Focus', icon: Brain, color: 'from-indigo-500 to-purple-500', time: customSettings.work },
    short_break: { label: 'Short Break', icon: Coffee, color: 'from-green-400 to-emerald-500', time: customSettings.shortBreak },
    long_break: { label: 'Long Break', icon: Timer, color: 'from-blue-400 to-cyan-500', time: customSettings.longBreak }
  };

  useEffect(() => {
    setTimeLeft(modes[mode].time * 60);
  }, [mode, customSettings]);

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    // Play notification sound
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }

    if (mode === 'work') {
      const newSessions = sessionsCompleted + 1;
      setSessionsCompleted(newSessions);
      onSessionComplete?.(task, customSettings.work);
      
      // After 4 work sessions, suggest long break
      if (newSessions % 4 === 0) {
        setMode('long_break');
      } else {
        setMode('short_break');
      }
    } else {
      setMode('work');
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(modes[mode].time * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((modes[mode].time * 60 - timeLeft) / (modes[mode].time * 60)) * 100;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Pomodoro Timer</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {showSettings ? (
          <div className="space-y-6 py-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Focus Duration</label>
                <span className="text-sm text-slate-500">{customSettings.work} min</span>
              </div>
              <Slider
                value={[customSettings.work]}
                onValueChange={([v]) => setCustomSettings({ ...customSettings, work: v })}
                min={5}
                max={60}
                step={5}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Short Break</label>
                <span className="text-sm text-slate-500">{customSettings.shortBreak} min</span>
              </div>
              <Slider
                value={[customSettings.shortBreak]}
                onValueChange={([v]) => setCustomSettings({ ...customSettings, shortBreak: v })}
                min={1}
                max={15}
                step={1}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Long Break</label>
                <span className="text-sm text-slate-500">{customSettings.longBreak} min</span>
              </div>
              <Slider
                value={[customSettings.longBreak]}
                onValueChange={([v]) => setCustomSettings({ ...customSettings, longBreak: v })}
                min={5}
                max={30}
                step={5}
              />
            </div>
            <Button className="w-full" onClick={() => setShowSettings(false)}>
              Save Settings
            </Button>
          </div>
        ) : (
          <div className="py-6">
            {task && (
              <div className="text-center mb-6 px-4 py-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Currently working on</p>
                <p className="font-medium text-slate-800 truncate">{task.title}</p>
              </div>
            )}

            <div className="flex justify-center gap-2 mb-8">
              {Object.entries(modes).map(([key, { label, icon: Icon }]) => (
                <Button
                  key={key}
                  variant={mode === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setMode(key);
                    setIsRunning(false);
                  }}
                  className={cn(
                    "gap-2",
                    mode === key && `bg-gradient-to-r ${modes[key].color}`
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>

            <div className="relative flex items-center justify-center mb-8">
              <div className={cn(
                "w-48 h-48 rounded-full flex items-center justify-center",
                "bg-gradient-to-br", modes[mode].color
              )}>
                <div className="w-44 h-44 rounded-full bg-white flex flex-col items-center justify-center">
                  <span className="text-5xl font-light text-slate-800 tabular-nums">
                    {formatTime(timeLeft)}
                  </span>
                  <span className="text-sm text-slate-500 mt-1">{modes[mode].label}</span>
                </div>
              </div>
              
              <svg className="absolute inset-0 w-48 h-48 -rotate-90 mx-auto" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-100"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${progress * 2.89} 289`}
                  strokeLinecap="round"
                  className={cn(
                    "transition-all duration-1000",
                    mode === 'work' ? "text-indigo-500" : mode === 'short_break' ? "text-green-500" : "text-blue-500"
                  )}
                />
              </svg>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                variant="outline"
                onClick={resetTimer}
                className="rounded-full w-12 h-12 p-0"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
              
              <Button
                size="lg"
                onClick={toggleTimer}
                className={cn(
                  "rounded-full w-16 h-16 p-0",
                  "bg-gradient-to-r", modes[mode].color,
                  "hover:opacity-90"
                )}
              >
                {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
              </Button>
              
              <div className="w-12 h-12 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-800">{sessionsCompleted}</p>
                  <p className="text-xs text-slate-500">sessions</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <audio ref={audioRef} preload="auto">
          <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp2nqJ6fj4R4bGBbXWlzgYuQl5OUl5KNiIN7c2pjYGBjaW93foOFiIiIh4WEgn96dXFuamdhYGFjZmpucXV3eXl5eXl5eHd1c3FuamZiX11cXFxcXV5fYGJjZGVmZmZmZWRjYV9dW1lXVVNRUE9OTk1MTEtKSUhIR0ZFRURDQkFAQD8+PT08Ozs6OTg4Nzc2NTU0NDMyMjExMDAvLy4uLS0sLCsrKiopKSkpKCgoKCcnJycnJiYmJiYlJSUlJSUlJSQkJCQkJCQkIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjJCQkJCQkJCQkJCQkJCUlJSUlJSUlJSYmJiYmJiYnJycoKCgoKSkpKSkqKissLCwsLS0uLi8vMDAxMTIyMzM0NDU1Njc3ODg5Ojs7PD09Pj9AQUFCREVFRkdISUpLTE1OT1BSU1RVV1haW1xeYGFjZGZoam1vcXN1d3l7foCChIaIio2PkZSWmJqdoKKlqKqtr7G0try/wsXIy87R1Njb3uHk5+ru8fT3+v4=" />
        </audio>
      </DialogContent>
    </Dialog>
  );
}