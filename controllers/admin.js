import { TryCatch } from "../middlewares/error.js";
import { User } from "../models/user.js";



const allUsers = TryCatch(async(req,res) => {

    const users = await User.find({});



    return res.status(200).json({
        status: "success",
        data: users,
    })

})


export {
    allUsers
}