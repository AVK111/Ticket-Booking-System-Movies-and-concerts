const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a local file to Cloudinary and deletes it locally upon completion.
 * @param {string} localFilePath - Path to the local temporary file.
 * @returns {Promise<object|null>} Cloudinary upload response object or null on failure.
 */
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        
        // upload on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        
        // file has been uploaded successfully
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return response;
    } catch (error) {
        console.error(`Error uploading to Cloudinary, unlinking ${localFilePath}!!`, error);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath); // remove the locally saved temp file as the upload failed
        }
        return null;
    }
};

/**
 * Deletes a file from Cloudinary using its public_id.
 * @param {string} public_id - Cloudinary public ID of the resource.
 * @returns {Promise<object>} Cloudinary destroy response object.
 */
const deleteOnCloudinary = async (public_id) => {
    try {
        const response = await cloudinary.uploader.destroy(public_id, {
            resource_type: "image"
        });
        return response;
    } catch (error) {
        console.error("Error deleting old file on Cloudinary:", error);
        const err = new Error("Error deleting old file on Cloudinary");
        err.status = 500;
        throw err;
    }
};

module.exports = {
    uploadOnCloudinary,
    deleteOnCloudinary
};
