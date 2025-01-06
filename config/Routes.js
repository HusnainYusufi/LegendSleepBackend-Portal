'use strict';
const routes = (app) => {
    app.use('/auth' , require('../controllers/AuthController'));
    // app.use('/user',require('../controllers/UserController'));
    app.use('/admin', require('../controllers/AdminController'));
    app.use('/vendor' , require('../controllers/VendorController'));
    app.use('/visa', require('../controllers/VisaController'));
    // app.use('/sharedServices' , require('../controllers/SharedServicesController'));
    app.use('/country' , require('../controllers/CountryController'));
    app.use('/role' , require('../controllers/RoleController'));
    // Add additional routes as needed
};

module.exports = {
    routes
};
