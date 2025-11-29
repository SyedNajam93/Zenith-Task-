import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  UserPlus, X, Check, Mail, Crown, 
  Edit3, Eye, Search, Users
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const roleConfig = {
  owner: { label: 'Owner', icon: Crown, color: 'text-amber-500' },
  editor: { label: 'Can edit', icon: Edit3, color: 'text-blue-500' },
  viewer: { label: 'Can view', icon: Eye, color: 'text-slate-500' }
};

export default function TeamMemberSelector({
  members = [],
  onAddMember,
  onRemoveMember,
  onUpdateRole,
  currentUserEmail,
  availableUsers = [],
  placeholder = "Add team member..."
}) {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('editor');
  const [isOpen, setIsOpen] = useState(false);

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || email?.[0]?.toUpperCase() || '?';
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

  const handleAddMember = () => {
    if (email && email.includes('@')) {
      onAddMember({ email, role: selectedRole });
      setEmail('');
      setIsOpen(false);
    }
  };

  const filteredUsers = availableUsers.filter(u => 
    !members.find(m => m.email === u.email) &&
    (u.email.toLowerCase().includes(email.toLowerCase()) || 
     u.full_name?.toLowerCase().includes(email.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-slate-700 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Team Members ({members.length})
        </h4>
        
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Member
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Search by name or email..."
                  className="pl-10"
                />
              </div>

              {filteredUsers.length > 0 && email && (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredUsers.map(user => (
                    <button
                      key={user.email}
                      onClick={() => {
                        onAddMember({ 
                          email: user.email, 
                          name: user.full_name,
                          role: selectedRole 
                        });
                        setEmail('');
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Avatar className={cn("h-8 w-8", getAvatarColor(user.email))}>
                        <AvatarFallback className="text-white text-xs">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{user.full_name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Can edit</SelectItem>
                    <SelectItem value="viewer">Can view</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleAddMember}
                  disabled={!email || !email.includes('@')}
                  className="flex-1"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Invite
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        {members.map((member) => {
          const RoleIcon = roleConfig[member.role]?.icon || Edit3;
          const isCurrentUser = member.email === currentUserEmail;
          const isOwner = member.role === 'owner';

          return (
            <div 
              key={member.email}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg group"
            >
              <Avatar className={cn("h-10 w-10", getAvatarColor(member.email))}>
                <AvatarFallback className="text-white">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800 truncate">
                    {member.name || member.email}
                  </p>
                  {isCurrentUser && (
                    <Badge variant="secondary" className="text-xs">You</Badge>
                  )}
                </div>
                <p className="text-sm text-slate-500 truncate">{member.email}</p>
              </div>

              <div className="flex items-center gap-2">
                {isOwner ? (
                  <Badge className="bg-amber-100 text-amber-700 gap-1">
                    <Crown className="h-3 w-3" />
                    Owner
                  </Badge>
                ) : (
                  <Select 
                    value={member.role} 
                    onValueChange={(role) => onUpdateRole(member.email, role)}
                    disabled={isCurrentUser}
                  >
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">Can edit</SelectItem>
                      <SelectItem value="viewer">Can view</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                
                {!isOwner && !isCurrentUser && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100"
                    onClick={() => onRemoveMember(member.email)}
                  >
                    <X className="h-4 w-4 text-slate-400 hover:text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}