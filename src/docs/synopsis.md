
# Synopsis: AI-Powered Mock Interview Platform

## 1. Architecture and Program Flow

This application is built on a modern, decoupled architecture designed for scalability and maintainability. It consists of three primary layers: a **Next.js Frontend**, a **Genkit AI Backend**, and **Firebase** for data persistence and authentication.

Here is a step-by-step flow of the program from the user's perspective:

1.  **Authentication**: The user begins by creating an account or logging in using their email and password. This process is securely managed by **Firebase Authentication**.

2.  **Dashboard**: Upon successful login, the user is directed to a personal dashboard. This page fetches their past interview reports from the **Firestore** database and provides an option to start a new interview.

3.  **Starting an Interview**: When the user starts a new session, the application transitions into the multi-round interview interface.

4.  **Aptitude Round**:
    *   The frontend calls a **Genkit AI flow** to dynamically generate a set of aptitude questions (covering mathematical, verbal, and logical reasoning).
    *   The user answers the multiple-choice questions within a time limit.
    *   Once submitted, the frontend calculates the score. If the score meets the cutoff, the user proceeds to the next round. The score is stored locally in the component's state for later use.

5.  **Coding Round**:
    *   The frontend calls another Genkit flow to generate a unique, LeetCode-style coding problem.
    *   The user is presented with a professional, dark-themed IDE where they can write code in multiple languages (e.g., Java, Python, JavaScript).
    *   The user can run their code against test cases. This action calls a "run code" Genkit flow, which executes the code in a sandboxed environment and returns the output or any errors.
    *   When the user submits their final solution, a simplified score is calculated and stored in the component's state.

6.  **HR Interview Round**:
    *   This round is a turn-based conversational interview with an AI.
    *   The frontend calls a Genkit flow to get the first question.
    *   The user clicks a button to start speaking. The browser's native **Web Speech API** captures their voice and transcribes it into text in real-time.
    *   This text transcript is then sent to a text-only Genkit flow. This flow analyzes the user's answer and the conversation history to generate the next logical question.
    *   This loop continues until the user decides to end the interview. The entire conversation transcript is saved in the component's state.

7.  **Final Feedback Generation**:
    *   Once the interview is complete, the application navigates to the final feedback page.
    *   All the data collected during the session—the aptitude score, coding score, and the full HR interview transcript—is sent to a final, comprehensive Genkit AI flow.
    *   This flow uses a powerful prompt to instruct the **Gemini AI model** to analyze all the data, calculate a final weighted score, and generate a detailed feedback report in Markdown format.

8.  **Saving and Displaying the Report**:
    *   The feedback report and overall score are returned to the frontend.
    *   The application then saves the complete interview session, including all scores and the final report, as a single document in the **Firestore** database, associated with the user's ID.
    *   The report is displayed to the user on the feedback page. They can also access it later from their main dashboard.

---

## 2. Technologies Used

### Core Frontend

*   **Next.js 15 (with App Router)**
    *   **Definition**: A popular React framework for building full-stack, production-grade web applications.
    *   **Purpose**: Used to create a fast, server-rendered frontend with a seamless user experience and optimized performance. The App Router simplifies routing and layout management.
*   **React 18**
    *   **Definition**: A JavaScript library for building user interfaces.
    *   **Purpose**: Forms the foundation of the UI, allowing for the creation of interactive, stateful components for each part of the interview process.
*   **TypeScript**
    *   **Definition**: A strongly-typed superset of JavaScript.
    *   **Purpose**: Ensures code quality, improves developer productivity, and reduces bugs by adding static types to the entire codebase.

### Styling and UI

*   **Tailwind CSS**
    *   **Definition**: A utility-first CSS framework for rapidly building custom designs.
    *   **Purpose**: Used for all styling, enabling the creation of a modern, responsive, and consistent design system without writing custom CSS.
*   **ShadCN UI**
    *   **Definition**: A collection of beautifully designed, accessible, and reusable UI components built on top of Radix UI and Tailwind CSS.
    *   **Purpose**: Provides the core UI components like buttons, cards, forms, and dialogs, significantly speeding up development and ensuring a professional look and feel.
*   **Lucide React**
    *   **Definition**: A library of simply designed, consistent open-source icons.
    *   **Purpose**: Provides all the icons used throughout the application for clear and intuitive navigation and user interaction.

### Artificial Intelligence

*   **Genkit**
    *   **Definition**: An open-source framework from Google designed to streamline the development of production-ready AI-powered applications.
    *   **Purpose**: Acts as the orchestration layer for all backend AI logic. It is used to define structured, testable, and maintainable "flows" that connect the frontend to the generative AI models.
*   **Google Gemini**
    *   **Definition**: A family of powerful, multimodal large language models (LLMs) from Google.
    *   **Purpose**: The core generative engine for the application. It is used for generating aptitude and coding questions, acting as the HR interviewer, and composing the final, detailed feedback report.

### Backend and Database

*   **Firebase**
    *   **Definition**: A comprehensive platform from Google for building web and mobile applications.
    *   **Purpose**: Provides the core backend services for the project.
*   **Firebase Authentication**
    *   **Definition**: A Firebase service that provides secure, easy-to-use authentication systems.
    *   **Purpose**: Manages the entire user authentication flow, including secure email/password sign-up and login.
*   **Firestore**
    *   **Definition**: A flexible, scalable, and real-time NoSQL cloud database.
    *   **Purpose**: Acts as the single source of truth for the application. It is used to store user profiles and a complete record of all their interview sessions and final reports.
