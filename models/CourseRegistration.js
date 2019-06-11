const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CourseRegistrationSchema = new Schema({
    courseTitle:{
        type: String,
        required: true
    },
    parentName:{
        type: String,
        required: true
    },
    childName:{
        type: String,
        required: true
    },
    birthDate: {
        type: Date,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    phone:{
        type: String,
        required: true
    },
    courseId:{
        type: String,
        required: true
    },
    date:{
        type: Date,
        default: Date.now()
    },
    confirmed:{
        type: Boolean,
        default: false
    },
    token:{
        type:String,
        required: true
    },
    createdAt:{
        type: Date,   
        expires: "30m",
        default: Date.now(),
    },
});

mongoose.model("courseRegistrations",CourseRegistrationSchema);