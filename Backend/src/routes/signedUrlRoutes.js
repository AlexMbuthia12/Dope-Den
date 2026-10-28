const express = require('express');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const router = express.Router();

const endpoint = process.env.R2_ENDPOINT || process.env.AWS_ENDPOINT;
const region = process.env.R2_REGION || process.env.AWS_REGION || 'auto';
const bucketName = process.env.R2_BUCKET_NAME || process.env.S3_BUCKET_NAME;
const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new S3Client({
  region,
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: Boolean(endpoint),
});

router.post('/generate-upload-url', async (req, res) => {
  try {
    if (!bucketName || !accessKeyId || !secretAccessKey) {
      return res.status(500).json({ error: 'Cloud storage credentials are not configured' });
    }

    const { fileName, fileType } = req.body;
    const fileKey = `products/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    const publicBaseUrl = process.env.R2_PUBLIC_URL || process.env.S3_PUBLIC_URL || `https://${bucketName}.${endpoint ? endpoint.replace(/^https?:\/\//, '') : 'storage.googleapis.com'}/${fileKey}`;
    const finalImageUrl = `${publicBaseUrl.replace(/\/$/, '')}/${fileKey}`;

    res.json({ uploadUrl, finalImageUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

module.exports = router;