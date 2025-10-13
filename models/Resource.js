const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  fileUrl: { type: String, required: true },
  fileKey: { type: String }, // S3 key
  previewImageUrl: { type: String }, // optional resource photo if any
  resourceType: { type: String, enum: ['announcement', 'notes'], default: 'notes' },
  uploadedBy: {
    id: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'uploadedByModel' },
    name: { type: String, required: true },
    role: { type: String, enum: ['student', 'faculty'], required: true }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resource', ResourceSchema);
