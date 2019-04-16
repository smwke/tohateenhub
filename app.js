const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const session = require("express-session");
const methodOverride = require("method-override");

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

// Connect to database
mongoose.connect("mongodb://dorin:goodpass123@ds135726.mlab.com:35726/tohateenhub", {
    useNewUrlParser: true
}, (err) => {
    if (err) throw err;
    console.log("MongoDB connected...");
});

// Set Storage Engine
const storage = multers3({
    s3: s3,
    bucket: 'tohateenhub/images/',
    key: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); //use Date.now() for unique file keys
    }
});

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

//Initialize MongoDB Models
require("./models/User");

// Load Event Model
require("./models/Event");
const Event = mongoose.model("events");

// Load routes
const admin = require("./routes/admin");

//Server port
const port = process.env.PORT || 4200;

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
    res.locals.localization = req.session.locale || "en"
    res.setLocale(res.locals.localization);
    next();
});

app.use("/admin", admin);

app.get("/", (req, res) => {
    Event.find({}, (err, data) => {
        if (err) console.log(err);
        else res.render("index", { events: data });
    })

});

app.get("/setLang/:lang", (req, res) => {
    if (i18n.getLocales().indexOf(req.params.lang) > -1) {
        req.session.locale = req.params.lang;
    }
    res.redirect("back");
});

app.get("/get-image/:id", (req, res) => {
    s3.getObject({ Bucket: "tohateenhub/images/", Key: req.params.id }, (err, data) => {
        if (err) console.log(err);
        else {
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.write(data.Body, 'binary');
            res.end(null, 'binary');
        }
    });
});

app.get("/event/:id", (req, res) => {
    Event.findById(req.params.id, (err, data) => {
        if (err){
            res.render("event");
        }
        else {
            let event = {
                title: data.title,
                subTitle: data.subTitle,
                date: data.date,
                backgroundKey: data.backgroundKey,
                thumbnailKey: data.thumbnailKey
            }
            switch (res.getLocale()) {
                case "en": { event.description = data.descriptionEn; } break;
                case "ro": { event.description = data.descriptionRo; } break;
                case "ru": { event.description = data.descriptionRu; } break;
            }
            res.render("event", { event: event });
        }
    });

});

app.listen(port, () => {
    console.log("Server started on: " + port);
});
