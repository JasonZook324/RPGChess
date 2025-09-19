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
      margin: opts.margin,
      filename: opts.filename || 'tutorial-lesson.pdf',
      image: { type: 'jpeg' as const, quality: opts.quality },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#1f2937', // Gray-800 to match tutorial background
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { 
        unit: 'in', 
        format: 'a4', 
        orientation: opts.orientation,
        compress: true
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
        width: element.scrollWidth
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
   * Export multiple lessons as a combined PDF
   */
  static async exportMultipleLessonsToPDF(
    lessons: { title: string; element: HTMLElement }[],
    options: ExportOptions = {}
  ): Promise<void> {
    const opts = { ...this.defaultOptions, ...options };
    
    const pdfOptions = {
      margin: opts.margin,
      filename: opts.filename || 'complete-tutorial.pdf',
      image: { type: 'jpeg' as const, quality: opts.quality },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#1f2937'
      },
      jsPDF: { 
        unit: 'in', 
        format: 'a4', 
        orientation: opts.orientation 
      }
    };

    // Create a temporary container for all lessons
    const container = document.createElement('div');
    container.style.backgroundColor = '#1f2937';
    container.style.color = '#ffffff';
    container.style.padding = '20px';
    container.style.fontFamily = 'Inter, sans-serif';

    // Add title page
    const titlePage = document.createElement('div');
    titlePage.style.textAlign = 'center';
    titlePage.style.padding = '100px 20px';
    titlePage.innerHTML = `
      <h1 style="font-size: 48px; margin-bottom: 20px; color: #fbbf24;">Chess RPG Tutorial</h1>
      <h2 style="font-size: 24px; color: #d1d5db;">Complete Guide</h2>
      <p style="font-size: 16px; color: #9ca3af; margin-top: 40px;">Generated on ${new Date().toLocaleDateString()}</p>
      <div style="page-break-after: always;"></div>
    `;
    container.appendChild(titlePage);

    // Add each lesson
    lessons.forEach((lesson, index) => {
      // Hide interactive elements in each lesson
      const elementsToHide = lesson.element.querySelectorAll('[data-export-hide]');
      elementsToHide.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });

      // Clone the lesson element
      const lessonClone = lesson.element.cloneNode(true) as HTMLElement;
      
      // Add lesson header
      const lessonHeader = document.createElement('div');
      lessonHeader.style.pageBreakBefore = index > 0 ? 'always' : 'auto';
      lessonHeader.style.marginBottom = '20px';
      lessonHeader.innerHTML = `
        <h2 style="font-size: 28px; color: #fbbf24; border-bottom: 2px solid #374151; padding-bottom: 10px;">
          Lesson ${index + 1}: ${lesson.title}
        </h2>
      `;
      
      container.appendChild(lessonHeader);
      container.appendChild(lessonClone);
      
      // Add page break after each lesson except the last
      if (index < lessons.length - 1) {
        const pageBreak = document.createElement('div');
        pageBreak.style.pageBreakAfter = 'always';
        container.appendChild(pageBreak);
      }
    });

    // Temporarily add container to DOM for html2pdf processing
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    try {
      await html2pdf().set(pdfOptions).from(container).save();
    } finally {
      // Clean up
      document.body.removeChild(container);
      
      // Restore hidden elements in original lessons
      lessons.forEach(lesson => {
        const elementsToHide = lesson.element.querySelectorAll('[data-export-hide]');
        elementsToHide.forEach(el => {
          (el as HTMLElement).style.display = '';
        });
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