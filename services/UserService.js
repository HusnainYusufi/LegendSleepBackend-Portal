const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const bcrypt = require('bcrypt');
const { httpsCodes } = require('../modules/constants');
const { language } = require('../language/language');
const { verifyToken } = require('../modules/helper');
const mongoose = require('mongoose');
const ForgotPassword = require('../models/ForgotPassword.model');
// const Questionnaire = require('../models/Questionare.model');

'use-strict'

class UserService {

    static async verifyUser(reqObj) {
        try {
            let filters = {}; // Initialize as an object, not an array
    
            if (reqObj?.email) {
                filters.email = reqObj.email;
            }
    
            if (reqObj?.userId) {
                filters._id = reqObj.userId;
            }
    
            // Use the filters object for querying
            const user = await User.findOne(filters).populate('RoleId').exec();
    
            if (!user) {
                return { status: httpsCodes.NOT_FOUND, message: language.NOT_FOUND };
            }
    
            return { status: httpsCodes.SUCCESS_CODE, message: language.RECORD_FOUND, result: user };
        } catch (error) {
            throw error;
        }
    }
    

    static async incrementCeremony(reqObj) {
        let result = "";

        try {
            let { userId } = reqObj;

            let userCeremony = await User.findByIdAndUpdate(userId, { $inc: { ceremony: 1 } }, { new: true }).exec();

            if (userCeremony) {
                result = { status: httpsCodes.SUCCESS_CODE, message: language.RECORDS_UPDATED };
            } else {
                result = { status: httpsCodes.BAD_REQUEST, message: language.INTERNAL_SERVER_ERROR };
            }
        } catch (error) {
            console.log(error);
            throw error;
        }

        return result;
    }
    static async userProfile(reqObj) {
        try {
            const { tokken } = reqObj;
            const verifiedtokken = await verifyToken(tokken);
            const userId = verifiedtokken?.data?.user;

            if (!userId) {
                return { status: httpsCodes.UNAUTHORIZE_CODE, message: language.UNAUTHORIZE_CODE };
            }

            // Fetch the user
            const user = await User.findById(userId).lean();
            if (!user) {
                return { status: httpsCodes.NOT_FOUND, message: language.NOT_FOUND };
            }

            const currentCeremony = user.ceremony || 1;
            const completedCeremonies = currentCeremony > 1 ? currentCeremony - 1 : 0;

            // Fetch all questions (assume all belong to the current ceremony)
            const allQuestions = await Questionnaire.find({}).sort({ createdAt: 1 }).lean();
            if (!allQuestions || allQuestions.length === 0) {
                return { status: httpsCodes.NOT_FOUND, message: "No questions found for the ceremony." };
            }

            // Calculate total subQuestions in this ceremony
            const totalSubQuestions = allQuestions.reduce((acc, q) => acc + q.subQuestions.length, 0);

            // Fetch user answers for this ceremony
            const userAnswers = await UserAnswer.find({ userId, ceremony: currentCeremony }).lean();

            let answeredSubQuestions = 0;

            // Iterate over each question to count answered subQuestions
            for (const question of allQuestions) {
                const qId = question._id.toString();
                const totalForThisQuestion = question.subQuestions.length;
                const validSubQIds = question.subQuestions.map(sq => sq._id.toString());

                const userAnswer = userAnswers.find(ua => ua.questionId.toString() === qId);

                if (userAnswer) {
                    // If the entire question is completed (or can no longer be attempted), count it fully
                    if (userAnswer.completed === true || userAnswer.canAttempt === false) {
                        answeredSubQuestions += totalForThisQuestion;
                    } else if (Array.isArray(userAnswer.subQuestionAnswers)) {
                        // Otherwise, count how many subQuestions are answered
                        const answeredCount = userAnswer.subQuestionAnswers.filter(ans =>
                            validSubQIds.includes(ans.subQuestionId.toString())
                        ).length;
                        answeredSubQuestions += answeredCount;
                    }
                }
            }

            // Calculate and round the completion percentage
            let completionPercentage = 0;
            if (totalSubQuestions > 0) {
                completionPercentage = (answeredSubQuestions / totalSubQuestions) * 100;
                completionPercentage = Math.round(completionPercentage); // Round to nearest integer
            }

            const result = {
                username: user.username,
                gender: user.gender,
                email: user.email,
                completedCeremonies,
                currentCeremony,
                completionPercentage
            };

            return {
                status: httpsCodes.SUCCESS_CODE,
                message: language.RECORD_FOUND,
                result: result
            };

        } catch (error) {
            console.error(error);
            return { status: httpsCodes.INTERNAL_SERVER_ERROR, message: language.INTERNAL_SERVER_ERROR };
        }
    }

    static async deleteProfile(reqObj) {
        try {
            const { tokken } = reqObj;

            const verifiedToken = await verifyToken(tokken);
            const userId = verifiedToken?.data?.user;

            if (!userId) {
                return { status: httpsCodes.UNAUTHORIZE_CODE, message: language.UNAUTHORIZE_CODE };
            }

            let deleteUserProfile = await User.findByIdAndDelete(userId).exec();
            if (deleteUserProfile) {
                await ForgotPassword.deleteMany({ userId: userId }).exec();
                await UserAnswer.deleteMany({ userId: userId }).exec();

                return { status: httpsCodes.SUCCESS_CODE, message: language.PROFILE_DELETED };
            } else {
                return { status: httpsCodes.NOT_FOUND, message: language.NOT_FOUND };
            }

        } catch (error) {
            console.log(error.message);
            return { status: httpsCodes.INTERNAL_SERVER_ERROR, message: language.INTERNAL_SERVER_ERROR };
        }
    }



    static async getAllUsers() {
        try {
            const users = await User.find({ userType: 'user' }).exec(); // Find all users with userType 'user'

            if (!users || users.length === 0) {
                return { status: httpsCodes.NOT_FOUND, message: language.NO_USERS_FOUND };
            }

            return { status: httpsCodes.SUCCESS_CODE, message: language.USERS_FOUND, result: users };
        } catch (error) {
            console.error(error);
            return { status: httpsCodes.INTERNAL_SERVER_ERROR, message: language.INTERNAL_SERVER_ERROR };
        }
    }

    static async getUserDetailsById(userId) {
        try {
            // Convert userId to ObjectId
            const userid = new mongoose.Types.ObjectId(userId);

            // Fetch user details along with their answers from UserAnswer collection
            const userDetails = await User.aggregate([
                { $match: { _id: userid } },
                {
                    $lookup: {
                        from: 'useranswers',
                        localField: '_id',
                        foreignField: 'userId',
                        as: 'userAnswers'
                    }
                },
                {
                    $project: {
                        username: 1,
                        email: 1,
                        gender: 1,
                        phonenumber: 1,
                        userType: 1,
                        ceremony: 1,
                        createdAt: 1,
                        userAnswers: 1 // Include user answers in the response
                    }
                }
            ]);

            if (!userDetails || userDetails.length === 0) {
                return { status: httpsCodes.NOT_FOUND, message: language.NOT_FOUND };
            }

            return { status: httpsCodes.SUCCESS_CODE, message: language.RECORD_FOUND, result: userDetails[0] };
        } catch (error) {
            console.error("Error fetching user details:", error);
            return { status: httpsCodes.INTERNAL_SERVER_ERROR, message: language.INTERNAL_SERVER_ERROR };
        }
    }

    static async getAllUserDetailsById(userId) {
        try {
            // Convert userId to ObjectId
            const userid = new mongoose.Types.ObjectId(userId);

            // Fetch user details along with their answers from UserAnswer collection
            const userDetails = await User.aggregate([
                { $match: { _id: userid } },
                {
                    $lookup: {
                        from: 'useranswers',  // Join with UserAnswer collection
                        localField: '_id',
                        foreignField: 'userId',
                        as: 'userAnswers'
                    }
                },
                {
                    $unwind: { path: "$userAnswers", preserveNullAndEmptyArrays: true } // Flatten userAnswers array if needed
                },
                {
                    $lookup: {
                        from: 'questionnaires', // Assuming there's a Questionnaire collection for sub-question details
                        localField: 'userAnswers.subQuestionAnswers.subQuestionId',
                        foreignField: '_id',
                        as: 'userAnswers.subQuestionDetails'
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        username: { $first: "$username" },
                        email: { $first: "$email" },
                        gender: { $first: "$gender" },
                        phonenumber: { $first: "$phonenumber" },
                        userType: { $first: "$userType" },
                        ceremony: { $first: "$ceremony" },
                        createdAt: { $first: "$createdAt" },
                        userAnswers: { $push: "$userAnswers" } // Re-group answers per user
                    }
                },
                {
                    $project: {
                        username: 1,
                        email: 1,
                        gender: 1,
                        phonenumber: 1,
                        userType: 1,
                        ceremony: 1,
                        createdAt: 1,
                        userAnswers: {
                            questionId: 1,
                            completed: 1,
                            answeredAt: 1,
                            ceremony: 1,
                            canAttempt: 1,
                            subQuestionAnswers: {
                                subQuestionId: 1,
                                answer: 1,
                                answerType: 1,
                                // Include sub-question text from subQuestionDetails array
                                questionText: { $arrayElemAt: ["$userAnswers.subQuestionDetails.questionText", 0] }
                            }
                        }
                    }
                }
            ]);

            if (!userDetails || userDetails.length === 0) {
                return { status: httpsCodes.NOT_FOUND, message: language.NOT_FOUND };
            }

            return { status: httpsCodes.SUCCESS_CODE, message: language.RECORD_FOUND, result: userDetails[0] };
        } catch (error) {
            console.error("Error fetching user details:", error);
            return { status: httpsCodes.INTERNAL_SERVER_ERROR, message: language.INTERNAL_SERVER_ERROR };
        }
    }

    static async getAllAnswers() {
        let users = await UserAnswer.find().exec();
        return users;
    }

    static async getUserSpecificAnswers(reqObj) {
        try {
            const { tokken } = reqObj;

            const verifiedToken = await verifyToken(tokken);
            const userId = verifiedToken?.data?.user;

            if (!userId) {
                return { status: httpsCodes.UNAUTHORIZE_CODE, message: language.UNAUTHORIZE_CODE };
            }

            let usersSpecificans = await UserAnswer.find({ userId: userId })
                .populate('questionId') 
                .populate('userId') 
                .populate({
                    path: 'subQuestionAnswers.subQuestionId', 
                    model: 'Questionnaire', 
                })
                .exec();


            if (!usersSpecificans) {
                return { status: httpsCodes.NOT_FOUND, message: language.NOT_FOUND };
            }

            return { status: httpsCodes.SUCCESS_CODE, message: language.RECORD_FOUND, result: usersSpecificans };


        } catch (error) {
            console.log(error.message);
            throw error;
        }
    }


}

module.exports = UserService;