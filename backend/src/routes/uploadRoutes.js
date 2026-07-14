const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer');
const { uploadOnCloudinary } = require('../config/cloudinary');
const { protect, requireRole } = require('../middleware/auth');

/**
 * @route   POST /api/upload/image
 * @desc    Upload an image to Cloudinary
 * @access  Private (Organiser, Admin)
 */
router.post('/image', protect, requireRole('organiser', 'admin'), upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        // Upload local file to Cloudinary
        const result = await uploadOnCloudinary(req.file.path);
        if (!result) {
            return res.status(500).json({ message: 'Failed to upload image to Cloudinary' });
        }

        return res.status(200).json({
            message: 'Image uploaded successfully',
            url: result.secure_url,
            public_id: result.public_id
        });
    } catch (error) {
        console.error('Upload route error:', error);
        return res.status(500).json({ message: error.message || 'Image upload failed' });
    }
});

module.exports = router;
