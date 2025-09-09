# AI-Powered Notes Generator

![React](https://img.shields.io/badge/React-18.2.0-blue)
![TypeScript](https://img.shields.io/badge/Javascript-5.0.0-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3.0-38B2AC)

A beautiful, responsive web application that transforms your questions into detailed, well-structured PDF study notes using AI. Perfect for students, educators, and professionals.

## ✨ Features

- 🤖 AI-powered content generation using Groq API and LLaMA 3
- 📚 Create comprehensive study notes from simple questions
- 🎨 Beautiful, modern UI with responsive design for all devices
- ⚙️ Customizable formatting options (bullet points, examples, summaries)
- 🎚️ Adjustable detail levels (concise, balanced, detailed)
- 🗣️ Multiple tone options (academic, professional, simple, enthusiastic)
- 📱 Mobile-friendly interface with intuitive controls
- 📥 Instant PDF download with professional formatting
- 🔔 Toast notifications for user feedback


## 🛠️ Tech Stack

- **Frontend:** React.js, Tailwind CSS  
- **PDF Generation:** jsPDF  
- **Icons:** react-icons  
- **AI API:** Groq AI (LLaMA 3.1)  

## 📂 Project Structure

AI-Notes-Generator/
- │── src/
- │ ├── components/
- │ │ └── NotesGenerator.jsx # Main component
- │ ├── App.jsx # App entry
- │ └── main.jsx # React DOM render
- │── public/ # Static assets
- │── package.json
- │── README.md

## 🚀 Live Demo

Check out the live application: [https://notes-gamma-two.vercel.app/](https://notes-gamma-two.vercel.app/)

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/samarthheble/notes.git
```
```bash
cd notes
```
```bash
npm install
```

Create a .env file in the root directory and add your Groq API key.

🔑 You can get an API key from Groq
```bash
VITE_GROQ_API_KEY=your_api_key_here
```
```bash
npm run dev ## Start the development server
```

---
Thanks for reading..❤️
