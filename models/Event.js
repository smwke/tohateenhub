const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const EventSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    subTitle: {
        type: String,
        required: true
    },
    descriptionEn: {
        type: {}
    },
    descriptionRo:{
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
    }
});

mongoose.model('events', EventSchema);