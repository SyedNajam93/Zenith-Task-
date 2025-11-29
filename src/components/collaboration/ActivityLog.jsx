import React from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Plus, Edit2, CheckCircle2, Trash2, 
  MessageSquare, UserPlus, Share2, Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

const actionConfig = {
  created: { icon: Plus, color: 'bg-green-100 text-green-600' },
  updated: { icon: Edit2, color: 'bg-blue-100 text-blue-600' },
  completed: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600' },
  deleted: { icon: Trash2, color: 'bg-red-100 text-red-600' },
  commented: { icon: MessageSquare, color: 'bg-purple-100 text-purple-600' },
  assigned: { icon: UserPlus, color: 'bg-amber-100 text-amber-600' },
  shared: { icon: Share2, color: 'bg-cyan-100 text-cyan-600' }
};

export default function ActivityLog({ activities = [] }) {
  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-slate-700 flex items-center gap-2">
        <Clock className="h-5 w-5" />
        Activity Log
      </h3>

      <div className="space-y-3">
        {activities.map((activity) => {
          const config = actionConfig[activity.action] || actionConfig.updated;
          const Icon = config.icon;

          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={cn("p-2 rounded-lg", config.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">
                  <span className="font-medium">{activity.user_name || activity.user_email}</span>
                  {' '}{activity.description}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {format(new Date(activity.created_date), 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}