AI-Powered Meeting Notes Summarizer
🚀 Overview
This is a full-stack application that allows users to upload meeting transcripts, generate summaries using AI, edit the summaries, and share them via email. The approach focuses on creating a functional and user-friendly application with a simple and intuitive interface.

✨ How It Works
Upload Transcript: Users can upload a text transcript (e.g., meeting notes, call transcript).

Provide Instructions: Users can input a custom instruction/prompt (e.g., “Summarize in bullet points for executives” or “Highlight only action items”).

Generate Summary: The AI generates a structured summary based on the transcript and the user's prompt.

Edit & Refine: The generated summary is fully editable, allowing for manual adjustments.

Share: Once finalized, the user can share the summary via email by entering recipient addresses.

🛠️ Tech Stack
Frontend
React: A JavaScript library for building user interfaces.

Vite: A fast and modern build tool for web development.

Tailwind CSS: A utility-first CSS framework for rapid UI development.

Backend
Node.js: A JavaScript runtime for building server-side applications.

Express.js: A web framework for Node.js that simplifies the process of building APIs.

Services
EmailJS: A service that allows you to send emails directly from your frontend without the need for a dedicated email server.

Vercel: A cloud platform for hosting modern web applications with seamless Git integration.

⚙️ Development Process
The development process was broken down into the following stages:

Project Setup: The project structure was set up with separate directories for the frontend and backend. The frontend was initialized using Vite with the React template, and the backend was set up as a Node.js project with Express.js.

Frontend Development: The UI was built with a focus on user experience, including components for file uploads, text inputs, summary display, and the email sharing form.

Backend Development: The backend was developed to expose an API endpoint that accepts the meeting transcript and custom prompt, integrates with the AI service, and returns the generated summary.

AI Integration: The backend was connected to an external AI service API to handle the core summarization logic based on user input.

Email Sharing: The email sharing functionality was implemented on the client-side using the EmailJS service.

Deployment: The frontend and backend were deployed as separate services on Vercel, configured for continuous deployment from a GitHub repository.

🚀 Deployment
The application is deployed on Vercel. The frontend and backend are deployed as separate projects, configured to communicate with each other. Vercel's integration with GitHub allows for automatic deployments on every push to the main branch, ensuring the live application is always up-to-date.
