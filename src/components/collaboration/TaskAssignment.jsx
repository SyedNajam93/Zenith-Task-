import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  UserPlus, X, Check, Users, ChevronDown
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

export default function TaskAssignment({
  assignees = [],
  teamMembers = [],
  onAssign,
  onUnassign,
  currentUser,
  compact = false
}) {
  const [isOpen, setIsOpen] = useState(false);

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

  const isAssigned = (email) => assignees.some(a => a.email === email);

  const handleToggleAssignment = (member) => {
    if (isAssigned(member.email)) {
      onUnassign(member.email);
    } else {
      onAssign({
        email: member.email,
        name: member.name || member.full_name,
        assigned_at: new Date().toISOString(),
        assigned_by: currentUser?.email
      });
    }
  };

  if (compact) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="h-auto p-1 gap-1">
            {assignees.length > 0 ? (
              <div className="flex -space-x-2">
                {assignees.slice(0, 3).map((assignee) => (
                  <Avatar 
                    key={assignee.email} 
                    className={cn("h-6 w-6 border-2 border-white", getAvatarColor(assignee.email))}
                  >
                    <AvatarFallback className="text-white text-xs">
                      {getInitials(assignee.name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {assignees.length > 3 && (
                  <div className="h-6 w-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs text-slate-600">
                    +{assignees.length - 3}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-slate-400 text-sm">
                <UserPlus className="h-4 w-4" />
                Assign
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search members..." />
            <CommandList>
              <CommandEmpty>No members found.</CommandEmpty>
              <CommandGroup>
                {teamMembers.map((member) => (
                  <CommandItem
                    key={member.email}
                    onSelect={() => handleToggleAssignment(member)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Avatar className={cn("h-6 w-6", getAvatarColor(member.email))}>
                      <AvatarFallback className="text-white text-xs">
                        {getInitials(member.name || member.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 truncate">{member.name || member.full_name || member.email}</span>
                    {isAssigned(member.email) && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-slate-700 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Assignees
        </h4>
        
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Assign
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="end">
            <Command>
              <CommandInput placeholder="Search members..." />
              <CommandList>
                <CommandEmpty>No members found.</CommandEmpty>
                <CommandGroup>
                  {teamMembers.map((member) => (
                    <CommandItem
                      key={member.email}
                      onSelect={() => handleToggleAssignment(member)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Avatar className={cn("h-6 w-6", getAvatarColor(member.email))}>
                        <AvatarFallback className="text-white text-xs">
                          {getInitials(member.name || member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate">{member.name || member.full_name || member.email}</span>
                      {isAssigned(member.email) && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {assignees.length === 0 ? (
        <p className="text-sm text-slate-400 py-2">No one assigned yet</p>
      ) : (
        <div className="space-y-2">
          {assignees.map((assignee) => (
            <div 
              key={assignee.email}
              className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg group"
            >
              <Avatar className={cn("h-8 w-8", getAvatarColor(assignee.email))}>
                <AvatarFallback className="text-white text-sm">
                  {getInitials(assignee.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{assignee.name || assignee.email}</p>
                {assignee.assigned_at && (
                  <p className="text-xs text-slate-400">
                    Assigned {format(new Date(assignee.assigned_at), 'MMM d')}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={() => onUnassign(assignee.email)}
              >
                <X className="h-3 w-3 text-slate-400 hover:text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}