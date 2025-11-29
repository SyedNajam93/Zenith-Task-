import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Calendar, BarChart3, Layout, Settings, 
  Timer, Focus, FileText, Sparkles
} from 'lucide-react';
import { isToday, isThisWeek, isFuture, isPast, isAfter } from 'date-fns';

import ListSidebar from '../components/lists/ListSidebar';
import TaskCard from '../components/tasks/TaskCard';
import TaskForm from '../components/tasks/TaskForm';
import TaskFilters from '../components/tasks/TaskFilters';
import QuickAddTask from '../components/tasks/QuickAddTask';
import CalendarView from '../components/calendar/CalendarView';
import ProductivityStats from '../components/analytics/ProductivityStats';
import PomodoroTimer from '../components/productivity/PomodoroTimer';
import FocusMode from '../components/productivity/FocusMode';
import TemplatesList from '../components/templates/TemplatesList';
import ShareListDialog from '../components/collaboration/ShareListDialog';
import NotificationCenter from '../components/collaboration/NotificationCenter';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [selectedList, setSelectedList] = useState('inbox');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeView, setActiveView] = useState('list');
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [pomodoroTask, setPomodoroTask] = useState(null);
  const [focusTask, setFocusTask] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    priority: 'all',
    category: 'all',
    status: 'all'
  });
  const [sortBy, setSortBy] = useState('due_date');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [sharingList, setSharingList] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date')
  });

  const { data: lists = [] } = useQuery({
    queryKey: ['lists'],
    queryFn: () => base44.entities.TaskList.list()
  });

  const { data: pomodoroSessions = [] } = useQuery({
    queryKey: ['pomodoro'],
    queryFn: () => base44.entities.PomodoroSession.list('-created_date', 100)
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.TaskTemplate.list()
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email }, '-created_date', 20),
    enabled: !!user?.email,
    refetchInterval: 30000
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const createListMutation = useMutation({
    mutationFn: (data) => base44.entities.TaskList.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists'] })
  });

  const updateListMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TaskList.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists'] })
  });

  const deleteListMutation = useMutation({
    mutationFn: (id) => base44.entities.TaskList.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists'] })
  });

  const createPomodoroMutation = useMutation({
    mutationFn: (data) => base44.entities.PomodoroSession.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pomodoro'] })
  });

  const updateNotificationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Notification.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.email] })
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.email] })
  });

  const handleShareList = (list) => {
    setSharingList(list);
    setShowShareDialog(true);
  };

  const handleInviteMember = async (member) => {
    const newMembers = [...(sharingList.team_members || []), member];
    await updateListMutation.mutateAsync({ 
      id: sharingList.id, 
      data: { team_members: newMembers, is_shared: true }
    });
    // Send notification to invited user
    await base44.entities.Notification.create({
      user_email: member.email,
      type: 'list_shared',
      title: 'List shared with you',
      message: `${user?.full_name} shared "${sharingList.name}" with you`,
      list_id: sharingList.id,
      from_user_email: user?.email,
      from_user_name: user?.full_name
    });
  };

  const handleRemoveMember = async (email) => {
    const newMembers = (sharingList.team_members || []).filter(m => m.email !== email);
    await updateListMutation.mutateAsync({ 
      id: sharingList.id, 
      data: { team_members: newMembers }
    });
  };

  const handleUpdateMemberRole = async (email, role) => {
    const newMembers = (sharingList.team_members || []).map(m =>
      m.email === email ? { ...m, role } : m
    );
    await updateListMutation.mutateAsync({ 
      id: sharingList.id, 
      data: { team_members: newMembers }
    });
  };

  const handleMarkNotificationRead = async (id) => {
    await updateNotificationMutation.mutateAsync({ 
      id, 
      data: { is_read: true, read_at: new Date().toISOString() }
    });
  };

  const handleMarkAllNotificationsRead = async () => {
    for (const n of notifications.filter(n => !n.is_read)) {
      await updateNotificationMutation.mutateAsync({ 
        id: n.id, 
        data: { is_read: true, read_at: new Date().toISOString() }
      });
    }
  };

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Apply view filter
    if (selectedList === 'inbox') {
      result = result.filter(t => t.status !== 'archived');
    } else if (selectedList === 'today') {
      result = result.filter(t => t.due_date && isToday(new Date(t.due_date)) && t.status !== 'completed');
    } else if (selectedList === 'upcoming') {
      result = result.filter(t => t.due_date && isFuture(new Date(t.due_date)) && t.status !== 'completed');
    } else if (selectedList === 'completed') {
      result = result.filter(t => t.status === 'completed');
    } else if (selectedList === 'archived') {
      result = result.filter(t => t.status === 'archived');
    } else {
      result = result.filter(t => t.list_id === selectedList);
    }

    // Apply search
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(t => 
        t.title?.toLowerCase().includes(search) ||
        t.description?.toLowerCase().includes(search) ||
        t.tags?.some(tag => tag.toLowerCase().includes(search))
      );
    }

    // Apply filters
    if (filters.priority !== 'all') {
      result = result.filter(t => t.priority === filters.priority);
    }
    if (filters.category !== 'all') {
      result = result.filter(t => t.category === filters.category);
    }
    if (filters.status !== 'all') {
      result = result.filter(t => t.status === filters.status);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'due_date') {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      }
      if (sortBy === 'priority') {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (order[a.priority] || 2) - (order[b.priority] || 2);
      }
      if (sortBy === 'created_date') {
        return new Date(b.created_date) - new Date(a.created_date);
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });

    return result;
  }, [tasks, selectedList, filters, sortBy]);

  // Calculate task counts for sidebar
  const taskCounts = useMemo(() => {
    const counts = {
      inbox: tasks.filter(t => t.status !== 'archived' && t.status !== 'completed').length,
      today: tasks.filter(t => t.due_date && isToday(new Date(t.due_date)) && t.status !== 'completed').length,
      upcoming: tasks.filter(t => t.due_date && isFuture(new Date(t.due_date)) && t.status !== 'completed').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      archived: tasks.filter(t => t.status === 'archived').length
    };
    
    lists.forEach(list => {
      counts[list.id] = tasks.filter(t => t.list_id === list.id && t.status !== 'completed').length;
    });

    return counts;
  }, [tasks, lists]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.priority !== 'all') count++;
    if (filters.category !== 'all') count++;
    if (filters.status !== 'all') count++;
    return count;
  }, [filters]);

  const handleSaveTask = async (taskData) => {
    if (editingTask) {
      await updateTaskMutation.mutateAsync({ id: editingTask.id, data: taskData });
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
        completed_at: completed ? new Date().toISOString() : null
      }
    });
  };

  const handleSubtaskToggle = async (task, subtaskId) => {
    const updatedSubtasks = task.subtasks.map(s =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    await updateTaskMutation.mutateAsync({
      id: task.id,
      data: { subtasks: updatedSubtasks }
    });
  };

  const handlePomodoroComplete = async (task, duration) => {
    await createPomodoroMutation.mutateAsync({
      task_id: task.id,
      duration_minutes: duration,
      completed: true,
      session_type: 'work'
    });

    // Update actual time spent
    const newTimeSpent = (task.actual_time_spent || 0) + duration;
    await updateTaskMutation.mutateAsync({
      id: task.id,
      data: { actual_time_spent: newTimeSpent }
    });
  };

  const handleFocusComplete = async (task, elapsedSeconds) => {
    const minutes = Math.ceil(elapsedSeconds / 60);
    const newTimeSpent = (task.actual_time_spent || 0) + minutes;
    
    await updateTaskMutation.mutateAsync({
      id: task.id,
      data: {
        status: 'completed',
        completed_at: new Date().toISOString(),
        actual_time_spent: newTimeSpent
      }
    });
  };

  const handleUseTemplate = async (template) => {
    const currentListId = lists[0]?.id;
    
    for (const taskTemplate of template.tasks) {
      await createTaskMutation.mutateAsync({
        title: taskTemplate.title,
        priority: taskTemplate.priority || 'medium',
        category: template.category,
        list_id: currentListId,
        status: 'pending',
        subtasks: taskTemplate.subtasks?.map((s, i) => ({
          id: `${Date.now()}-${i}`,
          title: s,
          completed: false
        })) || []
      });
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <ListSidebar
        lists={lists}
        selectedList={selectedList}
        onSelectList={setSelectedList}
        taskCounts={taskCounts}
        onCreateList={(data) => createListMutation.mutate(data)}
        onUpdateList={(id, data) => updateListMutation.mutate({ id, data })}
        onDeleteList={(id) => deleteListMutation.mutate(id)}
        onShareList={handleShareList}
        currentUserEmail={user?.email}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">
                {selectedList === 'inbox' && 'Inbox'}
                {selectedList === 'today' && "Today's Tasks"}
                {selectedList === 'upcoming' && 'Upcoming'}
                {selectedList === 'completed' && 'Completed'}
                {selectedList === 'archived' && 'Archived'}
                {lists.find(l => l.id === selectedList)?.name}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Tabs value={activeView} onValueChange={setActiveView}>
                <TabsList>
                  <TabsTrigger value="list" className="gap-2">
                    <Layout className="h-4 w-4" /> List
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="gap-2">
                    <Calendar className="h-4 w-4" /> Calendar
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="gap-2">
                    <BarChart3 className="h-4 w-4" /> Analytics
                  </TabsTrigger>
                  <TabsTrigger value="templates" className="gap-2">
                    <FileText className="h-4 w-4" /> Templates
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                variant="outline"
                onClick={() => setShowPomodoro(true)}
                className="gap-2"
              >
                <Timer className="h-4 w-4" /> Pomodoro
              </Button>

              <NotificationCenter
                notifications={notifications}
                onMarkAsRead={handleMarkNotificationRead}
                onMarkAllAsRead={handleMarkAllNotificationsRead}
                onDelete={(id) => deleteNotificationMutation.mutate(id)}
              />

              <Button
                onClick={() => setShowTaskForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                <Plus className="h-4 w-4" /> New Task
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {activeView === 'list' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <QuickAddTask
                onAdd={(data) => createTaskMutation.mutate(data)}
                listId={lists[0]?.id}
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
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-700">No tasks yet</h3>
                    <p className="text-slate-500 mt-1">Add your first task to get started</p>
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
            </div>
          )}

          {activeView === 'calendar' && (
            <CalendarView
              tasks={tasks}
              onTaskClick={(t) => { setEditingTask(t); setShowTaskForm(true); }}
              onDateClick={(date) => {
                setEditingTask(null);
                setShowTaskForm(true);
              }}
            />
          )}

          {activeView === 'analytics' && (
            <ProductivityStats
              tasks={tasks}
              pomodoroSessions={pomodoroSessions}
            />
          )}

          {activeView === 'templates' && (
            <TemplatesList
              templates={templates}
              onUseTemplate={handleUseTemplate}
              onCreateTemplate={() => {}}
              onDeleteTemplate={() => {}}
            />
          )}
        </div>
      </main>

      <TaskForm
        open={showTaskForm}
        onClose={() => { setShowTaskForm(false); setEditingTask(null); }}
        task={editingTask}
        lists={lists}
        onSave={handleSaveTask}
      />

      <PomodoroTimer
        open={showPomodoro}
        onClose={() => { setShowPomodoro(false); setPomodoroTask(null); }}
        task={pomodoroTask}
        onSessionComplete={handlePomodoroComplete}
      />

      {focusTask && (
        <FocusMode
          task={focusTask}
          onClose={() => setFocusTask(null)}
          onComplete={handleFocusComplete}
          onToggleSubtask={handleSubtaskToggle}
        />
      )}

      <ShareListDialog
        open={showShareDialog}
        onClose={() => { setShowShareDialog(false); setSharingList(null); }}
        list={sharingList}
        onUpdateList={(data) => updateListMutation.mutate({ id: sharingList?.id, data })}
        onInviteMember={handleInviteMember}
        onRemoveMember={handleRemoveMember}
        onUpdateMemberRole={handleUpdateMemberRole}
        currentUser={user}
      />
    </div>
  );
}