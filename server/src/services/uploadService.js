import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cloudinary } from '../config/cloudinary.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

const EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

/**
 * Store an uploaded image. Uses Cloudinary when configured, otherwise writes to
 * server/uploads (served at /uploads) so development works without credentials.
 */
export async function storeImage(file, { folder = 'trpb', baseUrl }) {
  if (env.cloudinaryEnabled) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (err, res) => (err ? reject(err) : resolve(res))
      );
      stream.end(file.buffer);
    });
    return { url: result.secure_url, width: result.width, height: result.height, provider: 'cloudinary' };
  }

  if (process.env.VERCEL) {
    // Serverless file systems are read-only and wiped between requests.
    throw new ApiError(503, 'Image uploads need Cloudinary on this host. Set the CLOUDINARY_* environment variables.');
  }
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${EXT[file.mimetype] || 'bin'}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), file.buffer);
  return { url: `${baseUrl}/uploads/${name}`, provider: 'local' };
}
