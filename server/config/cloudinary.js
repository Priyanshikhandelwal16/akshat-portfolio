const cloudinary = require('cloudinary').v2;

const configureCloudinary = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('⚠️ WARNING: Cloudinary credentials are not completely configured in .env. Video/image upload features will fail until these credentials are provided.');
    return null;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });

  return cloudinary;
};

module.exports = {
  cloudinary,
  configureCloudinary
};
