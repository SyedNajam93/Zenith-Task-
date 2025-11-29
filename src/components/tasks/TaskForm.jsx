import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon, Clock, Flag, Tag, Repeat,
  Plus, X, Paperclip, Bell, Users, Upload, UserPlus, Check
} from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { base44 } from '@/api/base44Client';

const priorities = ['low', 'medium', 'high', 'urgent'];
const categories = ['work', 'personal', 'shopping', 'fitness', 'health', 'finance', 'education', 'travel', 'other'];
const recurrencePatterns = ['daily', 'weekly', 'monthly', 'custom'];

export default function TaskForm({ open, onClose, task, lists, onSave, teamMembers = [] }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'personal',
    list_id: '',
    tags: [],
    due_date: null,
    start_date: null,
    duration_minutes: null,
    is_recurring: false,
    recurrence_pattern: 'daily',
    recurrence_interval: 1,
    subtasks: [],
    reminders: [],
    attachments: [],
    assigned_to: []
  });
  const [newTag, setNewTag] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showAssignees, setShowAssignees] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
        due_date: task.due_date ? new Date(task.due_date) : null,
        start_date: task.start_date ? new Date(task.start_date) : null,
        tags: task.tags || [],
        subtasks: task.subtasks || [],
        reminders: task.reminders || [],
        attachments: task.attachments || [],
        assigned_to: task.assigned_to || []
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        category: 'personal',
        list_id: lists?.[0]?.id || '',
        tags: [],
        due_date: null,
        start_date: null,
        duration_minutes: null,
        is_recurring: false,
        recurrence_pattern: 'daily',
        recurrence_interval: 1,
        subtasks: [],
        reminders: [],
        attachments: [],
        assigned_to: []
      });
    }
  }, [task, lists, open]);

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

  const isAssigned = (email) => formData.assigned_to?.some(a => a.email === email);

  const handleToggleAssignee = (member) => {
    if (isAssigned(member.email)) {
      setFormData({
        ...formData,
        assigned_to: formData.assigned_to.filter(a => a.email !== member.email)
      });
    } else {
      setFormData({
        ...formData,
        assigned_to: [...(formData.assigned_to || []), {
          email: member.email,
          name: member.name || member.full_name,
          assigned_at: new Date().toISOString()
        }]
      });
    }
  };

  const handleAddTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleAddSubtask = () => {
    if (newSubtask) {
      setFormData({
        ...formData,
        subtasks: [...formData.subtasks, { id: Date.now().toString(), title: newSubtask, completed: false }]
      });
      setNewSubtask('');
    }
  };

  const handleRemoveSubtask = (id) => {
    setFormData({ ...formData, subtasks: formData.subtasks.filter(s => s.id !== id) });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({
        ...formData,
        attachments: [...formData.attachments, { name: file.name, url: file_url, type: file.type }]
      });
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    const submitData = {
      ...formData,
      due_date: formData.due_date ? formData.due_date.toISOString() : null,
      start_date: formData.start_date ? formData.start_date.toISOString() : null
    };
    onSave(submitData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {task ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="subtasks">Subtasks</TabsTrigger>
            <TabsTrigger value="more">
              More
              {formData.assigned_to?.length > 0 && (
                <span className="ml-1.5 h-4 w-4 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center">
                  {formData.assigned_to.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="What needs to be done?"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add more details..."
                className="mt-1 h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(p => (
                      <SelectItem key={p} value={p}>
                        <div className="flex items-center gap-2">
                          <Flag className={cn("h-4 w-4", {
                            'text-slate-400': p === 'low',
                            'text-blue-500': p === 'medium',
                            'text-orange-500': p === 'high',
                            'text-red-500': p === 'urgent'
                          })} />
                          <span className="capitalize">{p}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c} value={c}>
                        <span className="capitalize">{c}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>List</Label>
              <Select
                value={formData.list_id}
                onValueChange={(v) => setFormData({ ...formData, list_id: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a list" />
                </SelectTrigger>
                <SelectContent>
                  {lists?.map(list => (
                    <SelectItem key={list.id} value={list.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: list.color }} />
                        {list.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="pl-2 pr-1 py-1">
                    #{tag}
                    <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full mt-1 justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {formData.start_date ? format(formData.start_date, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.start_date}
                      onSelect={(d) => setFormData({ ...formData, start_date: d })}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full mt-1 justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {formData.due_date ? format(formData.due_date, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.due_date}
                      onSelect={(d) => setFormData({ ...formData, due_date: d })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label>Estimated Duration (minutes)</Label>
              <Input
                type="number"
                value={formData.duration_minutes || ''}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || null })}
                placeholder="e.g., 30"
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Repeat className="h-5 w-5 text-violet-500" />
                <div>
                  <p className="font-medium">Recurring Task</p>
                  <p className="text-sm text-slate-500">Repeat this task automatically</p>
                </div>
              </div>
              <Switch
                checked={formData.is_recurring}
                onCheckedChange={(v) => setFormData({ ...formData, is_recurring: v })}
              />
            </div>

            {formData.is_recurring && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-violet-50 rounded-lg">
                <div>
                  <Label>Pattern</Label>
                  <Select
                    value={formData.recurrence_pattern}
                    onValueChange={(v) => setFormData({ ...formData, recurrence_pattern: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {recurrencePatterns.map(p => (
                        <SelectItem key={p} value={p}>
                          <span className="capitalize">{p}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Every</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.recurrence_interval}
                    onChange={(e) => setFormData({ ...formData, recurrence_interval: parseInt(e.target.value) || 1 })}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="subtasks" className="space-y-4 mt-4">
            <div>
              <Label>Subtasks / Checklist</Label>
              <div className="space-y-2 mt-2">
                {formData.subtasks.map(subtask => (
                  <div key={subtask.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <span className="flex-1">{subtask.title}</span>
                    <button onClick={() => handleRemoveSubtask(subtask.id)} className="text-slate-400 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="Add a subtask..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="icon" onClick={handleAddSubtask}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="more" className="space-y-4 mt-4">
            {teamMembers.length > 0 && (
              <div>
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assign To
                </Label>
                <div className="mt-2">
                  {formData.assigned_to?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.assigned_to.map((assignee) => (
                        <Badge key={assignee.email} variant="secondary" className="pl-1 pr-1.5 py-1 gap-2">
                          <Avatar className={cn("h-5 w-5", getAvatarColor(assignee.email))}>
                            <AvatarFallback className="text-white text-[10px]">
                              {getInitials(assignee.name)}
                            </AvatarFallback>
                          </Avatar>
                          {assignee.name || assignee.email}
                          <button 
                            onClick={() => handleToggleAssignee(assignee)}
                            className="hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Popover open={showAssignees} onOpenChange={setShowAssignees}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Add Assignee
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
                                onSelect={() => handleToggleAssignee(member)}
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
              </div>
            )}

            <div>
              <Label>Attachments</Label>
              <div className="mt-2 space-y-2">
                {formData.attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <Paperclip className="h-4 w-4 text-slate-400" />
                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm text-blue-600 hover:underline">
                      {att.name}
                    </a>
                    <button
                      onClick={() => setFormData({
                        ...formData,
                        attachments: formData.attachments.filter((_, idx) => idx !== i)
                      })}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 p-4 mt-2 border-2 border-dashed rounded-lg cursor-pointer hover:border-slate-400 transition-colors">
                <Upload className="h-5 w-5 text-slate-400" />
                <span className="text-sm text-slate-500">
                  {uploading ? 'Uploading...' : 'Click to upload a file'}
                </span>
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!formData.title}>
            {task ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}