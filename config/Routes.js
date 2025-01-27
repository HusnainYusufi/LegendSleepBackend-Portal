'use strict';
const routes = (app) => {
    app.use('/auth', require('../controllers/AuthController'));
    app.use('/admin', require('../controllers/AdminController'));
    app.use('/vendor', require('../controllers/VendorController'));
    app.use('/role', require('../controllers/RoleController'));
    app.use('/user', require('../controllers/UserController'));
};

module.exports = {
    routes
};
