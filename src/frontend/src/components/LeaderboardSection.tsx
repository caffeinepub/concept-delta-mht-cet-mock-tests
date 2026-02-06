import { useGetLeaderboardByTest, useGetOverallLeaderboard, useGetCallerUserProfile } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ShareButtons from './ShareButtons';

interface LeaderboardSectionProps {
  testId?: bigint | null;
  showOverall?: boolean;
}

export default function LeaderboardSection({ testId, showOverall = true }: LeaderboardSectionProps) {
  const { data: testLeaderboard, isLoading: testLoading } = useGetLeaderboardByTest(testId || null);
  const { data: overallLeaderboard, isLoading: overallLoading } = useGetOverallLeaderboard();
  const { data: userProfile } = useGetCallerUserProfile();

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <Badge className="bg-[#FFD700] text-gray-900 font-bold">
          <Trophy className="w-4 h-4 mr-1" />
          1st
        </Badge>
      );
    } else if (rank === 2) {
      return (
        <Badge className="bg-[#C0C0C0] text-gray-900 font-bold">
          <Medal className="w-4 h-4 mr-1" />
          2nd
        </Badge>
      );
    } else if (rank === 3) {
      return (
        <Badge className="bg-[#CD7F32] text-white font-bold">
          <Award className="w-4 h-4 mr-1" />
          3rd
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="font-semibold">
        #{rank}
      </Badge>
    );
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString();
  };

  const isCurrentUser = (userId: string) => {
    return userProfile && userProfile.id.toString() === userId;
  };

  if (!showOverall && !testId) {
    return null;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2 text-text-primary">
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFD700]" />
          Leaderboard
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm text-text-secondary">
          Top performers and rankings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={testId ? "test" : "overall"} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto bg-muted">
            {testId && (
              <TabsTrigger value="test" className="text-xs sm:text-sm py-2">
                This Test
              </TabsTrigger>
            )}
            {showOverall && (
              <TabsTrigger value="overall" className="text-xs sm:text-sm py-2">
                Overall Rankings
              </TabsTrigger>
            )}
          </TabsList>

          {testId && (
            <TabsContent value="test" className="space-y-4 mt-4">
              {testLoading ? (
                <div className="text-center py-8 text-text-muted">
                  <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Loading leaderboard...</p>
                </div>
              ) : !testLeaderboard || testLeaderboard.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No rankings yet. Be the first to take this test!</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {testLeaderboard.map((entry) => (
                      <Card
                        key={entry.userProfile.id.toString()}
                        className={`${
                          isCurrentUser(entry.userProfile.id.toString())
                            ? 'bg-primary/10 border-primary'
                            : 'bg-muted/30 border-border'
                        }`}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                {getRankBadge(Number(entry.rank))}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm sm:text-base text-text-primary truncate">
                                  {entry.userProfile.fullName}
                                  {isCurrentUser(entry.userProfile.id.toString()) && (
                                    <span className="text-xs text-primary ml-2">(You)</span>
                                  )}
                                </p>
                                <p className="text-xs text-text-muted">
                                  {formatDate(entry.submittedAt)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-lg sm:text-xl font-bold text-success">
                                {Math.round(entry.score)}%
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          )}

          {showOverall && (
            <TabsContent value="overall" className="space-y-4 mt-4">
              {overallLoading ? (
                <div className="text-center py-8 text-text-muted">
                  <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Loading overall rankings...</p>
                </div>
              ) : !overallLeaderboard || overallLeaderboard.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No overall rankings yet. Start taking tests!</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {overallLeaderboard.map((entry) => (
                      <Card
                        key={entry.userProfile.id.toString()}
                        className={`${
                          isCurrentUser(entry.userProfile.id.toString())
                            ? 'bg-primary/10 border-primary'
                            : 'bg-muted/30 border-border'
                        }`}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                {getRankBadge(Number(entry.rank))}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm sm:text-base text-text-primary truncate">
                                  {entry.userProfile.fullName}
                                  {isCurrentUser(entry.userProfile.id.toString()) && (
                                    <span className="text-xs text-primary ml-2">(You)</span>
                                  )}
                                </p>
                                <p className="text-xs text-text-muted">
                                  {entry.totalAttempts.toString()} test{Number(entry.totalAttempts) !== 1 ? 's' : ''} taken
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-lg sm:text-xl font-bold text-success">
                                {Math.round(entry.averageScore)}%
                              </p>
                              <p className="text-xs text-text-muted">avg</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* Share Buttons */}
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-text-secondary mb-3">Share with friends:</p>
          <ShareButtons />
        </div>
      </CardContent>
    </Card>
  );
}
