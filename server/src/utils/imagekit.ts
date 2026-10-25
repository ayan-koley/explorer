import ImageKit, { toFile } from '@imagekit/nodejs';
import type { Express } from 'express';

const imageMimeExtensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

let imageKitClient: ImageKit | undefined;

function getImageKitClient() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    const error = new Error('Image uploads are not configured. Add IMAGEKIT_PRIVATE_KEY to the server environment.');
    Object.assign(error, { status: 503 });
    throw error;
  }
  imageKitClient ??= new ImageKit({ privateKey });
  return imageKitClient;
}

export function isSupportedImage(file: Express.Multer.File): boolean {
  if (file.mimetype === 'image/jpeg') return file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff;
  if (file.mimetype === 'image/png') return file.buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (file.mimetype === 'image/gif') return file.buffer.subarray(0, 3).toString() === 'GIF';
  if (file.mimetype === 'image/webp') return file.buffer.subarray(0, 4).toString() === 'RIFF' && file.buffer.subarray(8, 12).toString() === 'WEBP';
  return false;
}

export async function uploadImage(file: Express.Multer.File, folder: string, ownerId: number) {
  const extension = imageMimeExtensions[file.mimetype];
  if (!extension || !isSupportedImage(file)) {
    const error = new Error('Choose a valid JPEG, PNG, WebP, or GIF image.');
    Object.assign(error, { status: 400 });
    throw error;
  }

  let uploaded: Awaited<ReturnType<ImageKit['files']['upload']>>;
  try {
    uploaded = await getImageKitClient().files.upload({
      file: await toFile(file.buffer, `image.${extension}`),
      fileName: `${folder}-${ownerId}-${Date.now()}.${extension}`,
      folder: `/chaitalk/${folder}`,
      useUniqueFileName: true,
    });
  } catch (cause) {
    if ((cause as { status?: number }).status === 503) throw cause;
    const error = new Error('Image upload service failed. Check the ImageKit configuration and try again.');
    Object.assign(error, { status: 502 });
    throw error;
  }

  return { url: uploaded.url, fileId: uploaded.fileId };
}
