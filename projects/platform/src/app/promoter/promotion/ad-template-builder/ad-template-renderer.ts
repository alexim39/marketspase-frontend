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

const wrapLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);

  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }

    if (current) {
      lines.push(current);
      current = word;
    } else {
      // A single word is longer than maxWidth; hard-break it.
      lines.push(word);
      current = '';
    }
  }

  if (current) lines.push(current);
  return lines;
};

const drawTextBlock = (ctx: CanvasRenderingContext2D, options: {
  x: number;
  y: number;
  maxWidth: number;
  text: string;
  font: string;
  fill: string;
  lineHeight: number;
  maxLines: number;
  shadow?: boolean;
}) => {
  ctx.save();
  ctx.font = options.font;
  ctx.fillStyle = options.fill;

  if (options.shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
  }

  const lines = wrapLines(ctx, options.text, options.maxWidth).slice(0, options.maxLines);
  lines.forEach((line, idx) => {
    ctx.fillText(line, options.x, options.y + idx * options.lineHeight);
  });
  ctx.restore();
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

const roundRectPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  // Prefer native roundRect when available.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyCtx = ctx as any;
  if (typeof anyCtx.roundRect === 'function') {
    anyCtx.roundRect(x, y, w, h, radius);
    return;
  }

  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
};

export const renderAdFrame = (args: {
  canvas: HTMLCanvasElement;
  layout: AdLayoutConfig;
  promotion: AdBuildPromotionRef | null;
  config: AdBuildConfig;
  media: MediaLike;
  timeMs?: number;
}) => {
  const { canvas, layout, config, promotion, media } = args;
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

  // Readability overlay
  const gradient = ctx.createLinearGradient(0, canvas.height * 0.55, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, canvas.height * 0.52, canvas.width, canvas.height * 0.48);

  // Top chip (platform + industry)
  const insets = getSafeInsets(layout);
  const chipText = `${promotion?.title || 'Promotion'}${config.platformId ? `  -  ${config.platformId.toUpperCase()}` : ''}`;
  ctx.save();
  ctx.font = '600 30px Inter, system-ui, -apple-system, Segoe UI, sans-serif';
  const chipW = ctx.measureText(chipText).width + 44;
  const chipH = 52;
  const chipX = insets.left;
  const chipY = insets.top - 72;

  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath();
  const r = 16;
  roundRectPath(ctx, chipX, chipY, chipW, chipH, r);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.fillText(chipText, chipX + 22, chipY + 35);
  ctx.restore();

  // Accent bar
  ctx.save();
  ctx.fillStyle = config.accentColor || '#2563eb';
  ctx.globalAlpha = 0.95;
  ctx.fillRect(insets.left, canvas.height - insets.bottom - 8, 120, 8);
  ctx.restore();

  // Headline + caption
  const textLeft = insets.left;
  const textRight = canvas.width - insets.right;
  const maxWidth = Math.max(1, textRight - textLeft);
  const textBottom = canvas.height - insets.bottom;

  const headline = String(config.headline || '').trim();
  const caption = String(config.caption || '').trim();

  const baseHeadlineSize =
    layout.id === 'landscape_16_9' ? 68 : layout.id === 'square_1_1' ? 72 : 82;
  const headlineSize = clamp(baseHeadlineSize - Math.max(0, Math.floor(headline.length / 18) * 8), 44, baseHeadlineSize);

  drawTextBlock(ctx, {
    x: textLeft,
    y: textBottom,
    maxWidth,
    text: headline || 'Write a headline',
    font: `800 ${headlineSize}px Inter, system-ui, -apple-system, Segoe UI, sans-serif`,
    fill: '#ffffff',
    lineHeight: Math.round(headlineSize * 1.08),
    maxLines: layout.id === 'landscape_16_9' ? 2 : 3,
    shadow: true,
  });

  const captionStartY = textBottom + Math.round(headlineSize * 1.1) * (layout.id === 'landscape_16_9' ? 1.6 : 1.9);
  drawTextBlock(ctx, {
    x: textLeft,
    y: captionStartY,
    maxWidth,
    text: caption,
    font: `500 ${layout.id === 'landscape_16_9' ? 34 : 36}px Inter, system-ui, -apple-system, Segoe UI, sans-serif`,
    fill: 'rgba(255,255,255,0.9)',
    lineHeight: layout.id === 'landscape_16_9' ? 44 : 46,
    maxLines: layout.id === 'story_9_16' ? 4 : 3,
    shadow: false,
  });

  // Footer hint (copyable link will be provided outside the image/video)
  ctx.save();
  ctx.font = `600 ${layout.id === 'landscape_16_9' ? 28 : 30}px Inter, system-ui, -apple-system, Segoe UI, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.fillText('Tap the link in the caption', textLeft, canvas.height - Math.max(40, insets.bottom - 24));
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
