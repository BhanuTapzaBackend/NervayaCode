import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import { CLOUDINARY_FOLDERS } from '../constants/app.constants';

const configureCloudinary = () => {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud_name || !api_key || !api_secret) {
    console.error('[Cloudinary Config Error]: Missing environment variables', {
      cloud_name: !!cloud_name,
      api_key: !!api_key,
      api_secret: !!api_secret,
    });
    throw new Error('Cloudinary environment variables are missing');
  }

  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
    secure: true,
  });
};

export const uploadImage = async (fileBuffer: Buffer): Promise<string> => {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: CLOUDINARY_FOLDERS.ROOT, resource_type: 'image' },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary uploadImage Error]:', error);
          reject(new Error(error.message || 'Image upload to Cloudinary failed'));
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error('Image upload failed without specific error'));
        }
      },
    );
    uploadStream.end(fileBuffer);
  });
};

export const uploadMedia = async (fileBuffer: Buffer): Promise<string> => {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: CLOUDINARY_FOLDERS.ROOT, resource_type: 'auto' } as UploadApiOptions,
      (error, result) => {
        if (error) {
          console.error('[Cloudinary uploadMedia Error]:', error);
          reject(new Error(error.message || 'Media upload to Cloudinary failed'));
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error('Media upload failed without specific error'));
        }
      },
    );
    uploadStream.end(fileBuffer);
  });
};
