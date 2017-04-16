//handles log in authentication and page accesss
const express = require('express')
const router = express.Router()
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const expressValidator = require('express-validator')
const mongoose = require('mongoose')
const Handlebars = require('express-handlebars')

const app = express()

const User = require('../models/user')
const Student = require('../models/student')

//login
router.get('/login', (req, res) => {
    res.render('login')
})
//renders dashboard based on account type of user
router.get('/dashboard', ensureAuthenticated, (req, res) => {
    if (req.user.account_type === 'business') {
        res.render('business/dashboard_business', {user: req.user})
    } 
    if (req.user.account_type === 'student') {
        res.render('talent/dashboard_student', {user: req.user})
    }
    if (req.user.admin) {
        //render admin page with database documents
        User.find({}, 'name username address contact_info account_type', (err, docs) => {
            if (err) throw err
            else {
                res.render('admin', {docs})
            }
        })
    }
})
//passed into function above as parameter
//prevents user from accessing dashboard if not logged in
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    } else {
        res.redirect('/user/login')
    }
}
//log in authentication
passport.use(new LocalStrategy(function(username, password, done) {
    //check account type
    if(Student.findOne({'username': username})) {
        Student.getStudentByUsername(username, function(err, student) {
            if (err) throw err
            //if username not found in database
            if (!student) {
                return done(null, false, {message: 'Unknown User'})
            }
            Student.comparePassword(password, student.password, function(err, isMatch) {
                if (err) throw err
                if (isMatch) {
                    return done(null, student)
                } else {
                    return done(null, false, {message: 'Invalid password'})
                }
            })
        })
    } /*else if(Business.findOne({'username': username})) {
        Business.getBusinessByUsername(username, function(err, business) {
            if (err) throw err
            //if username not found in database
            if (!business) {
                return done(null, false, {message: 'Unknown User'})
            }
            Business.comparePassword(password, business.password, function(err, isMatch) {
                if (err) throw err
                if (isMatch) {
                    return done(null, business)
                } else {
                    return done(null, false, {message: 'Invalid password'})
                }
            })
        })
    }*/
    
}))

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    //check account type
    if(Student.findById(id)) {
        Student.getStudentById(id, function(err, user) {
            done(err, user);
        });
    } /*else if(Business.findById(id)) {
        console.log('Found business!')
        Business.getBusinessById(id, function(err, user) {
            done(err, user);
        });
    }*/
    
});

//redirects user to dashboard if logged in succesfully, log in page is rerendered otherwise
router.post('/login', passport.authenticate('local', {successRedirect: '/user/dashboard', failureRedirect: '/user/login', failureFlash: true}), 
    function(req, res) {
        res.redirect('/')
    }
)

router.get('/logout', function(req, res) {
    req.logout()
    req.flash('success_msg', 'You are logged out.')
    res.redirect('/user/login')
})

module.exports = router