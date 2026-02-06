import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useGetAllSuggestions, useDeleteSuggestion } from '../hooks/useQueries';
import { Loader2, Trash2, MessageSquare, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function SuggestionModerationPanel() {
  const { data: suggestionsData, isLoading, isError } = useGetAllSuggestions();
  const deleteSuggestion = useDeleteSuggestion();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [suggestionToDelete, setsuggestionToDelete] = useState<{ id: bigint; author: string } | null>(null);

  const suggestions = suggestionsData?.suggestions || [];
  const count = suggestionsData?.count || BigInt(0);

  const handleDeleteClick = (id: bigint, author: string) => {
    setsuggestionToDelete({ id, author });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!suggestionToDelete) return;

    try {
      await deleteSuggestion.mutateAsync(suggestionToDelete.id);
      toast.success('Suggestion deleted successfully');
      setDeleteDialogOpen(false);
      setsuggestionToDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete suggestion');
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
          <p className="text-sm text-text-secondary">Loading suggestions...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <p className="text-sm text-text-secondary">Failed to load suggestions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg sm:text-xl text-text-primary flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Suggestions & Feedback
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-text-secondary">
                Review and moderate user feedback
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {Number(count)} Total
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No suggestions submitted yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {suggestions.map((suggestion) => (
                  <Card key={suggestion.id.toString()} className="bg-muted/30 border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {suggestion.author}
                            </Badge>
                            <span className="text-xs text-text-muted">
                              {formatTimestamp(suggestion.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-text-primary whitespace-pre-wrap break-words">
                            {suggestion.feedback}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(suggestion.id, suggestion.author)}
                          className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Suggestion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the suggestion from "{suggestionToDelete?.author}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteSuggestion.isPending}
            >
              {deleteSuggestion.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
