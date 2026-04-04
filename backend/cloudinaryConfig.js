import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// 🟢 Configuration
cloudinary.config({
  cloud_name: 'db6n3agzs',
  api_key: '615969283912398',
  api_secret: 'z8UoQROySQ9WxscZ0NQz6wCyrxk'
});

// 🟢 Storage Settings
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'dharashakti_employees', // Cloudinary pe is naam ka folder ban jayega
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage: storage });

export { cloudinary, upload };