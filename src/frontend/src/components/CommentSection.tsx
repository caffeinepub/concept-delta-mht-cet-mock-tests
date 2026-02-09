import { useState } from 'react';
import { useGetCommentsByQuestion, usePostComment, useDeleteComment, useGetCallerRole, useGetCallerUserProfile } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, Trash2, Send } from 'lucide-react';
import { toast } from 'sonner';
import type { Comment } from '../types/local';

interface CommentSectionProps {
  questionId: bigint;
}

export default function CommentSection({ questionId }: CommentSectionProps) {
  const [commentText, setCommentText] = useState('');
  const { data: comments, isLoading } = useGetCommentsByQuestion(questionId);
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: userRole } = useGetCallerRole();
  const postComment = usePostComment();
  const deleteComment = useDeleteComment();

  const isAdmin = userRole === 'admin';

  const handleSubmit = async () => {
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      await postComment.mutateAsync({
        questionId,
        text: commentText.trim(),
      });
      setCommentText('');
      toast.success('Comment posted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to post comment');
    }
  };

  const handleDelete = async (commentId: bigint) => {
    try {
      await deleteComment.mutateAsync({ commentId, questionId });
      toast.success('Comment deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete comment');
    }
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-sm text-muted-foreground">Loading comments...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comments
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Discuss this question with other students
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Write your comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <Button
            onClick={handleSubmit}
            disabled={postComment.isPending || !commentText.trim()}
            className="w-full sm:w-auto gap-2"
          >
            {postComment.isPending ? (
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

        {/* Comments List */}
        {comments && comments.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {comments.map((comment: Comment) => (
                <Card key={comment.id.toString()} className="bg-muted/30 border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            User {comment.userId.toString().slice(0, 8)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(comment.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                          {comment.text}
                        </p>
                      </div>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(comment.id)}
                          className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
