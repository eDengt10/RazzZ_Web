const chalk = require('chalk');
const session = require('express-session');
const expressLayout = require('express-ejs-layouts');
require('dotenv').config();
const mongoose = require("mongoose");


//env
const MongoString = process.env.MONGO_CONNECTION_STRING
const HOSTNAME = process.env.HOSTNAME
const PORT = process.env.PORT




mongoose.connect(MongoString)
    .then(() => {
        console.log(chalk.yellowBright.bold("\t|              " + chalk.greenBright.bold("Connected to MongoDB😊") + "                 |"));
        console.log(chalk.yellowBright.bold(`\t|                                                     |`));
        console.log(chalk.yellowBright.bold(`\t-------------------------------------------------------`));
    })
    .catch(err => {
        const errorMessage = chalk.redBright.bold("MongoDB connection error: " + err);
        console.log(errorMessage);
    });

const path = require('path');
const express = require("express");
const app = express();
const expressLayouts = require('express-ejs-layouts');
const nocache = require('nocache');

// Set view engine and layout
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/layout');

// Set up session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 * 60 }
}));

// Use nocache globally
app.use(nocache());

// Use Express' built-in body parser instead of body-parser package
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Route for adminRoutes
const adminRoute = require('./routes/adminRoute');
app.use('/admin', adminRoute);

// Route for userRoutes
const userRoute = require('./routes/userRoute');
app.use('/', userRoute);

// Start server
app.listen(PORT, () => {
    console.log(chalk.yellowBright.bold(`\n\t-------------------------------------------------------`));
    console.log(chalk.yellowBright.bold(`\t|                                                     |`));
    console.log(chalk.yellowBright.bold(`\t|    🌐 Server is running on` + chalk.cyanBright.bold(` http://${HOSTNAME}:${PORT}`) + `    |`));
});
