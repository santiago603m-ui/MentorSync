import { v2 as cloudinary } from 'cloudinary';

// Configuración para imágenes
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME_IMG,
  api_key: process.env.CLOUDINARY_API_KEY_IMG,
  api_secret: process.env.CLOUDINARY_API_SECRET_IMG,
});

// Subir imágenes
export const uploadImageCloudinary = async (filePath) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'mentorSync/images', // Carpeta opcional en Cloudinary
    resource_type: 'image'
  });
  return {
    url: result.secure_url,
    public_id: result.public_id
  };
};

// Eliminar imágenes
export const deleteImageCloudinary = async (publicId) => {
  return await cloudinary.uploader.destroy(publicId);
};

export default cloudinary;
