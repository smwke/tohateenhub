const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RegistrationSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    eventName:{
        type: String,
        required: true
    },
    eventId:{
        type: String,
        required: true
    },
    phoneNumber:{
        type: String,
        required: true
    },
    date:{
        type: Date,
        default: Date.now()
    }
});

mongoose.model("registrations",RegistrationSchema);