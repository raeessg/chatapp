import express from "express";
import { 
    getMyProfile, 
    login, 
    logout, 
    newUsers, 
    searchUser, 
    sendFriendRequest ,
    acceptFriendRequest,
    getAllNotification,
    getMyFriends
} from "../controllers/user.js";
import { singleAvatar } from '../middlewares/multer.js'
import { isAuthenticated } from "../middlewares/auth.js";
import { 
    registerValidator, 
    validateHandler, 
    loginValidator, 
    sendRequestValidator,
    accepteRequestValidator 
} from "../lib/validators.js";


const app = express.Router();

app.post('/new',
    singleAvatar,
    registerValidator(), // Humko array return karna hai isliye call kar rahe hai.(registerValidator())
    validateHandler,
    newUsers
);
app.post('/login', loginValidator(), validateHandler, login);


// After here user must be Logged in to access the routes

app.use(isAuthenticated)

app.get("/me", getMyProfile);

app.get("/logout", logout);

app.get("/search", searchUser);

app.put("/sendrequest",
    sendRequestValidator(),
    validateHandler,
    sendFriendRequest
);

app.put("/acceptrequest",
    accepteRequestValidator(),
    validateHandler,
    acceptFriendRequest
);

app.get("/notifications",getAllNotification);

app.get("/friends",getMyFriends);

export default app;