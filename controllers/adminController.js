const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const config = require('../config/config');

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
};

// Load the login page
const loadLogin = async (req, res) => {
    try {

        res.render('login',{ message: "Warning: Only admins are allowed" });
    } catch (error) {
        console.error('Error loading login page:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

// Verify login credentials
const verifyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email: email });

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);

            if (passwordMatch) {
                if (userData.is_admin === true) {
                    req.session.user_id = userData._id;
                    return res.redirect('/admin/home');
                } else {
                    return res.render('login', { message: 'You are not an admin' });
                }
            } else {
                return res.render('login', { message: 'Email or password is incorrect' });
            }
        } else {
            return res.render('login', { message: 'Email or password is incorrect' });
        }
    } catch (error) {
        console.error('Error verifying login:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

// Load admin dashboard
const loadDashboard = async (req, res) => {
    try {
        const userData = await User.findById(req.session.user_id);
        res.render('home', { admin: userData });
    } catch (error) {
        console.error('Error loading dashboard:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

// Admin authentication middleware
const isAdmin = async (req, res, next) => {
    try {
        const userId = req.session.user_id;

        if (!userId) {
            return res.redirect('/admin');
        }

        const user = await User.findById(userId);
        if (user && user.is_admin === true) {
            next();
        } else {
            return res.redirect('/home');
        }
    } catch (error) {
        console.error('Admin authentication error:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

// Logout functionality
const logout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/admin');
    } catch (error) {
        console.error('Error logging out:', error.message);
    }
};

const adminDashboard = async (req, res) => {
    try {
        let usersData = req.session.searchResults || [];
        const message = req.query.message || null;

        if (usersData.length === 0) {
            usersData = await User.find({ is_admin: false });
        }

        req.session.searchResults = null;

        res.render('dashboard', {
            users: usersData,
            message: message
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const searchUser = async (req, res) => {
    try {
        const searchData = req.body.searchItem || "";
        const regex = new RegExp(`^${searchData}`, `i`);
        const usersData = await User.find({
            is_admin: false,
            $or: [{ name: { $regex: regex } }, { email: { $regex: regex } }],
        });
        if (usersData.length > 0) {
            // Store search results in session
            req.session.searchResults = usersData;
            return res.redirect(`/admin/dashboard?message=Search completed successfully`);
        } else {
            req.session.searchResults = []; // Store empty array if no users found
            return res.redirect(`/admin/dashboard?message=No users found`);
        }
    } catch (error) {
        console.log(error.message);
        return res.redirect(`/admin/dashboard?message=An error occurred during search`);
    }
};



const newUserLoad = (req, res) => {
    const message = req.query.message;
    res.render('new-user', { message });
};

const addUser = async (req, res) => {
    try {
        const { name, email, phone, password} = req.body;
        const image = req.file ? req.file.filename : '';

        if (!name || !email || !phone || !image || !password) {
            return res.redirect(`/admin/new-user?message=All fields are required`);
        }

        const existingUser = await User.findOne({ $or: [{ email }, { mobile: phone }] });
        if (existingUser) {
            return res.redirect(`/admin/new-user?message=Email or mobile number already in use`);
        }

        const spassword = await securePassword(password);

        const user = new User({
            name,
            email,
            mobile: phone,
            image,
            password: spassword,
            is_admin: false,
        });

        const userData = await user.save();
        if (userData) {
            return res.redirect(`/admin/new-user?message=New user added successfully`);
        } else {
            return res.redirect(`/admin/new-user?message=Something went wrong, please try again`);
        }
    } catch (error) {
        console.error('Error adding user:', error.message);
        return res.redirect(`/admin/new-user?message=An error occurred while adding the user`);
    }
};

const editUserLoad = async (req, res) => {
    try {
        const id = req.params.id;
        const message = req.query.message;
        const userData = await User.findById(id);

        if (userData) {
            return res.render('edit-user', { user: userData, message});
        } else {
            return res.redirect(`/admin/dashboard?message=User not found`);
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const password = req.body.password;
        let passwordHash;
        if(password){
            passwordHash = await securePassword(password);
        } else {
            let oldPass = await User.findById(userId);
            if(!oldPass) {
                res.redirect("/admin/dashboard?message=User password not found.")
            }
            passwordHash = await oldPass.password
        }

        const updateData = {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.phone,
            password: passwordHash
        };

        if (req.file) {
            updateData.image = req.file.filename;
        }

        const userData = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true });

        if (userData) {
            res.redirect(`/admin/dashboard?message=User updated successfully`);
        } else {
            res.redirect(`/admin/dashboard?message=User not found`);
        }
    } catch (error) {
        console.log('Error updating user:', error.message);
        res.redirect(`/admin/dashboard?message=An error occurred while updating the user`);
    }
};

const deleteUser = async (req, res) => {
    try {
        const id = req.params.id;
        console.log(id)
        await User.findByIdAndDelete(id);
        res.redirect('/admin/dashboard?message=User deleted successfully');
    } catch (error) {
        console.error('Error deleting user:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

const toggleBanStatus = async (req, res) => {
    try {
        const userId = req.params.id;
        const { isBanned } = req.body;

        // Update the user's banned status
        await User.findByIdAndUpdate(userId, { isBanned: isBanned });

        return res.json({ message: 'User ban status updated successfully' });
    } catch (error) {
        console.error('Error updating ban status:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// // In your route file
// app.post('/admin/ban-user/:id', toggleBanStatus);


const disableUser = async (req, res) => {
    try {
        const id = req.query.id;
        const user = await User.findById(id);

        if (user) {
            const updatedStatus = user.is_active === 1 ? 0 : 1;
            await User.findByIdAndUpdate(id, { is_active: updatedStatus });
            res.redirect(`/admin/dashboard?message=User status updated successfully`);
        } else {
            res.redirect(`/admin/dashboard?message=User not found`);
        }
    } catch (error) {
        console.error('Error disabling user:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    loadLogin,
    verifyLogin,
    loadDashboard,
    isAdmin,
    logout,
    adminDashboard,
    newUserLoad,
    addUser,
    editUserLoad,
    updateUser,
    deleteUser,
    toggleBanStatus,
    searchUser,
    disableUser
};
