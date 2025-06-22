import { getGridFSBucket, getDatabase } from './mongodb';
import { ObjectId } from 'mongodb';

export interface ImageUploadResult {
  imageId: string;
  imageUrl: string;
}

export const uploadImageToMongoDB = async (
  file: File,
  userId: string,
  entryId?: string
): Promise<ImageUploadResult> => {
  try {
    console.log('=== MONGODB IMAGE UPLOAD START ===');
    console.log('Getting GridFS bucket...');
    const bucket = await getGridFSBucket();
    console.log('GridFS bucket obtained successfully');

    // Create a unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const metadata = {
      userId,
      entryId: entryId || 'temp',
      originalName: file.name,
      uploadDate: new Date(),
      contentType: file.type
    };

    console.log('Upload metadata:', metadata);

    // Convert File to Buffer
    console.log('Converting file to buffer...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('Buffer created, size:', buffer.length);

    // Create upload stream
    console.log('Creating upload stream...');
    const uploadStream = bucket.openUploadStream(fileName, {
      metadata
    });

    // Upload the file
    const uploadPromise = new Promise<ObjectId>((resolve, reject) => {
      uploadStream.on('error', (error) => {
        console.error('Upload stream error:', error);
        reject(error);
      });
      uploadStream.on('finish', () => {
        console.log('Upload stream finished, ID:', uploadStream.id);
        resolve(uploadStream.id as ObjectId);
      });
    });

    // Write buffer to stream
    console.log('Writing buffer to stream...');
    uploadStream.end(buffer);

    // Wait for upload to complete
    console.log('Waiting for upload to complete...');
    const imageId = await uploadPromise;
    console.log('Upload completed successfully, image ID:', imageId.toString());

    // Return image ID and URL (we'll create an API endpoint to serve images)
    const result = {
      imageId: imageId.toString(),
      imageUrl: `/api/images/${imageId.toString()}`
    };
    console.log('=== MONGODB IMAGE UPLOAD COMPLETE ===');
    return result;
  } catch (error) {
    console.error("Error uploading image to MongoDB:", error);
    throw new Error("Failed to upload image to MongoDB");
  }
};

export const deleteImageFromMongoDB = async (imageId: string): Promise<void> => {
  try {
    const bucket = await getGridFSBucket();
    await bucket.delete(new ObjectId(imageId));
  } catch (error) {
    console.error("Error deleting image from MongoDB:", error);
    // Don't throw error for deletion failures as it's not critical
  }
};

export const getImageFromMongoDB = async (imageId: string): Promise<{
  stream: any;
  metadata: any;
} | null> => {
  try {
    const bucket = await getGridFSBucket();
    const db = await getDatabase();
    
    // Check if file exists
    const file = await db.collection('images.files').findOne({
      _id: new ObjectId(imageId)
    });
    
    if (!file) {
      return null;
    }
    
    // Create download stream
    const downloadStream = bucket.openDownloadStream(new ObjectId(imageId));
    
    return {
      stream: downloadStream,
      metadata: file.metadata
    };
  } catch (error) {
    console.error("Error getting image from MongoDB:", error);
    return null;
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
