const multer = require('multer');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();

        if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
            cb(null, 'uploads/images/');
        } else if (['.mp3', '.wav', '.mpeg'].includes(ext)) {
            cb(null, 'uploads/audio/');
        } else if (['.mp4', '.mov', '.avi', '.3gp', '.mkv'].includes(ext)) { 
            cb(null, 'uploads/videos/');
        } else {
            cb(new Error('Invalid file type'), false);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const allowedAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav'];
    const allowedVideoTypes = [
        'video/mp4',             
        'video/quicktime',        
        'video/x-msvideo',       
        'video/3gpp',             
        'video/x-matroska'       
    ];

    if (
        allowedImageTypes.includes(file.mimetype) ||
        allowedAudioTypes.includes(file.mimetype) ||
        allowedVideoTypes.includes(file.mimetype)
    ) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 } 
});

module.exports = upload;
