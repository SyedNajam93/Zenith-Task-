import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Share2, Copy, Check, Link2, Mail, 
  Users, Globe, Lock, Crown, Edit3, Eye, X
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ShareListDialog({
  open,
  onClose,
  list,
  onUpdateList,
  onInviteMember,
  onRemoveMember,
  onUpdateMemberRole,
  currentUser
}) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [copied, setCopied] = useState(false);

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

  const handleInvite = () => {
    if (inviteEmail && inviteEmail.includes('@')) {
      onInviteMember({
        email: inviteEmail,
        role: inviteRole,
        joined_at: new Date().toISOString()
      });
      setInviteEmail('');
      toast.success(`Invited ${inviteEmail} to the list`);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/shared-list/${list?.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied to clipboard');
  };

  const members = list?.team_members || [];
  const isOwner = list?.created_by === currentUser?.email;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share "{list?.name}"
          </DialogTitle>
          <DialogDescription>
            Invite team members to collaborate on this list
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Invite section */}
          <div>
            <Label className="text-sm font-medium">Invite by email</Label>
            <div className="flex gap-2 mt-2">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                />
              </div>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <Edit3 className="h-3 w-3" />
                      Can edit
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Eye className="h-3 w-3" />
                      Can view
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInvite} disabled={!inviteEmail.includes('@')}>
                Invite
              </Button>
            </div>
          </div>

          {/* Copy link section */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Link2 className="h-4 w-4 text-slate-500" />
                Share link
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Anyone with the link can view this list
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy link
                </>
              )}
            </Button>
          </div>

          {/* Team members */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Members ({members.length + 1})
              </Label>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {/* Owner */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Avatar className={cn("h-10 w-10", getAvatarColor(list?.created_by))}>
                  <AvatarFallback className="text-white">
                    {getInitials(currentUser?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">
                    {currentUser?.full_name}
                    {isOwner && <span className="text-slate-500 font-normal"> (you)</span>}
                  </p>
                  <p className="text-sm text-slate-500 truncate">{list?.created_by}</p>
                </div>
                <Badge className="bg-amber-100 text-amber-700 gap-1">
                  <Crown className="h-3 w-3" />
                  Owner
                </Badge>
              </div>

              {/* Members */}
              {members.map((member) => (
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
                    <p className="font-medium text-slate-800 truncate">
                      {member.name || member.email}
                    </p>
                    <p className="text-sm text-slate-500 truncate">{member.email}</p>
                  </div>
                  
                  {isOwner ? (
                    <>
                      <Select 
                        value={member.role} 
                        onValueChange={(role) => onUpdateMemberRole(member.email, role)}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="editor">Can edit</SelectItem>
                          <SelectItem value="viewer">Can view</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        onClick={() => onRemoveMember(member.email)}
                      >
                        <X className="h-4 w-4 text-slate-400 hover:text-red-500" />
                      </Button>
                    </>
                  ) : (
                    <Badge variant="secondary" className="capitalize text-xs">
                      {member.role}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Privacy settings */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              {list?.is_shared ? (
                <Globe className="h-5 w-5 text-green-500" />
              ) : (
                <Lock className="h-5 w-5 text-slate-500" />
              )}
              <div>
                <p className="font-medium text-sm">
                  {list?.is_shared ? 'Shared list' : 'Private list'}
                </p>
                <p className="text-xs text-slate-500">
                  {list?.is_shared 
                    ? 'Team members can access this list' 
                    : 'Only you can see this list'}
                </p>
              </div>
            </div>
            {isOwner && (
              <Switch
                checked={list?.is_shared}
                onCheckedChange={(checked) => onUpdateList({ is_shared: checked })}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}