const express = require("express");
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');

const { ensureAuthenticated } = require("../helpers/auth");

const ImageUpload = require("../app").ImageUpload;
const s3 = require("../app").s3;
const multer = require('multer');

const updateJsonLocaleFields = require("../helpers/functions").updateJsonLocaleFields;

const router = express.Router();

// Load User Model
require("../models/User");
const User = mongoose.model("users");

// Load Event model
require("../models/Event");
const Event = mongoose.model("events");

// Load News model
require("../models/News");
const News = mongoose.model("news");

// Load Registrations model
require("../models/Registration");
const Registration = mongoose.model("registrations");

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
    passport.authenticate('local', {
        successRedirect: '/admin',
        failureRedirect: '/admin/login',
        failureFlash: true
    })(req, res, next);

});

// Register Form POST
router.post('/register', (req, res) => {
    let errors = [];

    errors.push({ text: "Registering is not available" });

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
            layout: 'dashboard'
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


/** Event/News EDIT FORM PUT EXPLANATION of files
 * the edit put form is of enctype=multipart/form-data
 * this means body-parser cannot parse the form body
 * instead, multer is used to parse this form in the [ ImageUpload ] object
 * firstly, multer automatically detects if either or both of the files
 * have been sent through the form and uploads them straight away
 * then in the script it is checked again wether either of these files 
 * have been sent and if a file has indeed been sent (and is already uploaded), 
 * then the new path to the image is also updated to mongoDB
 */

//#region [rgba(165, 255, 0,0.05)] EVENTS CRUD

// Event list page
router.get('/events', ensureAuthenticated, (req, res) => {
    Event.find({}, (err, result) => {
        if (err) {
            req.flash('error_msg', err);
        } else {
            //projects: [{ title: "Edinet- pol de crestere economica", description: "pretty good project!", key: "background-1554024904339.jpg" }]\
            res.render('admin/events', {
                layout: 'dashboard',
                events: result
            });
        }
    });
});

// New Event form page
router.get('/event/new', ensureAuthenticated, (req, res) => {
    res.render('admin/event-add-form', {
        layout: 'dashboard'
    });
});

// Edit Event form page
router.get("/event/edit/:id", ensureAuthenticated, (req, res) => {
    Event.findById(req.params.id, (err, data) => {
        if (err) console.log(err);
        else {
            res.render("admin/event-edit-form", {
                layout: 'dashboard',
                event: data
            })
        }
    });
});

// Edit Event PUT
router.put('/event/edit', ensureAuthenticated, (req, res) => {
    ImageUpload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.log(err);
        }
        Event.findById(req.body.id, (err, result) => {
            if (err) console.log(err);
            else {
                let newEvent = {
                    title: req.body.titleEn,
                    location: req.body.locationEn,
                    shortDescription: req.body.shortDescriptionEn,
                    descriptionEn: req.body.descriptionEn,
                    descriptionRo: req.body.descriptionRo,
                    descriptionRu: req.body.descriptionRu
                }
                // Edit En locale json file
                updateJsonLocaleFields("en", {
                    [req.body.titleEn]: req.body.titleEn,
                    [req.body.locationEn]: req.body.locationEn,
                    [req.body.shortDescriptionEn]: req.body.shortDescriptionEn
                });

                // Edit Ro locale json file
                updateJsonLocaleFields("ro", {
                    [req.body.titleEn]: req.body.titleRo,
                    [req.body.locationEn]: req.body.locationRo,
                    [req.body.shortDescriptionEn]: req.body.shortDescriptionRo
                });

                // Edit Ru locale json file
                updateJsonLocaleFields("ru", {
                    [req.body.titleEn]: req.body.titleRu,
                    [req.body.locationEn]: req.body.locationRu,
                    [req.body.shortDescriptionEn]: req.body.shortDescriptionRu
                });

                // If the background image is overriden
                if (req.files.background) {
                    newEvent.backgroundKey = req.files.background[0].key;
                    s3.deleteObjects({
                        Bucket: "tohateenhub",
                        Delete: {
                            Objects: [
                                {
                                    Key: ("images//" + result.backgroundKey).toString()
                                }
                            ],
                        }
                    }, (err, data) => {
                        if (err) {
                            console.log(err);
                            req.flash("error_msg", err.stack);
                        } else {
                            req.flash("success_msg", "Background deleted successfully");
                        }
                    });
                }

                // If the thumbnail image is overriden
                if (req.files.thumbnail) {
                    newEvent.thumbnailKey = req.files.thumbnail[0].key;
                    s3.deleteObjects({
                        Bucket: "tohateenhub",
                        Delete: {
                            Objects: [
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
                            req.flash("success_msg", "Thumbnail deleted successfully");
                        }
                    });
                }

                // If the date is overriden
                if (req.body.date) {
                    newEvent.date = req.body.date;
                }

                // If the start time is overriden
                if (req.body.startTime) {
                    newEvent.startTime = req.body.startTime;
                }

                // If the end time is overriden
                if (req.body.endTime) {
                    newEvent.endTime = req.body.endTime;
                }

                // Put the modified object on MongoDB
                Event.updateOne({ _id: result._id }, newEvent, (err, raw) => {
                    if (err) console.log(err);
                    else {
                        req.flash("success_msg", "Event updated successfully!")
                        res.redirect('/admin/events');
                    }
                })
            }
        });
    });
})

// Submit new Event
router.post('/event/upload', ensureAuthenticated, (req, res) => {

    //Upload the images to s3 webserver
    ImageUpload(req, res, (err) => {
        if (err) {
            req.flash('error_msg', 'There has been an ' + err);
            res.redirect('/admin/events');
        } else {
            console.log("Uploaded images!");
            let bgkey, thumbkey, date = Date.now(), startTime = "All day", endTime = "All day";
            //Save the project data to mongoDB
            if (req.files.background) {
                bgkey = req.files.background[0].key;
            } else bgkey = "thumbnail-1554469053905.jpg";

            if (req.files.thumbnail) {
                thumbkey = req.files.thumbnail[0].key;
            } else thumbkey = "thumbnail-1554469053905.jpg";


            // Date of event
            if (req.body.date) {
                date = req.body.date;
            } else {
                console.warn("an event was added without a date");
            }

            // Start time of event
            if (req.body.startTime) {
                startTime = req.body.startTime;
            } else {
                console.warn("an event was added without a start time");
            }

            // End time of event
            if (req.body.endTime) {
                endTime = req.body.endTime;
            } else {
                console.warn("an event was added without an end time");
            }

            // Edit En locale json file
            updateJsonLocaleFields("en", {
                [req.body.titleEn]: req.body.titleEn,
                [req.body.locationEn]: req.body.locationEn,
                [req.body.shortDescriptionEn]: req.body.shortDescriptionEn
            });

            // Edit Ro locale json file
            updateJsonLocaleFields("ro", {
                [req.body.titleEn]: req.body.titleRo,
                [req.body.locationEn]: req.body.locationRo,
                [req.body.shortDescriptionEn]: req.body.shortDescriptionRo
            });

            // Edit Ru locale json file
            updateJsonLocaleFields("ru", {
                [req.body.titleEn]: req.body.titleRu,
                [req.body.locationEn]: req.body.locationRu,
                [req.body.shortDescriptionEn]: req.body.shortDescriptionRu
            });

            // Upload to MongoDB
            new Event({
                title: req.body.titleEn,
                shortDescription: req.body.shortDescriptionEn,
                location: req.body.locationEn,
                descriptionEn: req.body.descriptionEn,
                descriptionRo: req.body.descriptionRo,
                descriptionRu: req.body.descriptionRu,
                backgroundKey: bgkey,
                thumbnailKey: thumbkey,
                date: date,
                startTime: startTime,
                endTime: endTime
            }).save()
                .then(data => {
                    req.flash('success_msg', 'Event added!');
                    res.redirect('/admin/events');
                });
        }
    });
});

// Delete Event
router.delete('/event/delete/:id', ensureAuthenticated, (req, res) => {

    Event.findByIdAndDelete(req.params.id, (err, result) => {
        if (err) {
            console.log(err);
            req.flash("error_msg", err);
        } else {
            req.flash("success_msg", "Data removed from MongoDB.");
        }
        s3.deleteObjects({
            Bucket: "tohateenhub",
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
                req.flash("success_msg", "Images deleted from s3.");
            }
            res.redirect("/admin/events");
        });


    });
});
//#endregion

//#region [rgba(0, 212, 255,0.05)] NEWS CRUD

// News list page
router.get('/news', ensureAuthenticated, (req, res) => {
    News.find({}, (err, result) => {
        if (err) {
            req.flash('error_msg', err);
        } else {
            //projects: [{ title: "Edinet- pol de crestere economica", description: "pretty good project!", key: "background-1554024904339.jpg" }]\
            res.render('admin/news', {
                layout: 'dashboard',
                news: result
            });
        }
    });
});

// New News form page
router.get('/news/new', ensureAuthenticated, (req, res) => {
    res.render("admin/news-add-form", {
        layout: "dashboard"
    })
});

// Edit News form page
router.get("/news/edit/:id", ensureAuthenticated, (req, res) => {
    News.findById(req.params.id, (err, data) => {
        if (err) console.log(err);
        else {
            res.render("admin/news-edit-form", {
                layout: 'dashboard',
                news: data
            })
        }
    });
});

// Edit News PUT
router.put('/news/edit', ensureAuthenticated, (req, res) => {
    ImageUpload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.log(err);
        }
        News.findById(req.body.id, (err, result) => {
            if (err) console.log(err);
            else {
                let newNews = {
                    title: req.body.titleEn,
                    shortDescription: req.body.shortDescriptionEn,
                    descriptionEn: req.body.descriptionEn,
                    descriptionRo: req.body.descriptionRo,
                    descriptionRu: req.body.descriptionRu
                }
                // Edit En locale json file
                updateJsonLocaleFields("en", {
                    [req.body.titleEn]: req.body.titleEn,
                    [req.body.shortDescriptionEn]: req.body.shortDescriptionEn
                });

                // Edit Ro locale json file
                updateJsonLocaleFields("ro", {
                    [req.body.titleEn]: req.body.titleRo,
                    [req.body.shortDescriptionEn]: req.body.shortDescriptionRo
                });

                // Edit Ru locale json file
                updateJsonLocaleFields("ru", {
                    [req.body.titleEn]: req.body.titleRu,
                    [req.body.shortDescriptionEn]: req.body.shortDescriptionRu
                });

                // If the background image is overriden
                if (req.files.background) {
                    // Set the new already uploaded image's path
                    newNews.backgroundKey = req.files.background[0].key;
                    // Delete the old image  
                    s3.deleteObjects({
                        Bucket: "tohateenhub",
                        Delete: {
                            Objects: [
                                {
                                    Key: ("images//" + result.backgroundKey).toString()
                                }
                            ],
                        }
                    }, (err, data) => {
                        if (err) {
                            console.log(err);
                            req.flash("error_msg", err.stack);
                        } else {
                            req.flash("success_msg", "Background deleted successfully");
                        }
                    });
                }

                // If the thumbnail image is overriden
                if (req.files.thumbnail) {
                    newNews.thumbnailKey = req.files.thumbnail[0].key;
                    s3.deleteObjects({
                        Bucket: "tohateenhub",
                        Delete: {
                            Objects: [
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
                            req.flash("success_msg", "Thumbnail deleted successfully");
                        }
                    });
                }

                // If the date is overriden
                if (req.body.date) {
                    newNews.date = req.body.date;
                }

                // Put the modified object on MongoDB
                News.updateOne({ _id: result._id }, newNews, (err, raw) => {
                    if (err) console.log(err);
                    else {
                        req.flash("success_msg", "News updated successfully!")
                        res.redirect('/admin/news');
                    }
                })
            }
        });
    });
})

// Submit News
router.post('/news/upload', ensureAuthenticated, (req, res) => {

    //Upload the images to s3 webserver
    ImageUpload(req, res, (err) => {
        if (err) {
            req.flash('error_msg', 'There has been an ' + err);
            res.redirect('/admin/news');
        } else {
            console.log("Uploaded images!");
            let bgkey, thumbkey, date = Date.now();

            //Save the project data to mongoDB
            if (req.files.background) {
                bgkey = req.files.background[0].key;
            } else bgkey = "thumbnail-1554469053905.jpg";

            if (req.files.thumbnail) {
                thumbkey = req.files.thumbnail[0].key;
            } else thumbkey = "thumbnail-1554469053905.jpg";


            // Date of news
            if (req.body.date) {
                date = req.body.date;
            } else {
                console.warn("a news was added without a date");
            }

            // Edit En locale json file
            updateJsonLocaleFields("en", {
                [req.body.titleEn]: req.body.titleEn,
                [req.body.shortDescriptionEn]: req.body.shortDescriptionEn
            });

            // Edit Ro locale json file
            updateJsonLocaleFields("ro", {
                [req.body.titleEn]: req.body.titleRo,
                [req.body.shortDescriptionEn]: req.body.shortDescriptionRo
            });

            // Edit Ru locale json file
            updateJsonLocaleFields("ru", {
                [req.body.titleEn]: req.body.titleRu,
                [req.body.shortDescriptionEn]: req.body.shortDescriptionRu
            });

            // Upload to MongoDB
            new News({
                title: req.body.titleEn,
                shortDescription: req.body.shortDescriptionEn,
                descriptionEn: req.body.descriptionEn,
                descriptionRo: req.body.descriptionRo,
                descriptionRu: req.body.descriptionRu,
                backgroundKey: bgkey,
                thumbnailKey: thumbkey,
                date: date
            }).save()
                .then(data => {
                    req.flash('success_msg', 'News added!');
                    res.redirect('/admin/news');
                });
        }
    });
});

// Delete News
router.delete('/news/delete/:id', ensureAuthenticated, (req, res) => {

    News.findByIdAndDelete(req.params.id, (err, result) => {
        if (err) {
            console.log(err);
            req.flash("error_msg", err);
        } else {
            req.flash("success_msg", "Data removed from MongoDB.");
        }
        s3.deleteObjects({
            Bucket: "tohateenhub",
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
                req.flash("success_msg", "Images deleted from s3.");
            }
            res.redirect("/admin/news");
        });


    });
});

//#endregion

//#region [rgba(255,255,255,0.05)] EVENT REGISTRATIONS CRUD
// Registrations list page
router.get("/registrations", ensureAuthenticated, (req, res) => {
    Registration.find({}, (err, result) => {
        if (err) console.log(err);
        else {
            res.render("admin/registrations", {
                layout: "dashboard",
                registrations: result
            });
        }
    })
});
router.delete("/registrations/delete/:id", ensureAuthenticated, (req, res) => {
    Registration.findOneAndDelete({ _id: req.params.id }, (err, result) => {
        if (err) console.log(err);
        else {
            res.status(200).json(result.name);
        }
    });/* This method is deprecated
    Registration.findByIdAndRemove(req.params.id, (err, result) => {
        if (err) console.log(err);
        else {
            res.status(200).json(result.name);
        }
    })*/
});
//endregion

module.exports = router;
