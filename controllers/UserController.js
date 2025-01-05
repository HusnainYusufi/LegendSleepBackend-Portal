const express = require('express');
const router = express();
const userService = require('../services/UserService');

router.get('/profile' , async (req , res) =>{
   try {
      let tokken = req.headers['authorization'].split(' ')[1];
      let result = await userService.userProfile({tokken});
      return res.json(result);
   } catch (error) {
         console.log(error);
   }
   
});

router.post('/delete/profile' , async (req , res) =>{
   try {
      let tokken = req.headers['authorization'].split(' ')[1];
      let result = await userService.deleteProfile({tokken});
      return res.json(result);
   } catch (error) {
         console.log(error);
   }
   
});

//testing route
router.get('/testing/get/answers' , async(req , res) =>{
   let result = await userService.getAllAnswers();
   return res.json(result);
});

router.get('/userSpecificAnswers' , async (req , res) =>{
   try {
      let tokken = req.headers['authorization'].split(' ')[1];
      let result = await userService.getUserSpecificAnswers({tokken});
      return res.json(result);
   } catch (error) {
      console.log(error.message);
   }

});

module.exports = router;