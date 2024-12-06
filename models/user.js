import mongoose, { Schema, model } from "mongoose";

import { hash } from 'bcrypt'

// const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    bio: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    avatar: {
        public_id: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        }
    },
}, {
    timestamps: true
});


userSchema.pre('save', async function (next) {

    if (!this.isModified('password')) return next();
    this.password = await hash(this.password, 10)
});


export const User = mongoose.models.User || model("User", userSchema);








// import mongoose, { Schema, model } from "mongoose";

// const userSchema = new Schema({
//     name: {
//         type: String,
//         required: true,
//     },
//     username: {
//         type: String,
//         required: true,
//         unique: true,
//     },
//     password: {
//         type: String,
//         required: true,
//         select: false,
//     },
//     avatar: {
//         public: {  // Define `public` inside the `avatar` object
//             type: String,  // Type of `public` should be `String`
//             required: true,  // Make `public` field required
//         }
//     },
//     url: {
//         type: String,
//         required: true,
//     }
// }, {
//     timestamps: true  // Automatically add createdAt and updatedAt timestamps
// });

// export const User = mongoose.models.User || model("User", userSchema);
