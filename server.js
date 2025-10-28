import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import twilio from "twilio";
import nodemailer from "nodemailer";
import Message from "./models/Message.js";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: ["https://vizhi-moments-studio.vercel.app"],
    methods: ["GET", "POST"],
  })
);
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

// Twilio setup
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// API Route for contact form
app.post("/contact", async (req, res) => {
  try {
    const { name, email,number, message } = req.body;

    // 1️⃣ Save to MongoDB
    const newMsg = new Message({ name, email, message });
    await newMsg.save();

    // 2️⃣ Send WhatsApp Message
   // 2️⃣ Send WhatsApp Message (customized for Vizhi Studios)
await client.messages.create({
  from: process.env.TWILIO_WHATSAPP_FROM,
  to: process.env.MY_WHATSAPP_TO,
  body: `💬 *New Inquiry via Vizhi Studios Website*\n\n👤 Name: ${name}\n📧 Email: ${email}\n💍 \n Number: ${number}\n Occasion: ${req.body.occasion || "Not specified"}\n📝 Message: ${message}\n\n📸 _Let's capture their beautiful moments!_`,
});

// 3️⃣ Send Email (branded)
await transporter.sendMail({
  from: `"Vizhi Studios" <${process.env.EMAIL_USER}>`,
  to: process.env.EMAIL_TO,
  subject: `📸 New Inquiry from ${name} — Vizhi Studios Website`,
  html: `
    <h2>New Inquiry from Vizhi Studios Website</h2>
    <p><b>Name:</b> ${name}</p>
    <p><b>Email:</b> ${email}</p>
    <p><b>Number:</b> ${number || "Not provided"}</p>

    <p><b>Occasion:</b> ${req.body.occasion || "Not specified"}</p>
    <p><b>Message:</b><br>${message}</p>
    <hr>
    <p style="font-style: italic;">Sent automatically from Vizhi Studios website 💫</p>
  `,
});


    res.status(200).json({ success: true, message: "Form submitted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error processing request" });
  }
});

// 🩺 Health Check Endpoint
app.get("/health", async (req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    res.status(200).json({
      status: "ok",
      server: "running",
      mongo: mongoStatus,
      time: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Health check failed",
      error: error.message,
    });
  }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
