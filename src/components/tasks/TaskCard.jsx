import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, Clock, Flag, MoreHorizontal, Paperclip, 
  MessageSquare, Users, ChevronDown, ChevronRight,
  Edit2, Trash2, Bell, Repeat
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

const priorityConfig = {
  low: { color: 'bg-slate-100 text-slate-600', icon: 'text-slate-400' },
  medium: { color: 'bg-blue-100 text-blue-600', icon: 'text-blue-500' },
  high: { color: 'bg-orange-100 text-orange-600', icon: 'text-orange-500' },
  urgent: { color: 'bg-red-100 text-red-600', icon: 'text-red-500' }
};

const categoryConfig = {
  work: { color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  personal: { color: 'bg-purple-50 text-purple-600 border-purple-200' },
  shopping: { color: 'bg-pink-50 text-pink-600 border-pink-200' },
  fitness: { color: 'bg-green-50 text-green-600 border-green-200' },
  health: { color: 'bg-teal-50 text-teal-600 border-teal-200' },
  finance: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  education: { color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
  travel: { color: 'bg-rose-50 text-rose-600 border-rose-200' },
  other: { color: 'bg-gray-50 text-gray-600 border-gray-200' }
};

export default function TaskCard({ 
  task, 
  onToggleComplete, 
  onEdit, 
  onDelete,
  onSubtaskToggle,
  compact = false 
}) {
  const [expanded, setExpanded] = useState(false);
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  const handleComplete = () => {
    onToggleComplete(task, task.status !== 'completed');
  };

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300",
      "hover:shadow-lg hover:shadow-slate-200/50 border-slate-200/80",
      task.status === 'completed' && "opacity-60 bg-slate-50/50"
    )}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.status === 'completed'}
            onCheckedChange={handleComplete}
            className={cn(
              "mt-1 h-5 w-5 rounded-full border-2 transition-all",
              task.status === 'completed' 
                ? "bg-green-500 border-green-500" 
                : priorityConfig[task.priority]?.icon.replace('text-', 'border-')
            )}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className={cn(
                  "font-medium text-slate-800 leading-tight",
                  task.status === 'completed' && "line-through text-slate-500"
                )}>
                  {task.title}
                </h3>
                
                {task.description && !compact && (
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Edit2 className="h-4 w-4 mr-2" /> Edit Task
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(task)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              {task.priority && (
                <Badge variant="secondary" className={cn("text-xs font-medium", priorityConfig[task.priority]?.color)}>
                  <Flag className={cn("h-3 w-3 mr-1", priorityConfig[task.priority]?.icon)} />
                  {task.priority}
                </Badge>
              )}
              
              {task.category && (
                <Badge variant="outline" className={cn("text-xs", categoryConfig[task.category]?.color)}>
                  {task.category}
                </Badge>
              )}
              
              {task.due_date && (
                <Badge variant="outline" className="text-xs text-slate-600 border-slate-200">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(task.due_date), 'MMM d')}
                </Badge>
              )}
              
              {task.duration_minutes && (
                <Badge variant="outline" className="text-xs text-slate-600 border-slate-200">
                  <Clock className="h-3 w-3 mr-1" />
                  {task.duration_minutes}m
                </Badge>
              )}

              {task.is_recurring && (
                <Badge variant="outline" className="text-xs text-violet-600 border-violet-200 bg-violet-50">
                  <Repeat className="h-3 w-3 mr-1" />
                  {task.recurrence_pattern}
                </Badge>
              )}

              {task.reminders?.length > 0 && (
                <Bell className="h-3.5 w-3.5 text-amber-500" />
              )}

              {task.attachments?.length > 0 && (
                <Badge variant="outline" className="text-xs text-slate-500">
                  <Paperclip className="h-3 w-3 mr-1" />
                  {task.attachments.length}
                </Badge>
              )}

              {task.assigned_to?.length > 0 && (
                <div className="flex items-center">
                  <div className="flex -space-x-1.5">
                    {task.assigned_to.slice(0, 3).map((assignee, i) => (
                      <div
                        key={assignee.email || i}
                        className="w-5 h-5 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-white text-[10px]"
                        title={assignee.name || assignee.email}
                      >
                        {(assignee.name || assignee.email)?.[0]?.toUpperCase()}
                      </div>
                    ))}
                    {task.assigned_to.length > 3 && (
                      <div className="w-5 h-5 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] text-slate-600">
                        +{task.assigned_to.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {task.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {task.tags.map((tag, i) => (
                  <span 
                    key={i} 
                    className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {totalSubtasks > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                >
                  {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span>{completedSubtasks}/{totalSubtasks} subtasks</span>
                  <div className="flex-1 max-w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                    />
                  </div>
                </button>
                
                {expanded && (
                  <div className="mt-2 pl-6 space-y-1.5">
                    {task.subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={subtask.completed}
                          onCheckedChange={() => onSubtaskToggle(task, subtask.id)}
                          className="h-4 w-4"
                        />
                        <span className={cn(
                          "text-sm text-slate-600",
                          subtask.completed && "line-through text-slate-400"
                        )}>
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1 transition-colors",
        priorityConfig[task.priority]?.icon.replace('text-', 'bg-')
      )} />
    </Card>
  );
}