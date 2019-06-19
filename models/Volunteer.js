const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const VolunteerSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    birthDate: {
        type: Date,
        required:true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    }
});

mongoose.model("volunteers", VolunteerSchema);