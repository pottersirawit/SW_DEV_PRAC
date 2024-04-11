const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

const auth = require("./routes/auth");
const dentists = require("./routes/dentists");
const bookings = require("./routes/bookings");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const { xss } = require("express-xss-sanitizer");
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100,
});
const hpp = require("hpp");
// const swaggerUI = require("swagger-ui-express");
// const swaggerJSDoc = require("swagger-jsdoc");

//Load env vars
dotenv.config({ path: "./config/config.env" });

//Connect to database
connectDB();

const app = express();
app.use(express.json());
app.use(cors());
app.use(mongoSanitize());
app.use(helmet());
app.use(xss());
app.use(limiter);
app.use(hpp());
app.use(cookieParser());

app.use("/api/v1/auth", auth);
app.use("/api/v1/dentist", dentists);
app.use("/api/v1/bookings", bookings);

const PORT = process.env.PORT || 5001;
const server = app.listen(
  PORT,
  console.log("Server running in", process.env.NODE_ENV, " mode on port ", PORT)
);

process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${(err, promise)}`);
  server.close(() => process.exit(1));
});
