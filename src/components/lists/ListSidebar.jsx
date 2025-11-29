import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, List, Inbox, Calendar, Star, CheckCircle2, 
  Archive, Settings, MoreHorizontal, Edit2, Trash2, Users,
  Share2, ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";

const defaultViews = [
  { id: 'inbox', name: 'Inbox', icon: Inbox, count: 0 },
  { id: 'today', name: 'Today', icon: Star, count: 0 },
  { id: 'upcoming', name: 'Upcoming', icon: Calendar, count: 0 },
  { id: 'completed', name: 'Completed', icon: CheckCircle2, count: 0 },
  { id: 'archived', name: 'Archived', icon: Archive, count: 0 }
];

const colorOptions = [
  '#4F46E5', '#7C3AED', '#EC4899', '#EF4444', 
  '#F97316', '#EAB308', '#22C55E', '#06B6D4'
];

export default function ListSidebar({ 
  lists, 
  selectedList, 
  onSelectList, 
  taskCounts,
  onCreateList,
  onUpdateList,
  onDeleteList,
  onShareList,
  currentUserEmail
}) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [newListName, setNewListName] = useState('');
  const [newListColor, setNewListColor] = useState('#4F46E5');

  const handleSaveList = () => {
    if (editingList) {
      onUpdateList(editingList.id, { name: newListName, color: newListColor });
    } else {
      onCreateList({ name: newListName, color: newListColor });
    }
    setShowCreateDialog(false);
    setEditingList(null);
    setNewListName('');
    setNewListColor('#4F46E5');
  };

  const openEditDialog = (list) => {
    setEditingList(list);
    setNewListName(list.name);
    setNewListColor(list.color || '#4F46E5');
    setShowCreateDialog(true);
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="p-4 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-800">TaskFlow</h2>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {defaultViews.map(view => (
            <button
              key={view.id}
              onClick={() => onSelectList(view.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                selectedList === view.id 
                  ? "bg-indigo-50 text-indigo-600" 
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <view.icon className="h-5 w-5" />
              <span className="flex-1 text-left font-medium">{view.name}</span>
              {taskCounts[view.id] > 0 && (
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  selectedList === view.id ? "bg-indigo-100" : "bg-slate-100"
                )}>
                  {taskCounts[view.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My Lists</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1">
            {lists.map(list => {
              const isOwner = list.created_by === currentUserEmail;
              const memberCount = (list.team_members?.length || 0) + 1;
              
              return (
                <div
                  key={list.id}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer",
                    selectedList === list.id 
                      ? "bg-indigo-50 text-indigo-600" 
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                  onClick={() => onSelectList(list.id)}
                >
                  <div 
                    className="w-3 h-3 rounded-sm flex-shrink-0" 
                    style={{ backgroundColor: list.color || '#4F46E5' }} 
                  />
                  <span className="flex-1 font-medium truncate">{list.name}</span>
                  {list.is_shared && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-slate-400">{memberCount}</span>
                    </div>
                  )}
                  {taskCounts[list.id] > 0 && (
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      selectedList === list.id ? "bg-indigo-100" : "bg-slate-100"
                    )}>
                      {taskCounts[list.id]}
                    </span>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(list); }}>
                        <Edit2 className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShareList?.(list); }}>
                        <Share2 className="h-4 w-4 mr-2" /> Share
                      </DropdownMenuItem>
                      {list.is_shared && (
                        <DropdownMenuItem asChild>
                          <Link 
                            to={createPageUrl(`SharedList?id=${list.id}`)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" /> Open Shared View
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {isOwner && (
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); onDeleteList(list.id); }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingList ? 'Edit List' : 'Create New List'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">List Name</label>
              <Input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="My List"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-2 mt-2">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewListColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-transform",
                      newListColor === color && "ring-2 ring-offset-2 ring-slate-400 scale-110"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveList} disabled={!newListName.trim()}>
                {editingList ? 'Save' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}