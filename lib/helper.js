import { userSocketIDs } from "../app.js";


export const getotherMembers = (members,userId)=>
     members.find((member) => member._id.toString() !== userId.toString());

export const getSockets = (users = []) => {

    const sockets = users.map((user) => userSocketIDs.get(user.toString()));

    return sockets;
}


export const getBase64 = (file) => 
    `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;






// Finds the other member in a chat that isn't the current user
// export const getotherMembers = (members, userId) => {
//     if (!Array.isArray(members) || !userId) {
//         throw new Error("Invalid members array or userId");
//     }
//     return members.find((member) => member._id.toString() !== userId.toString());
// };

// // Retrieves socket IDs for a list of users
// export const getSockets = (users = []) => {
//     const sockets = users
//         .map((user) => userSocketIDs.get(user.toString()))
//         .filter((socket) => socket !== undefined); // Remove undefined sockets
//     return sockets;
// };

// // Converts a file buffer to a Base64 string with MIME type
// export const getBase64 = (file) => {
//     if (!file || !file.mimetype || !file.buffer) {
//         throw new Error("Invalid file object");
//     }
//     return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
// };
