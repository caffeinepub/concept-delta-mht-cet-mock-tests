import { useState } from 'react';
import { useGetComments, useAddComment, useDeleteComment, useGetCallerRole, useGetCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Send, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface CommentSectionProps {
  questionId: bigint;
}

export default function CommentSection({ questionId }: CommentSectionProps) {
  const [commentText, setCommentText] = useState('');
  const { data: comments, isLoading: commentsLoading } = useGetComments(questionId);
  const { data: userRole } = useGetCallerRole();
  const { data: userProfile } = useGetCallerUserProfile();
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();

  const isAdmin = userRole === 'admin';

  const handlePostComment = async () => {
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    if (commentText.length > 250) {
      toast.error('Comment must be 250 characters or less');
      return;
    }

    try {
      await addComment.mutateAsync({ questionId, text: commentText.trim() });
      setCommentText('');
      toast.success('Comment posted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to post comment');
    }
  };

  const handleDeleteComment = async (commentId: bigint) => {
    try {
      await deleteComment.mutateAsync(commentId);
      toast.success('Comment deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete comment');
    }
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getUserName = (userId: string) => {
    if (userProfile && userProfile.id.toString() === userId) {
      return userProfile.fullName || 'You';
    }
    return `User ${userId.slice(0, 8)}...`;
  };

  return (
    <Card className="bg-card border-border mt-6">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-text-primary">
          <MessageSquare className="w-5 h-5" />
          Comments ({comments?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment Input */}
        <div className="space-y-2">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Share your thoughts or ask a question..."
            rows={3}
            maxLength={250}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">
              {commentText.length}/250 characters
            </span>
            <Button
              onClick={handlePostComment}
              disabled={addComment.isPending || !commentText.trim()}
              size="sm"
              className="gap-2"
            >
              {addComment.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Post Comment
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Comments List */}
        {commentsLoading ? (
          <div className="text-center py-8 text-text-muted">
            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
            <p className="text-sm">Loading comments...</p>
          </div>
        ) : !comments || comments.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {comments.map((comment) => (
                <Card key={comment.id.toString()} className="bg-muted/30 border-border">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-text-primary">
                            {getUserName(comment.userId.toString())}
                          </span>
                          <span className="text-xs text-text-muted">
                            {formatTimestamp(comment.timestamp)}
                          </span>
                        </div>
                      </div>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deleteComment.isPending}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-text-primary whitespace-pre-wrap break-words">
                      {comment.text}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
