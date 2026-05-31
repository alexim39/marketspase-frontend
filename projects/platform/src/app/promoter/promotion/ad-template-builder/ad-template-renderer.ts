import { AdBuildConfig, AdBuildPromotionRef } from './ad-template-builder.models';
import { AdLayoutConfig } from './ad-template-builder.models';

type MediaLike = HTMLImageElement | HTMLVideoElement | null;

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const fitCover = (srcW: number, srcH: number, dstW: number, dstH: number) => {
  const srcAspect = srcW / srcH;
  const dstAspect = dstW / dstH;
  let drawW = dstW;
  let drawH = dstH;
  let dx = 0;
  let dy = 0;

  if (srcAspect > dstAspect) {
    drawH = dstH;
    drawW = dstH * srcAspect;
    dx = (dstW - drawW) / 2;
  } else {
    drawW = dstW;
    drawH = dstW / srcAspect;
    dy = (dstH - drawH) / 2;
  }

  return { dx, dy, dw: drawW, dh: drawH };
};

const getSafeInsets = (layout: AdLayoutConfig) => {
  if (layout.id === 'story_9_16') {
    return { top: 120, right: 90, bottom: 260, left: 90 };
  }
  if (layout.id === 'portrait_4_5') {
    return { top: 90, right: 80, bottom: 190, left: 80 };
  }
  if (layout.id === 'landscape_16_9') {
    return { top: 70, right: 70, bottom: 110, left: 70 };
  }
  return { top: 80, right: 80, bottom: 160, left: 80 };
};

export const renderAdFrame = (args: {
  canvas: HTMLCanvasElement;
  layout: AdLayoutConfig;
  promotion: AdBuildPromotionRef | null;
  config: AdBuildConfig;
  media: MediaLike;
  timeMs?: number;
}) => {
  const { canvas, layout, config, media } = args;
  const t = Number(args.timeMs || 0);

  canvas.width = layout.width;
  canvas.height = layout.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Media (cover)
  if (media) {
    const srcW = (media as any).videoWidth || (media as any).naturalWidth || canvas.width;
    const srcH = (media as any).videoHeight || (media as any).naturalHeight || canvas.height;

    const { dx, dy, dw, dh } = fitCover(srcW, srcH, canvas.width, canvas.height);

    const zoom = 1 + (Math.sin(t / 1800) * 0.01) + (t > 0 ? clamp(t / 6000, 0, 1) * 0.03 : 0);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(zoom, zoom);
    ctx.translate(-cx, -cy);
    ctx.drawImage(media as any, dx, dy, dw, dh);
    ctx.restore();
  } else {
    // Accent wash if no media
    ctx.save();
    ctx.fillStyle = config.accentColor || '#2563eb';
    ctx.globalAlpha = 0.18;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // NOTE: PPC flow now keeps copy (headline/caption/link) outside the visual asset.
  // The canvas export should remain a clean creative that promoters can reuse per platform.
  const insets = getSafeInsets(layout);

  // Accent bar
  ctx.save();
  ctx.fillStyle = config.accentColor || '#2563eb';
  ctx.globalAlpha = 0.95;
  ctx.fillRect(insets.left, canvas.height - insets.bottom - 8, 120, 8);
  ctx.restore();
};

export const canvasToJpegBlob = async (canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob> => {
  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
  );

  if (!blob) {
    throw new Error('Unable to export image');
  }

  return blob;
};

export const pickBestRecorderMimeType = (): string | null => {
  if (typeof MediaRecorder === 'undefined') return null;

  const candidates = [
    'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];

  for (const candidate of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(candidate)) return candidate;
    } catch {
      // Ignore.
    }
  }

  return null;
};

export const recordCanvasVideo = async (args: {
  canvas: HTMLCanvasElement;
  durationMs: number;
  fps: number;
  mimeType?: string | null;
  onFrame: (timeMs: number) => void;
}): Promise<Blob> => {
  const mimeType = args.mimeType ?? pickBestRecorderMimeType();
  if (typeof MediaRecorder === 'undefined' || !mimeType) {
    throw new Error('Video export is not supported in this browser.');
  }

  const stream = args.canvas.captureStream(args.fps);
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: BlobPart[] = [];

  const blob = await new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () => reject(new Error('Video recorder error'));
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));

    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      args.onFrame(elapsed);
      if (elapsed >= args.durationMs) {
        recorder.stop();
        return;
      }
      window.setTimeout(tick, Math.max(0, 1000 / args.fps));
    };

    recorder.start();
    tick();
  });

  return blob;
};
