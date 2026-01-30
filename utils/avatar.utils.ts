import { AVATAR_CANVAS_SIZE } from '../constants/app.constants';

export const generateCroppedAvatar = async (
  imageSrc: string,
  cropX: number,
  cropY: number,
  zoom: number,
  boxSize: number
): Promise<string | null> => {
  const outputSize = AVATAR_CANVAS_SIZE;
  const img = new Image();
  img.src = imageSrc;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Erro ao carregar imagem'));
  });

  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  const baseScale = Math.max(boxSize / iw, boxSize / ih);
  const totalScale = baseScale * zoom;

  const renderedW = iw * totalScale;
  const renderedH = ih * totalScale;

  const imgLeft = (boxSize - renderedW) / 2 + cropX;
  const imgTop = (boxSize - renderedH) / 2 + cropY;

  let sx = (0 - imgLeft) / totalScale;
  let sy = (0 - imgTop) / totalScale;
  let sSize = boxSize / totalScale;

  if (sx < 0) sx = 0;
  if (sy < 0) sy = 0;

  if (sx + sSize > iw) sSize = iw - sx;
  if (sy + sSize > ih) sSize = ih - sy;

  if (sSize <= 0) return null;

  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, outputSize, outputSize);

  return canvas.toDataURL('image/jpeg', 0.9);
};

