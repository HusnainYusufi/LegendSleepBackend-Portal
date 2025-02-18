'use strict';
const routes = (app) => {
    app.use('/auth', require('../controllers/AuthController'));
    app.use('/admin', require('../controllers/AdminController'));
    app.use('/leads', require('../controllers/LeadsController'));
    app.use('/role', require('../controllers/RoleController'));
    app.use('/user', require('../controllers/UserController'));
    app.use('/leadsassign' , require('../controllers/LeadAssignmentController'));
    app.use('/ticket' , require('../controllers/TicketController'));
};

module.exports = {
    routes
};
