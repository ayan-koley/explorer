import multer from 'multer';
import type { RequestHandler } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const accepted = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype);
    if (!accepted) return callback(new Error('Choose a JPEG, PNG, WebP, or GIF image.'));
    callback(null, true);
  },
}).single('image');

export const imageUpload: RequestHandler = (req, res, next) => {
  upload(req, res, (error) => {
    if (!error) return next();
    const status = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json(ApiResponse.error(status === 413 ? 'Images must be 5 MB or smaller.' : error.message));
  });
};
