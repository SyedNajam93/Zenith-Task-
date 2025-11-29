import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Bell, BellOff, Check, CheckCheck, UserPlus, 
  MessageSquare, CheckCircle2, Calendar, Share2, 
  Edit2, Trash2, X
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const notificationConfig = {
  task_assigned: { icon: UserPlus, color: 'text-amber-500 bg-amber-50' },
  task_completed: { icon: CheckCircle2, color: 'text-green-500 bg-green-50' },
  comment_added: { icon: MessageSquare, color: 'text-purple-500 bg-purple-50' },
  mentioned: { icon: Bell, color: 'text-pink-500 bg-pink-50' },
  due_date_reminder: { icon: Calendar, color: 'text-orange-500 bg-orange-50' },
  list_shared: { icon: Share2, color: 'text-cyan-500 bg-cyan-50' },
  task_updated: { icon: Edit2, color: 'text-blue-500 bg-blue-50' }
};

export default function NotificationCenter({ 
  notifications = [], 
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete
}) {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

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

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onMarkAllAsRead} className="text-xs">
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <BellOff className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const config = notificationConfig[notification.type] || notificationConfig.task_updated;
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex gap-3 p-4 hover:bg-slate-50 transition-colors cursor-pointer group",
                      !notification.is_read && "bg-indigo-50/50"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="relative flex-shrink-0">
                      {notification.from_user_email ? (
                        <Avatar className={cn("h-10 w-10", getAvatarColor(notification.from_user_email))}>
                          <AvatarFallback className="text-white text-sm">
                            {getInitials(notification.from_user_name)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", config.color)}>
                          <Icon className="h-5 w-5" />
                        </div>
                      )}
                      {!notification.is_read && (
                        <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-indigo-500 rounded-full border-2 border-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">
                        {notification.title}
                      </p>
                      <p className="text-sm text-slate-500 line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
                      </p>
                    </div>

                    <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsRead(notification.id);
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(notification.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 border-t bg-slate-50">
            <Link to={createPageUrl('Notifications')}>
              <Button variant="ghost" className="w-full text-sm">
                View all notifications
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}