try {
    'use-strict'
    require('dotenv').config();
    const express = require('express');
    const helmet = require('helmet');
    const cors = require('cors');
    const app = express();
    const  { routes } = require('./config/Routes');
    const { Base } = require('./middlewares/Base');
    const logger = require('./modules/logger');
    const errorLoggingMiddleware = require('./middlewares/errorLoggingMiddleware');
    //require('./cronjobs/notifyFollowUps'); // Import the cron job
    const PORT = process.env.PORT;
    app.use(helmet());
    app.use(cors());
    

    Base.init(app).then(() =>{
        routes(app);
    })
  

    // Use the error logging middleware after all routes
    app.use(errorLoggingMiddleware);

    process.on('uncaughtException', (err) => {
        logger.error('Uncaught Exception:', { message: err.message, stack: err.stack });
        process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection:', { reason: reason?.message || reason, stack: reason?.stack });
        process.exit(1);
    });

} catch (error) {
    console.log(error);
}