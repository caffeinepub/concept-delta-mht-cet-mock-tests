import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { UserProfile, TestAttempt, TestConfig } from '../backend';

interface PerTestResultPDFExportProps {
  test: TestConfig;
  usersWithAttempts: Array<[UserProfile, TestAttempt[]]>;
}

export default function PerTestResultPDFExport({ test, usersWithAttempts }: PerTestResultPDFExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  };

  const handleExportPDF = async () => {
    if (!usersWithAttempts || usersWithAttempts.length === 0) {
      toast.error('No user data available for this test');
      return;
    }

    // Filter users who attempted this specific test
    const testParticipants = usersWithAttempts
      .map(([userProfile, attempts]) => {
        const testAttempt = attempts.find(a => a.testId === test.id);
        return testAttempt ? { userProfile, attempt: testAttempt } : null;
      })
      .filter((item): item is { userProfile: UserProfile; attempt: TestAttempt } => item !== null);

    if (testParticipants.length === 0) {
      toast.error('No participants found for this test');
      return;
    }

    setIsGenerating(true);

    try {
      // Load jsPDF library
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

      // @ts-ignore - jsPDF loaded from CDN
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Add banner
      try {
        const bannerImg = new Image();
        bannerImg.crossOrigin = 'anonymous';
        bannerImg.src = '/assets/photo_2026-01-08_11-34-29-2.jpg';

        await new Promise((resolve, reject) => {
          bannerImg.onload = resolve;
          bannerImg.onerror = reject;
          setTimeout(reject, 3000);
        });

        const bannerHeight = 25;
        const bannerWidth = contentWidth;
        pdf.addImage(bannerImg, 'JPEG', margin, yPosition, bannerWidth, bannerHeight);
        yPosition += bannerHeight + 5;

        // Add tagline
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(25, 46, 91);
        const tagline = 'This test created by COEPian';
        const taglineWidth = pdf.getTextWidth(tagline);
        pdf.text(tagline, (pageWidth - taglineWidth) / 2, yPosition);
        yPosition += 10;
      } catch (error) {
        console.error('Failed to add banner:', error);
        yPosition = margin + 10;
      }

      // Title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(25, 46, 91);
      const title = `Test Results: ${test.name}`;
      const titleWidth = pdf.getTextWidth(title);
      pdf.text(title, (pageWidth - titleWidth) / 2, yPosition);
      yPosition += 12;

      // Test details
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      const detailsText = `Subject: ${test.subject} | Duration: ${test.durationMinutes.toString()} min | Total Questions: ${test.totalQuestions.toString()}`;
      const detailsWidth = pdf.getTextWidth(detailsText);
      pdf.text(detailsText, (pageWidth - detailsWidth) / 2, yPosition);
      yPosition += 8;

      // Date
      const dateText = `Generated on: ${new Date().toLocaleString()}`;
      const dateWidth = pdf.getTextWidth(dateText);
      pdf.text(dateText, (pageWidth - dateWidth) / 2, yPosition);
      yPosition += 15;

      // Table header
      pdf.setFillColor(25, 46, 91);
      pdf.rect(margin, yPosition, contentWidth, 10, 'F');

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('Rank', margin + 3, yPosition + 7);
      pdf.text('Name', margin + contentWidth * 0.15, yPosition + 7);
      pdf.text('Score', margin + contentWidth * 0.7, yPosition + 7);
      pdf.text('Time', margin + contentWidth * 0.85, yPosition + 7);
      yPosition += 12;

      // Sort participants by score (descending)
      const sortedParticipants = [...testParticipants].sort((a, b) => b.attempt.score - a.attempt.score);

      // Table rows
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);

      sortedParticipants.forEach((participant, index) => {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }

        const rank = (index + 1).toString();
        const name = participant.userProfile.fullName;
        const score = participant.attempt.score.toFixed(1);
        const timeMinutes = Math.floor(Number(participant.attempt.timeTaken) / 60);
        const timeSeconds = Number(participant.attempt.timeTaken) % 60;
        const timeText = `${timeMinutes}:${timeSeconds.toString().padStart(2, '0')}`;

        // Alternating row colors
        if (index % 2 === 0) {
          pdf.setFillColor(245, 245, 245);
          pdf.rect(margin, yPosition - 5, contentWidth, 8, 'F');
        }

        pdf.setFontSize(9);
        pdf.text(rank, margin + 3, yPosition);
        pdf.text(name, margin + contentWidth * 0.15, yPosition);
        pdf.text(score, margin + contentWidth * 0.7, yPosition);
        pdf.text(timeText, margin + contentWidth * 0.85, yPosition);
        yPosition += 8;
      });

      // Footer on all pages
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);

        const footerY = pageHeight - 18;

        pdf.setFillColor(25, 46, 91);
        pdf.roundedRect(margin, footerY - 2, contentWidth, 12, 2, 2, 'F');

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        const telegramText = 'Join Our Telegram Channel for Explanation PDFs';
        const telegramWidth = pdf.getTextWidth(telegramText);
        const telegramX = (pageWidth - telegramWidth) / 2;
        const telegramY = footerY + 4;

        pdf.text(telegramText, telegramX, telegramY);

        pdf.setDrawColor(255, 255, 255);
        pdf.setLineWidth(0.3);
        pdf.line(telegramX, telegramY + 0.5, telegramX + telegramWidth, telegramY + 0.5);

        pdf.link(telegramX - 2, telegramY - 4, telegramWidth + 4, 6, { url: 'https://t.me/conceptdelta' });

        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont('helvetica', 'normal');
        const pageText = `Page ${i} of ${totalPages}`;
        const pageTextWidth = pdf.getTextWidth(pageText);
        pdf.text(pageText, (pageWidth - pageTextWidth) / 2, pageHeight - 5);
      }

      // Save PDF
      const fileName = `${test.name.replace(/[^a-z0-9]/gi, '_')}_Results_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast.success(`Result PDF for "${test.name}" downloaded successfully!`);
    } catch (error: any) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleExportPDF}
      disabled={isGenerating}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="hidden sm:inline">Generating...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export Result PDF</span>
          <span className="sm:hidden">Export</span>
        </>
      )}
    </Button>
  );
}
