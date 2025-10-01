export interface MediaFile {
  file: File;
  url: string;
  type: 'image' | 'video';
  size: number;
  duration?: number; // for videos
}