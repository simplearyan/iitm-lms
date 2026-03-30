# 🎓 IITM Unified LMS: Assessment & Examination Engine

A modern, high-fidelity Learning Management System (LMS) mockup tailored for the IIT Madras BS Degree environment. This project focuses on a seamless transition between **Instructor Authoring** and **Learner Examination** experiences.

![IITM Logo](https://www.iitm.ac.in/sites/default/files/iitm-logo_0.png)

## 🚀 Core Features

### 🛠️ Instructor Dashboard (Authoring)
- **Syllabus Builder**: Drag-and-drop style module management.
- **Unified Assessment Creator**: Build Assignments, Quizzes, and Mock Exams from a single interface.
- **Live Markdown & LaTeX Previews**: Real-time rendering of complex mathematical formulas using KaTeX.
- **Assessment Configuration**: Set granular rules for duration, total marks, and submission policies (Strict vs. Open).

### 📖 Learner Experience (Exam Engine)
- **High-Stakes Exam UI**: Inspired by the IITM Exam-Portal for a familiar student experience.
- **Integrated Whiteboard**: Question-specific scratchpad for manual calculations.
- **Real-Time Progress Tracking**: Visual palette indicating answered, flagged, and unvisited questions.
- **Responsive Theme**: sleek dark/light mode integration for focused study sessions.

## 🛠️ Tech Stack
- **Framework**: Vite + React 19
- **State Management**: Zustand
- **Styling**: Tailwind CSS 4
- **Rendering**: Marked (Markdown), KaTeX (Math), Rough.js (Hand-drawn Whiteboard)
- **Icons**: Lucide React

## 📦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🚢 Deployment
This project is configured for automated deployment to **GitHub Pages** via GitHub Actions. Every push to the `main` branch triggers a build and deploy cycle.

Verification: `base: './'` is preset in `vite.config.js` for perfect subfolder routing.

---
*Created with ❤️ for the IITM BS Degree Community.*
