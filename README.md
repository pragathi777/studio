# AI-Powered Mock Interview Platform

This is a full-stack Next.js application that provides a realistic, AI-powered mock interview experience. It includes a multi-round interview process with an aptitude test, a coding challenge, and a conversational HR interview, complete with AI-generated feedback.

## Technologies Used

-   **Frontend:** Next.js 15, React 18, TypeScript, Tailwind CSS, ShadCN UI
-   **AI Orchestration:** Genkit
-   **Generative Models:** Google Gemini
-   **Backend:** Firebase (Authentication, Firestore)

## Getting Started

Follow these instructions to set up and run the project on your local machine.

### 1. Prerequisites

Make sure you have the following installed on your system:
*   [Node.js](https://nodejs.org/en) (v20 or later recommended)
*   [npm](https://www.npmjs.com/) (usually comes with Node.js)

### 2. Set Up Firebase

The backend for this application is powered by Firebase.

1.  **Create a Firebase Project:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Click "Add project" and follow the on-screen instructions to create a new project.

2.  **Create a Web App:**
    *   In your project's dashboard, click the web icon (`</>`) to add a new web app.
    *   Register your app. When you're done, Firebase will provide you with a `firebaseConfig` object. **Copy this object.**

3.  **Update Firebase Configuration:**
    *   Open the `src/firebase/config.ts` file in this project.
    *   Replace the placeholder `firebaseConfig` object with the one you copied from your Firebase project.

4.  **Enable Firebase Services:**
    *   In the Firebase Console, go to the "Build" section in the left sidebar.
    *   **Authentication:** Click on "Authentication", go to the "Sign-in method" tab, and enable the **Email/Password** provider.
    *   **Firestore:** Click on "Firestore Database", create a new database in **Production mode**, and choose a location.

### 3. Install Dependencies

Open your terminal, navigate to the project's root directory, and run the following command to install all the necessary packages:

```bash
npm install
```

### 4. Run the Development Server

Once the dependencies are installed, you can start the application with the following command:

```bash
npm run dev
```

This will start the Next.js development server, typically on [http://localhost:3000](http://localhost:3000). The Genkit AI flows are integrated into the Next.js server, so they will run automatically.

You can now open your browser and navigate to `http://localhost:3000` to use the application. You can start by creating a new account on the registration page.
