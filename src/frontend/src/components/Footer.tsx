import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container py-6 sm:py-8 md:py-10">
        <div className="space-y-4 md:space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm md:text-base">
            <p className="text-center sm:text-left font-medium">
              © Concept Delta — Only for MHT-CET Aspirants
            </p>
            <p className="flex items-center gap-1 sm:gap-1.5 text-center text-muted-foreground">
              Built with <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 fill-red-500" /> using{' '}
              <a
                href="https://caffeine.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-foreground transition-colors underline"
              >
                caffeine.ai
              </a>
            </p>
          </div>
          <div className="border-t pt-3 sm:pt-4 md:pt-5 space-y-2 text-[10px] sm:text-xs md:text-sm text-muted-foreground text-center">
            <p>
              Mentored by a COEP Technological University alumnus/student (Not affiliated with COEP)
            </p>
            <p className="max-w-3xl mx-auto px-4">
              <strong>Disclaimer:</strong> Concept Delta is an independent educational platform and is not affiliated with or endorsed by COEP Technological University.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

