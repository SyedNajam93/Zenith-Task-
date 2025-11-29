import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Plus, Share2, Users, Activity, 
  Settings, MessageSquare, Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";

import TaskCard from '../components/tasks/TaskCard';
import TaskForm from '../components/tasks/TaskForm';
import TaskFilters from '../components/tasks/TaskFilters';
import QuickAddTask from '../components/tasks/QuickAddTask';
import ListActivityFeed from '../components/collaboration/ListActivityFeed';
import ShareListDialog from '../components/collaboration/ShareListDialog';
import EnhancedComments from '../components/collaboration/EnhancedComments';

export default function SharedList() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const listId = urlParams.get('id');

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [filters, setFilters] = useState({
    search: '',
    priority: 'all',
    category: 'all',
    status: 'all'
  });
  const [sortBy, setSortBy] = useState('due_date');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: list, isLoading: listLoading } = useQuery({
    queryKey: ['list', listId],
    queryFn: async () => {
      const lists = await base44.entities.TaskList.filter({ id: listId });
      return lists[0];
    },
    enabled: !!listId
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', listId],
    queryFn: () => base44.entities.Task.filter({ list_id: listId }, '-created_date'),
    enabled: !!listId
  });

  const { data: allLists = [] } = useQuery({
    queryKey: ['lists'],
    queryFn: () => base44.entities.TaskList.list()
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities', listId],
    queryFn: () => base44.entities.ActivityLog.filter({ list_id: listId }, '-created_date', 50),
    enabled: !!listId,
    refetchInterval: 10000 // Poll every 10 seconds for real-time updates
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['listComments', listId],
    queryFn: () => base44.entities.Comment.filter({ list_id: listId }, '-created_date'),
    enabled: !!listId
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create({ ...data, list_id: listId }),
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', listId] });
      logActivity('created', newTask.id, `created task "${newTask.title}"`);
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', listId] })
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', listId] })
  });

  const updateListMutation = useMutation({
    mutationFn: (data) => base44.entities.TaskList.update(listId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['list', listId] })
  });

  const createCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.Comment.create({
      ...data,
      list_id: listId,
      author_email: user?.email,
      author_name: user?.full_name
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listComments', listId] })
  });

  const createActivityMutation = useMutation({
    mutationFn: (data) => base44.entities.ActivityLog.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities', listId] })
  });

  const createNotificationMutation = useMutation({
    mutationFn: (data) => base44.entities.Notification.create(data)
  });

  const logActivity = async (action, taskId, description, metadata = {}) => {
    await createActivityMutation.mutateAsync({
      list_id: listId,
      task_id: taskId,
      action,
      description,
      user_email: user?.email,
      user_name: user?.full_name,
      metadata
    });
  };

  const sendNotification = async (targetEmail, type, title, message, taskId) => {
    await createNotificationMutation.mutateAsync({
      user_email: targetEmail,
      type,
      title,
      message,
      task_id: taskId,
      list_id: listId,
      from_user_email: user?.email,
      from_user_name: user?.full_name
    });
  };

  const handleSaveTask = async (taskData) => {
    if (editingTask) {
      await updateTaskMutation.mutateAsync({ id: editingTask.id, data: taskData });
      await logActivity('updated', editingTask.id, `updated task "${taskData.title}"`);
    } else {
      await createTaskMutation.mutateAsync(taskData);
    }
    setEditingTask(null);
  };

  const handleToggleComplete = async (task, completed) => {
    await updateTaskMutation.mutateAsync({
      id: task.id,
      data: {
        status: completed ? 'completed' : 'pending',
        completed_at: completed ? new Date().toISOString() : null,
        completed_by: completed ? user?.email : null
      }
    });
    await logActivity(
      completed ? 'completed' : 'status_changed',
      task.id,
      completed ? `completed task "${task.title}"` : `marked "${task.title}" as pending`
    );

    // Notify assignees
    if (completed && task.assigned_to?.length > 0) {
      for (const assignee of task.assigned_to) {
        if (assignee.email !== user?.email) {
          await sendNotification(
            assignee.email,
            'task_completed',
            'Task completed',
            `${user?.full_name} completed "${task.title}"`,
            task.id
          );
        }
      }
    }
  };

  const handleSubtaskToggle = async (task, subtaskId) => {
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    const updatedSubtasks = task.subtasks.map(s =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    await updateTaskMutation.mutateAsync({
      id: task.id,
      data: { subtasks: updatedSubtasks }
    });
    if (!subtask.completed) {
      await logActivity('subtask_completed', task.id, `completed subtask "${subtask.title}" in "${task.title}"`);
    }
  };

  const handleAssignTask = async (task, assignee) => {
    const newAssignees = [...(task.assigned_to || []), assignee];
    await updateTaskMutation.mutateAsync({
      id: task.id,
      data: { assigned_to: newAssignees }
    });
    await logActivity('assigned', task.id, `assigned "${task.title}" to ${assignee.name || assignee.email}`, {
      target_user_email: assignee.email
    });
    await sendNotification(
      assignee.email,
      'task_assigned',
      'New task assigned',
      `${user?.full_name} assigned you to "${task.title}"`,
      task.id
    );
  };

  const handleUnassignTask = async (task, email) => {
    const newAssignees = (task.assigned_to || []).filter(a => a.email !== email);
    await updateTaskMutation.mutateAsync({
      id: task.id,
      data: { assigned_to: newAssignees }
    });
    await logActivity('unassigned', task.id, `removed ${email} from "${task.title}"`);
  };

  const handleInviteMember = async (member) => {
    const newMembers = [...(list.team_members || []), member];
    await updateListMutation.mutateAsync({ 
      team_members: newMembers,
      is_shared: true 
    });
    await sendNotification(
      member.email,
      'list_shared',
      'List shared with you',
      `${user?.full_name} shared "${list.name}" with you`,
      null
    );
  };

  const handleRemoveMember = async (email) => {
    const newMembers = (list.team_members || []).filter(m => m.email !== email);
    await updateListMutation.mutateAsync({ team_members: newMembers });
  };

  const handleUpdateMemberRole = async (email, role) => {
    const newMembers = (list.team_members || []).map(m =>
      m.email === email ? { ...m, role } : m
    );
    await updateListMutation.mutateAsync({ team_members: newMembers });
  };

  // Team members including owner
  const teamMembers = useMemo(() => {
    const members = list?.team_members || [];
    const owner = allUsers.find(u => u.email === list?.created_by);
    return [
      { email: list?.created_by, name: owner?.full_name, role: 'owner' },
      ...members
    ].filter(m => m.email);
  }, [list, allUsers]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(t =>
        t.title?.toLowerCase().includes(search) ||
        t.description?.toLowerCase().includes(search)
      );
    }

    if (filters.priority !== 'all') {
      result = result.filter(t => t.priority === filters.priority);
    }
    if (filters.category !== 'all') {
      result = result.filter(t => t.category === filters.category);
    }
    if (filters.status !== 'all') {
      result = result.filter(t => t.status === filters.status);
    }

    return result;
  }, [tasks, filters]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.priority !== 'all') count++;
    if (filters.category !== 'all') count++;
    if (filters.status !== 'all') count++;
    return count;
  }, [filters]);

  if (listLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-lg text-slate-600">List not found</p>
        <Link to={createPageUrl('Dashboard')}>
          <Button className="mt-4">Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('Dashboard')}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: list.color }} 
                />
                <h1 className="text-xl font-semibold text-slate-800">{list.name}</h1>
                {list.is_shared && (
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    Shared
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {teamMembers.slice(0, 4).map((member) => (
                  <div
                    key={member.email}
                    className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-white text-xs"
                    title={member.name || member.email}
                  >
                    {(member.name || member.email)?.[0]?.toUpperCase()}
                  </div>
                ))}
                {teamMembers.length > 4 && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs text-slate-600">
                    +{teamMembers.length - 4}
                  </div>
                )}
              </div>

              <Button variant="outline" onClick={() => setShowShareDialog(true)} className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>

              <Button
                onClick={() => setShowTaskForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                <Plus className="h-4 w-4" /> New Task
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="tasks" className="gap-2">
                  Tasks ({tasks.length})
                </TabsTrigger>
                <TabsTrigger value="discussion" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Discussion ({comments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tasks" className="space-y-4 mt-4">
                <QuickAddTask
                  onAdd={(data) => createTaskMutation.mutate(data)}
                  listId={listId}
                />

                <TaskFilters
                  filters={filters}
                  onFilterChange={setFilters}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  activeFiltersCount={activeFiltersCount}
                />

                <div className="space-y-3">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border">
                      <p className="text-slate-500">No tasks yet. Add your first task to get started!</p>
                    </div>
                  ) : (
                    filteredTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggleComplete={handleToggleComplete}
                        onEdit={(t) => { setEditingTask(t); setShowTaskForm(true); }}
                        onDelete={(t) => deleteTaskMutation.mutate(t.id)}
                        onSubtaskToggle={handleSubtaskToggle}
                      />
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="discussion" className="mt-4">
                <div className="bg-white rounded-xl border p-6">
                  <EnhancedComments
                    comments={comments}
                    currentUser={user}
                    teamMembers={teamMembers}
                    onAddComment={(data) => createCommentMutation.mutate(data)}
                    onEditComment={(id, content) => base44.entities.Comment.update(id, { content, is_edited: true, edited_at: new Date().toISOString() })}
                    onDeleteComment={(id) => base44.entities.Comment.delete(id)}
                    onAddReaction={(commentId, emoji) => {
                      const comment = comments.find(c => c.id === commentId);
                      const reactions = comment?.reactions || [];
                      const existingIndex = reactions.findIndex(r => r.user_email === user?.email && r.emoji === emoji);
                      const newReactions = existingIndex >= 0
                        ? reactions.filter((_, i) => i !== existingIndex)
                        : [...reactions, { emoji, user_email: user?.email }];
                      base44.entities.Comment.update(commentId, { reactions: newReactions });
                    }}
                    isLoading={createCommentMutation.isPending}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <ListActivityFeed
              activities={activities}
              tasks={tasks}
              isLoading={activitiesLoading}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['activities', listId] })}
            />
          </div>
        </div>
      </main>

      <TaskForm
        open={showTaskForm}
        onClose={() => { setShowTaskForm(false); setEditingTask(null); }}
        task={editingTask}
        lists={allLists}
        onSave={handleSaveTask}
      />

      <ShareListDialog
        open={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        list={list}
        onUpdateList={(data) => updateListMutation.mutate(data)}
        onInviteMember={handleInviteMember}
        onRemoveMember={handleRemoveMember}
        onUpdateMemberRole={handleUpdateMemberRole}
        currentUser={user}
      />
    </div>
  );
}