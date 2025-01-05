'use strict';
const routes = (app) => {
    app.use('/auth' , require('../controllers/AuthController'));
    // app.use('/user',require('../controllers/UserController'));
    // app.use('/admin', require('../controllers/AdminController'));
    // app.use('/questionare' , require('../controllers/QuestionareController'));
    // app.use('/getFiles', require('../controllers/GetFilesController'));
    // app.use('/sharedServices' , require('../controllers/SharedServicesController'));
    app.use('/country' , require('../controllers/CountryController'));
    app.use('/role' , require('../controllers/RoleController'));
    // Add additional routes as needed
};

module.exports = {
    routes
};
