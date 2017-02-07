const express = require('express')
const router = express.Router()
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const expressValidator = require('express-validator')
const mongoose = require('mongoose')

const app = express()

const User = require('../models/user')

//email validator
app.use(expressValidator({
 customValidators: {
    eduEmail: function(email) {
        return email.substring(email.length-4, email.length+1) === '.edu'
    }
 }
}));

//get register view
router.get('/register', (req, res) => {
    res.render('register')
})
//get register view
router.get('/register_business', (req, res) => {
    res.render('register_business')
})
//get register view
router.get('/register_talent', (req, res) => {
    res.render('register_talent')
})
//login
router.get('/login', (req, res) => {
    res.render('login')
})
//dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) => {
    if (req.user.account_type === 'business') {
        res.render('dashboard_business')
    } 
    if (req.user.account_type === 'talent') {
        /*User.find({'account_type': 'business'}, (err, company) => {
            if (err) return handleError(err)
            console.log(company)
        })*/
        res.render('dashboard_talent')
    } 
})
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    } else {
        res.redirect('/users/login')
    }
}
//post business registration form
router.post('/register_business', (req, res) => {
    let user_address = `${req.body.address}, ${req.body.city}, ${req.body.region} ${req.body.postalcode}`
    let name = req.body.name
    let email = req.body.email
    let website1 = req.body.website1
    let address = user_address
    let username = req.body.username
    let password = req.body.password
    let password2 = req.body.password2

    //validation
    req.checkBody('name', 'Name is required.').notEmpty()
    req.checkBody('email', 'Email is required.').notEmpty()
    req.checkBody('email', 'Email is not valid.').isEmail()
    req.checkBody('address', 'Address is required.').notEmpty()
    req.checkBody('city', 'City is required.').notEmpty()
    req.checkBody('region', 'Region is required.').notEmpty()
    req.checkBody('postalcode', 'Postal Code is required.').notEmpty()
    req.checkBody('username', 'Name is required.').notEmpty()
    req.checkBody('password', 'Password is required.').notEmpty()
    req.checkBody('password2', 'Passwords do not match.').equals(req.body.password)

    let errors = req.validationErrors()
    if (errors) {
        res.render('register_business', {
            errors: errors
        })
    } else {
        let newUser = new User({
            name: name,
            email: email,
            website1: website1,
            address: address,
            username: username,
            password: password,
            account_type: 'business'
        })
        User.createUser(newUser, (err, user) => {
            if (err) throw err
            console.log(user)
        })
        req.flash('success_msg', 'You have successfully registered.')
        res.redirect('/users/login')
    }
})

//post student registration form
router.post('/register_talent', (req, res) => {
    let user_address = `${req.body.city}, ${req.body.region} ${req.body.postalcode}`
    let name = req.body.name
    let email = req.body.email
    let website1 = req.body.website1
    let website2 = req.body.website2 ? req.body.website2 : ''
    let address = user_address
    let username = req.body.username
    let password = req.body.password
    let password2 = req.body.password2

    //validation
    req.checkBody('name', 'Name is required.').notEmpty()
    req.checkBody('email', 'Email is required.').notEmpty()
    req.checkBody('email', 'Email is not valid.').isEmail()
    req.checkBody('email', 'Email must be .edu.').eduEmail()
    req.checkBody('city', 'City is required.').notEmpty()
    req.checkBody('region', 'Region is required.').notEmpty()
    req.checkBody('postalcode', 'Postal Code is required.').notEmpty()
    req.checkBody('username', 'Name is required.').notEmpty()
    req.checkBody('password', 'Password is required.').notEmpty()
    req.checkBody('password2', 'Passwords do not match.').equals(req.body.password)

    let errors = req.validationErrors()
    if (errors) {
        res.render('register_talent', {
            errors: errors
        })
    } else {
        let newUser = new User({
            name: name,
            email: email,
            website1: website1,
            website2: website2,
            address: address,
            username: username,
            password: password,
            account_type: 'talent'
        })
        User.createUser(newUser, (err, user) => {
            if (err) throw err
            console.log(user)
        })
        req.flash('success_msg', 'You have successfully registered.')
        res.redirect('/users/login')
    }
})

passport.use(new LocalStrategy(
    function(username, password, done) {
        User.getUserByUsername(username, function(err, user) {
            if (err) throw err
            if (!user) {
                return done(null, false, {message: 'Unknown User'})
            }
            User.comparePassword(password, user.password, function(err, isMatch) {
                if (err) throw err
                if (isMatch) {
                    return done(null, user)
                } else {
                    return done(null, false, {message: 'Invalid password'})
                }
            })
        })
    }
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.getUserById(id, function(err, user) {
        done(err, user);
    });
});

router.post('/login',passport.authenticate('local', {successRedirect: '/users/dashboard', failureRedirect: '/users/login', failureFlash: true}), 
    function(req, res) {
        res.redirect('/')
    }
);

router.get('/logout', function(req, res) {
    req.logout()
    req.flash('success_msg', 'You are logged out.')
    res.redirect('/users/login')
})

module.exports = router