require('dotenv').config();
const Resource = require('../models/Resource');
const { S3Client, GetObjectCommand,DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = require('../config/s3'); // S3Client instance

// Get all resources (public) with optional search and filter
exports.getResources = async (req, res) => {
  try {
    const { q, type } = req.query;
    const filter = {};
    if (type) filter.resourceType = type;
    if (q) filter.title = { $regex: q, $options: 'i' };

    const resources = await Resource.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json({ count: resources.length, resources });
  } catch (err) {
    console.error('getResources error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single resource by id (public)
exports.getResourceById = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    res.json({ resource });
  } catch (err) {
    console.error('getResourceById error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Download resource - return signed URL (AWS SDK v3)
exports.getSignedDownloadUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    if (!resource.fileKey) {
      return res.status(500).json({ message: 'Resource fileKey is missing in DB' });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: resource.fileKey,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
    console.log("Signed URL:", url); // debug

    res.json({ url });
  } catch (err) {
    console.error('getSignedDownloadUrl error', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
// Delete a resource (admin only)
exports.deleteResource = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Optional: delete file from S3 if you want
    if (resource.fileKey) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: resource.fileKey,
        });
        await s3.send(command);
      } catch (err) {
        console.error('S3 delete error (resource still removed from DB):', err.message);
      }
    }

    await resource.deleteOne();

    res.json({ message: 'Resource deleted successfully' });
  } catch (err) {
    console.error('deleteResource error', err);
    res.status(500).json({ message: 'Server error' });
  }
};


