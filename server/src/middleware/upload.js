import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

export const imageUpload = (maxMb = 6) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxMb * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) =>
      ALLOWED.includes(file.mimetype)
        ? cb(null, true)
        : cb(ApiError.badRequest('Only JPEG, PNG, WebP, GIF or AVIF images are allowed.')),
  }).single('image');
