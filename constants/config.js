const corsOptions = {
    origin: [
        "http://localhost:5173", // For local development
        process.env.CLIENT_URL,// Deployed frontend
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // Allow cookies
};


const MESSAGE_TOKRN = "message-Token"

export{corsOptions, MESSAGE_TOKRN}