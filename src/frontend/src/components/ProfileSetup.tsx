import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileSetup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    if (!mobileNumber.trim()) {
      toast.error('Please enter your mobile number');
      return;
    }

    try {
      await saveProfile.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        isYouTubeVerified: false,
        youtubeVerificationTimestamp: null,
        isBlocked: false,
        blockTimestamp: null,
      });
      toast.success('Profile created successfully!');
    } catch (error: any) {
      // Error toast is already shown by the hook's onError handler
      console.error('Profile save error:', error);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Welcome to Concept Delta!</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Please complete your profile to get started with MHT-CET preparation
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 mt-4">
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
            <Label htmlFor="email" className="text-sm sm:text-base">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 sm:h-12 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobileNumber" className="text-sm sm:text-base">Mobile Number *</Label>
            <Input
              id="mobileNumber"
              type="tel"
              placeholder="Enter your mobile number"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              required
              className="h-11 sm:h-12 text-base"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-11 sm:h-12 text-base font-semibold"
            disabled={saveProfile.isPending}
          >
            {saveProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Profile...
              </>
            ) : (
              'Create Profile'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
