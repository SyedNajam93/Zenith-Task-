import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, Plus, Edit2, CheckCircle2, Trash2, 
  MessageSquare, UserPlus, UserMinus, Share2, 
  Clock, Flag, Calendar, Bell, Filter,
  RefreshCw
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const actionConfig = {
  created: { icon: Plus, color: 'bg-green-100 text-green-600', label: 'created' },
  updated: { icon: Edit2, color: 'bg-blue-100 text-blue-600', label: 'updated' },
  completed: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600', label: 'completed' },
  deleted: { icon: Trash2, color: 'bg-red-100 text-red-600', label: 'deleted' },
  commented: { icon: MessageSquare, color: 'bg-purple-100 text-purple-600', label: 'commented on' },
  assigned: { icon: UserPlus, color: 'bg-amber-100 text-amber-600', label: 'assigned' },
  unassigned: { icon: UserMinus, color: 'bg-orange-100 text-orange-600', label: 'unassigned' },
  shared: { icon: Share2, color: 'bg-cyan-100 text-cyan-600', label: 'shared' },
  mentioned: { icon: Bell, color: 'bg-pink-100 text-pink-600', label: 'mentioned' },
  status_changed: { icon: Flag, color: 'bg-violet-100 text-violet-600', label: 'changed status of' },
  priority_changed: { icon: Flag, color: 'bg-rose-100 text-rose-600', label: 'changed priority of' },
  due_date_changed: { icon: Calendar, color: 'bg-teal-100 text-teal-600', label: 'updated due date for' },
  subtask_completed: { icon: CheckCircle2, color: 'bg-lime-100 text-lime-600', label: 'completed subtask in' }
};

export default function ListActivityFeed({ 
  activities = [], 
  tasks = [],
  isLoading,
  onRefresh 
}) {
  const [filter, setFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const getAvatarColor = (email) => {
    const colors = [
      'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-rose-500', 'bg-orange-500', 'bg-amber-500',
      'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500'
    ];
    const index = email?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  const getTaskTitle = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    return task?.title || 'Unknown task';
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const groupActivitiesByDate = (activities) => {
    const groups = {};
    activities.forEach(activity => {
      const date = new Date(activity.created_date);
      let key;
      if (isToday(date)) {
        key = 'Today';
      } else if (isYesterday(date)) {
        key = 'Yesterday';
      } else {
        key = format(date, 'MMMM d, yyyy');
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(activity);
    });
    return groups;
  };

  const filteredActivities = activities.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'tasks') return ['created', 'updated', 'completed', 'deleted'].includes(a.action);
    if (filter === 'comments') return a.action === 'commented';
    if (filter === 'assignments') return ['assigned', 'unassigned'].includes(a.action);
    return true;
  });

  const groupedActivities = groupActivitiesByDate(filteredActivities);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-500" />
            Activity Feed
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
        
        <Tabs value={filter} onValueChange={setFilter} className="mt-3">
          <TabsList className="grid grid-cols-4 h-9">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">Tasks</TabsTrigger>
            <TabsTrigger value="comments" className="text-xs">Comments</TabsTrigger>
            <TabsTrigger value="assignments" className="text-xs">Assignments</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <ScrollArea className="flex-1">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No activity yet</p>
              <p className="text-sm mt-1">Activity will appear here when team members make changes</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedActivities).map(([date, dateActivities]) => (
                <div key={date}>
                  <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                    {date}
                  </h4>
                  <div className="space-y-4">
                    {dateActivities.map((activity) => {
                      const config = actionConfig[activity.action] || actionConfig.updated;
                      const Icon = config.icon;

                      return (
                        <div key={activity.id} className="flex gap-3 group">
                          <div className="relative">
                            <Avatar className={cn("h-8 w-8", getAvatarColor(activity.user_email))}>
                              <AvatarFallback className="text-white text-xs">
                                {getInitials(activity.user_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className={cn(
                              "absolute -bottom-1 -right-1 p-1 rounded-full",
                              config.color
                            )}>
                              <Icon className="h-2.5 w-2.5" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700">
                              <span className="font-medium">{activity.user_name || activity.user_email}</span>
                              {' '}{config.label}{' '}
                              {activity.task_id && (
                                <Link 
                                  to={createPageUrl(`TaskDetails?id=${activity.task_id}`)}
                                  className="font-medium text-indigo-600 hover:underline"
                                >
                                  {getTaskTitle(activity.task_id)}
                                </Link>
                              )}
                              {activity.target_user_email && (
                                <span className="font-medium"> to {activity.target_user_email}</span>
                              )}
                            </p>
                            
                            {activity.description && (
                              <p className="text-sm text-slate-500 mt-0.5">
                                {activity.description}
                              </p>
                            )}

                            {activity.metadata && (
                              <div className="flex gap-2 mt-1">
                                {activity.metadata.old_value && (
                                  <Badge variant="outline" className="text-xs line-through text-slate-400">
                                    {activity.metadata.old_value}
                                  </Badge>
                                )}
                                {activity.metadata.new_value && (
                                  <Badge variant="secondary" className="text-xs">
                                    {activity.metadata.new_value}
                                  </Badge>
                                )}
                              </div>
                            )}

                            <p className="text-xs text-slate-400 mt-1">
                              {format(new Date(activity.created_date), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}