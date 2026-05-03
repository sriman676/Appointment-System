const crypto = require('crypto');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    // SECURITY: Use random UUID to prevent Predictable Resource Location attacks
    const randomName = crypto.randomUUID();
    cb(null, `${randomName}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const checkFileType = (file, cb) => {
  const filetypes = /pdf|doc|docx|jpg|png|jpeg/;
  const ext = path.extname(file.originalname).toLowerCase();
  
  // SECURITY: Block double extensions (e.g., image.png.exe)
  const parts = file.originalname.split('.');
  if (parts.length > 2) {
    return cb(new Error('SECURITY: Potential double-extension attack detected!'));
  }

  const isAllowedExt = filetypes.test(ext);
  const isAllowedMime = filetypes.test(file.mimetype);

  if (isAllowedExt && isAllowedMime) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Only images and documents (PDF, DOC, DOCX) allowed!'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB (reduced from 10MB)
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
});

module.exports = upload;
