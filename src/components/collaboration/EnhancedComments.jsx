import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Send, MessageSquare, AtSign, Paperclip, 
  MoreHorizontal, Edit2, Trash2, Reply,
  Smile, Image, FileText
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import { base44 } from '@/api/base44Client';

const EMOJI_LIST = ['👍', '❤️', '🎉', '😄', '🤔', '👀', '🚀', '✅'];

export default function EnhancedComments({ 
  comments = [], 
  currentUser,
  teamMembers = [],
  onAddComment,
  onEditComment,
  onDeleteComment,
  onAddReaction,
  isLoading 
}) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const textareaRef = useRef(null);

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

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    // Extract mentions from comment
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(newComment)) !== null) {
      const member = teamMembers.find(m => 
        m.name?.toLowerCase().includes(match[1].toLowerCase()) ||
        m.email?.toLowerCase().includes(match[1].toLowerCase())
      );
      if (member) mentions.push(member.email);
    }

    await onAddComment({
      content: newComment,
      parent_id: replyingTo?.id,
      mentions
    });

    setNewComment('');
    setReplyingTo(null);
  };

  const handleMentionSelect = (member) => {
    const mention = `@${member.name || member.email.split('@')[0]} `;
    setNewComment(prev => prev.replace(/@\w*$/, mention));
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewComment(value);

    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowMentions(true);
      setMentionSearch('');
    } else if (lastAtIndex !== -1) {
      const searchText = value.slice(lastAtIndex + 1);
      if (!searchText.includes(' ')) {
        setShowMentions(true);
        setMentionSearch(searchText);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const filteredMembers = teamMembers.filter(m =>
    m.name?.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    m.email?.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const renderComment = (comment, isReply = false) => {
    const replies = comments.filter(c => c.parent_id === comment.id);
    const isEditing = editingComment?.id === comment.id;

    return (
      <div key={comment.id} className={cn("group", isReply && "ml-10 mt-3")}>
        <div className="flex gap-3">
          <Avatar className={cn("h-8 w-8 flex-shrink-0", getAvatarColor(comment.author_email))}>
            <AvatarFallback className="text-white text-xs">
              {getInitials(comment.author_name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-slate-800 text-sm">
                {comment.author_name || comment.author_email}
              </span>
              <span className="text-xs text-slate-400">
                {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
              </span>
              {comment.is_edited && (
                <span className="text-xs text-slate-400">(edited)</span>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editingComment.content}
                  onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => {
                    onEditComment(comment.id, editingComment.content);
                    setEditingComment(null);
                  }}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingComment(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                  {comment.content.split(/(@\w+)/g).map((part, i) => 
                    part.startsWith('@') ? (
                      <span key={i} className="text-indigo-600 font-medium">{part}</span>
                    ) : part
                  )}
                </p>

                {comment.attachments?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {comment.attachments.map((att, i) => (
                      <a
                        key={i}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 hover:bg-slate-200"
                      >
                        <FileText className="h-3 w-3" />
                        {att.name}
                      </a>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  {comment.reactions?.length > 0 && (
                    <div className="flex gap-1">
                      {Object.entries(
                        comment.reactions.reduce((acc, r) => {
                          acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([emoji, count]) => (
                        <button
                          key={emoji}
                          onClick={() => onAddReaction(comment.id, emoji)}
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs border transition-colors",
                            comment.reactions.some(r => r.emoji === emoji && r.user_email === currentUser?.email)
                              ? "bg-indigo-50 border-indigo-200"
                              : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                          )}
                        >
                          {emoji} {count}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Smile className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2">
                        <div className="flex gap-1">
                          {EMOJI_LIST.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => onAddReaction(comment.id, emoji)}
                              className="text-lg hover:bg-slate-100 p-1 rounded"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setReplyingTo(comment)}
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>

                    {comment.author_email === currentUser?.email && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingComment(comment)}>
                            <Edit2 className="h-3 w-3 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDeleteComment(comment.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-3 w-3 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {replies.length > 0 && (
          <div className="space-y-3 mt-3">
            {replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  const topLevelComments = comments.filter(c => !c.parent_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-slate-600">
        <MessageSquare className="h-5 w-5" />
        <h3 className="font-medium">Discussion ({comments.length})</h3>
      </div>

      {topLevelComments.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No comments yet. Start the conversation!</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {topLevelComments.map(comment => renderComment(comment))}
        </div>
      )}

      {replyingTo && (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
          <Reply className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-600">
            Replying to <span className="font-medium">{replyingTo.author_name}</span>
          </span>
          <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto" onClick={() => setReplyingTo(null)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="relative">
        <div className="flex gap-3">
          <Avatar className={cn("h-8 w-8", getAvatarColor(currentUser?.email))}>
            <AvatarFallback className="text-white text-xs">
              {getInitials(currentUser?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={newComment}
              onChange={handleInputChange}
              placeholder="Write a comment... Use @ to mention team members"
              className="resize-none min-h-[60px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <AtSign className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                size="sm"
                onClick={handleSubmit}
                disabled={!newComment.trim() || isLoading}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
          </div>
        </div>

        {showMentions && filteredMembers.length > 0 && (
          <div className="absolute bottom-full left-11 mb-2 w-64 bg-white rounded-lg shadow-lg border py-2 z-10">
            {filteredMembers.map(member => (
              <button
                key={member.email}
                onClick={() => handleMentionSelect(member)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50"
              >
                <Avatar className={cn("h-6 w-6", getAvatarColor(member.email))}>
                  <AvatarFallback className="text-white text-xs">
                    {getInitials(member.name || member.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{member.name || member.full_name || member.email}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}