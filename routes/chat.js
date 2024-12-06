import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { attachmentMulter } from "../middlewares/multer.js";
import {
    newGroupChat,
    getMyChats,
    getMyGroups,
    addMembers,
    removeMembers,
    leaveMembers,
    sendAttachments,
    getChatDetails,
    renameGroup,
    deleteChat,
    getMessages
} from "../controllers/chat.js";
import { 
    validateHandler, 
    newGroupValidator, 
    addMemberValidator, 
    removeMemberValidator, 
    sendAttachmentsValidator, 
    chatIdValidator,
    renameValidator, 
} from "../lib/validators.js";

const app = express.Router();

// After here user must be Logged in to access the routes

app.use(isAuthenticated)

app.post("/new", newGroupValidator(), validateHandler, newGroupChat)

app.get("/my", getMyChats)

app.get("/my/groups", getMyGroups)

app.put("/addmembers", addMemberValidator(), validateHandler, addMembers)

app.put("/removemember", removeMemberValidator(), validateHandler, removeMembers)

app.delete("/leave/:id", chatIdValidator(), validateHandler, leaveMembers)


// Send Attachment
app.post("/message", 
    attachmentMulter,
    // sendAttachmentsValidator(),
    // validateHandler,
    sendAttachments,
)


// Get messages for a specific chat
app.get("/message/:id", chatIdValidator(), validateHandler, getMessages)

//Get Chat Details, remove, delete
app.route("/:id")
    .get(chatIdValidator(), validateHandler, getChatDetails)
    .put(renameValidator(),validateHandler,renameGroup)
    .delete(chatIdValidator(), validateHandler,deleteChat)


export default app;