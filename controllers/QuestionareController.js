const express = require('express');
const app = express();
const userService = require('../services/UserService');
const QuestionareService = require('../services/QuestionareService');
const upload = require('../services/multerService');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

app.get('/questions', async (req, res) => {
    try {
        let tokken = req.headers['authorization'].split(' ')[1];
        QuestionareService.allQuestions({ tokken })
            .then((result) => {
                return res.json(result)
            })
            .catch((err) => {
                return res.json(err);
            })
    } catch (error) {
        console.log(error);
        throw error;
    }
});

// app.post('/addQuestions', upload.fields([
//     { name: 'mainTitleImg', maxCount: 1 },
//     { name: 'mainTitleAudio', maxCount: 1 },
//     { name: 'mainTitleAudioFemale', maxCount: 1 }, // Add this line for the new field
//     { name: 'subQuestionsAudio', maxCount: 5 }
// ]), async (req, res) => {
//     try {
//         const { files, body } = req;
//         console.log('Files received:', files);

//         if (files.mainTitleImg) {
//             body.mainTitleImg = files.mainTitleImg.map(file => file.path);
//         }

//         if (files.mainTitleAudio) {
//             body.mainTitleAudio = files.mainTitleAudio.map(file => file.path);
//         }

//         // Handle the new field
//         if (files.mainTitleAudioFemale) {
//             body.mainTitleAudioFemale = files.mainTitleAudioFemale.map(file => file.path);
//         }

//         if (files.subQuestionsAudio) {
//             body.subQuestions = JSON.parse(body.subQuestions);

//             for (let i = 0; i < body.subQuestions.length; i++) {
//                 if (files.subQuestionsAudio[i]) {
//                     if (Array.isArray(files.subQuestionsAudio[i])) {
//                         body.subQuestions[i].subAudio = files.subQuestionsAudio[i].map(file => file.path);
//                     } else {
//                         body.subQuestions[i].subAudio = [files.subQuestionsAudio[i].path];
//                     }
//                 }
//             }
//         }

//         const result = await QuestionareService.addQuestions({ ...body });
//         return res.json(result);
//     } catch (error) {
//         console.error('Error in addQuestions route:', error);
//         return res.status(500).json({ status: 500, message: 'Internal Server Error' });
//     }
// });

app.post('/useranswer', upload.single('video'), async (req, res) => {
    try {
        const { userId, questionId, subQuestionId, answerType } = req.body;
        let answer = req.body.answer;
        if (answerType === 'video') {
            if (!req.file) {
                return res.status(400).json({ message: 'No video file uploaded' });
            }
            answer = req.file.filename;
        }
        const result = await QuestionareService.addUserAnswer({ userId, questionId, subQuestionId, answer, answerType });

        return res.status(result.status).json(result);
    } catch (error) {
        console.error('Error submitting answer:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Route 1: Add or update questionnaire
app.post('/addQuestionnaire', upload.fields([
    { name: 'mainTitleImg', maxCount: 1 },
    { name: 'mainTitleAudio', maxCount: 1 },
    { name: 'mainTitleAudioFemale', maxCount: 1 },
]), async (req, res) => {
    try {
        const { files, body } = req;

        if (files.mainTitleImg) {
            body.mainTitleImg = files.mainTitleImg.map(file => file.path);
        }
        if (files.mainTitleAudio) {
            body.mainTitleAudio = files.mainTitleAudio.map(file => file.path);
        }
        if (files.mainTitleAudioFemale) {
            body.mainTitleAudioFemale = files.mainTitleAudioFemale.map(file => file.path);
        }

        const result = await QuestionareService.addOrUpdateQuestionnaire({ ...body });
        return res.status(result.status).json(result);
    } catch (error) {
        console.error('Error in /addQuestionnaire:', error);
        return res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
});

// Route 2: Add or update subquestions
app.post('/addSubQuestions/:questionnaireId', upload.any(), async (req, res) => {
    try {
        const { questionnaireId } = req.params;
        const { files, body } = req;

        // Ensure format is a valid string
        const format = typeof body.format === 'string' ? body.format : 'text';

        const subQuestion = {
            subTitle: body.subTitle,
            format, // Use validated format
            subAudio: files.filter(file => file.fieldname === 'subAudio').map(file => file.path),
            subAudioFemale: files.filter(file => file.fieldname === 'subAudioFemale').map(file => file.path),
        };

        const result = await QuestionareService.addOrUpdateSubQuestion(questionnaireId, subQuestion);
        return res.status(result.status).json(result);
    } catch (error) {
        console.error('Error in /addSubQuestions:', error);
        return res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
});

app.get('/mainQuestion' , async(req  , res) =>{

});

// Route to fetch all main questions for dropdown population
app.get('/mainQuestions', async (req, res) => {
    try {
      
        const result = await QuestionareService.getAllMainQuestions();
        if (result.status === 200) {
            return res.status(200).json(result);
        } else {
            return res.status(result.status).json({ message: result.message });
        }
    } catch (error) {
        console.error('Error fetching main questions:', error);
        return res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
});

app.get('/allQuestionsWithSubQuestions', async (req, res) => {
    try {

        // Fetch all questions and subquestions from the service
        const result = await QuestionareService.getAllQuestionsWithSubQuestions();

        if (result.status === 200) {
            return res.status(200).json(result);
        } else {
            return res.status(result.status).json({ message: result.message });
        }
    } catch (error) {
        console.error('Error fetching all questions and subquestions:', error);
        return res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
});

app.delete('/deleteQuestion/:questionId', async (req, res) => {
    try {
        const { questionId } = req.params;

        // Call the service to delete the question
        const result = await QuestionareService.deleteQuestionWithSubQuestions(questionId);

        return res.status(result.status).json({ message: result.message });
    } catch (error) {
        console.error('Error deleting question:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});






module.exports = app;