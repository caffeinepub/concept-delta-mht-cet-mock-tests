import { useState, useMemo } from 'react';
import { useGetAllUsersWithTestAttempts, useBlockUser, useUnblockUser, useGetOrderedTestConfigs } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Search, Users, TrendingUp, Clock, Award, ChevronUp, ChevronDown, Eye, Ban, CheckCircle, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import type { UserProfile, TestAttempt, TestConfig, TestType } from '../backend';

type SortField = 'fullName' | 'email' | 'mobileNumber' | 'testCount' | 'avgScore' | 'isBlocked';
type SortDirection = 'asc' | 'desc';

interface UserWithStats extends UserProfile {
  testCount: number;
  avgScore: number;
  totalTimeTaken: number;
}

export default function UserManagement() {
  const { data: usersData, isLoading, error } = useGetAllUsersWithTestAttempts();
  const { data: testConfigs } = useGetOrderedTestConfigs();
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('fullName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
  const [userToBlock, setUserToBlock] = useState<UserWithStats | null>(null);
  const [userToUnblock, setUserToUnblock] = useState<UserWithStats | null>(null);
  const [filterBlocked, setFilterBlocked] = useState<'all' | 'active' | 'blocked'>('all');
  
  // New filter states
  const [filterTestName, setFilterTestName] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterScoreMin, setFilterScoreMin] = useState<string>('');
  const [filterScoreMax, setFilterScoreMax] = useState<string>('');

  // Process user data with statistics
  const usersWithStats: UserWithStats[] = useMemo(() => {
    if (!usersData) return [];

    return usersData.map(([profile, attempts]) => {
      const testCount = attempts.length;
      const avgScore = testCount > 0
        ? attempts.reduce((sum, attempt) => sum + attempt.score, 0) / testCount
        : 0;
      const totalTimeTaken = attempts.reduce((sum, attempt) => sum + Number(attempt.timeTaken), 0);

      return {
        ...profile,
        testCount,
        avgScore,
        totalTimeTaken,
      };
    });
  }, [usersData]);

  // Get unique test names for filter
  const uniqueTestNames = useMemo(() => {
    if (!testConfigs) return [];
    return testConfigs.map(test => ({ id: test.id, name: test.name }));
  }, [testConfigs]);

  // Filter users based on all criteria
  const filteredUsers = useMemo(() => {
    let filtered = usersWithStats;

    // Apply block status filter
    if (filterBlocked === 'active') {
      filtered = filtered.filter(user => !user.isBlocked);
    } else if (filterBlocked === 'blocked') {
      filtered = filtered.filter(user => user.isBlocked);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.fullName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.mobileNumber.includes(query)
      );
    }

    // Apply test name filter
    if (filterTestName !== 'all' && usersData) {
      const testId = BigInt(filterTestName);
      filtered = filtered.filter(user => {
        const userAttempts = usersData.find(([profile]) => profile.id.toString() === user.id.toString())?.[1] || [];
        return userAttempts.some(attempt => attempt.testId === testId);
      });
    }

    // Apply class filter
    if (filterClass !== 'all' && testConfigs) {
      const classTestIds = testConfigs
        .filter(test => {
          if (filterClass === 'class11') return test.testType === 'class11';
          if (filterClass === 'class12') return test.testType === 'class12';
          if (filterClass === 'completeSyllabus') return test.testType === 'completeSyllabus';
          return false;
        })
        .map(test => test.id);

      if (usersData) {
        filtered = filtered.filter(user => {
          const userAttempts = usersData.find(([profile]) => profile.id.toString() === user.id.toString())?.[1] || [];
          return userAttempts.some(attempt => classTestIds.some(id => id === attempt.testId));
        });
      }
    }

    // Apply score range filter
    const minScore = filterScoreMin ? parseFloat(filterScoreMin) : null;
    const maxScore = filterScoreMax ? parseFloat(filterScoreMax) : null;
    
    if (minScore !== null || maxScore !== null) {
      filtered = filtered.filter(user => {
        if (minScore !== null && user.avgScore < minScore) return false;
        if (maxScore !== null && user.avgScore > maxScore) return false;
        return true;
      });
    }

    return filtered;
  }, [usersWithStats, searchQuery, filterBlocked, filterTestName, filterClass, filterScoreMin, filterScoreMax, usersData, testConfigs]);

  // Sort users
  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers];

    sorted.sort((a, b) => {
      let aValue: string | number | boolean;
      let bValue: string | number | boolean;

      switch (sortField) {
        case 'fullName':
          aValue = a.fullName.toLowerCase();
          bValue = b.fullName.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'mobileNumber':
          aValue = a.mobileNumber;
          bValue = b.mobileNumber;
          break;
        case 'testCount':
          aValue = a.testCount;
          bValue = b.testCount;
          break;
        case 'avgScore':
          aValue = a.avgScore;
          bValue = b.avgScore;
          break;
        case 'isBlocked':
          aValue = a.isBlocked ? 1 : 0;
          bValue = b.isBlocked ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredUsers, sortField, sortDirection]);

  // Calculate analytics for charts
  const analyticsData = useMemo(() => {
    if (!usersData || !testConfigs) return null;

    // Per-test analytics
    const perTestStats = testConfigs.map(test => {
      const testAttempts = usersData
        .flatMap(([profile, attempts]) => 
          attempts
            .filter(a => a.testId === test.id && !profile.isBlocked)
            .map(a => ({ ...a, userName: profile.fullName }))
        );

      const avgScore = testAttempts.length > 0
        ? testAttempts.reduce((sum, a) => sum + a.score, 0) / testAttempts.length
        : 0;

      return {
        testName: test.name,
        participantCount: testAttempts.length,
        avgScore: avgScore.toFixed(1),
      };
    });

    // Overall average
    const allScores = usersData
      .filter(([profile]) => !profile.isBlocked)
      .flatMap(([, attempts]) => attempts.map(a => a.score));
    
    const overallAvg = allScores.length > 0
      ? (allScores.reduce((sum, score) => sum + score, 0) / allScores.length).toFixed(1)
      : '0.0';

    return {
      perTestStats,
      overallAvg,
      totalAttempts: allScores.length,
    };
  }, [usersData, testConfigs]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleViewDetails = (user: UserWithStats) => {
    setSelectedUser(user);
    setDetailsDialogOpen(true);
  };

  const handleBlockUser = (user: UserWithStats) => {
    setUserToBlock(user);
    setBlockDialogOpen(true);
  };

  const handleUnblockUser = (user: UserWithStats) => {
    setUserToUnblock(user);
    setUnblockDialogOpen(true);
  };

  const confirmBlockUser = async () => {
    if (!userToBlock) return;

    try {
      await blockUser.mutateAsync(userToBlock.id);
      toast.success(`User "${userToBlock.fullName}" has been blocked`);
      setBlockDialogOpen(false);
      setUserToBlock(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to block user');
    }
  };

  const confirmUnblockUser = async () => {
    if (!userToUnblock) return;

    try {
      await unblockUser.mutateAsync(userToUnblock.id);
      toast.success(`User "${userToUnblock.fullName}" has been unblocked`);
      setUnblockDialogOpen(false);
      setUserToUnblock(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to unblock user');
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  const handleClearFilters = () => {
    setFilterTestName('all');
    setFilterClass('all');
    setFilterScoreMin('');
    setFilterScoreMax('');
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl text-text-primary">User Management</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-text-secondary">
            Loading user data...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl text-text-primary">User Management</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-text-secondary">
            Error loading user data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="w-12 h-12 text-destructive mb-4" />
            <p className="text-text-secondary">Failed to load user data</p>
            <p className="text-xs text-text-muted mt-2">Please try refreshing the page</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const blockedCount = usersWithStats.filter(u => u.isBlocked).length;
  const activeCount = usersWithStats.filter(u => !u.isBlocked).length;

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl text-text-primary">User Management & Analytics</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-text-secondary">
                  View and manage user data with advanced filtering ({sortedUsers.length} users shown)
                </CardDescription>
              </div>
            </div>

            {/* Analytics Section */}
            {analyticsData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Overall Average Score
                  </h4>
                  <div className="text-3xl font-bold text-primary">{analyticsData.overallAvg}</div>
                  <p className="text-xs text-text-secondary mt-1">
                    Based on {analyticsData.totalAttempts} total attempts
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text-primary mb-2">Per-Test Averages</h4>
                  <ScrollArea className="h-24">
                    <div className="space-y-1">
                      {analyticsData.perTestStats.slice(0, 5).map((stat, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-text-secondary truncate flex-1">{stat.testName}</span>
                          <span className="font-medium text-text-primary ml-2">
                            {stat.avgScore} ({stat.participantCount})
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>

              <Select value={filterTestName} onValueChange={setFilterTestName}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filter by test" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tests</SelectItem>
                  {uniqueTestNames.map(test => (
                    <SelectItem key={test.id.toString()} value={test.id.toString()}>
                      {test.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="class11">Class 11</SelectItem>
                  <SelectItem value="class12">Class 12</SelectItem>
                  <SelectItem value="completeSyllabus">Complete Syllabus</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min score"
                  value={filterScoreMin}
                  onChange={(e) => setFilterScoreMin(e.target.value)}
                  className="h-10"
                  min="0"
                  max="100"
                />
                <Input
                  type="number"
                  placeholder="Max score"
                  value={filterScoreMax}
                  onChange={(e) => setFilterScoreMax(e.target.value)}
                  className="h-10"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            {/* Status Filters and Clear */}
            <div className="flex flex-wrap gap-2 items-center">
              <Button
                variant={filterBlocked === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBlocked('all')}
              >
                All ({usersWithStats.length})
              </Button>
              <Button
                variant={filterBlocked === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBlocked('active')}
              >
                Active ({activeCount})
              </Button>
              <Button
                variant={filterBlocked === 'blocked' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBlocked('blocked')}
              >
                Blocked ({blockedCount})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="ml-auto"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {sortedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-text-muted mb-4" />
              <p className="text-text-secondary">
                {searchQuery || filterTestName !== 'all' || filterClass !== 'all' || filterScoreMin || filterScoreMax
                  ? 'No users found matching your filters'
                  : 'No users in this category'}
              </p>
              <p className="text-xs text-text-muted mt-2">
                {searchQuery || filterTestName !== 'all' || filterClass !== 'all' || filterScoreMin || filterScoreMax
                  ? 'Try adjusting your filters'
                  : 'Users will appear here once they register'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <ScrollArea className="h-[600px] rounded-lg border border-border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted z-10">
                      <TableRow>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => handleSort('fullName')}
                        >
                          Full Name <SortIcon field="fullName" />
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => handleSort('email')}
                        >
                          Email <SortIcon field="email" />
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => handleSort('mobileNumber')}
                        >
                          Contact <SortIcon field="mobileNumber" />
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/80 transition-colors text-center"
                          onClick={() => handleSort('testCount')}
                        >
                          Tests <SortIcon field="testCount" />
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/80 transition-colors text-center"
                          onClick={() => handleSort('avgScore')}
                        >
                          Avg Score <SortIcon field="avgScore" />
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/80 transition-colors text-center"
                          onClick={() => handleSort('isBlocked')}
                        >
                          Status <SortIcon field="isBlocked" />
                        </TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedUsers.map((user) => (
                        <TableRow 
                          key={user.id.toString()} 
                          className={`hover:bg-muted/50 ${user.isBlocked ? 'opacity-60 bg-destructive/5' : ''}`}
                        >
                          <TableCell className="font-medium text-text-primary">
                            {user.fullName}
                            {user.isBlocked && (
                              <Badge variant="destructive" className="ml-2 text-xs">
                                Blocked
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-text-secondary text-sm">
                            {user.email || 'N/A'}
                          </TableCell>
                          <TableCell className="text-text-secondary text-sm">
                            {user.mobileNumber || 'N/A'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="text-xs">
                              {user.testCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={user.avgScore >= 70 ? 'default' : user.avgScore >= 50 ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {user.avgScore.toFixed(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {user.isBlocked ? (
                              <Badge variant="destructive" className="text-xs">
                                <Ban className="w-3 h-3 mr-1" />
                                Blocked
                              </Badge>
                            ) : (
                              <Badge variant="default" className="text-xs bg-success">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(user)}
                                className="gap-1"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {user.isBlocked ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnblockUser(user)}
                                  className="gap-1 text-success hover:text-success"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleBlockUser(user)}
                                  className="gap-1 text-destructive hover:text-destructive"
                                >
                                  <Ban className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              {/* Mobile/Tablet Card View */}
              <div className="lg:hidden">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {sortedUsers.map((user) => (
                      <Card 
                        key={user.id.toString()} 
                        className={`bg-muted/30 border-border ${user.isBlocked ? 'opacity-75 border-destructive/50' : ''}`}
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-text-primary truncate">
                                {user.fullName}
                              </h4>
                              <p className="text-xs text-text-secondary truncate">{user.email || 'N/A'}</p>
                              <p className="text-xs text-text-muted">{user.mobileNumber || 'N/A'}</p>
                            </div>
                            {user.isBlocked ? (
                              <Badge variant="destructive" className="text-xs flex-shrink-0">
                                <Ban className="w-3 h-3 mr-1" />
                                Blocked
                              </Badge>
                            ) : (
                              <Badge variant="default" className="text-xs bg-success flex-shrink-0">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-text-muted" />
                              <span className="text-xs text-text-secondary">{user.testCount} tests</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-text-muted" />
                              <span className="text-xs text-text-secondary">
                                Avg: {user.avgScore.toFixed(1)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(user)}
                              className="flex-1 gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                            {user.isBlocked ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnblockUser(user)}
                                className="flex-1 gap-1 text-success hover:text-success"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Unblock
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBlockUser(user)}
                                className="flex-1 gap-1 text-destructive hover:text-destructive"
                              >
                                <Ban className="w-4 h-4" />
                                Block
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-text-primary">User Performance Details</DialogTitle>
            <DialogDescription className="text-sm text-text-secondary">
              Detailed analytics for {selectedUser?.fullName}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6 mt-4">
              {/* User Info */}
              <Card className="bg-muted/30 border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-text-primary">User Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Full Name:</span>
                    <span className="font-medium text-text-primary">{selectedUser.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Email:</span>
                    <span className="font-medium text-text-primary">{selectedUser.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Contact:</span>
                    <span className="font-medium text-text-primary">{selectedUser.mobileNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Status:</span>
                    {selectedUser.isBlocked ? (
                      <Badge variant="destructive" className="text-xs">
                        <Ban className="w-3 h-3 mr-1" />
                        Blocked
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-xs bg-success">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Registered:</span>
                    <span className="font-medium text-text-primary">
                      {formatDate(selectedUser.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Last Login:</span>
                    <span className="font-medium text-text-primary">
                      {formatDate(selectedUser.lastLogin)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" />
                      <CardDescription className="text-xs text-text-secondary">Tests Taken</CardDescription>
                    </div>
                    <CardTitle className="text-2xl text-primary">{selectedUser.testCount}</CardTitle>
                  </CardHeader>
                </Card>

                <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-success" />
                      <CardDescription className="text-xs text-text-secondary">Avg Score</CardDescription>
                    </div>
                    <CardTitle className="text-2xl text-success">
                      {selectedUser.avgScore.toFixed(1)}
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card className="bg-gradient-to-br from-info/10 to-info/5 border-info/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-info" />
                      <CardDescription className="text-xs text-text-secondary">Total Time</CardDescription>
                    </div>
                    <CardTitle className="text-2xl text-info">
                      {formatTime(selectedUser.totalTimeTaken)}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Test Attempts */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-text-primary">Test Attempts</CardTitle>
                  <CardDescription className="text-xs text-text-secondary">
                    Recent test performance history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedUser.testAttempts.length === 0 ? (
                    <p className="text-sm text-text-secondary text-center py-4">No test attempts yet</p>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {selectedUser.testAttempts.map((attempt, index) => (
                          <Card key={index} className="bg-muted/30 border-border">
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">
                                  Test ID: {attempt.testId.toString()}
                                </Badge>
                                <Badge
                                  variant={
                                    attempt.score >= 70 ? 'default' : attempt.score >= 50 ? 'secondary' : 'outline'
                                  }
                                  className="text-xs"
                                >
                                  Score: {attempt.score.toFixed(1)}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-xs text-text-secondary">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatTime(Number(attempt.timeTaken))}</span>
                                </div>
                                <span>{formatDate(attempt.submittedAt)}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Block Confirmation Dialog */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to block "{userToBlock?.fullName}"? This user will not be able to log in or take tests.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBlockUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Block User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unblock Confirmation Dialog */}
      <AlertDialog open={unblockDialogOpen} onOpenChange={setUnblockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unblock "{userToUnblock?.fullName}"? This user will be able to log in and take tests again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnblockUser}>
              Unblock User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
