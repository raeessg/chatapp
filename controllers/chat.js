import { errorMiddleware, TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import { Chat } from '../models/chat.js'
import { deleteFilesFromCloudinary, emitEvent, uploadFilesToCloudinary } from "../utils/features.js";
import { ALERT, NEW_ATTACHMENT, NEW_MESSAGE, NEW_MESSAGE_ALERT, REFETCH_CHATS } from "../constants/event.js"
import { getotherMembers } from "../lib/helper.js";
// import { Promise } from "mongoose";
import { User } from "../models/user.js";
import { Message } from "../models/message.js";
import mongoose from "mongoose";


// Create Groups
const newGroupChat = TryCatch(async (req, res, next) => {

    const { name, members } = req.body;

    if (members.length < 2)
        return next(
            new ErrorHandler("Group Chat Must Have At Least 3 Members", 400)
        );


    const allMembers = [...members, req.user];

    await Chat.create({
        name,
        groupChat: true,
        creator: req.user,
        members: allMembers,
    });

    emitEvent(req, ALERT, allMembers, `Welcome to ${name} group`);
    emitEvent(req, REFETCH_CHATS, members);

    return res.status(201).json({
        success: true,
        message: "Group Created",
    })
});


//  getMyChats

const getMyChats = TryCatch(async (req, res, next) => {
    const chats = await Chat.find({ members: req.user }).populate(
        "members",
        "name avatar"
    );

    // Transforming each chat
    const transformChat = chats.map(({ _id, name, members, groupChat }) => {
        const otherMember = getotherMembers(members, req.user) || {};

        return {
            _id,
            groupChat,
            avatar: groupChat
                // ? members.slice(0, 3).map(({ avatar }) => avatar?.url || "defaultAvatarUrl") // Ensure avatar exists
                // : [otherMember.avatar?.url || "defaultAvatarUrl"], // Use a default if avatar is undefined

                ? members.slice(0, 3).map(({ avatar }) => avatar?.url)
                : [otherMember.avatar?.url],

            name: groupChat ? name : otherMember.name,
            members: members.reduce((prev, curr) => {
                if (curr._id.toString() !== req.user.toString()) {
                    prev.push(curr._id);
                }
                return prev;
            }, []),
        };
    });

    return res.status(200).json({
        success: true,
        chats: transformChat,
    });
});


// const getMyChats = TryCatch(async (req, res, next) => {

//     const chats = await Chat.find({ members: req.user }).populate(
//         "members",
//         "name avatar"
//     );

//     // Transforming each chat
//     const transformChat = chats.map((chat) => {
//         const { _id, name, groupChat, members } = chat;

//         // Check for other member and avatar existence
//         const otherMember = getotherMembers(members, req.user) || {};

//         return {
//             _id,
//             groupChat,
//             avatar: groupChat
//                 ? members.slice(0, 3).map(({ avatar }) => avatar?.url || "defaultAvatarUrl")
//                 : [otherMember.avatar?.url || "defaultAvatarUrl"],
//             name: groupChat ? name : otherMember.name || "Unknown",
//             members: members.reduce((prev, curr) => {
//                 if (curr._id.toString() !== req.user.toString()) {
//                     prev.push(curr._id);
//                 }
//                 return prev;
//             }, []),
//         };
//     });

//     return res.status(200).json({
//         success: true,
//         chats: transformChat,
//     });
// });


// const getMyChats = TryCatch(async (req, res, next) => {

//     const chats = await Chat.find({ members: req.user }).populate(
//         "members",
//         "name avatar"
//     );

//     const transformChat = chats.map((chat) => {
//         const { _id, name, groupChat, members } = chat;

//         // Ensure 'otherMember' and its avatar property are defined
//         const otherMember = getotherMembers(members, req.user) || {};

//         return {
//             _id,
//             groupChat,
//             avatar: groupChat
//                 ? members.slice(0, 3).map(member => member?.avatar?.url || "defaultAvatarUrl")
//                 : [otherMember.avatar?.url || "defaultAvatarUrl"],
//             name: groupChat ? name : otherMember.name || "Unknown",
//             members: members.reduce((prev, curr) => {
//                 if (curr?._id.toString() !== req.user.toString()) {
//                     prev.push(curr._id);
//                 }
//                 return prev;
//             }, []),
//         };
//     });

//     return res.status(200).json({
//         success: true,
//         chats: transformChat,
//     });
// });




// Only Show Own Groups
const getMyGroups = TryCatch(async (req, res, next) => {

    const chats = await Chat.find({
        members: req.user,
        groupChat: true,
        creator: req.user,
    }).populate("members", "name avatar");

    const groups = chats.map(({ members, _id, groupChat, name }) => ({
        _id,
        groupChat,
        name,
        avatar: members.slice(0, 3).map(({ avatar }) => avatar.url)
    }));

    return res.status(200).json({
        success: true,
        groups,
    });


})

// Add member in Group
const addMembers = TryCatch(async (req, res, next) => {

    const { chatId, members } = req.body;

    const chat = await Chat.findById(chatId);

    if (!chat)
        return next(new ErrorHandler("Chat not found", 404));

    if (chat.creator.toString() !== req.user.toString())
        return next(new ErrorHandler("You area not allow to add members", 403));

    if (!chat.groupChat)
        return next(new ErrorHandler("This is not a group chat", 400));


    // Fetching user information for new members
    const allNewMembersPromise = members.map((i) => User.findById(i, "name"));


    const allNewMembers = await Promise.all(allNewMembersPromise);

    const uniqueMembers = allNewMembers.filter((i) => {
        return !chat.members.includes(i._id.toString())
    }).map((i) => i._id);

    // Adding new members
    chat.members.push(...uniqueMembers);

    // Check group member resultPerPage
    if (chat.members.length > 100)
        return next(new ErrorHandler("Group members resultPerPage reached", 400))

    await chat.save();

    // Concatenating new members' names for notification
    const allUsersName = allNewMembers.map((i) => i.name).join("")

    emitEvent(
        req,
        ALERT,
        `${allUsersName} has been added in the group`
    )

    emitEvent(req, REFETCH_CHATS, chat.members)

    return res.status(200).json({
        success: true,
        members: "Members added successfully",
    });


})


// Remove member in Group
const removeMembers = TryCatch(async (req, res, next) => {

    const { userId, chatId } = req.body;

    const [chat, userThatWillBeResult] = await Promise.all([
        Chat.findById(chatId),
        User.findById(userId, "name")
    ]);
    if (!chat)
        return next(new ErrorHandler("Chat not found", 404));

    if (chat.creator.toString() !== req.user.toString())
        return next(new ErrorHandler("You area not allow to add members", 403));

    if (!chat.groupChat)
        return next(new ErrorHandler("This is not a group chat", 400));

    if (chat.members.length <= 3)
        return next(new ErrorHandler("Group must have at least 3 members", 400))

    chat.members = chat.members.filter((members) =>
        members.toString() !== userId.toString());

    await chat.save();

    emitEvent(
        req,
        ALERT,
        chat.members,
        `${userThatWillBeResult} has been removed in the group`
    )

    emitEvent(req, REFETCH_CHATS, chat.members)

    return res.status(200).json({
        success: true,
        members: "Member removed successfully",
    });
})


// Leave someone from the group
const leaveMembers = TryCatch(async (req, res, next) => {

    const chatId = req.params.id;

    const chat = await Chat.findById(chatId);

    if (!chat)
        return next(new ErrorHandler("Chat not found", 404));

    if (!chat.groupChat)
        return next(new ErrorHandler("This is not a group chat", 400));

    const remainingMembers = chat.members.filter(
        (members) => members.toString() !== req.user.toString()
    )

    if (remainingMembers.length < 3){
        return next(new ErrorHandler("Group must have at least 3 members", 400));
    }

    if (chat.creator.toString() === req.user.toString()) {

        const randomElement = Math.floor(Math.random() * remainingMembers.length);

        const newCreator = remainingMembers[randomElement];

        chat.creator = newCreator;
    }

    chat.members = remainingMembers;

    const [user] = await Promise.all([User.findById(req.user, "name"), chat.save()])

    emitEvent(
        req,
        ALERT,
        chat.members,
        `User ${user.name} has left the group`
    )

    emitEvent(req, REFETCH_CHATS, chat.members)

    return res.status(200).json({
        success: true,
        members: "Leave group successfully",
    });
})


const sendAttachments = TryCatch(async (req, res, next) => {

    const { chatId } = req.body;

    console.log(chatId)


    const [chat, me] = await Promise.all([
        Chat.findById(chatId),
        User.findById(req.user, 'name')
    ]);

    console.log(chat);
    
    if (!chat) return next(new ErrorHandler("Chat not found", 404));

    const files = req.files || [];

    // console.log(files)

    if (files.length < 1) return next(new ErrorHandler("Please Upload Attachment", 400));

    const attachments = await uploadFilesToCloudinary(files);

    const messageForDB = {
        content: "",
        attachments,
        sender: me._id,
        chat: chatId,
    };

    const messageForRealTime = {
        ...messageForDB,
        sender: {
            _id: me._id,
            name: me.name,
        },
    };

    const message = await Message.create(messageForDB);


    emitEvent(req, NEW_MESSAGE, chat.members, {
        message: messageForRealTime,
        chatId,
    })


    emitEvent(req, NEW_MESSAGE_ALERT, chat.members, { chatId, })


    return res.status(200).json({
        success: true,
        message,
    })
})

// const sendAttachments = TryCatch(async (req, res, next) => {
//     try {
//         console.count("API called");

//         // Validate the incoming request body and files
//         const { chatId } = req.body;
//         const files = req.files || [];

//         console.log("Received Request Body:", req.body);
//         console.log("Uploaded Files:", files);

//         // Check if chatId is provided
//         if (!chatId) {
//             console.error("Chat ID is missing in the request.");
//             return next(new ErrorHandler("Chat ID is required.", 400));
//         }

//         // Validate file count
//         if (files.length < 1) {
//             return next(new ErrorHandler("Please upload at least one attachment.", 400));
//         }
//         if (files.length > 5) {
//             return next(new ErrorHandler("You can upload a maximum of 5 files.", 400));
//         }

//         // Fetch chat and user information in parallel
//         const [chat, me] = await Promise.all([
//             Chat.findById(chatId),
//             User.findById(req.user, "name"),
//         ]);

//         // Validate chat and user existence
//         if (!chat) {
//             console.error("Chat not found.");
//             return next(new ErrorHandler("Chat not found.", 404));
//         }

//         if (!me) {
//             console.error("User not found.");
//             return next(new ErrorHandler("User not found.", 404));
//         }

//         // Upload files to Cloudinary or any cloud storage
//         const attachments = await uploadFilesToCloudinary(files);

//         console.log("Attachments uploaded:", attachments);

//         // Prepare the message payload
//         const messageForDB = {
//             content: "",
//             attachments,
//             sender: me._id,
//             chat: chatId,
//         };

//         const messageForRealTime = {
//             ...messageForDB,
//             sender: {
//                 _id: me._id,
//                 name: me.name,
//             },
//         };

//         // Save the message to the database
//         const message = await Message.create(messageForDB);

//         // Emit events for real-time updates
//         emitEvent(req, NEW_ATTACHMENT, chat.members, {
//             message: messageForRealTime,
//             chatId,
//         });

//         emitEvent(req, NEW_MESSAGE_ALERT, chat.members, {
//             chatId,
//         });

//         // Send the response
//         return res.status(200).json({
//             success: true,
//             message,
//         });
//     } catch (err) {
//         // Catch unexpected errors and pass them to the error handler
//         console.error("Error in sendAttachments:", err.message);
//         return next(new ErrorHandler(err.message || "Internal Server Error", 500));
//     }
// });




const getChatDetails = TryCatch(async (req, res, next) => {

    if (req.query.populate === "true") {
        const chat = await Chat.findById(req.params.id).populate("members", "name avatar").lean();

        if (!chat) return next(new ErrorHandler("chat not found"), 404);

        chat.members = chat.members.map(({ _id, name, avatar }) => ({
            _id,
            name,
            avatar: avatar.url
        }));

        return res.status(200).json({
            success: true,
            chat,
        });
    }
    else {
        const chat = await Chat.findById(req.params.id);
        if (!chat) return next(new ErrorHandler("chat not found"), 404);

        return res.status(200).json({
            success: true,
            chat,
        });
    }

})

//  Rename Group
const renameGroup = TryCatch(async (req, res, next) => {

    const chatId = req.params.id;
    const { name } = req.body;

    const chat = await Chat.findById(chatId);

    if (!chat) return next(new ErrorHandler("chat not found", 404));

    if (!chat.groupChat)
        return next(new ErrorHandler("This is not a group chat", 400));

    if (chat.creator.toString() === req.user.toString()) {
        return next(new ErrorHandler("you are not allowed to remane the group"), 403)
    }

    chat.name = name;

    await chat.save();

    emitEvent(
        req,
        REFETCH_CHATS,
        chat.members,
    )

    return res.status(200).json({
        success: true,
        members: "Member renamed successfully",
    });

})

// Delete Chat
const deleteChat = TryCatch(async (req, res, next) => {

    const chatId = req.params.id;

    const chat = await Chat.findById(chatId);

    if (!chat) return next(new ErrorHandler("chat not found", 404));

    const members = chat.members;

    // Check if it's a group chat and if the user is the creator
    if (!chat.groupChat.toString() && chat.creator.toString() !== req.user.toString()) {
        return next(new ErrorHandler("you are not allowed to delete the group", 403))
    }

    // Check if the user is allowed to delete based on membership
    if (!chat.getMyChats && !chat.members.includes(req.user.toString())) {
        return next(new ErrorHandler("you are not allowed to delete the group", 403))
    }

    // Find messages with attachments
    const messageWithAttachments = await Message.find({
        chat: chatId, attachments: { $exists: true, $ne: [] },
    });

    const public_ids = [];

    messageWithAttachments.forEach(({ attachments }) => {
        attachments.forEach(({ public_id }) => public_ids.push(public_id));
    });


    // Perform deletions in parallel
    await Promise.all([
        deleteFilesFromCloudinary(public_ids),
        chat.deleteOne(),
        Message.deleteMany({ chat: chatId })
    ]);

    // Emit event to update chat lists
    emitEvent(
        req,
        REFETCH_CHATS,
        members,
    )

    return res.status(200).json({
        success: true,
        members: "Chat deleted successfully",
    });

});

// const getMessages = TryCatch(async (req, res, next) => {

//     const chatId = req.params.id;

//     const { page = 1 } = req.query;

//     const resultPerPage = 20;

//     const skip = (page - 1) * resultPerPage;


//     const [messages, totalMessagesCount] = await Promise.all([Message.find(
//         { chat: chatId })
//         .sort({ created: -1 })
//         .skip(skip)
//         .limit(resultPerPage)
//         .populate("sender", "name") // We can show name with avatar like("name avatar")
//         .lean(),
//     Message.countDocuments({ chat: chatId })
//     ]);

//     console.log(totalMessagesCount);

//     const totalPagers = Math.ceil(totalMessagesCount / resultPerPage) || 0;

//     return res.status(200).json({
//         success: true,
//         messages: messages.reverse(),
//         totalPagers,
//     });
// })


const getMessages = TryCatch(async (req, res, next) => {
    const chatId = req.params.id;
    // console.log(chatId);
    const { page = 1 } = req.query;

    const resultPerPage = 20;
    const skip = (page - 1) * resultPerPage;
    const sort = req.query.sort === 'desc' ? -1 : 1; // default to ascending


    const [messages, totalMessagesCount] = await Promise.all([
        Message.find({ chat: chatId })
            // .sort({ created: 1 }) // Sort by oldest first
            .sort({ timestamp: sort })
            .skip(skip)
            .limit(resultPerPage)
            .populate("sender", "name avatar")
            .lean(),
        Message.countDocuments({ chat: chatId })
    ]);

    const totalPages = Math.ceil(totalMessagesCount / resultPerPage) || 0;

    return res.status(200).json({
        success: true,
        messages, // No need to reverse
        totalPages,
    });
});



export {
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
    getMessages,
};
