import express from "express";
import { createServer } from "http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import { YSocketIO } from "y-socket.io/dist/server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.static(path.join(__dirname, "public")));
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

const ySocketIO = new YSocketIO(io);
ySocketIO.initialize();

// app.get("/", (req, res) => {
//     res.status(200).json({
//         message: "Server is running",
//         success: true,
//     });
// });


app.get("/health", (req, res) => {
    res.status(200).json({
        message: "Server is healthy",
        success: true,
    });
});



httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});