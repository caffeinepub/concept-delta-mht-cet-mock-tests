/**
 * Utility for exporting questions to PDF with MathJax support and fallback rendering
 */

import type { Question } from '../backend';

// Strip HTML tags and decode entities for plain text fallback
function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// Load external script dynamically
function loadScript(src: string): Promise<void> {
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
}

// Wait for MathJax to be ready and typeset content
async function ensureMathJaxReady(element?: HTMLElement): Promise<void> {
  if (!window.MathJax) return;
  
  try {
    await window.MathJax.startup.promise;
    if (element) {
      await window.MathJax.typesetPromise([element]);
      // Give extra time for rendering to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error) {
    console.warn('MathJax typesetting warning:', error);
  }
}

// Render HTML element to canvas with retry logic
async function renderToCanvas(element: HTMLElement, retries = 2): Promise<HTMLCanvasElement | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // @ts-ignore - html2canvas loaded from CDN
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        foreignObjectRendering: false,
        imageTimeout: 5000,
        removeContainer: false,
      });
      
      // Verify canvas has content
      if (canvas && canvas.width > 0 && canvas.height > 0) {
        return canvas;
      }
    } catch (error) {
      console.warn(`Canvas render attempt ${attempt + 1} failed:`, error);
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }
  return null;
}

// Create offscreen container for rendering
function createOffscreenContainer(content: string, width = 800, backgroundColor = '#ffffff'): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: ${width}px;
    padding: 20px;
    background-color: ${backgroundColor};
    font-size: 16px;
    line-height: 1.6;
    font-family: Arial, Helvetica, sans-serif;
    color: #000000;
    visibility: visible;
    opacity: 1;
  `;
  container.innerHTML = content;
  document.body.appendChild(container);
  return container;
}

// Add text with word wrapping as fallback
function addTextWithWrapping(pdf: any, text: string, x: number, y: number, maxWidth: number, lineHeight = 6): number {
  const lines = pdf.splitTextToSize(text, maxWidth);
  pdf.text(lines, x, y);
  return y + (lines.length * lineHeight);
}

// Add header and footer to PDF page
async function addHeaderAndFooter(pdf: any, pageNum: number, totalPages: number): Promise<void> {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;

  // Add banner image at top
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
    const bannerWidth = pageWidth - (2 * margin);
    const bannerX = margin;
    const bannerY = 8;
    
    pdf.addImage(bannerImg, 'JPEG', bannerX, bannerY, bannerWidth, bannerHeight);
    
    // Add tagline below banner
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(25, 46, 91);
    const tagline = 'This test created by COEPian';
    const taglineWidth = pdf.getTextWidth(tagline);
    pdf.text(tagline, (pageWidth - taglineWidth) / 2, bannerY + bannerHeight + 5);
    
  } catch (error) {
    console.error('Failed to add banner:', error);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(25, 46, 91);
    const fallbackText = 'Concept Delta - This test created by COEPian';
    const fallbackWidth = pdf.getTextWidth(fallbackText);
    pdf.text(fallbackText, (pageWidth - fallbackWidth) / 2, 15);
  }

  // Add footer with Telegram link
  const footerY = pageHeight - 18;
  
  pdf.setFillColor(25, 46, 91);
  pdf.roundedRect(margin, footerY - 2, pageWidth - (2 * margin), 12, 2, 2, 'F');
  
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
  const pageText = `Page ${pageNum} of ${totalPages}`;
  const pageTextWidth = pdf.getTextWidth(pageText);
  pdf.text(pageText, (pageWidth - pageTextWidth) / 2, pageHeight - 5);
}

// Render content block (question text, option, or explanation) with fallback
async function renderContentBlock(
  pdf: any,
  content: string,
  yPosition: number,
  margin: number,
  contentWidth: number,
  pageHeight: number,
  footerHeight: number,
  backgroundColor = '#ffffff',
  prefix = ''
): Promise<number> {
  let newY = yPosition;
  
  // Try canvas rendering first
  const container = createOffscreenContainer(
    prefix ? `<strong>${prefix}</strong> ${content}` : content,
    750,
    backgroundColor
  );
  
  try {
    await ensureMathJaxReady(container);
    const canvas = await renderToCanvas(container);
    
    if (canvas) {
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height / canvas.width) * imgWidth;
      
      // Check if we need a new page
      if (newY + imgHeight > pageHeight - footerHeight) {
        pdf.addPage();
        newY = 45; // headerHeight
      }
      
      pdf.addImage(imgData, 'PNG', margin, newY, imgWidth, imgHeight);
      newY += imgHeight + 5;
      document.body.removeChild(container);
      return newY;
    }
  } catch (error) {
    console.warn('Canvas rendering failed, using text fallback:', error);
  }
  
  // Fallback to plain text rendering
  document.body.removeChild(container);
  
  const plainText = stripHtml(content);
  if (plainText.trim()) {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    
    if (prefix) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(prefix, margin, newY);
      newY += 6;
      pdf.setFont('helvetica', 'normal');
    }
    
    newY = addTextWithWrapping(pdf, plainText, margin, newY, contentWidth, 6);
    newY += 5;
  }
  
  return newY;
}

export async function generateQuestionsPDF(
  questions: Question[],
  testName: string
): Promise<void> {
  // Load required libraries
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');

  // Wait for MathJax to be ready
  await ensureMathJaxReady();

  // @ts-ignore - jsPDF loaded from CDN
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  const headerHeight = 45;
  const footerHeight = 25;
  let yPosition = headerHeight;

  // Use Helvetica font
  pdf.setFont('helvetica', 'normal');

  // First page - Title page with banner
  try {
    const bannerImg = new Image();
    bannerImg.crossOrigin = 'anonymous';
    bannerImg.src = '/assets/photo_2026-01-08_11-34-29-2.jpg';
    
    await new Promise((resolve, reject) => {
      bannerImg.onload = resolve;
      bannerImg.onerror = reject;
      setTimeout(reject, 3000);
    });
    
    const bannerHeight = 30;
    const bannerWidth = pageWidth - (2 * margin);
    pdf.addImage(bannerImg, 'JPEG', margin, 10, bannerWidth, bannerHeight);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(25, 46, 91);
    const tagline = 'This test created by COEPian';
    const taglineWidth = pdf.getTextWidth(tagline);
    pdf.text(tagline, (pageWidth - taglineWidth) / 2, 10 + bannerHeight + 6);
    
    yPosition = 10 + bannerHeight + 15;
  } catch (error) {
    console.error('Failed to load banner:', error);
    yPosition = headerHeight;
  }

  // Add Title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(25, 46, 91);
  const title = 'Concept Delta - Question Bank';
  const titleWidth = pdf.getTextWidth(title);
  pdf.text(title, (pageWidth - titleWidth) / 2, yPosition);
  yPosition += 12;

  // Add Test Name
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  const testNameLines = pdf.splitTextToSize(testName, contentWidth);
  pdf.text(testNameLines, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += testNameLines.length * 7 + 15;

  // Add Telegram Channel Section
  const telegramBoxY = yPosition;
  const telegramBoxHeight = 30;
  
  pdf.setFillColor(25, 46, 91);
  pdf.roundedRect(margin, telegramBoxY, contentWidth, telegramBoxHeight, 3, 3, 'F');
  
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  const telegramTitle = 'Join Our Telegram Channel for Explanation PDFs';
  const telegramTitleWidth = pdf.getTextWidth(telegramTitle);
  pdf.text(telegramTitle, (pageWidth - telegramTitleWidth) / 2, telegramBoxY + 10);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const subtitle = 'Get detailed explanations and study materials';
  const subtitleWidth = pdf.getTextWidth(subtitle);
  pdf.text(subtitle, (pageWidth - subtitleWidth) / 2, telegramBoxY + 18);
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  const linkText = 'Click here to join';
  const linkWidth = pdf.getTextWidth(linkText);
  const linkX = (pageWidth - linkWidth) / 2;
  const linkY = telegramBoxY + 25;
  
  pdf.text(linkText, linkX, linkY);
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.3);
  pdf.line(linkX, linkY + 0.5, linkX + linkWidth, linkY + 0.5);
  
  pdf.link(linkX - 2, linkY - 3, linkWidth + 4, 5, { url: 'https://t.me/conceptdelta' });

  // Process each question
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    
    // Start new page for each question
    pdf.addPage();
    yPosition = headerHeight;

    // Question Number and Metadata
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(25, 46, 91);
    pdf.text(`Question ${i + 1}`, margin, yPosition);
    yPosition += 8;

    // Subject, Chapter, Difficulty
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    const metadata = `${question.subject} | ${question.chapter} | ${question.difficulty}`;
    pdf.text(metadata, margin, yPosition);
    yPosition += 10;

    // Render Question Text
    if (question.questionText && question.questionText.trim()) {
      yPosition = await renderContentBlock(
        pdf,
        question.questionText,
        yPosition,
        margin,
        contentWidth,
        pageHeight,
        footerHeight,
        '#ffffff'
      );
    }

    // Question Image
    if (question.image) {
      try {
        const imgUrl = question.image.getDirectURL();
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imgUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          setTimeout(reject, 3000);
        });

        const maxImgWidth = contentWidth;
        const maxImgHeight = 70;
        let imgWidth = maxImgWidth;
        let imgHeight = (img.height / img.width) * imgWidth;
        
        if (imgHeight > maxImgHeight) {
          imgHeight = maxImgHeight;
          imgWidth = (img.width / img.height) * imgHeight;
        }

        if (yPosition + imgHeight > pageHeight - footerHeight) {
          pdf.addPage();
          yPosition = headerHeight;
        }

        pdf.addImage(img, 'JPEG', margin, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 8;
      } catch (error) {
        console.error('Failed to load question image:', error);
      }
    }

    // Check if we need new page for options
    if (yPosition > pageHeight - footerHeight - 60) {
      pdf.addPage();
      yPosition = headerHeight;
    }

    // Options
    for (let j = 0; j < question.options.length; j++) {
      const option = question.options[j];
      const isCorrect = Number(question.correctAnswer) === j;

      if (yPosition > pageHeight - footerHeight - 20) {
        pdf.addPage();
        yPosition = headerHeight;
      }

      // Option background for correct answer
      if (isCorrect) {
        pdf.setFillColor(220, 252, 231);
        pdf.roundedRect(margin, yPosition - 3, contentWidth, 12, 2, 2, 'F');
      }

      // Render option text
      if (option.text && option.text.trim()) {
        yPosition = await renderContentBlock(
          pdf,
          option.text,
          yPosition,
          margin,
          contentWidth - 5,
          pageHeight,
          footerHeight,
          isCorrect ? '#dcfce7' : '#ffffff',
          `${j + 1}.`
        );
      } else if (option.image) {
        // Image-only option: show only the number prefix
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${j + 1}.`, margin + 2, yPosition);
        yPosition += 6;
      }

      // Option image
      if (option.image) {
        try {
          const imgUrl = option.image.getDirectURL();
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = imgUrl;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            setTimeout(reject, 3000);
          });

          const maxImgWidth = contentWidth - 10;
          const maxImgHeight = 40;
          let imgWidth = maxImgWidth;
          let imgHeight = (img.height / img.width) * imgWidth;
          
          if (imgHeight > maxImgHeight) {
            imgHeight = maxImgHeight;
            imgWidth = (img.width / img.height) * imgHeight;
          }

          if (yPosition + imgHeight > pageHeight - footerHeight) {
            pdf.addPage();
            yPosition = headerHeight;
          }

          pdf.addImage(img, 'JPEG', margin + 5, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 3;
        } catch (error) {
          console.error('Failed to load option image:', error);
        }
      }

      // Correct answer indicator
      if (isCorrect) {
        pdf.setFontSize(8);
        pdf.setTextColor(22, 163, 74);
        pdf.setFont('helvetica', 'bold');
        pdf.text('✓ Correct Answer', margin + 3, yPosition);
        yPosition += 5;
      }
    }

    yPosition += 5;

    // Explanation
    if (question.explanation && question.explanation.trim()) {
      if (yPosition > pageHeight - footerHeight - 30) {
        pdf.addPage();
        yPosition = headerHeight;
      }

      // Add explanation label
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(59, 130, 246);
      pdf.text('Explanation:', margin, yPosition);
      yPosition += 6;

      yPosition = await renderContentBlock(
        pdf,
        question.explanation,
        yPosition,
        margin,
        contentWidth,
        pageHeight,
        footerHeight,
        '#f0f9ff'
      );
    }
  }

  // Add header and footer to all pages
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    await addHeaderAndFooter(pdf, i, totalPages);
  }

  // Save the PDF
  const fileName = `${testName.replace(/[^a-z0-9]/gi, '_')}_Questions.pdf`;
  pdf.save(fileName);
}
