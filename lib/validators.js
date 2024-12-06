import { body, validationResult, check, param, query } from 'express-validator'
import { ErrorHandler } from '../utils/utility.js';


const validateHandler = (req, res, next) => {

    const errors = validationResult(req);

    const errorMessage = errors.array().map((error) =>
        error.msg).join(", ");


    if (errors.isEmpty()) return next();

    else next(new ErrorHandler(errorMessage, 400))
}


// For Register (if any input field is empty then show the error message)
const registerValidator = () => [

    body("name", "Please Enter Name").notEmpty(),
    body("username", "Please Enter Username").notEmpty(),
    body("password", "Please Enter Password").notEmpty(),
    body("bio", "Please Enter Bio").notEmpty(),

    // check("avatar").notEmpty().withMessage("Please Enter Avatar")  ---> We can pass the error message in this way

];

// For Login (if any input field is empty then show the error message)
const loginValidator = () => [
    body("username", "Please Enter Username").notEmpty(),
    body("password", "Please Enter Password").notEmpty(),

];

// For New Group (if any input field is empty then show the error message)
const newGroupValidator = () => [
    body("name", "Please Enter Name").notEmpty(),
    body("members").notEmpty().withMessage("Please Enter Members").isArray({ min: 2, max: 100 }).withMessage("Members must have be 2-100"),
];

// For Add Member in Group (if any input field is empty then show the error message)
const addMemberValidator = () => [
    body("chatId", "Please Enter Chat ID").notEmpty(),
    body("members").notEmpty().withMessage("Please Enter Members").isArray({ min: 1, max: 97 }).withMessage("Members must have be 1-97"),
];

// For Remove Member in Group (if any input field is empty then show the error message)
const removeMemberValidator = () => [
    body("chatId", "Please Enter Chat ID").notEmpty(),
    body("userId", "Please Enter User ID").notEmpty(),
];

const sendAttachmentsValidator = () => [
    body("ChatId", "Please Enter Chat ID").notEmpty(),
];

const chatIdValidator = () => [
    param("id", "Please Enter Chat ID").notEmpty(),
];

const renameValidator = () => [
    param("id", "Please Enter Chat ID").notEmpty(),
    body("name", "Please Enter New Nmae").notEmpty(),

];

const sendRequestValidator = () => [
    body("userId", "Please Enter User Id").notEmpty(),
];

const accepteRequestValidator = () => [
    body("requestId","Please Enter Request Id").notEmpty(),
    body("accept")
    .notEmpty().withMessage("Please Add Accept")
    .isBoolean().
    withMessage("Accept must be a boolean"),

];


export {
    registerValidator,
    validateHandler,
    loginValidator,
    newGroupValidator,
    addMemberValidator,
    removeMemberValidator,
    sendAttachmentsValidator,
    chatIdValidator,
    renameValidator,
    sendRequestValidator,
    accepteRequestValidator,
}