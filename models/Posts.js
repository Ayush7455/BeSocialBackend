const mongoose = require("mongoose");
const bcrypt = require("bcrypt");


const postsSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    profilepic: {
        type: String,
        default: '',
        // required: true
    },
    post: {
        type: String,
        default: '',
    },
    postdescription: {
        type: String,
        default: '',
    },
    likes: {
        type: Array,
        default: []
    },
    comments: {
        type: Array,
        default: []
    }
 
})



mongoose.model("Posts", postsSchema);