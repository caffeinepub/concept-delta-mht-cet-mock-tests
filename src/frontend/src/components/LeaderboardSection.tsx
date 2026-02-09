import { useGetLeaderboard, useGetOverallLeaderboard, useGetCallerUserProfile } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, TrendingUp, Loader2, Award } from 'lucide-react';
import ShareButtons from './ShareButtons';

export default function LeaderboardSection() {
  const { data: overallLeaderboard, isLoading: overallLoading } = useGetOverallLeaderboard();
  const { data: userProfile } = useGetCallerUserProfile();

  const isCurrentUser = (userId: string) => {
    return userProfile?.id === userId;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return <Badge className="bg-yellow-500 text-yellow-950 hover:bg-yellow-600">🥇 1st</Badge>;
    } else if (rank === 2) {
      return <Badge className="bg-gray-400 text-gray-950 hover:bg-gray-500">🥈 2nd</Badge>;
    } else if (rank === 3) {
      return <Badge className="bg-amber-600 text-amber-950 hover:bg-amber-700">🥉 3rd</Badge>;
    }
    return <Badge variant="outline">{rank}th</Badge>;
  };

  if (overallLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-sm text-muted-foreground">Loading leaderboard...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Leaderboard
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Top performers across all tests
            </CardDescription>
          </div>
          <Award className="w-8 h-8 text-primary opacity-20" />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overall" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="overall" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Overall Rankings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overall" className="space-y-4">
            {overallLeaderboard && overallLeaderboard.length > 0 ? (
              <>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {overallLeaderboard.map((entry: any) => (
                      <Card
                        key={entry.userProfile.id.toString()}
                        className={`${
                          isCurrentUser(entry.userProfile.id.toString())
                            ? 'border-2 border-primary bg-primary/5'
                            : 'border border-border bg-card'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                {getRankBadge(Number(entry.rank))}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm sm:text-base text-foreground truncate">
                                  {entry.userProfile.fullName}
                                  {isCurrentUser(entry.userProfile.id.toString()) && (
                                    <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {entry.totalAttempts.toString()} test{Number(entry.totalAttempts) !== 1 ? 's' : ''} taken
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-lg sm:text-xl font-bold text-primary">
                                {Math.round(entry.averageScore)}%
                              </p>
                              <p className="text-xs text-muted-foreground">Avg Score</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>

                <div className="pt-4 border-t border-border">
                  <ShareButtons />
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No rankings available yet</p>
                <p className="text-sm mt-2">Complete tests to appear on the leaderboard!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
