import { faker, SimpleFaker } from '@faker-js/faker';
import { Chat } from "../models/chat.js";
import { Message } from "../models/message.js";
import { User } from "../models/user.js";


const createSingleChats = async (numChats) => {

    try {
        const users = await User.find().select("_id");

        const chatsPromise = [];

        for (let i = 0; i < users.length; i++) {
            for (let j = i + 1; j < users.length; j++) {
                chatsPromise.push(
                    Chat.create({
                        name: faker.lorem.words(2),
                        members: [users[i], users[j]],
                    })
                );
            }
        }

        await Promise.all(chatsPromise);

        console.log("Chat created successfully");
        process.exit();
    }
    catch (error) {

        console.error(error);
        process.exit();
    }
}

const createGroupChats = async (numChats) => {

    try {

        const users = await User.find().select("_id");

        const chatsPromise = [];

        for (let i = 0; i < numChats; i++) {
            const numsMembers = SimpleFaker.numbers.int({ min: 3, max: users.length })

            const members = [];

            for (let i = 0; i < numsMembers; i++) {
                const randomIndex = Math.floor(Math.random() * users.length);

                const randomUser = users[randomIndex];

                // Ensure the same user is not added twice
                if (!members.includes(randomUser)) {
                    members.push(randomUser)
                }
            }

            const chat = Chat.create({
                groupChat: true,
                name: faker.lorem.words(1),
                members,
                creator: members[0],
            });

            chatsPromise.push(chat);
        }

        await Promise.all(chatsPromise);

        console.log("Chat created Successfully")
        process.exit();

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}


const createMessages = async (numMessages) => {

    try {

         // Fetch all users and chats, selecting only _id field
        const users = await User.find().select("_id");
        const chats = await Chat.find().select("_id");

        const messagesPromise = [];

        for (let i = 0; i < numMessages; i++) {
            // Randomly select a user and chat
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const randomChat = chats[Math.floor(Math.random() * chats.length)];

            messagesPromise.push(
                Message.create({
                    chat: randomChat,
                    sender: randomUser,
                    content: faker.lorem.sentence(),
                })
            )
        }


        await Promise.all(messagesPromise);

        console.log("Messages created Successfully");
        process.exit(0);



    } catch (error) {

        console.error(error);
        process.exit(1);
    }
}


const createMessagesInChat = async (chatId, numMessages) => {

    try{
        const users = await User.find().select("_id");

        const messagesPromise = [];

        for (let i = 0; i < numMessages; i++) {
            const randomUser = users[Math.floor(Math.random() * users.length)];

            messagesPromise.push(
                Message.create({
                    chat: chatId,
                    sender: randomUser,
                    content: faker.lorem.sentence(),
                })
            )
        }
        
        await Promise.all(messagesPromise);

        console.log("Messages created Successfully");
        process.exit();
    }
    catch(error){
        console.error(error);
        process.exit(1);
    }
}

export { 
    createSingleChats, 
    createGroupChats, 
    createMessages,
    createMessagesInChat
}