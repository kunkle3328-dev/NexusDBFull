# NexusDB

A local research knowledge base with advanced AI capabilities, powered by Google's Gemini API. NexusDB allows you to chat with your documents, ground AI responses in specific sources, and manage your research locally.

## ✨ Features

- **Advanced AI Chat:** Engage in intelligent conversations powered by the Gemini API.
- **Source Grounding:** Upload and select specific documents or links to ground the AI's responses, ensuring accuracy and relevance to your research.
- **Local Database:** All your chats, sources, and metadata are stored securely in your browser using IndexedDB (`idb`). No external database required.
- **Text-to-Speech (TTS):** Listen to the AI's responses with built-in text-to-speech capabilities.
- **Source Selector:** Granular control over which sources are active for each chat session.
- **Markdown & Code Highlighting:** Beautifully rendered markdown responses with syntax highlighting for code blocks.
- **Responsive & Animated UI:** A sleek, modern interface built with Tailwind CSS and Framer Motion.

## 🛠️ Tech Stack

- **Frontend Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **AI Integration:** [@google/genai](https://www.npmjs.com/package/@google/genai)
- **Local Storage:** [idb](https://github.com/jakearchibald/idb) (IndexedDB wrapper)
- **Animations:** [Motion](https://motion.dev/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Markdown Rendering:** `react-markdown`, `remark-gfm`, `react-syntax-highlighter`

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- A Google Gemini API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/nexusdb.git
   cd nexusdb
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory based on the `.env.example` file:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key to the `.env` file:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

### Running the Development Server

Start the Vite development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 📂 Project Structure

```text
├── src/
│   ├── components/      # Reusable UI components (Sidebar, SourceSelector, etc.)
│   ├── lib/             # Utility functions and database configuration (idb)
│   ├── App.tsx          # Main application component and routing
│   ├── index.css        # Global Tailwind CSS styles
│   └── main.tsx         # React entry point
├── .env.example         # Example environment variables
├── index.html           # HTML entry point
├── package.json         # Project dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

## 💡 Usage

1. **Add Sources:** Click the upload button in the sidebar to add new documents or links to your knowledge base.
2. **Create a Chat:** Start a new chat session.
3. **Select Grounding Sources:** Use the "Source Selector" in the top bar to choose which specific documents the AI should use for its responses.
4. **Chat:** Ask questions, request summaries, or generate insights based on your selected sources.
5. **Listen:** Use the Text-to-Speech feature to have the AI read its responses aloud.

## 📄 License

This project is licensed under the MIT License.
