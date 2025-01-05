const express = require('express');
const app = express();
const upload = require('../services/multerService');
const { httpsCodes } = require('../modules/constants');
const Shared = require('../services/SharedServices');


app.post('/addSharedService', upload.fields([
    { name: 'MaleVoice', maxCount: 1 },
    { name: 'FemaleVoice', maxCount: 1 }
]), async (req, res) => {

    try {

        const { ScreenName } = req.body;
        const mVoice = req?.files?.MaleVoice?.[0]?.filename;
        const fVoice = req?.files?.FemaleVoice?.[0]?.filename;

        if (!ScreenName || !mVoice) {
            return res.status(400).json({ message: 'ScreenName, MaleVoice, and FemaleVoice are required.' });
        }

        const payload = {
            ScreenName,
            MaleVoice: mVoice,
            FemaleVoice: fVoice
        };
        let result = await Shared.addSharedService(payload);
        return res.json(result);
     
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'An error occurred while uploading the audio files.' });
    }
});


module.exports = app;