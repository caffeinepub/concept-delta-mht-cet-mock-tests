import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ProfileSetup() {
  const { identity } = useInternetIdentity();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!mobileNumber.trim() || mobileNumber.length < 10) {
      toast.error('Please enter a valid mobile number');
      return;
    }

    if (!identity) {
      toast.error('Not authenticated');
      return;
    }

    try {
      await saveProfile.mutateAsync({
        id: identity.getPrincipal(),
        fullName: fullName.trim(),
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        testAttempts: [],
        createdAt: BigInt(Date.now() * 1000000),
        lastLogin: BigInt(Date.now() * 1000000),
        isYouTubeVerified: false,
        youtubeVerificationTimestamp: undefined,
        isBlocked: false,
        blockTimestamp: undefined,
      });
      toast.success('Profile created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create profile');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4 sm:p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3 sm:space-y-4">
          <div className="mx-auto mb-2 sm:mb-4 w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-full flex items-center justify-center">
            <span className="text-3xl sm:text-4xl font-bold text-primary-foreground">Δ</span>
          </div>
          <CardTitle className="text-xl sm:text-2xl md:text-3xl">Welcome to Concept Delta</CardTitle>
          <CardDescription className="text-sm sm:text-base">Complete your profile to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm sm:text-base">Full Name *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-11 sm:h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-sm sm:text-base">Mobile Number *</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="10-digit mobile number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                required
                maxLength={10}
                className="h-11 sm:h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 sm:h-12 text-base"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 sm:h-14 text-base sm:text-lg touch-target"
              disabled={saveProfile.isPending}
            >
              {saveProfile.isPending ? 'Creating Profile...' : 'Complete Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
