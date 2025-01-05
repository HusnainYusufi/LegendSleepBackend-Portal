const mongoose = require('mongoose'); // Add this line

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { httpsCodes } = require('../modules/constants');
const { language } = require('../language/language');
const SharedModel = require('../models/sharedService.model');

class Shared {

    static async addSharedService(reqObj){
        let result = "";
        try {
            let { ScreenName , MaleVoice , FemaleVoice } = reqObj;
            
            if(!ScreenName){
                return { status : httpsCodes.BAD_REQUEST , message : language.BAD_REQUEST}
            }

            let newShared = new SharedModel({
                ScreenName,
                MaleVoice,
                FemaleVoice
            });

            let sharedsave = await newShared.save();

            if(sharedsave){
                result = { status : httpsCodes.SUCCESS_CODE , message : language.RECORDS_ADDED }
            }else{
                result = { status : httpsCodes.BAD_REQUEST , message : language.INTERNAL_SERVER_ERROR }
            }
            return result;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    static async allSharedServices(reqObj){
        let result = "";
        try {
            let filters = {};

            if(reqObj !== undefined && reqObj.ScreenName){
                filters.ScreenName = reqObj.ScreenName
            }
            let sharedServicesData = await SharedModel.find(filters).exec();

            if(sharedServicesData){
                result = { status : httpsCodes.SUCCESS_CODE , message : language.RECORD_FOUND , result : sharedServicesData}
            }else{
                result = { status : httpsCodes.NOT_FOUND , message : language.NOT_FOUND}
            }
            return result;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}



module.exports = Shared;
