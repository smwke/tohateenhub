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
    },
    confirmed:{
        type: Boolean,
        default: false
    },
    token:{
        type:String,
        required: true
    },
    expireAt:{
        type: Date,
        default: Date.now() + 60000*30,
    }
});

mongoose.model("registrations",RegistrationSchema);