const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const CourseSchema = new Schema({
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
    }
});
mongoose.model('courses', CourseSchema);