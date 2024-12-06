import { ErrorHandler } from "../utils/utility.js";
import jwt from "jsonwebtoken"
import { TryCatch } from "./error.js";
import { MESSAGE_TOKRN } from "../constants/config.js";
import { User } from '../models/user.js';


const isAuthenticated = TryCatch(async (req, res, next) => {

    const token = req.cookies[MESSAGE_TOKRN];

    if (!token)

        return next(new ErrorHandler("Please login to access this route", 401));

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decodedData._id;

    next();
});



const socketAuthenticator = async (err, socket, next) => {

    try {

        if (err)
            return next(err);

        const authToken = socket.request.cookies[MESSAGE_TOKRN];

        if (!authToken)
            return next(new ErrorHandler("Please login to access this route", 401));

        const decodedData = jwt.verify(authToken, process.env.JWT_SECRET)

        const user = await User.findById(decodedData._id);

        if (!user)
            return next(new ErrorHandler("Please login to access this route", 401));


        socket.user = user;

        return next();

    } catch (error) {
        console.log(error)
        return next(new ErrorHandler("Please login to access this route", 401))

    }
}



export { isAuthenticated, socketAuthenticator }





// import jwt from "jsonwebtoken";
// import { ErrorHandler } from "../utils/utility.js";
// import { TryCatch } from "./error.js";
// import { MESSAGE_TOKRN } from "../constants/config.js";
// import { User } from "../models/user.js";

// const isAuthenticated = TryCatch((req, res, next) => {
//   const token = req.cookies[MESSAGE_TOKRN];
//   if (!token)
//     return next(new ErrorHandler("Please login to access this route", 401));

//   const decodedData = jwt.verify(token, process.env.JWT_SECRET);

//   req.user = decodedData._id;

//   next();
// });

// const adminOnly = (req, res, next) => {
//   const token = req.cookies["chattu-admin-token"];

//   if (!token)
//     return next(new ErrorHandler("Only Admin can access this route", 401));

//   next();
// };

// const socketAuthenticator = async (err, socket, next) => {
//   try {
//     if (err) return next(err);

//     const authToken = socket.request.cookies[MESSAGE_TOKRN];

//     if (!authToken)
//       return next(new ErrorHandler("Please login to access this route", 401));

//     const decodedData = jwt.verify(authToken, process.env.JWT_SECRET);

//     const user = await User.findById(decodedData._id);

//     if (!user)
//       return next(new ErrorHandler("Please login to access this route", 401));

//     socket.user = user;

//     return next();
//   } catch (error) {
//     console.log(error);
//     return next(new ErrorHandler("Please login to access this route", 401));
//   }
// };

// export { isAuthenticated, socketAuthenticator };