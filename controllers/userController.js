const User = require('../models/userModel');
const bcrypt = require('bcrypt')

const securePassword = async(password) => {
    try { 
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash;
    } catch (error) {
        console.log(error.message)
    }
}

const loadRegister = async(req,res) => { 
    try {
        const message = req.query.message || '';
        res.render('registration',{
            action: "/register",
            title: "RazzZ - Registration",
            message: message
        })
    } catch (error) {
        console.log(error.message)
    }
}

const createUser = async(req,res) => {
    try {
        const { email, phoneNumber, password} = req.body;
        console.log(email);
        
        const existingUser = await User.findOne({ $or: [{email},{mobile:phoneNumber}]});
        if(existingUser) {
            return res.redirect('/register?message=Username or email already exists');
        };
        const spassword = await securePassword(password)
        const user = new User({
            name:req.body.name,
            email:email,
            mobile:phoneNumber,
            password:spassword,
            image:req.file.filename,
            is_admin:0
        })
        const userData = await user.save();
        
        if(userData) {
            return res.redirect('/register?message=Registration Successful. Login now&action=/register&title=RazzZ - Registration');
        } else {
            return res.redirect('/register?message=Registration Failed&action=/register&title=RazzZ - Registration');
        }
    } catch (error) {
        console.log(error.message)
    }
}

// Login user methods started
const loginLoad = async(req,res) => {
    try {
        const message = req.query.message;
        res.render('login',{
            action: "/login",
            title: "RazzZ - login",
            message: message
        })
    } catch(error) {
        console.log(error.message)
    }
}

const verifyLogin = async(req,res) => {
    try {
        const { email, password} = req.body;
        const userData = await User.findOne({email:email});

        if(userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password)
            if(passwordMatch) {
                req.session.user_id = userData._id;
                res.redirect('/home')
            } else {
                res.redirect('/login?message=Email or password is incorrect.')
            }
        } else {
            res.redirect('/login?message=Email or password is incorrect.2')
        }
    } catch (error) {
        console.log(error.message)
        res.redirect('/login?message=Something went wrong.')
    }
}

const loadHome = async(req,res) => {
    try {
        const userData = await User.findById({_id:req.session.user_id})
        res.render('home',{
            title:"RazzZ - Home",
            user: userData
        })
    } catch (error) {
        console.log(error.message)
    }

}

const loadProfile = async(req,res) => {
    try {
        const userData = await User.findById({_id:req.session.user_id})
        res.render('profile',{
            title:"RazzZ - Profile",
            user: userData
        })

    } catch (error) {
        console.log(error.message)
    }

}

const userLogout = async(req,res) => {
    try {
        req.session.destroy();
        res.redirect('/');
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    loadRegister,
    createUser,
    loginLoad,
    verifyLogin,
    loadHome,
    loadProfile,
    userLogout
}