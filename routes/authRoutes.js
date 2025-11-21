// routes/authRoutes.js
const express = require("express");
const multer = require("multer");
const { Upload } = require("@aws-sdk/lib-storage");
const s3 = require("../config/s3");
const { studentSignup, facultySignup,studentLogin,facultyLogin,adminLogin,logout } = require("../controllers/authController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Upload to S3 helper (inline)
async function uploadToS3(file, folder) {
  const key = `${folder}/${Date.now()}_${file.originalname}`;
  const uploader = new Upload({
    client: s3,
    params: {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    },
  });
  await uploader.done();
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

// Student signup route
router.post("/student/signup", upload.single("profilePicture"), async (req, res) => {
  try {
    if (req.file) req.body.profilePictureUrl = await uploadToS3(req.file, "profiles");
    return studentSignup(req, res);
  } catch (err) {
    console.error("student signup error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
router.post('/student/login', studentLogin);
// Faculty signup route
router.post("/faculty/signup", upload.single("profilePicture"), async (req, res) => {
  try {
    if (req.file) req.body.profilePictureUrl = await uploadToS3(req.file, "profiles");
    return facultySignup(req, res);
  } catch (err) {
    console.error("faculty signup error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
router.post('/admin/login',adminLogin)
router.get("/logout", logout);

module.exports = router;
