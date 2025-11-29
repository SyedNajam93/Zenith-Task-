import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from 'date-fns';
import { cn } from "@/lib/utils";

const priorityColors = {
  low: 'bg-slate-400',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500'
};

export default function CalendarView({ 
  tasks, 
  onTaskClick, 
  onDateClick,
  view = 'month' // month, week, day
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentDate]);

  const getTasksForDay = (day) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      return isSameDay(new Date(task.due_date), day);
    });
  };

  const goToPrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-slate-800">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-slate-500 bg-slate-50">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarDays.map((day, idx) => {
          const dayTasks = getTasksForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={idx}
              onClick={() => onDateClick?.(day)}
              className={cn(
                "min-h-28 p-2 border-b border-r border-slate-100 cursor-pointer transition-colors",
                "hover:bg-slate-50",
                !isCurrentMonth && "bg-slate-50/50"
              )}
            >
              <div className={cn(
                "w-7 h-7 flex items-center justify-center rounded-full text-sm mb-1",
                isCurrentDay && "bg-indigo-500 text-white font-semibold",
                !isCurrentDay && !isCurrentMonth && "text-slate-400",
                !isCurrentDay && isCurrentMonth && "text-slate-700"
              )}>
                {format(day, 'd')}
              </div>
              
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map(task => (
                  <button
                    key={task.id}
                    onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                    className={cn(
                      "w-full text-left px-2 py-1 rounded text-xs truncate transition-colors",
                      "hover:opacity-80",
                      task.status === 'completed' 
                        ? "bg-green-100 text-green-700 line-through" 
                        : "bg-indigo-50 text-indigo-700"
                    )}
                  >
                    <span className={cn(
                      "inline-block w-1.5 h-1.5 rounded-full mr-1.5",
                      priorityColors[task.priority]
                    )} />
                    {task.title}
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <span className="text-xs text-slate-500 pl-2">
                    +{dayTasks.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}