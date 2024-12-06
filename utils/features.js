import mongoose from "mongoose"
import jwt from 'jsonwebtoken'
import { v4 as uuid } from 'uuid';
import {v2 as cloudinary} from 'cloudinary'
import { getBase64, getSockets } from "../lib/helper.js";

const cookieOption = {
    maxAge: 15 * 24 * 60 * 60 * 1000,
    sameSite: "none",
    htttpOnly: true,
    secure: true,
}

const connectDB = (url) => {
    mongoose
        // .connect(url, { dbName: 'Messenger' })
        .connect(url, { dbName: 'TalkSync' })
        .then((data) => console.log(`Connected to DB: ${data.connection.host}`))
        .catch((error) => {
            throw error;
        })
}


const sendToken = (res, user, code, message) => {
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

    return res.status(code).cookie("message-Token", token, cookieOption).json({
        success: true,
        user,
        message,
    });
};

const emitEvent = (req, event, users, data) => {
    const io = req.app.get('io');
    const userSocket = getSockets(users);
    io.to(userSocket).emit(event, data);
    console.log("Emmiting event", event)
}

const uploadFilesToCloudinary = async (file = []) => {

    const uploadPromise = file.map((file) => {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload(
                getBase64(file),
                {
                    resource_type: "auto",
                    public_id: uuid(),
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
        })
    })

    try {
        const results = await Promise.all(uploadPromise);

        const formattedResults = results.map((result) =>({
            public_id: result.public_id,
            url: result.secure_url,
        }));

        return formattedResults;
    } 
    catch (error) {
        console.log(error)
        throw new Error("Error uploading files to cloudinary",error)
    }
}


// const uploadFilesToCloudinary = async (files = []) => {
//     if (!Array.isArray(files) || files.length === 0) {
//         throw new Error("No files provided for upload.");
//     }

//     const uploadPromise = files.map((file) => {
//         return new Promise((resolve, reject) => {
//             cloudinary.uploader.upload(
//                 file.path || file, // Use `file.path` if file objects are used.
//                 {
//                     resource_type: "auto",
//                     public_id: uuid(), // Generate a unique public ID for each file.
//                 },
//                 (error, result) => {
//                     if (error) return reject(error);
//                     resolve(result);
//                 }
//             );
//         });
//     });

//     try {
//         const results = await Promise.all(uploadPromise);

//         // Format the results to include only public_id and url.
//         const formattedResults = results.map((result) => ({
//             public_id: result.public_id,
//             url: result.secure_url,
//         }));

//         console.count()

//         return formattedResults;
        
//     } catch (error) {
//         console.error("Cloudinary Upload Error:", error);
//         throw new Error("Error uploading files to Cloudinary");
//     }
    
// };

// const uploadFilesToCloudinary = async (files = []) => {
// };


const deleteFilesFromCloudinary = async (public_ids) => {

}

export {
    connectDB,
    sendToken,
    cookieOption,
    emitEvent,
    deleteFilesFromCloudinary,
    uploadFilesToCloudinary
}