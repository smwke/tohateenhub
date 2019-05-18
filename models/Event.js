const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const EventSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    shortDescription: {
        type: String,
        required: true
    },
    descriptionEn: {
        type: {}
    },
    descriptionRo: {
        type: {}
    },
    descriptionRu: {
        type: {}
    },
    backgroundKey: {
        type: String,
        default: "thumbnail-1554469053905.jpg"
    },
    thumbnailKey: {
        type: String,
        default: "thumbnail-1554469053905.jpg"
    },
    date: {
        type: Date,
        default: Date.now
    },
    startTime: {
        type: String,
        default: Date.now.toString()
    },
    endTime:{
        type: String,
        default: Date.now.toString()
    },
    location:{
        type: String,
        default: "Strada Păcii 11, Tohatin, Chișinău"
    }
});
mongoose.model('events', EventSchema);