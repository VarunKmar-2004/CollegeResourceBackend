const express = require("express");
const multer = require("multer");
const { Upload } = require("@aws-sdk/lib-storage");
const Resource = require("../models/Resource");
const authMiddleware = require("../middleware/auth");
const {
  getResourceById,
  getSignedDownloadUrl,
  getResources,
} = require('../controllers/resourceController');

const s3 = require("../config/s3"); // S3Client instance
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(),limits: { fileSize: 50 * 1024 * 1024 } });

// Upload resource
router.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const key = `resources/${Date.now()}_${req.file.originalname}`;

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    const uploader = new Upload({
      client: s3,
      params: uploadParams,
    });

    await uploader.done();

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // Save both fileUrl and fileKey
    const resource = await Resource.create({
      title: req.body.title,
      description: req.body.description,
      resourceType: req.body.resourceType || 'notes',
      fileUrl,
      fileKey: key, // important for signed URL
      uploadedBy: {
        id: req.user._id,
        name: req.user.name,
        role: req.userRole,
      },
    });

    res.status(201).json({
      message: "✅ Resource uploaded successfully",
      resource,
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Routes
router.get('/', getResources);
router.get('/:id', getResourceById);
router.get('/:id/download', getSignedDownloadUrl);

module.exports = router;
