import multer from "multer";
import path from "path";
import fs from "fs";

// 1. Ensure 'uploads' folder exists (Server start hone par auto-create)
const uploadDir = "uploads/profiles";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Specific folder for profiles
  },
  filename: (req, file, cb) => {
    // Filename format: employeeId-timestamp.extension
    const employeeId = req.body.employeeId || "unknown";
    const ext = path.extname(file.originalname);
    cb(null, `${employeeId}-${Date.now()}${ext}`);
  },
});

// 2. File Filter (Strictly Images Only)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Error: Only Images (JPG, JPEG, PNG) are allowed!"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB Limit
  fileFilter: fileFilter,
});

export default upload;