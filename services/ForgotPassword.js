// const Forgot = require('../models/ForgotPassword.model');
// const otpGenerator = require('otp-generator');
// const { sendEmail } = require('../modules/helper');
// const { httpsCodes } = require('../modules/constants');
// const { language } = require('../language/language');
// const { createToken } = require('../modules/helper');
// const UserService = require('./UserService');
// require('dotenv').config();
// 'use-strict'

// class ForgotPassword {

//     static async generateAndSendOtp(reqObj){

//         let result = "";
//         let { _id , email , username } = reqObj.result;

//         if(!_id || !email || !username){
//             return { status : httpsCodes.BAD_REQUEST , message : language.BAD_REQUEST}
//         }
  
//         try {
//             const otp = otpGenerator.generate(6, {
//                 upperCaseAlphabets: false, 
//                 lowerCaseAlphabets: false, 
//                 specialChars: false,       
//                 digits: true               
//             });

//               let getUserDetails = await UserService.verifyUser({ email });
//               if(getUserDetails.status === 200){

//                 let otpdata = new Forgot({
//                     userId: getUserDetails?.result?._id,
//                     otp: otp,
//                     expiresAt: new Date(Date.now() + 25 * 60 * 1000)
//                 });
//                 const savedOtp =  await otpdata.save();

//                 if (savedOtp) {
   
//                  let sentOtp = await sendEmail({
//                        from: process.env.MAIL_USER, 
//                        to: email,
//                        subject: 'Your OTP Code',
//                        text: `Hello ${username},\n\nYour OTP code is: ${otp}. It will expire in 3 minutes.\n\nThank you!`,
//                        html: `<p>Hello ${username},</p><p>Your OTP code is: <strong>${otp}</strong>. It will expire in 3 minutes.</p><p>Thank you!</p>`
//                    });

//                    return sentOtp;

//               }
            
//             }else{
//                 result = { status : httpsCodes.BAD_REQUEST , message : language.NOT_FOUND}
//             }
//              return result;
//         } catch (error) {
//             console.log(error);
//             throw error;
//         }
//     }

//     static async verifyOtp(reqObj) {
//         try {
//             const { otp, email } = reqObj;
    
//             if (!otp || !email) {
//                 return { status: httpsCodes.BAD_REQUEST, message: language.BAD_REQUEST };
//             }
    
//             let verifyUser = await UserService.verifyUser({ email });
//             if (!verifyUser) {
//                 return { status: httpsCodes.NOT_FOUND, message: 'User not found' };
//             }
    
//             let verifyOtp = await Forgot.findOne({
//                 userId: verifyUser?.result?._id,
//                 otp: otp,
//                 isUsed: false,
//             });
    
//             if (!verifyOtp) {
//                 return { status: httpsCodes.BAD_REQUEST, message: 'Invalid OTP' };
//             }
    
//             const currentTime = new Date();
    
//             // Calculate the time difference in milliseconds
//             const timeDifference = verifyOtp.expiresAt - currentTime;
    
//             // Convert 5 minutes to milliseconds (5 * 60 * 1000)
//             const fiveMinutesInMillis = 25 * 60 * 1000;
    
//             if (timeDifference < 0 || timeDifference > fiveMinutesInMillis) {
//                 return { status: httpsCodes.BAD_REQUEST, message: language.OTP_EXPIRED };
//             }

//             verifyOtp.isUsed = true;
//             await verifyOtp.save();
//             const jwtTokken = await createToken({ userData : verifyUser });
    
//             return { status: httpsCodes.SUCCESS_CODE, message: language.RECORD_FOUND , tokken : jwtTokken };
    
//         } catch (error) {
//             console.log(error);
//             throw error;
//         }
//     }
    

// }

// module.exports = ForgotPassword;