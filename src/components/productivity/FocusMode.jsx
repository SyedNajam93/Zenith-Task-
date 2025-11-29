import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Focus, X, Clock, CheckCircle2, Play, Pause } from 'lucide-react';
import { cn } from "@/lib/utils";
import TaskCard from '../tasks/TaskCard';

export default function FocusMode({ 
  task, 
  onClose, 
  onComplete, 
  onToggleSubtask 
}) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleComplete = () => {
    onComplete(task, elapsedTime);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 z-50 flex items-center justify-center p-6">
      <div className="absolute top-6 right-6">
        <Button variant="ghost" onClick={onClose} className="text-white hover:text-slate-300">
          <X className="h-6 w-6" />
        </Button>
      </div>

      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-indigo-400 mb-4">
            <Focus className="h-6 w-6" />
            <span className="text-lg font-medium">Focus Mode</span>
          </div>
          
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-white/10 rounded-full">
            <Clock className="h-5 w-5 text-slate-400" />
            <span className="text-4xl font-light text-white tabular-nums">
              {formatTime(elapsedTime)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsRunning(!isRunning)}
              className="text-white hover:text-slate-300"
            >
              {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <Card className="bg-white/10 border-white/20 backdrop-blur-sm p-6">
          <h2 className="text-2xl font-semibold text-white mb-2">{task.title}</h2>
          {task.description && (
            <p className="text-slate-300 mb-4">{task.description}</p>
          )}

          {task.subtasks?.length > 0 && (
            <div className="space-y-2 mt-6">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
                Checklist
              </h3>
              {task.subtasks.map((subtask) => (
                <button
                  key={subtask.id}
                  onClick={() => onToggleSubtask(task, subtask.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-all",
                    "text-left hover:bg-white/10",
                    subtask.completed ? "text-slate-500" : "text-white"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    subtask.completed 
                      ? "bg-green-500 border-green-500" 
                      : "border-slate-500"
                  )}>
                    {subtask.completed && <CheckCircle2 className="h-4 w-4 text-white" />}
                  </div>
                  <span className={cn(subtask.completed && "line-through")}>
                    {subtask.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>

        <div className="flex justify-center gap-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-white/30 text-white hover:bg-white/10"
          >
            Exit Focus Mode
          </Button>
          <Button 
            onClick={handleComplete}
            className="bg-green-500 hover:bg-green-600"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Complete Task
          </Button>
        </div>

        <p className="text-center text-slate-500 text-sm">
          Press Esc to exit focus mode
        </p>
      </div>
    </div>
  );
}