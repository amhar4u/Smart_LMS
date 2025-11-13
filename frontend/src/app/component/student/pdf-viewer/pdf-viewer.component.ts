import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.css']
})
export class PdfViewerComponent {
  safeUrl: SafeResourceUrl;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { url: string, title: string },
    private dialogRef: MatDialogRef<PdfViewerComponent>,
    private sanitizer: DomSanitizer
  ) {
    // Use Google Docs Viewer for better PDF display compatibility
    // This prevents download and displays PDF inline
    const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(data.url)}&embedded=true`;
    
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(googleDocsUrl);
  }

  close() {
    this.dialogRef.close();
  }

  openInNewTab() {
    window.open(this.data.url, '_blank');
  }

  downloadPdf() {
    const link = document.createElement('a');
    link.href = this.data.url;
    link.download = this.data.title || 'document.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
