// Client-side image upload functions that call API routes

export interface ImageUploadResult {
  imageId: string;
  imageUrl: string;
}

export const uploadImageToServer = async (
  file: File,
  userId: string,
  entryId?: string
): Promise<ImageUploadResult> => {
  try {
    console.log('=== CLIENT IMAGE UPLOAD START ===');
    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      userId,
      entryId
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    if (entryId) {
      formData.append('entryId', entryId);
    }

    console.log('Sending request to /api/upload-image...');
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Upload failed:', errorData);
      throw new Error(errorData.error || 'Failed to upload image');
    }

    const result = await response.json();
    console.log('Upload successful:', result);
    console.log('=== CLIENT IMAGE UPLOAD COMPLETE ===');
    return result;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please select a valid image file (JPEG, PNG, or WebP)'
    };
  }
  
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Image size must be less than 5MB'
    };
  }
  
  return { isValid: true };
};
