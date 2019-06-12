const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const session = require("express-session");
const methodOverride = require("method-override");

const nodemailer = require('nodemailer');
const bcrypt = require("bcryptjs");

const fs = require("fs");

const aws = require('aws-sdk');
const multer = require('multer');
const multers3 = require('multer-s3');

// Connect to s3 storage provider
const s3 = new aws.S3({
    accessKeyId: "77323B24A82CB5DB260AE237555E0E8A",
    secretAccessKey: "b4f47174fdebc9059b42cee9940389640300be22",
    endpoint: 'http://rest.s3for.me'
});


// Localization
const i18n = require("i18n");

// Register/ Log in solution
const passport = require("passport");

const path = require("path");

// For flashing error/ succes messages on front-end
const flash = require("connect-flash");

// MongoDB database manager
const mongoose = require("mongoose");
mongoose.set('useCreateIndex', true)
// Connect to database
mongoose.connect("mongodb://dorin:goodpass123@ds135726.mlab.com:35726/tohateenhub", {
    useNewUrlParser: true
}, (err) => {
    if (err) throw err;
    console.log("MongoDB connected...");
});

/*
mongoose.connect("mongodb://localhost:27017/tohateenhub", {
    useNewUrlParser: true
}, (err) => {
    if (err) throw err;
    console.log("MongoDB connected...");
})
*/
// Set Storage Engine
const storage = multers3({
    s3: s3,
    bucket: 'tohateenhub/images/',
    key: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); //use Date.now() for unique file keys
    }
});

/*
const storage = multer.diskStorage({
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); //use Date.now() for unique file keys
    },
    destination: "uploads/",
})*/

// Init Multer upload
const ImageUpload = multer({
    storage: storage,
    limits: { fileSize: 5000000 },
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).fields([
    {
        name: 'background',
        maxCount: 1
    },
    {
        name: 'thumbnail',
        maxCount: 1
    }
]);

//Check File Type / Ensure it is an image
function checkFileType(file, cb) {
    // Allowed extensions
    const fileTypes = /jpeg|jpg|png|gif/;
    // Check the extension
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());

    // Check mimeType
    const mimeType = fileTypes.test(file.mimetype);

    if (mimeType && extname) {
        return cb(null, true);
    } else {
        cb('Error: jpeg|jpg|png|gif Images only!');
    }
}

//Export the upload module for use in other files
module.exports = {
    ImageUpload: ImageUpload,
    s3: s3
};

/*      Initialize MongoDB Models       */
// Load User Model (usage in passport)
require("./models/User");

// Load Event Model
require("./models/Event");
const Event = mongoose.model("events");

// Load News Model
require("./models/News");
const News = mongoose.model("news");

// Load Event Registration Model
require("./models/Registration");
const Registration = mongoose.model("registrations");

// Load Course Model
require("./models/Course");
const Course = mongoose.model("courses");

// Load Course Registration Model
require("./models/CourseRegistration");
const CourseRegistration = mongoose.model("courseRegistrations");

// Load Message Model
require("./models/Message");
const Message = mongoose.model("messages");


// NodeMailer config
let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'cascavaldorin@gmail.com',
        pass: 'ogppjvkmpxnrgdju'
    }
});

/*      Load routes     */
const admin = require("./routes/admin");


/*      Server configuration        */
//Server port
const port = process.env.PORT || 8443;
const siteName = "https://tohateenhub.herokuapp.com";
// How many events/ news should be loaded from the database upon accessing the full list?
const components_to_load = 5;

// HTTPS Configuration */
var privateKey = fs.readFileSync(__dirname+"/certs/server.key",'utf8');
var certificate = fs.readFileSync(__dirname+"/certs/server.cert",'utf8');

const http = require("http");
const https = require("https");

var credentials = {
    key: privateKey,
    cert: certificate
};

//Init app
const app = express();

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// Set up i18n
i18n.configure({
    locales: ['en', 'ru', 'ro'],
    defaultLocale: 'en',
    directory: __dirname + '/locales',
    autoReload: true
});

// i18n Middleware [for internalization]
app.use(i18n.init);

// View engine (handlebars)
const hbs = exphbs.create({
    defaultLayout: "main",
    helpers: require("./helpers/helpers")
});

// Handlebars Middleware
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Method override middleware
app.use(methodOverride('_method'));

// Express session midleware
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// Passport Config
require('./config/passport')(passport);

//Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Connect-flash middleware /* Must be initialized after session
app.use(flash());

//Global variables /* Must be initialized after flash
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    res.locals.res = res;
    res.locals.localization = req.session.locale || "en";
    res.setLocale(res.locals.localization);
    next();
});


/*      Site Routes     */
// use admin routes
app.use("/admin", admin);

const components_to_load_on_main_page = 3;

// Default route
app.get("/", (req, res) => {
    Event.find({}, (err, events) => {
        if (err) console.log(err);
        else {
            News.find({}, (err, news) => {
                if (err) console.log(er);
                else {
                    Course.find({}, (err, courses) => {
                        if (err) console.log(err);
                        else {
                            res.render("index", { events: events, news: news, courses: courses });
                        }
                    });
                }
            }).sort({ 'date': -1 }).limit(components_to_load_on_main_page);
        }
    }).sort({ 'date': -1 }).limit(components_to_load_on_main_page);
});

// Contacts route
app.get("/contacts", (req, res) => {
    res.render("contacts");
});

// about us route
app.get("/about-us", (req, res) => {
    res.render("aboutUs");
});

// Set locale
app.get("/setLang/:lang", (req, res) => {
    if (i18n.getLocales().indexOf(req.params.lang) > -1) {
        req.session.locale = req.params.lang;
    }
    res.redirect("back");
});

// Get image
app.get("/get-image/:id", (req, res) => {
    /*
    let pathdir = path.resolve(process.cwd(), "./uploads");
    fs.readFile(pathdir + `\\${req.params.id}`, 'utf8', function readFileCallback(err, data) {
        if (err) console.log(err);
        else if (data) {
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.write(data.Body, 'binary');
            res.end(null, 'binary');
        }
    });
    */

    s3.getObject({ Bucket: "tohateenhub/images/", Key: req.params.id }, (err, data) => {
        if (err instanceof multer.MulterError) {
            console.log(err);

        }
        else {
            if (data) {
                res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                res.write(data.Body, 'binary');
                res.end(null, 'binary');
            }
        }
    });

});

//#region [ rgba(255,255,255,0.05) ] News routes
// All news list
app.get("/news", (req, res) => {
    News.find({}, (err, data) => {
        if (err) console.log(err);
        else {
            res.render("allNews", { news: data });
        }
    }).sort({ 'date': -1 }).limit(components_to_load);
});

// Load another :limit number of news based on the current :page
app.get("/get-news/:page/:limit", (req, res) => {
    let skip = req.params.page;
    skip *= req.params.limit;

    if (isNaN(req.params.page) || isNaN(req.params.limit)) {
        req.flash("error_msg", "Incorrect url parameters");
        res.redirect("back");
    } else {
        News.find({}, (err, data) => {
            if (err) console.log(err);
            else {
                let months = [
                    "JAN",
                    "FEB",
                    "MAR",
                    "APR",
                    "MAY",
                    "JUN",
                    "JUL",
                    "AUG",
                    "SEP",
                    "OCT",
                    "NOV",
                    "DEC"
                ];

                let result = []
                let buffer;
                data.forEach((event) => {
                    buffer = {};
                    let a = new Date(event.date);

                    buffer.title = res.__(event.title);
                    buffer.shortDescription = res.__(event.shortDescription);
                    buffer.date = a.getDate();
                    buffer.month = months[a.getMonth()];
                    buffer.id = event._id;
                    buffer.thumbnailKey = event.thumbnailKey;

                    result.push(buffer);
                });

                res.status(200).json(result);
            }
        }).sort({ 'date': -1 }).limit(parseInt(req.params.limit)).skip(parseInt(skip));

    }
});

// Specific news description
app.get("/news/:id", (req, res) => {
    News.findById(req.params.id, (err, data) => {
        if (err) {
            res.render("news");
        }
        else {
            if (data) {
                let news = {
                    title: data.title,
                    shortDescription: data.shortDescription,
                    location: data.location,
                    date: data.date,
                    backgroundKey: data.backgroundKey,
                    thumbnailKey: data.thumbnailKey,
                    id: data._id
                }
                switch (res.getLocale()) {
                    case "en": { news.description = data.descriptionEn; } break;
                    case "ro": { news.description = data.descriptionRo; } break;
                    case "ru": { news.description = data.descriptionRu; } break;
                }
                res.render("news", { news: news });
            } else {
                res.render("news");
            }
        }
    });

});
//#endregion

//#region [ rgba(255,255,255,0.05) ] Events routes
// All events list
app.get("/events", (req, res) => {
    Event.find({}, (err, data) => {
        if (err) console.log(err);
        else
            res.render("allEvents", { events: data });
    }).sort({ 'date': -1 }).limit(components_to_load);

});

app.get("/confirm-event/:token", (req, res) => {
    Registration.findOne({ token: req.params.token }, (err, data) => {
        if (err) console.log(err);
        else {
            if (data) {
                Registration.updateOne({ _id: data._id }, { confirmed: true, createdAt: null }, (err, raw) => {
                    if (err) console.log(err);
                    else {
                        req.flash("success_msg", "Registration complete!");
                        res.redirect("/");
                    }
                });
            } else {
                req.flash("error_msg", "Registration not found");
                res.redirect("/");
            }
        }
    })
});

// Event Register modal form POST
app.post("/events/register", (req, res) => {
    bcrypt.hash(Date.now().toString(), 1, (err, hash) => {
        if (err) console.log(err);
        else {
            hash = hash.replace(/[\/?$]/g, "");
            // Save registration to MongoDB
            new Registration({
                name: req.body.name,
                email: req.body.email,
                phoneNumber: req.body.phone,
                eventName: req.body.eventName,
                eventId: req.body.eventId,
                token: hash
            }).save().then(data => {
                // setup email data
                let mailOptions = {
                    from: "Dorin",
                    to: req.body.email,
                    subject: "TohaTeen Event Registration",
                    text: `Hello, please confirm your registration of ${req.body.eventName}`,
                    html: `<div style="padding-left:20px;">
                    <h2>Please confirm your registration of:</h2>
                    <h1>${req.body.eventName}</h1>
                    <ul>
                        <li>Your name: ${req.body.name}</li>
                        <li>Phone number: ${req.body.phone}</li>
                    </ul>
                    <a style="margin-left: 60px;" href="${siteName}/confirm-event/${hash}"><button style="font-size: 26px;height:50px;width:130px;">Confirm</button></a>
                </div>`
                }

                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) console.log(err);
                    else {
                        res.status(200).json("Please confirm your registration at " + req.body.email);
                    }
                });
            });

        }
    })
});

// Load another :limit number of events based on the current :page
app.get("/get-events/:page/:limit", (req, res) => {
    let skip = req.params.page;
    skip *= req.params.limit;

    if (isNaN(req.params.page) || isNaN(req.params.limit)) {
        req.flash("error_msg", "Incorrect url parameters");
        res.redirect("back");
    } else
        Event.find({}, (err, data) => {
            if (err) console.log(err);
            else {
                let months = [
                    "JAN",
                    "FEB",
                    "MAR",
                    "APR",
                    "MAY",
                    "JUN",
                    "JUL",
                    "AUG",
                    "SEP",
                    "OCT",
                    "NOV",
                    "DEC"
                ];

                let result = [];
                let buffer;
                data.forEach((event) => {
                    buffer = {};
                    let a = new Date(event.date);

                    buffer.title = res.__(event.title);
                    buffer.shortDescription = res.__(event.shortDescription);
                    buffer.date = a.getDate();
                    buffer.month = months[a.getMonth()];
                    buffer.startTime = event.startTime;
                    buffer.endTime = event.endTime;
                    buffer.id = event._id;
                    buffer.thumbnailKey = event.thumbnailKey;

                    result.push(buffer);
                });
                res.status(200).json(result);
            }
        }).sort({ 'date': -1 }).limit(parseInt(req.params.limit)).skip(parseInt(skip));
});

// Specific event description
app.get("/event/:id", (req, res) => {
    Event.findById(req.params.id, (err, data) => {
        if (err) {
            res.render("event");
        }
        else {
            if (data) {
                let event = {
                    title: data.title,
                    shortDescription: data.shortDescription,
                    location: data.location,
                    date: data.date,
                    backgroundKey: data.backgroundKey,
                    thumbnailKey: data.thumbnailKey,
                    id: data._id
                }
                switch (res.getLocale()) {
                    case "en": { event.description = data.descriptionEn; } break;
                    case "ro": { event.description = data.descriptionRo; } break;
                    case "ru": { event.description = data.descriptionRu; } break;
                }
                res.render("event", { event: event });
            } else {
                res.render("event");
            }

        }
    });

});
//#endregion

//#region [ rgba(255,255,255,0.05) ] Courses routes

// Specific Course description
app.get("/courses", (req, res) => {
    Course.find({}, (err, data) => {
        if (err) console.log(err);
        else {
            let courses = [];
            let buffer = {};

            data.forEach((course) => {
                buffer = {
                    title: course.title,
                    thumbnailKey: course.thumbnailKey,
                    id: course._id.toString()
                }

                switch (res.getLocale()) {
                    case "en": { buffer.description = course.descriptionEn; } break;
                    case "ro": { buffer.description = course.descriptionRo; } break;
                    case "ru": { buffer.description = course.descriptionRu; } break;
                }

                courses.push(buffer);
            });
            res.render("allCourses", { courses: courses, coursesString: JSON.stringify(courses) });
        }
    });
});

app.post("/course/register", (req, res) => {
    bcrypt.hash(Date.now().toString(), 1, (err, hash) => {
        if (err) console.log(err);
        else {
            hash = hash.replace(/[\/?$]/g, "");
            // Save registration to MongoDB
            new CourseRegistration({
                courseTitle: req.body.courseTitle,
                parentName: req.body.parentName,
                childName: req.body.childName,
                birthDate: req.body.birthDate,
                email: req.body.email,
                phone: req.body.phone,
                courseId: req.body.courseId,
                token: hash
            }).save((err) => {
                if (err) {
                    console.log(err);
                } else {
                    // setup email data
                    let mailOptions = {
                        from: "Dorin",
                        to: req.body.email,
                        subject: "TohaTeen Event Registration",
                        text: `Hello, please confirm your registration of ${req.body.courseTitle}`,
                        html: `<div style="padding-left:20px;">
                        <h2>Please confirm your registration of:</h2>
                        <h1>${req.body.courseTitle}</h1>
                        <ul>
                            <li>Parent's name: ${req.body.parentName}</li>
                            <li>Child's name: ${req.body.childName}</li>
                            <li>Phone number: ${req.body.phone}</li>
                        </ul>
                        <a style="margin-left: 60px;" href="${siteName}/confirm-course/${hash}"><button style="font-size: 26px;height:50px;width:130px;">Confirm</button></a>
                    </div>`
                    }

                    transporter.sendMail(mailOptions, (err, info) => {
                        if (err) console.log(err);
                        else {
                            res.status(200).json("Please confirm your registration at " + req.body.email);
                        }
                    });
                }
            })
        }
    })
});

app.get("/confirm-course/:token", (req, res) => {
    CourseRegistration.findOne({ token: req.params.token }, (err, data) => {
        if (err) console.log(err);
        else {
            if (data) {
                CourseRegistration.updateOne({ _id: data._id }, { confirmed: true, createdAt: null }, (err, raw) => {
                    if (err) console.log(err);
                    else {
                        req.flash("success_msg", "Registration complete!");
                        res.redirect("/");
                    }
                });
            } else {
                req.flash("error_msg", "Registration not found");
                res.redirect("/");
            }
        }
    })
})

//#endregion

app.post("/send-message", (req, res) => {
    new Message({
        senderName: req.body.senderName,
        email: req.body.email,
        message: req.body.message
    }).save((err) => {
        if (err) console.log(err);
        else {
            req.flash("success_msg", "Message has been sent!");
            res.redirect("/contacts");
        }
    })
});

//var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials,app);

//httpServer.listen(8080);
httpsServer.listen(port);


/* Start server
httpServer.listen(port, () => {
    console.log("Server started on: " + port);
});*/
