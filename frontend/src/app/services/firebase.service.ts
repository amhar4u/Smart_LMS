import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_B3ZDSsycZyJKeAesmcqAKzC_BK8zNLI",
  authDomain: "smart-lms-d5ce5.firebaseapp.com",
  projectId: "smart-lms-d5ce5",
  storageBucket: "smart-lms-d5ce5.firebasestorage.app",
  messagingSenderId: "1048951192303",
  appId: "1:1048951192303:web:9d3528e4e97e1e1207b91a",
  measurementId: "G-G5PGXF5WJV"
};

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private storage: any;

  constructor() {
    const app = initializeApp(firebaseConfig);
    this.storage = getStorage(app);
  }

  /**
   * Get download URL for a file
   * @param filePath - Firebase storage path
   * @returns Promise<string> - Download URL
   */
  async getDownloadURL(filePath: string): Promise<string> {
    try {
      const fileRef = ref(this.storage, filePath);
      return await getDownloadURL(fileRef);
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw error;
    }
  }

  /**
   * Open file in new tab
   * @param url - File URL
   */
  openFile(url: string): void {
    window.open(url, '_blank');
  }

  /**
   * Download file
   * @param url - File URL
   * @param filename - File name
   */
  downloadFile(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
