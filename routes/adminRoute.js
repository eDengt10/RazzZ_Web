const express = require('express');
const path = require('path');
const multer = require('multer');
const adminController = require('../controllers/adminController');
const nocache = require('nocache');
const auth = require('../middleware/adminAuth');
const admin_route = express();

// Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/userImages'));
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
});
const upload = multer({ storage: storage });

// View engine setup
admin_route.set('view engine', 'ejs');
admin_route.set('views', path.join(__dirname, '../views/admins'));

// Define routes
admin_route.get('/', auth.isLogout, adminController.loadLogin);
admin_route.post('/', adminController.verifyLogin);
admin_route.get('/home', auth.isLogin, adminController.isAdmin, adminController.loadDashboard); 
admin_route.get('/logout', auth.isLogin, adminController.isAdmin, adminController.logout);
admin_route.get('/dashboard', auth.isLogin, adminController.isAdmin, adminController.adminDashboard);
admin_route.post('/dashboard', auth.isLogin, adminController.searchUser);
admin_route.get('/new-user', auth.isLogin, adminController.isAdmin, adminController.newUserLoad);
admin_route.post('/new-user', upload.single('image'), adminController.addUser);
admin_route.get('/edit-user/:id', auth.isLogin, adminController.isAdmin, adminController.editUserLoad);
admin_route.post('/edit-user/:id', upload.single('image'), adminController.updateUser);
admin_route.get('/delete-user/:id', auth.isLogin, adminController.isAdmin, adminController.deleteUser);
admin_route.post('/ban-user/:id', auth.isLogin, adminController.isAdmin, adminController.toggleBanStatus);

// Catch all other route
admin_route.get('*', (req, res) => {
    res.redirect('/admin');
});

module.exports = admin_route;
