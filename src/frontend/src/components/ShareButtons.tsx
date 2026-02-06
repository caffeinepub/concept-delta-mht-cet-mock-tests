import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SiWhatsapp, SiTelegram } from 'react-icons/si';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareButtons() {
  const websiteUrl = window.location.origin;
  const shareText = "🎓 Prepare for MHT-CET with Concept Delta! Get access to comprehensive mock tests created by a COEPian. Join now:";

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + websiteUrl)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    toast.success('Opening WhatsApp...');
  };

  const handleTelegramShare = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(websiteUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
    toast.success('Opening Telegram...');
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-sm sm:text-base text-text-primary">
                Share with Friends
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary">
                Help your friends prepare for MHT-CET
              </p>
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              onClick={handleWhatsAppShare}
              variant="outline"
              size="sm"
              className="gap-2 flex-1 sm:flex-initial h-11 sm:h-10 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
            >
              <SiWhatsapp className="w-5 h-5" />
              <span className="font-semibold">WhatsApp</span>
            </Button>
            <Button
              onClick={handleTelegramShare}
              variant="outline"
              size="sm"
              className="gap-2 flex-1 sm:flex-initial h-11 sm:h-10 border-[#0088cc] text-[#0088cc] hover:bg-[#0088cc]/10"
            >
              <SiTelegram className="w-5 h-5" />
              <span className="font-semibold">Telegram</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
