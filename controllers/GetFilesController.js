const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Route to handle file requests
router.get('/:type/:filename', (req, res) => {
    const { type, filename } = req.params;
    let baseDir;
    if (type === 'image') {
        baseDir = path.join(__dirname, '../uploads/images');
    } else if (type === 'audio') {
        baseDir = path.join(__dirname, '../uploads/audio');
    } else {
        return res.status(400).json({ message: 'Invalid file type' });
    }

    const filePath = path.join(baseDir, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
    }
    res.sendFile(filePath);
});

module.exports = router;
