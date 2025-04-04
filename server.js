// server.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { twiml } = require("twilio");
const VoiceResponse = twiml.VoiceResponse;
const { createServer } = require("http");
const twilio = require("twilio");
const axios = require("axios");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// In-memory call log
let callLogs = [];

const MEDICATION_LIST = ["Aspirin", "Cardivol", "Metformin"];
const REMINDER_TEXT = `Hello, this is a reminder from your healthcare provider to confirm your medications for the day. Please confirm if you have taken your ${MEDICATION_LIST.join(", ")} today.`;
const VOICEMAIL_TEXT = `We called to check on your medication but couldn't reach you. Please call us back or take your medications if you haven't done so.`;

// Route to trigger a call
app.post("/call", async (req, res) => {
  const { to } = req.body;
  try {
    const call = await client.calls.create({
      url: `${process.env.BASE_URL}/voice`,
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    console.log("[CALL TRIGGERED] SID:", call.sid);
    res.status(200).json({ message: "Call initiated", sid: call.sid });
  } catch (error) {
    console.error("[ERROR] Failed to initiate call:", error);
    res.status(500).json({ error: "Failed to initiate call" });
  }
});

// Voice call handler
app.post("/voice", (req, res) => {
  const response = new VoiceResponse();
  response.say(REMINDER_TEXT);
  response.record({
    maxLength: 15,
    action: "/recording",
    transcribe: true,
    transcribeCallback: "/transcription"
  });
  res.type("text/xml");
  res.send(response.toString());
});

// Recording callback
app.post("/recording", async (req, res) => {
  const { CallSid, CallStatus, RecordingUrl } = req.body;

  const log = {
    sid: CallSid,
    status: CallStatus,
    responseText: "Pending (transcription in progress)",
    recordingUrl: RecordingUrl || "N/A"
  };

  callLogs.push(log);
  console.log("[CALL COMPLETED] SID:", CallSid, "Status:", CallStatus);
  res.sendStatus(200);
});

// Transcription callback
app.post("/transcription", (req, res) => {
  const { CallSid, TranscriptionText } = req.body;
  const log = callLogs.find(log => log.sid === CallSid);
  if (log) {
    log.responseText = TranscriptionText || "(No transcription)";
    console.log("[TRANSCRIPTION] SID:", CallSid, "Text:", TranscriptionText);
  }
  res.sendStatus(200);
});

// Patient call-back handler
app.post("/incoming", (req, res) => {
  const response = new VoiceResponse();
  response.say(REMINDER_TEXT);
  res.type("text/xml");
  res.send(response.toString());
});

// Endpoint to get call logs
app.get("/logs", (req, res) => {
  res.json(callLogs);
});

const PORT = process.env.PORT || 3000;
createServer(app).listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
