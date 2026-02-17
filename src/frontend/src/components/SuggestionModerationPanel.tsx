import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useGetAllSuggestions, useDeleteSuggestion } from '../hooks/useQueries';
import { Loader2, Trash2, MessageSquare, AlertCircle } from 'lucide-react';
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
import type { Suggestion } from '../backend';

export default function SuggestionModerationPanel() {
  const { data: suggestions = [], isLoading, isError, error, refetch } = useGetAllSuggestions();
  const deleteMutation = useDeleteSuggestion();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);

  const handleDeleteClick = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedSuggestion) {
      await deleteMutation.mutateAsync(selectedSuggestion.id);
      setDeleteDialogOpen(false);
      setSelectedSuggestion(null);
    }
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp / 1_000_000n));
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Suggestions & Feedback
          </CardTitle>
          <CardDescription>Review and moderate user suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Suggestions & Feedback
          </CardTitle>
          <CardDescription>Review and moderate user suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-sm text-muted-foreground text-center">
              Failed to load suggestions: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Suggestions & Feedback
          </CardTitle>
          <CardDescription>
            Review and moderate user suggestions ({suggestions.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No suggestions submitted yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id.toString()}
                    className="rounded-lg border bg-card p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-normal">
                            {suggestion.author}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(suggestion.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{suggestion.feedback}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(suggestion)}
                        disabled={deleteMutation.isPending}
                        className="shrink-0"
                      >
                        {deleteMutation.isPending &&
                        selectedSuggestion?.id === suggestion.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Suggestion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this suggestion? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
