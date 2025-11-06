# Architectural Block Diagram

This document outlines the high-level architecture of the application. The system is composed of three primary layers: Frontend (Client-Side), Application Server (Serverless Functions), and Backend Services (Google Cloud & Firebase).

```mermaid
graph TD
    subgraph Frontend (Client-Side: Next.js/React in Browser)
        A[User] --> B(UI: ShadCN/React);
        B --> C{Interview Flow};
        C --> C1[Aptitude Step];
        C --> C2[Coding Step];
        C --> C3[HR Step];
        C --> C4[Feedback Step];

        B --> D[Dashboard];
        D --> D1[Past Reports List];

        C3 -- "Speech Input" --> E[Web Speech API];
        E -- "Transcribed Text" --> C3;

        C1 -- "Get Questions" --> F1;
        C2 -- "Run Code" --> F2;
        C3 -- "Get Next Question" --> F3;
        C4 -- "Generate Feedback" --> F4;

        F_FB_AUTH(Firebase Auth SDK) -- "Sign In/Out" --> B;
        F_FB_FS(Firebase Firestore SDK) -- "Save/Read Reports" --> D;
        F_FB_FS -- "Save Report" --> C4;
    end

    subgraph Application Server (Serverless Functions)
        F1(Flow: generateAptitudeQuestions)
        F2(Flow: runCode)
        F3(Flow: simulateHrInterview)
        F4(Flow: provideDetailedFeedback)
    end

    subgraph Backend Services (Google Cloud & Firebase)
        G[Google AI: Gemini Models]
        H[Firebase Auth]
        I[Firestore Database]

        I -- "users/{uid}" --> J[User Data];
        I -- "interviewSessions/{sid}" --> K[Interview Reports];
    end

    %% Frontend to App Server Connections
    C1 --> F1;
    C2 --> F2;
    C3 --> F3;
    C4 --> F4;

    %% App Server to Backend Connections
    F1 --> G;
    F2 --> G;
    F3 --> G;
    F4 --> G;

    %% Frontend to Backend Connections
    F_FB_AUTH --> H;
    F_FB_FS --> I;

    %% Styling
    style A fill:#fff,stroke:#333,stroke-width:2px;
    style B fill:#e6fffa,stroke:#00bfa5;
    style C fill:#e6fffa,stroke:#00bfa5;
    style D fill:#e6fffa,stroke:#00bfa5;
    style F_FB_AUTH fill:#fff0e6,stroke:#ff6d00;
    style F_FB_FS fill:#fff0e6,stroke:#ff6d00;

    style F1 fill:#e3f2fd,stroke:#2962ff;
    style F2 fill:#e3f2fd,stroke:#2962ff;
    style F3 fill:#e3f2fd,stroke:#2962ff;
    style F4 fill:#e3f2fd,stroke:#2962ff;

    style G fill:#f3e5f5,stroke:#aa00ff;
    style H fill:#fbe9e7,stroke:#d84315;
    I;
    style I fill:#fbe9e7,stroke:#d84315;
    style J fill:#fbe9e7,stroke:#d84315;
    style K fill:#fbe9e7,stroke:#d84315;

```

### Layer Breakdown

#### 1. Frontend (Client-Side)
-   **Description**: The user-facing application built with Next.js and React, running in the browser. It manages the UI, routing, and local state.
-   **Technologies**: Next.js, React, ShadCN UI, Tailwind CSS.
-   **Key Components**:
    -   **Interview Flow**: A multi-step component that guides the user through the aptitude, coding, and HR rounds.
    -   **Dashboard**: Displays a summary of past interviews.
    -   **Firebase SDK**: Handles client-side interaction with Firebase for authentication and data access.
    -   **Web Speech API**: Used in the HR step to capture the user's voice and convert it to text.

#### 2. Application Server (Serverless Functions)
-   **Description**: This layer contains the core business logic, implemented as server-side Genkit flows. These functions are responsible for interacting with the powerful Generative AI models.
-   **Technology**: Genkit (TypeScript).
-   **Key Flows**:
    -   `generateAptitudeQuestions`: Creates questions for the aptitude test.
    -   `runCode`: Executes code provided by the user in a sandboxed environment.
    *   `simulateHrInterview`: Acts as the HR chatbot, generating dynamic questions.
    *   `provideDetailedFeedback`: Synthesizes performance data from all rounds into a final report.

#### 3. Backend Services (Google Cloud & Firebase)
-   **Description**: Managed cloud services that provide the necessary infrastructure for data storage, authentication, and AI.
-   **Services**:
    -   **Google AI (Gemini Models)**: The underlying LLMs that provide the intelligence for all AI-powered features.
    -   **Firebase Authentication**: Manages user identity and sign-in.
    -   **Firestore Database**: A NoSQL database that stores user data and all interview reports. Security rules ensure data privacy.
