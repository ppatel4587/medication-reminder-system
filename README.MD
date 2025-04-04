# Voice-Driven Medication Reminder System

This is a Node.js-based voice reminder system that calls patients, reminds them about their medication, captures their voice confirmation, and logs everything for review. Built using Twilio, Express, and STT transcription.

## 🩺 Features
- Make a voice call to the patient via REST API
- TTS message to confirm medications
- Record patient’s response and transcribe it
- Handle voicemail and fallback to SMS (extension optional)
- Replay message if patient calls back
- View call logs via API

---

## 🔧 Setup Instructions

### 1. Clone the repo
```bash
git clone https://github.com/<your-repo-name>.git
cd <your-repo-name>
