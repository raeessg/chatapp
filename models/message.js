import mongoose,{ Schema,Types, model, } from "mongoose";

// const mongoose = require("mongoose");


const messageSchema = new mongoose.Schema(
    {
        content: String,

        attachments: [
            {
                public_id:{
                    type: String,
                    required: true,
                },
                url:{
                    type: String,
                    required: true,
                },
                
            },
        ],

        sender: {
            type: Types.ObjectId,
            ref: "User",
            required: true,
        },
        chat: {
            type: Types.ObjectId,
            ref: "Chat",
            required: true,

        },
    },
    {
        timestamps: true,
    }
);



export const Message = mongoose.models.Message || model("Message", messageSchema);
// export const Message = new mongoose.model("Message", messageSchema);
