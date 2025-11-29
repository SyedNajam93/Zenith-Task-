import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Calendar, Clock, Flag, Tag, 
  Paperclip, Users, Timer, Focus, Edit2,
  Trash2, CheckCircle2, MoreHorizontal, Share2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";

import TaskComments from '../components/collaboration/TaskComments';
import ActivityLog from '../components/collaboration/ActivityLog';
import TaskForm from '../components/tasks/TaskForm';
import PomodoroTimer from '../components/productivity/PomodoroTimer';
import FocusMode from '../components/productivity/FocusMode';

const priorityConfig = {
  low: { color: 'bg-slate-100 text-slate-600', icon: 'text-slate-400' },
  medium: { color: 'bg-blue-100 text-blue-600', icon: 'text-blue-500' },
  high: { color: 'bg-orange-100 text-orange-600', icon: 'text-orange-500' },
  urgent: { color: 'bg-red-100 text-red-600', icon: 'text-red-500' }
};

export default function TaskDetails() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const taskId = urlParams.get('id');

  const [showEditForm, setShowEditForm] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showFocusMode, setShowFocusMode] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const tasks = await base44.entities.Task.filter({ id: taskId });
      return tasks[0];
    },
    enabled: !!taskId
  });

  const { data: lists = [] } = useQuery({
    queryKey: ['lists'],
    queryFn: () => base44.entities.TaskList.list()
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => base44.entities.Comment.filter({ task_id: taskId }),
    enabled: !!taskId
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities', taskId],
    queryFn: () => base44.entities.ActivityLog.filter({ task_id: taskId }, '-created_date'),
    enabled: !!taskId
  });

  const updateTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.update(taskId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task', taskId] })
  });

  const addCommentMutation = useMutation({
    mutationFn: (content) => base44.entities.Comment.create({
      task_id: taskId,
      content,
      author_email: user?.email,
      author_name: user?.full_name
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', taskId] })
  });

  const createActivityMutation = useMutation({
    mutationFn: (data) => base44.entities.ActivityLog.create({
      task_id: taskId,
      user_email: user?.email,
      user_name: user?.full_name,
      ...data
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities', taskId] })
  });

  const handleSubtaskToggle = async (subtaskId) => {
    const updatedSubtasks = task.subtasks.map(s =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    await updateTaskMutation.mutateAsync({ subtasks: updatedSubtasks });
  };

  const handleToggleComplete = async () => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await updateTaskMutation.mutateAsync({
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null
    });
    await createActivityMutation.mutateAsync({
      action: newStatus === 'completed' ? 'completed' : 'updated',
      description: newStatus === 'completed' ? 'completed this task' : 'marked task as pending'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-lg text-slate-600">Task not found</p>
        <Link to={createPageUrl('Dashboard')}>
          <Button className="mt-4">Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const currentList = lists.find(l => l.id === task.list_id);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className={cn(
                "text-xl font-semibold",
                task.status === 'completed' && "line-through text-slate-500"
              )}>
                {task.title}
              </h1>
              {currentList && (
                <div className="flex items-center gap-2 mt-1">
                  <div 
                    className="w-2 h-2 rounded" 
                    style={{ backgroundColor: currentList.color }} 
                  />
                  <span className="text-sm text-slate-500">{currentList.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowPomodoro(true)} className="gap-2">
              <Timer className="h-4 w-4" /> Pomodoro
            </Button>
            <Button variant="outline" onClick={() => setShowFocusMode(true)} className="gap-2">
              <Focus className="h-4 w-4" /> Focus
            </Button>
            <Button variant="outline" onClick={() => setShowEditForm(true)} className="gap-2">
              <Edit2 className="h-4 w-4" /> Edit
            </Button>
            <Button
              onClick={handleToggleComplete}
              className={cn(
                "gap-2",
                task.status === 'completed' 
                  ? "bg-slate-600 hover:bg-slate-700" 
                  : "bg-green-600 hover:bg-green-700"
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              {task.status === 'completed' ? 'Mark Incomplete' : 'Complete'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                {task.description && (
                  <p className="text-slate-600 mb-6">{task.description}</p>
                )}

                <div className="flex flex-wrap gap-3 mb-6">
                  {task.priority && (
                    <Badge className={cn("gap-1", priorityConfig[task.priority]?.color)}>
                      <Flag className={cn("h-3 w-3", priorityConfig[task.priority]?.icon)} />
                      {task.priority} priority
                    </Badge>
                  )}
                  {task.category && (
                    <Badge variant="outline" className="capitalize">
                      {task.category}
                    </Badge>
                  )}
                  {task.due_date && (
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(task.due_date), 'MMM d, yyyy')}
                    </Badge>
                  )}
                  {task.duration_minutes && (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      Est. {task.duration_minutes} min
                    </Badge>
                  )}
                </div>

                {task.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {task.tags.map((tag, i) => (
                      <span 
                        key={i} 
                        className="text-sm px-3 py-1 rounded-full bg-slate-100 text-slate-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {totalSubtasks > 0 && (
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-slate-800">Subtasks</h3>
                      <span className="text-sm text-slate-500">
                        {completedSubtasks}/{totalSubtasks} completed
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full mb-4">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                      />
                    </div>
                    <div className="space-y-2">
                      {task.subtasks.map((subtask) => (
                        <div 
                          key={subtask.id}
                          className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <Checkbox
                            checked={subtask.completed}
                            onCheckedChange={() => handleSubtaskToggle(subtask.id)}
                          />
                          <span className={cn(
                            "flex-1",
                            subtask.completed && "line-through text-slate-400"
                          )}>
                            {subtask.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {task.attachments?.length > 0 && (
                  <div className="border-t pt-6 mt-6">
                    <h3 className="font-medium text-slate-800 mb-4 flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Attachments
                    </h3>
                    <div className="space-y-2">
                      {task.attachments.map((att, i) => (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <Paperclip className="h-4 w-4 text-slate-400" />
                          <span className="text-blue-600 hover:underline">{att.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="comments">
                  <TabsList>
                    <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                  </TabsList>
                  <TabsContent value="comments" className="mt-4">
                    <TaskComments
                      comments={comments}
                      currentUser={user}
                      onAddComment={(content) => addCommentMutation.mutate(content)}
                      isLoading={addCommentMutation.isPending}
                    />
                  </TabsContent>
                  <TabsContent value="activity" className="mt-4">
                    <ActivityLog activities={activities} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Created</p>
                  <p className="font-medium">
                    {format(new Date(task.created_date), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                {task.completed_at && (
                  <div>
                    <p className="text-sm text-slate-500">Completed</p>
                    <p className="font-medium">
                      {format(new Date(task.completed_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                )}
                {task.actual_time_spent && (
                  <div>
                    <p className="text-sm text-slate-500">Time Spent</p>
                    <p className="font-medium">{task.actual_time_spent} minutes</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {task.assigned_to?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Assigned To
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {task.assigned_to.map((email, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm">
                          {email[0].toUpperCase()}
                        </div>
                        <span className="text-sm">{email}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <TaskForm
        open={showEditForm}
        onClose={() => setShowEditForm(false)}
        task={task}
        lists={lists}
        onSave={(data) => updateTaskMutation.mutate(data)}
      />

      <PomodoroTimer
        open={showPomodoro}
        onClose={() => setShowPomodoro(false)}
        task={task}
        onSessionComplete={(t, duration) => {
          updateTaskMutation.mutate({
            actual_time_spent: (task.actual_time_spent || 0) + duration
          });
        }}
      />

      {showFocusMode && (
        <FocusMode
          task={task}
          onClose={() => setShowFocusMode(false)}
          onComplete={(t, seconds) => {
            const minutes = Math.ceil(seconds / 60);
            updateTaskMutation.mutate({
              status: 'completed',
              completed_at: new Date().toISOString(),
              actual_time_spent: (task.actual_time_spent || 0) + minutes
            });
          }}
          onToggleSubtask={(t, subtaskId) => handleSubtaskToggle(subtaskId)}
        />
      )}
    </div>
  );
}