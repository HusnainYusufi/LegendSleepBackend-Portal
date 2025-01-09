const User = require('../models/User.model');
const { language } = require('../language/language');
const { createToken, verifyToken } = require('../modules/helper');
const { httpsCodes } = require('../modules/constants');
const UserService = require('../services/UserService')
const bcrypt = require('bcrypt');
const ForgotPassword = require('./ForgotPassword');
const SharedService = require('./SharedServices');
const logger = require('../modules/logger'); // Import logger

'use-strict';

class AuthService {

    static async login(reqObj) {
        try {
          
            let { email, password } = reqObj;
            let result = "";

            let verifyUser = await UserService.verifyUser({ email });
            if (verifyUser.status !== 200) {
                return { status: 404, message: 'User not found.' };
            }
           
            const user = verifyUser.result;

            const isPasswordMatched = await bcrypt.compare(password, user.password);
            if (!isPasswordMatched) {
                return { status: 401, message: 'Invalid email or password.' };
            }
            const jwtToken = await createToken({ user });
        
            if (jwtToken) {
                result = { status: 200, message: "Record Found", result: { jwtToken, userType : user.RoleId.name , username : user.username } };
            }

            return result;
        } catch (error) {
            logger.error('Error in AuthService - Login SuperAdmin:', {
                message: error.message,
                stack: error.stack,
                data: reqObj
            });
            throw error;
        }
    }

    static async signupSuperAdmin(reqObj, roleId) {
        try {
            const { email, username, password, gender, phonenumber, address } = reqObj;

            // Validate required fields
            if (!email || !username || !password || !gender || !address) {
                return { status: 400, message: 'All fields are required.' };
            }

            // Check if the email already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return { status: 409, message: 'User with this email already exists.' };
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create the SuperAdmin user
            const superAdmin = new User({
                email,
                username,
                password: hashedPassword,
                gender,
                phonenumber,
                Address: address,
                RoleId: roleId // Assign the SuperAdmin role ID
            });

            // Save the user to the database
            const savedUser = await superAdmin.save();

            if (savedUser) {
                return { status: 201, message: 'SuperAdmin successfully created.', data: savedUser };
            } else {
                return { status: 500, message: 'Failed to create SuperAdmin.' };
            }
        } catch (error) {
            logger.error('Error in AuthService - Signup SuperAdmin:', {
                message: error.message,
                stack: error.stack,
                data: reqObj
            });
            throw error;
        }
    }


    static async forgotPassword(reqObj) {
        let result = "";
        try {
            let { email } = reqObj;

            let verifyUser = await UserService.verifyUser({ email });

            if (verifyUser.status === 200) {

                let otp = await ForgotPassword.generateAndSendOtp(verifyUser);
                if (otp.messageId) {
                    result = { status: httpsCodes.SUCCESS_CODE, message: language.OTP_SENT }
                }
            } else {

                result = { status: httpsCodes.NOT_FOUND, message: language.NOT_FOUND }
            }

            return result;

        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    static async resetPassword(reqObj) {
        let result = "";
        try {
            let { password, email } = reqObj;

            if (!password || !email) {
                return { status: httpsCodes.BAD_REQUEST, message: language.BAD_REQUEST }
            }

            let verifyUserEmail = await UserService.verifyUser({ email });
            if (verifyUserEmail.status === 200) {

                let hassedpassword = await bcrypt.hash(password, 10);
                let updatePassword = await User.findOneAndUpdate({ _id: verifyUserEmail?.result?._id }, { password: hassedpassword }).exec();

                if (updatePassword) {
                    result = { status: httpsCodes.RECORD_CREATED, message: language.RECORDS_UPDATED }
                } else {
                    result = { status: httpsCodes.BAD_REQUEST, message: language.INTERNAL_SERVER_ERROR }
                }

            } else {
                result = { status: httpsCodes.BAD_REQUEST, message: language.NOT_FOUND };

            }
            return result;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    static async verifyJwtTokken(reqObj) {
        let result = "";
        try {
            const { jwtTokken } = reqObj;
            const verifiedTokken = await verifyToken(jwtTokken);

            if (verifiedTokken && verifiedTokken.message === 'Token Verified') {
                result = { status: httpsCodes.SUCCESS_CODE, message: language.TOKKEN_LIVE };
            } else {
                result = { status: httpsCodes.UNAUTHORIZE_CODE, message: language.NO_AUTH_GIVEN };
            }

            return result;
        } catch (error) {
            console.log(error);
            throw new Error("Token verification failed");
        }
    }


}

module.exports = AuthService;