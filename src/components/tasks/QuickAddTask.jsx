import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Mic, MicOff, Calendar, Flag, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { base44 } from '@/api/base44Client';

export default function QuickAddTask({ onAdd, listId }) {
  const [title, setTitle] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [dueDate, setDueDate] = useState(null);
  const [priority, setPriority] = useState('medium');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef(null);

  const priorities = [
    { value: 'low', color: 'text-slate-400', bg: 'bg-slate-100' },
    { value: 'medium', color: 'text-blue-500', bg: 'bg-blue-100' },
    { value: 'high', color: 'text-orange-500', bg: 'bg-orange-100' },
    { value: 'urgent', color: 'text-red-500', bg: 'bg-red-100' }
  ];

  const parseNaturalLanguage = async (input) => {
    setIsProcessing(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Parse this task input and extract the task title, due date (if mentioned), and priority (if mentioned).
      Input: "${input}"
      
      Examples:
      - "Buy groceries tomorrow at 5 PM" -> title: "Buy groceries", due_date: tomorrow 5 PM
      - "Urgent meeting with team" -> title: "Meeting with team", priority: urgent
      - "Finish report by Friday high priority" -> title: "Finish report", due_date: this Friday, priority: high
      
      Return ONLY the extracted information.`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          due_date: { type: "string", description: "ISO date string or null" },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"] }
        }
      }
    });
    setIsProcessing(false);
    return result;
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;

    let taskData = {
      title,
      priority,
      due_date: dueDate?.toISOString(),
      list_id: listId,
      status: 'pending'
    };

    // Try to parse natural language if the title contains time/date references
    if (/tomorrow|today|next|monday|tuesday|wednesday|thursday|friday|saturday|sunday|urgent|high|low/i.test(title)) {
      const parsed = await parseNaturalLanguage(title);
      if (parsed) {
        taskData.title = parsed.title || title;
        if (parsed.due_date) taskData.due_date = parsed.due_date;
        if (parsed.priority) taskData.priority = parsed.priority;
      }
    }

    onAdd(taskData);
    setTitle('');
    setDueDate(null);
    setPriority('medium');
    setIsExpanded(false);
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setTitle(transcript);
      setIsExpanded(true);
    };

    recognition.start();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setIsExpanded(false);
      setTitle('');
    }
  };

  return (
    <div className={cn(
      "relative bg-white rounded-2xl border shadow-sm transition-all duration-300",
      isExpanded ? "shadow-lg border-indigo-200" : "border-slate-200"
    )}>
      <div className="flex items-center gap-3 p-4">
        <div className={cn(
          "flex items-center justify-center w-6 h-6 rounded-full transition-colors",
          isExpanded ? "bg-indigo-500" : "bg-slate-200"
        )}>
          <Plus className={cn("h-4 w-4", isExpanded ? "text-white" : "text-slate-500")} />
        </div>
        
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (e.target.value && !isExpanded) setIsExpanded(true);
          }}
          onFocus={() => setIsExpanded(true)}
          onKeyDown={handleKeyDown}
          placeholder="Add a task... (try 'Buy milk tomorrow at 3pm')"
          className="flex-1 border-0 shadow-none focus-visible:ring-0 text-base placeholder:text-slate-400"
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={handleVoiceInput}
          className={cn(
            "rounded-full transition-colors",
            isListening && "bg-red-100 text-red-500"
          )}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 flex items-center justify-between border-t pt-3 gap-2">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  {dueDate ? format(dueDate, 'MMM d') : 'Due date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                />
              </PopoverContent>
            </Popover>

            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    "p-1.5 rounded-md transition-all",
                    priority === p.value ? p.bg : "hover:bg-slate-200"
                  )}
                >
                  <Flag className={cn("h-4 w-4", p.color)} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsExpanded(false);
                setTitle('');
              }}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleSubmit}
              disabled={!title.trim() || isProcessing}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isProcessing ? 'Processing...' : 'Add Task'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}