const User = require('../models/User.model');
const { language } = require('../language/language');
const { createToken, verifyToken } = require('../modules/helper');
const { httpsCodes } = require('../modules/constants');
const UserService = require('../services/UserService')
const bcrypt = require('bcrypt');
const ForgotPassword = require('./ForgotPassword');
const Questionnaire = require('../models/Questionare.model');
const UserAnswer = require('../models/UserAnswers');
'use-strict';

class AdminService {

    //get all users
    static async getAllUsers() {
        try {
            const users = await UserService.getAllUsers();
            if (!users || users.length === 0) {
                return { status: httpsCodes.NOT_FOUND, message: language.NO_USERS_FOUND };
            }

            // Return success response with users
            return { status: httpsCodes.SUCCESS_CODE, message: language.USERS_FOUND, result: users };
        } catch (error) {
            console.error("Error in getAllUsers:", error); // Log the error for debugging
            return { status: httpsCodes.INTERNAL_SERVER_ERROR, message: language.INTERNAL_SERVER_ERROR };
        }
    }

    static async getUserDetailById(reqObj) {
        try {
          
            const users = await UserService.getUserDetailsById(reqObj.userId);
            console.log(users);
            if (!users || users.length === 0) {
                return { status: httpsCodes.NOT_FOUND, message: language.NO_USERS_FOUND };
            }

            // Return success response with users
            return { status: httpsCodes.SUCCESS_CODE, message: language.USERS_FOUND, result: users };
        } catch (error) {
            console.error("Error in getAllUsers:", error); // Log the error for debugging
            return { status: httpsCodes.INTERNAL_SERVER_ERROR, message: language.INTERNAL_SERVER_ERROR };
        }
    }


    static async getSingleUserAllDetailById(reqObj) {
        try {
          
            const users = await UserService.getAllUserDetailsById(reqObj.userId);
            console.log(users);
            if (!users || users.length === 0) {
                return { status: httpsCodes.NOT_FOUND, message: language.NO_USERS_FOUND };
            }

            // Return success response with users
            return { status: httpsCodes.SUCCESS_CODE, message: language.USERS_FOUND, result: users };
        } catch (error) {
            console.error("Error in getAllUsers:", error); // Log the error for debugging
            return { status: httpsCodes.INTERNAL_SERVER_ERROR, message: language.INTERNAL_SERVER_ERROR };
        }
    }
    static async getDashboardSummary() {
        try {
            // Get total users
            const totalUsers = await User.countDocuments({ userType: 'user' });

            // Get total questions
            const totalQuestions = await Questionnaire.countDocuments();

            // Get total users who answered at least one question
            const usersWhoAnswered = await UserAnswer.distinct('userId');
            const totalUsersWhoAnswered = usersWhoAnswered.length;

            // Get total answers submitted (count of UserAnswer documents)
            const totalAnswersSubmitted = await UserAnswer.countDocuments();

            // Construct response
            const result = {
                totalUsers,
                totalQuestions,
                totalUsersWhoAnswered,
                totalAnswersSubmitted
            };

            return {
                status: httpsCodes.SUCCESS_CODE,
                message: language.RECORDS_FOUND,
                result
            };
        } catch (error) {
            console.error('Error fetching dashboard summary:', error);
            return {
                status: httpsCodes.INTERNAL_SERVER_ERROR,
                message: language.INTERNAL_SERVER_ERROR
            };
        }
    }
    


}

module.exports = AdminService;