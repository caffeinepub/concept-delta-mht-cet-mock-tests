import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { UserProfile, TestAttempt } from '../backend';

interface AverageResultPDFExportProps {
  usersWithAttempts: Array<[UserProfile, TestAttempt[]]>;
}

export default function AverageResultPDFExport({ usersWithAttempts }: AverageResultPDFExportProps) {
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
      toast.error('No user data available to export');
      return;
    }

    // Filter out blocked users
    const activeUsers = usersWithAttempts.filter(([userProfile]) => !userProfile.isBlocked);

    if (activeUsers.length === 0) {
      toast.error('No active users with test attempts');
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
      const title = 'Average Performance Report';
      const titleWidth = pdf.getTextWidth(title);
      pdf.text(title, (pageWidth - titleWidth) / 2, yPosition);
      yPosition += 12;

      // Date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      const dateText = `Generated on: ${new Date().toLocaleString()}`;
      const dateWidth = pdf.getTextWidth(dateText);
      pdf.text(dateText, (pageWidth - dateWidth) / 2, yPosition);
      yPosition += 15;

      // Calculate overall statistics
      const totalUsers = activeUsers.length;
      const totalAttempts = activeUsers.reduce((sum, [, attempts]) => sum + attempts.length, 0);
      const allScores = activeUsers.flatMap(([, attempts]) => attempts.map(a => a.score));
      const averageScore = allScores.length > 0 ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length : 0;
      const maxScore = allScores.length > 0 ? Math.max(...allScores) : 0;
      const minScore = allScores.length > 0 ? Math.min(...allScores) : 0;

      // Calculate subject-wise averages
      const subjectScores: { [key: string]: number[] } = {
        Physics: [],
        Chemistry: [],
        Mathematics: [],
      };

      // Note: We don't have subject information in TestAttempt, so we'll show overall stats
      // In a real implementation, you'd need to fetch test configs to determine subjects

      // Overall Statistics Section
      pdf.setFillColor(25, 46, 91);
      pdf.rect(margin, yPosition, contentWidth, 8, 'F');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('Overall Statistics', margin + 3, yPosition + 6);
      yPosition += 12;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);

      const stats = [
        `Total Active Users: ${totalUsers}`,
        `Total Test Attempts: ${totalAttempts}`,
        `Average Score: ${averageScore.toFixed(2)}`,
        `Highest Score: ${maxScore.toFixed(2)}`,
        `Lowest Score: ${minScore.toFixed(2)}`,
        `Participation Rate: ${totalUsers > 0 ? ((totalAttempts / totalUsers).toFixed(2)) : '0.00'} tests per user`,
      ];

      stats.forEach((stat) => {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(stat, margin + 5, yPosition);
        yPosition += 7;
      });

      yPosition += 8;

      // Score Distribution Section
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFillColor(25, 46, 91);
      pdf.rect(margin, yPosition, contentWidth, 8, 'F');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('Score Distribution', margin + 3, yPosition + 6);
      yPosition += 12;

      // Calculate score ranges
      const scoreRanges = {
        '0-20': 0,
        '21-40': 0,
        '41-60': 0,
        '61-80': 0,
        '81-100': 0,
      };

      allScores.forEach((score) => {
        if (score <= 20) scoreRanges['0-20']++;
        else if (score <= 40) scoreRanges['21-40']++;
        else if (score <= 60) scoreRanges['41-60']++;
        else if (score <= 80) scoreRanges['61-80']++;
        else scoreRanges['81-100']++;
      });

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);

      Object.entries(scoreRanges).forEach(([range, count]) => {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }
        const percentage = allScores.length > 0 ? ((count / allScores.length) * 100).toFixed(1) : '0.0';
        pdf.text(`${range}: ${count} students (${percentage}%)`, margin + 5, yPosition);
        yPosition += 7;
      });

      yPosition += 8;

      // Top Performers Section
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFillColor(25, 46, 91);
      pdf.rect(margin, yPosition, contentWidth, 8, 'F');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('Top 10 Performers (by Average Score)', margin + 3, yPosition + 6);
      yPosition += 12;

      // Calculate average scores for each user
      const userAverages = activeUsers
        .map(([userProfile, attempts]) => ({
          name: userProfile.fullName,
          avgScore: attempts.length > 0 ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length : 0,
          testsTaken: attempts.length,
        }))
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 10);

      // Table header
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPosition, contentWidth, 8, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Rank', margin + 3, yPosition + 6);
      pdf.text('Name', margin + contentWidth * 0.15, yPosition + 6);
      pdf.text('Avg Score', margin + contentWidth * 0.65, yPosition + 6);
      pdf.text('Tests', margin + contentWidth * 0.85, yPosition + 6);
      yPosition += 10;

      pdf.setFont('helvetica', 'normal');
      userAverages.forEach((user, index) => {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }

        if (index % 2 === 0) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(margin, yPosition - 5, contentWidth, 7, 'F');
        }

        pdf.setFontSize(9);
        pdf.text((index + 1).toString(), margin + 3, yPosition);
        pdf.text(user.name, margin + contentWidth * 0.15, yPosition);
        pdf.text(user.avgScore.toFixed(2), margin + contentWidth * 0.65, yPosition);
        pdf.text(user.testsTaken.toString(), margin + contentWidth * 0.85, yPosition);
        yPosition += 7;
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
      const fileName = `Average_Performance_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast.success('Average performance report downloaded successfully!');
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
      disabled={isGenerating || !usersWithAttempts || usersWithAttempts.length === 0}
      variant="default"
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
          <span className="hidden sm:inline">Export Average Results</span>
          <span className="sm:hidden">Avg Results</span>
        </>
      )}
    </Button>
  );
}
