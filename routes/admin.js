const express = require("express");
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');

const { ensureAuthenticated } = require("../helpers/auth");

const upload = require("../app").upload;
const s3 = require("../app").s3;

const path = require("path");
var fs = require('fs');


const router = express.Router();

// Load User Model
require("../models/User");
const User = mongoose.model("users");

// Load Event model
require("../models/Event");
const Event = mongoose.model("events");

// Login Page
router.get('/login', (req, res) => {
    res.render('admin/login', { layout: "dashboard" });
});

// Register Page -:Disabled
router.get('/register', (req, res) => {
    res.render('admin/register', { layout: "dashboard" });
});

// Login Form POST
router.post('/login', (req, res, next) => {
    console.log("someone is logging in!")
    passport.authenticate('local', {
        successRedirect: '/admin',
        failureRedirect: '/admin/login',
        failureFlash: true
    })(req, res, next);

});

// Register Form POST
router.post('/register', (req, res) => {
    let errors = [];

    //errors.push({ text: 'Registration is not possible' });

    if (req.body.password != req.body.password2) {
        errors.push({ text: 'Passwords do not match' });
    }

    if (req.body.password.length < 4) {
        errors.push({ text: 'Password must be at least 4 characters' });
    }

    if (errors.length > 0) {
        res.render('admin/login', {
            errors: errors,
            name: req.body.name,
            password: req.body.password,
            password2: req.body.password2,
            layout: 'admin'
        });
    } else {
        User.findOne({ name: req.body.name })
            .then(user => {
                if (user) {
                    req.flash('error_msg', 'UserName is not available');
                    res.redirect('/admin/login');
                } else {
                    const newUser = new User({
                        name: req.body.name,
                        password: req.body.password,
                    });
                    bcrypt.genSalt((err, salt) => {
                        if (err) throw err;
                        bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if (err) throw err;
                            newUser.password = hash;

                            newUser.save()
                                .then(user => {
                                    req.flash('success_msg', 'You are now registered and can log in');
                                    res.redirect('/admin/login');
                                })
                                .catch(err => {
                                    console.log(err);
                                    return;
                                });
                        });
                    });
                }
            });
    }
});

// Logout User
router.get('/logout', ensureAuthenticated, (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/admin/login');
});

// Index dashboard page
router.get('/', ensureAuthenticated, (req, res) => {
    res.render('admin/index', { layout: 'dashboard' });
});

// Event list page
router.get('/events', ensureAuthenticated, (req, res) => {
    Event.find({}, (err, result) => {
        if (err) {
            req.flash('error_msg', err);
        } else {
            //projects: [{ title: "Edinet- pol de crestere economica", description: "pretty good project!", key: "background-1554024904339.jpg" }]
            res.render('admin/events', {
                layout: 'dashboard',
                events: result
            });
        }
    });
});

//New Event form page
router.get('/event/new', ensureAuthenticated, (req, res) => {
    res.render('admin/event-add-form', {
        layout: 'dashboard',
    });
});

//Submit Event
router.post('/event/upload', ensureAuthenticated, (req, res) => {

	/* NOTE: The form has enctype="multipart/form-data" enabled
	 * This means body-parser cannot process the form data
	 * Multer is parsing the form-data below along with files
	 * in / upload(()=>{}); below / 
	*/

    //Upload the images to s3 webserver
    upload(req, res, (err) => {
        if (err) {
            req.flash('error_msg', 'There has been an ' + err);
            res.redirect('/admin/events');
        } else {
            let bgkey, thumbkey, date = Date.now();
            //Save the project data to mongoDB
            if (req.files.background) {
                bgkey = req.files.background[0].key;
            } else bgkey = "thumbnail-1554469053905.jpg";

            if (req.files.thumbnail) {
                thumbkey = req.files.thumbnail[0].key;
            } else thumbkey = "thumbnail-1554469053905.jpg";

            if (req.body.date) {
                date = req.body.date;
            }
            let pathdir = path.resolve(process.cwd(), "./locales")
            console.log(pathdir);
            fs.readdir(pathdir, (err, files) => {
                if (err) console.log(err);
                else {
                    let en = JSON.parse(files[0]);
                    let ro = JSON.parse(files[1]);
                    let ru = JSON.parse(files[2]);

                    en[req.body.titleEn] = req.body.titleEn;
                    ro[req.body.titleEn] = req.body.titleRo;
                    ru[req.body.titleEn] = req.body.titleRu;

                    en[req.body.subTitleEn] = req.body.subTitleEn;
                    ro[req.body.subTitleEn] = req.body.subTitleRo;
                    ru[req.body.subTitleEn] = req.body.subTitleRu;

                    fs.writeFile(pathdir + "\\en.json", JSON.stringify(en), 'utf8', (err) => {
                        if (err) console.log(err);
                    });
                    fs.writeFile(pathdir + '\\ro.json', JSON.stringify(ro), 'utf8', (err) => {
                        if (err) console.log(err);
                    });
                    fs.writeFile(pathdir + '\\ru.json', JSON.stringify(ru), 'utf8', (err) => {
                        if (err) console.log(err);
                    });
                }
            })

            // Upload to MongoDB
            new Event({
                title: req.body.titleEn,
                subTitle: req.body.subTitleEn,
                descriptionEn: req.body.descriptionEn,
                descriptionRo: req.body.descriptionRo,
                descriptionRu: req.body.descriptionRu,
                backgroundKey: bgkey,
                thumbnailKey: thumbkey,
                date: date
            }).save()
                .then(data => {
                    req.flash('success_msg', 'Event added!');
                    res.redirect('/admin/events');
                });
        }
    });
});

// Delete project
router.delete('/event/delete/:id', ensureAuthenticated, (req, res) => {

    Project.findByIdAndDelete(req.params.id, (err, result) => {
        if (err) {
            console.log(err);
            req.flash("error_msg", err);
        } else {
            req.flash("success_msg", "Project from MongoDB.");
        }

        s3.deleteObjects({
            Bucket: "cdci",
            Delete: {
                Objects: [
                    {
                        Key: ("images//" + result.backgroundKey).toString()
                    },
                    {
                        Key: ("images//" + result.thumbnailKey).toString()
                    }
                ],
            }
        }, (err, data) => {
            if (err) {
                console.log(err);
                req.flash("error_msg", err.stack);
            } else {
                req.flash("success_msg", "Project images deleted.");

            }
            res.redirect("/admin/dashboard/projects");
        });


    });
});

module.exports = router;
