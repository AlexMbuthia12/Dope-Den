const getStorageProvider = () => (process.env.MEDIA_PROVIDER || 'local').toLowerCase();

const buildCloudUrl = ({ src, fileName }) => {
  const baseUrl = process.env.CLOUD_PUBLIC_URL || process.env.R2_PUBLIC_URL || process.env.S3_PUBLIC_URL || '';
  const safeName = (fileName || 'slide').replace(/\s+/g, '-');
  const fileKey = `carousel/${Date.now()}-${safeName}`;

  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, '')}/${fileKey}`;
  }

  return src || fileKey;
};

const resolveMediaPayload = ({ src, fileName, mediaType }) => {
  const provider = getStorageProvider();

  if (!src) {
    return {
      mediaUrl: '',
      storageProvider: 'local',
      mediaType: mediaType || 'image',
      isCloudConfigured: false,
    };
  }

  if (src.startsWith('data:')) {
    return {
      mediaUrl: src,
      storageProvider: 'local',
      mediaType: mediaType || 'image',
      isCloudConfigured: false,
    };
  }

  if (provider === 'r2' || provider === 's3' || provider === 'cloud' || provider === 'cloudinary') {
    return {
      mediaUrl: buildCloudUrl({ src, fileName }),
      storageProvider: 'cloud',
      mediaType: mediaType || 'image',
      isCloudConfigured: true,
    };
  }

  return {
    mediaUrl: src,
    storageProvider: 'remote',
    mediaType: mediaType || 'image',
    isCloudConfigured: false,
  };
};

module.exports = {
  getStorageProvider,
  buildCloudUrl,
  resolveMediaPayload,
};
