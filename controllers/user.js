import { compare } from 'bcrypt';
import { User } from '../models/user.js'
import { Chat } from '../models/chat.js'
import { cookieOption, emitEvent, sendToken, uploadFilesToCloudinary } from '../utils/features.js';
import { TryCatch } from '../middlewares/error.js';
import { ErrorHandler } from '../utils/utility.js';
import { Request } from '../models/request.js'
import { Error } from 'mongoose';
import { NEW_REQUEST, REFETCH_CHATS } from '../constants/event.js';
import { getotherMembers } from "../lib/helper.js"


//Create a new user and save it to the database and save token in cookie
// const newUsers = TryCatch(async (req, res, next) => {

//     const { name, username, password, bio } = req.body;

//     const file = req.file;

//     if (!file) return next(new ErrorHandler("Plesse upload avatar "));

//     const result = await uploadFilesToCloudinary([file]);


//     const avatar = {
//         public_id: result[0].public_id,
//         url: result[0].url,
//     }

//     const user = await User.create({
//         name,
//         bio,
//         username,
//         password,
//         avatar,
//     });

//     sendToken(res, user, 210, "User created");
//     console.count()

// });


const newUsers = TryCatch(async (req, res, next) => {
    const { name, username, password, bio } = req.body;
  
    const file = req.file;
  
    if (!file) return next(new ErrorHandler("Please Upload Avatar"));
  
    const result = await uploadFilesToCloudinary([file]);
  
    const avatar = {
      public_id: result[0].public_id,
      url: result[0].url,
    };
  
    const user = await User.create({
      name,
      bio,
      username,
      password,
      avatar,
    });

    console.error()
    sendToken(res, user, 201, "User created");
  });



// Login user and save token token in cookie 
const login = TryCatch(async (req, res, next) => {

    const { username, password } = req.body;
    
    const user = await User.findOne({ username }).select("+password");

    if (!user) {
        return next(new ErrorHandler("Invalid username", 404))
    }

    const isMatch = await compare(password, user.password);

    if (!isMatch) {
        return next(new ErrorHandler("Invalid password", 404));
    }

    sendToken(res, user, 200, `welcome Back, ${user.name}`);

});

const getMyProfile = TryCatch(async (req, res, next) => {

    const user = await User.findById(req.user);

    if (!user) return next(new ErrorHandler("User Not Found", 404))

    // console.log(req.user)

    res.status(200).json({
        success: true,
        // data: req.user,
        user
    });
});




// const getMyProfile = TryCatch(async (req, res) => {
//     try {
//         // Log the req.user value
//         console.log("req.user:", req.user);

//         // Check if req.user is populated
//         if (!req.user) {
//             return res.status(400).json({
//                 success: false,
//                 message: "User ID is missing in request",
//             });
//         }

//         // Fetch user from database
//         const user = await User.findById(req.user);

//         // Check if user was found
//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found",
//             });
//         }

//         // Send successful response
//         res.status(200).json({
//             success: true,
//             user,
//         });
//     } catch (error) {
//         console.error("Error fetching profile:", error);
//         res.status(500).json({
//             success: false,
//             message: "An error occurred while fetching the profile",
//         });
//     }
// });




const logout = TryCatch(async (req, res) => {

    return res.status(200).cookie("message-Token", "", { ...cookieOption, maxAge: 0 }).json({
        success: true,
        message: "Logged out successfully",
    });
});


const searchUser = TryCatch(async (req, res, next) => {

    const { name = "" } = req.query;

    const myChats = await Chat.find({ groupChat: false, members: req.user })

    const allUsersFromMyChats = myChats.flatMap((chat) => chat.members);


    const allUserExceptMeAndFriends = await User.find({
        _id: { $nin: allUsersFromMyChats },
        name: { $regex: name, $options: "i" },
    })

    // modifying the response
    const users = allUserExceptMeAndFriends.map(({ _id, name, avatar }) =>
    ({
        _id,
        name,
        avatar: avatar.url
    }))

    return res.status(200).json({
        success: true,
        users
    });
});


// const sendFriendRequest = TryCatch(async (req, res, next) => {

//     const { userId } = req.body;
//     console.log('Incoming request body:', req.body);


//     // Check if a friend request between these users already exists
//     const request = await Request.findOne({
//         $or: [
//             {
//                 sender: req.user,
//                 receiver: userId,
//             },
//             {
//                 sender: userId,
//                 receiver: req.user,
//             }
//         ]
//     });
//     if (request) return next(new ErrorHandler("Request already sent", 400));

//     await Request.create({
//         sender: req.user,
//         receiver: userId
//     })

//     emitEvent(req, NEW_REQUEST, [userId])

//     return res.status(200).json({
//         success: true,
//         message: "Friend request sent successfully",
//     });
// });

const sendFriendRequest = TryCatch(async (req, res, next) => {
    const { userId } = req.body;
    // console.log('Incoming request body:', req.body); // Debugging output

    // Validate userId
    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "userId is required."
        });
    }

    // Check if a friend request between these users already exists
    const request = await Request.findOne({
        $or: [
            {
                sender: req.user, 
                receiver: userId,
            },
            {
                sender: userId,
                receiver: req.user,
            }
        ]
    });
    if (request) return next(new ErrorHandler("Request already sent", 400));

    await Request.create({
        sender: req.user, 
        receiver: userId
    });

    emitEvent(req, NEW_REQUEST, [userId]);

    return res.status(200).json({
        success: true,
        message: "Friend request sent successfully",
    });
});



const acceptFriendRequest = TryCatch(async (req, res, next) => {

    const { requestId, accept } = req.body;

    const request = await Request.findById(requestId)
        .populate("sender", "name")
        .populate("receiver", "name")

    if (!request) return next(new ErrorHandler("Request Not Found", 404));

    if (request.receiver._id.toString() !== req.user.toString())
        return next(new ErrorHandler("You are notUnauthorized to accept this request", 401))

    if (!accept) {
        await request.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Friend request rejected",
        });
    }

    const members = [request.sender._id, request.receiver._id];

    await Promise.all([
        Chat.create({
            members,
            name: `${request.sender.name} - ${request.receiver.name}`
        }),
        request.deleteOne(),
    ])

    emitEvent(req, REFETCH_CHATS, members)


    return res.status(200).json({
        success: true,
        message: "Request Accepted",
        senderId: request.sender._id,
    });
});


const getAllNotification = TryCatch(async (req, res) => {

    const request = await Request.find({ receiver: req.user }).populate(
        "sender",
        "name avatar"
    )

    const allRequest = request.map(({ _id, sender }) => ({
        _id,
        sender: {
            _id: sender._id,
            name: sender.name,
            avatar: sender.avatar.url,
        }
    }));

    return res.status(200).json({
        success: true,
        allRequest,
    });

})

const getMyFriends = TryCatch(async (req, res) => {

    const chatId = req.query.chatId;

    const chats = await Chat.find({
        members: req.user,
        groupChat: false
    }).populate("members", "name avatar");

    const friends = chats.map(({ members }) => {
        const otherUser = getotherMembers(members, req.user)

        return {
            _id: otherUser._id,
            name: otherUser.name,
            avatar: otherUser.avatar.url,
        };
    })

    if (chatId) {
        const chat = await Chat.findById(chatId);

        const avalableFriends = friends.filter(
            (friend) => !chat.members.includes(friend._id)
        )
        return res.status(200).json({
            success: true,
            friends: avalableFriends
        });
    }
    else {
        return res.status(200).json({
            success: true,
            friends,
        });

    }
})





export {
    login,
    newUsers,
    getMyProfile,
    logout,
    searchUser,
    sendFriendRequest,
    acceptFriendRequest,
    getAllNotification,
    getMyFriends
} 