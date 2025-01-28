const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the uploads/leads directory exists
const leadsUploadPath = path.join(__dirname, '../uploads/leads/');
if (!fs.existsSync(leadsUploadPath)) {
    fs.mkdirSync(leadsUploadPath, { recursive: true });
}

// Configure multer storage for leads import
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, leadsUploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to accept only Excel and CSV files
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv', // .csv
        'application/csv' // Some browsers may use this MIME type
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'), false);
    }
};

// Initialize multer with defined storage and file filter
const leadUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // Limit file size to 10MB
});

module.exports = leadUpload;
