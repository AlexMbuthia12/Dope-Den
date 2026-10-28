import { useState } from 'react';

type ProductImageUploaderProps = {
  onImageUploaded: (imageUrl: string) => void;
};

export function ProductImageUploader({ onImageUploaded }: ProductImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // Step 1: Ask Node backend for presigned URL
      const response = await fetch('/api/images/generate-upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });
      const { uploadUrl, finalImageUrl } = await response.json();

      // Step 2: Upload file directly to S3 bucket
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      // Step 3: Pass finalImageUrl up to parent form state
      onImageUploaded(finalImageUrl);
      alert('Image uploaded successfully!');
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
      {uploading && <p>Uploading to cloud storage...</p>}
    </div>
  );
}