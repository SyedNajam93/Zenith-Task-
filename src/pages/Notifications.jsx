import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Bell, BellOff, Check, CheckCheck, 
  UserPlus, MessageSquare, CheckCircle2, Calendar, 
  Share2, Edit2, Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";

const notificationConfig = {
  task_assigned: { icon: UserPlus, color: 'text-amber-500 bg-amber-50' },
  task_completed: { icon: CheckCircle2, color: 'text-green-500 bg-green-50' },
  comment_added: { icon: MessageSquare, color: 'text-purple-500 bg-purple-50' },
  mentioned: { icon: Bell, color: 'text-pink-500 bg-pink-50' },
  due_date_reminder: { icon: Calendar, color: 'text-orange-500 bg-orange-50' },
  list_shared: { icon: Share2, color: 'text-cyan-500 bg-cyan-50' },
  task_updated: { icon: Edit2, color: 'text-blue-500 bg-blue-50' }
};

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['allNotifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email }, '-created_date'),
    enabled: !!user?.email
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Notification.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allNotifications'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allNotifications'] })
  });

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

  const handleMarkAsRead = (id) => {
    updateMutation.mutate({ id, data: { is_read: true, read_at: new Date().toISOString() } });
  };

  const handleMarkAllAsRead = async () => {
    for (const n of notifications.filter(n => !n.is_read)) {
      await updateMutation.mutateAsync({ id: n.id, data: { is_read: true, read_at: new Date().toISOString() } });
    }
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">Notifications</h1>
              <p className="text-sm text-slate-500">
                {unreadNotifications.length} unread
              </p>
            </div>
          </div>
          
          {unreadNotifications.length > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead} className="gap-2">
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread ({unreadNotifications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-3">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <BellOff className="h-12 w-12 text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-700">No notifications</h3>
                  <p className="text-sm text-slate-500 mt-1">You're all caught up!</p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => {
                const config = notificationConfig[notification.type] || notificationConfig.task_updated;
                const Icon = config.icon;

                return (
                  <Card 
                    key={notification.id}
                    className={cn(
                      "transition-colors",
                      !notification.is_read && "bg-indigo-50/50 border-indigo-100"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="relative flex-shrink-0">
                          {notification.from_user_email ? (
                            <Avatar className={cn("h-12 w-12", getAvatarColor(notification.from_user_email))}>
                              <AvatarFallback className="text-white">
                                {getInitials(notification.from_user_name)}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", config.color)}>
                              <Icon className="h-6 w-6" />
                            </div>
                          )}
                          {!notification.is_read && (
                            <span className="absolute top-0 right-0 h-3 w-3 bg-indigo-500 rounded-full border-2 border-white" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="font-medium text-slate-800">
                                {notification.title}
                              </h4>
                              <p className="text-sm text-slate-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-slate-400 mt-2">
                                {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              {!notification.is_read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="text-xs"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Mark read
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => deleteMutation.mutate(notification.id)}
                              >
                                <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                              </Button>
                            </div>
                          </div>

                          {notification.task_id && (
                            <Link 
                              to={createPageUrl(`TaskDetails?id=${notification.task_id}`)}
                              className="inline-flex items-center gap-1 mt-3 text-sm text-indigo-600 hover:underline"
                            >
                              View task →
                            </Link>
                          )}
                          {notification.list_id && !notification.task_id && (
                            <Link 
                              to={createPageUrl(`SharedList?id=${notification.list_id}`)}
                              className="inline-flex items-center gap-1 mt-3 text-sm text-indigo-600 hover:underline"
                            >
                              View list →
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="unread" className="mt-6 space-y-3">
            {unreadNotifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Check className="h-12 w-12 text-green-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-700">All caught up!</h3>
                  <p className="text-sm text-slate-500 mt-1">No unread notifications</p>
                </CardContent>
              </Card>
            ) : (
              unreadNotifications.map((notification) => {
                const config = notificationConfig[notification.type] || notificationConfig.task_updated;
                const Icon = config.icon;

                return (
                  <Card key={notification.id} className="bg-indigo-50/50 border-indigo-100">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="relative flex-shrink-0">
                          {notification.from_user_email ? (
                            <Avatar className={cn("h-12 w-12", getAvatarColor(notification.from_user_email))}>
                              <AvatarFallback className="text-white">
                                {getInitials(notification.from_user_name)}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", config.color)}>
                              <Icon className="h-6 w-6" />
                            </div>
                          )}
                          <span className="absolute top-0 right-0 h-3 w-3 bg-indigo-500 rounded-full border-2 border-white" />
                        </div>

                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800">{notification.title}</h4>
                          <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-slate-400 mt-2">
                            {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}