const express = require("express");
const user_route = express();
const path = require('path');
const multer = require("multer");
const userController = require("../controllers/userController");
const auth = require('../middleware/auth');


user_route.use(express.static('public'));
user_route.set('view engine', 'ejs');
user_route.set('views', "./views/users");
user_route.set("layout", "layouts/layout");

user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));

// Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, path.join(__dirname, '../public/userImages'));
    },
    filename: function (req, file, callback) {
        const name = file.originalname + "-" + Date.now();
        callback(null, name);
    }
});
const upload = multer({ storage: storage });

// Define routes
user_route.get('/register', auth.isLogout, userController.loadRegister);
user_route.post('/register', upload.single('image'), userController.createUser);
user_route.get('/', auth.isLogout, userController.loginLoad);
user_route.get('/login', auth.isLogout, userController.loginLoad);
user_route.post('/login', userController.verifyLogin);
user_route.get('/home', auth.isLogin, userController.loadHome);

user_route.get('/profile', auth.isLogin, userController.loadProfile);
user_route.get('/logout', auth.isLogin, userController.userLogout);

module.exports = user_route;
