import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';

export interface ExportOptions {
  filename?: string;
  format?: 'pdf' | 'png' | 'jpeg';
  quality?: number;
  margin?: number;
  orientation?: 'portrait' | 'landscape';
}

export class TutorialExporter {
  private static defaultOptions: ExportOptions = {
    format: 'pdf',
    quality: 0.98,
    margin: 0.5,
    orientation: 'portrait'
  };

  /**
   * Export a single element as PDF
   */
  static async exportToPDF(element: HTMLElement, options: ExportOptions = {}): Promise<void> {
    const opts = { ...this.defaultOptions, ...options };
    
    const pdfOptions = {
      margin: 0.2,
      filename: opts.filename || 'tutorial-lesson.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#1f2937'
      },
      jsPDF: { 
        unit: 'in', 
        format: 'letter', 
        orientation: 'portrait' as const
      }
    };

    // Hide any interactive elements that shouldn't appear in export
    const elementsToHide = element.querySelectorAll('[data-export-hide]');
    elementsToHide.forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });

    try {
      await html2pdf().set(pdfOptions).from(element).save();
    } finally {
      // Restore hidden elements
      elementsToHide.forEach(el => {
        (el as HTMLElement).style.display = '';
      });
    }
  }

  /**
   * Export a single element as image
   */
  static async exportToImage(element: HTMLElement, options: ExportOptions = {}): Promise<void> {
    const opts = { ...this.defaultOptions, ...options };
    
    // Hide interactive elements
    const elementsToHide = element.querySelectorAll('[data-export-hide]');
    elementsToHide.forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#1f2937', // Gray-800 background
        scrollX: 0,
        scrollY: 0,
        height: element.scrollHeight,
        width: element.scrollWidth,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      // Create download link
      const link = document.createElement('a');
      link.download = opts.filename || `tutorial-lesson.${opts.format}`;
      link.href = canvas.toDataURL(`image/${opts.format}`, opts.quality);
      link.click();
    } finally {
      // Restore hidden elements
      elementsToHide.forEach(el => {
        (el as HTMLElement).style.display = '';
      });
    }
  }


  /**
   * Get formatted filename based on lesson data
   */
  static getFilename(lessonTitle: string, format: 'pdf' | 'png' | 'jpeg'): string {
    const sanitizedTitle = lessonTitle.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    return `tutorial-${sanitizedTitle}.${format}`;
  }
}