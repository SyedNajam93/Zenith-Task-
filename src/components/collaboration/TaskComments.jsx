import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

export default function TaskComments({ 
  comments = [], 
  currentUser,
  onAddComment,
  isLoading 
}) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-slate-600">
        <MessageSquare className="h-5 w-5" />
        <h3 className="font-medium">Comments ({comments.length})</h3>
      </div>

      {comments.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No comments yet. Start the conversation!</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className={cn("h-8 w-8", getAvatarColor(comment.author_email))}>
                <AvatarFallback className="text-white text-xs">
                  {getInitials(comment.author_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800 text-sm">
                    {comment.author_name || comment.author_email}
                  </span>
                  <span className="text-xs text-slate-400">
                    {format(new Date(comment.created_date), 'MMM d, h:mm a')}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t">
        <Avatar className={cn("h-8 w-8", getAvatarColor(currentUser?.email))}>
          <AvatarFallback className="text-white text-xs">
            {getInitials(currentUser?.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="resize-none min-h-[40px] max-h-32"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button 
            size="icon" 
            onClick={handleSubmit}
            disabled={!newComment.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}