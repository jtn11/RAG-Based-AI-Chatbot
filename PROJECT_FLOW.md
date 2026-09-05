# AI Chatbot with RAG (Retrieval-Augmented Generation)
### Interview Prep & Project Flow Guide

This document explains the high-level architecture, tech stack, and step-by-step flows of the application. Use this guide to explain the project clearly during your interviews.

---

## 🛠️ Technology Stack

* **Frontend & Web Server**: Next.js 16 (React 19), TypeScript, Tailwind CSS.
* **Metadata & Chat History**: Firebase Firestore (stores user accounts, chat metadata, and message history).
* **Document Storage**: Local file system (saved inside the Next.js `public/uploads/` directory to ensure independent, cost-effective local deployment).
* **RAG Backend**: Python FastAPI (runs on port `8000` to process PDFs, perform vector search, and run RAG pipeline).
* **Text Extraction**: `pypdf` (Python PDF reader library).
* **Text Chunking & Abstractions**: `LangChain` framework.
* **Embeddings Model**: `sentence-transformers/all-MiniLM-L6-v2` (runs locally via HuggingFace library, generating 384-dimensional dense vectors).
* **Vector Database**: `Chroma` (lightweight, embedded vector store persisted locally in a directory isolated by user and chat IDs).
* **LLM**: Groq SDK (low-latency LLM calls using Mixtral/Llama models).

---

## 🔄 Core Flows

### 1. Document Upload & Ingestion Flow
```
[User Uploads PDF] ──> [Next.js API /api/uploads] ──> [Saves PDF locally to /public/uploads]
                                                            │
                                                            ├──> [Saves Chat metadata to Firestore]
                                                            │
                                                            └──> [FastAPI /ingest] 
                                                                       │
                                                                       ├──> [Extracts & Cleans text]
                                                                       ├──> [Chunks text (LangChain)]
                                                                       ├──> [Generates Embeddings (HF)]
                                                                       └──> [Saves to ChromaDB (db/)]
```
1. **User Action**: The user selects and uploads a PDF in the chatbot interface.
2. **Next.js File Save**: The Next.js API route `/api/uploads` receives the file stream, saves the buffer to disk under `public/uploads/{userId}/{chatId}/{fileId}.pdf`, and updates Firestore with document metadata (filename, path, `isRagActive: true`).
3. **Trigger Ingestion**: Next.js notifies the FastAPI backend `/ingest` endpoint, sending the file's local URL, user ID, and chat ID.
4. **FastAPI Download & Text Extraction**: FastAPI fetches the PDF from the local Next.js server, extracts the text using `pypdf`, and cleans up whitespace.
5. **Chunking**: The extracted text is split into overlapping chunks (default ~1000 characters) using LangChain's `CharacterTextSplitter`.
6. **Embeddings & Vector Database**: FastAPI generates vector embeddings for each chunk using the `all-MiniLM-L6-v2` sentence-transformer model and saves them into a chat-specific ChromaDB instance (`db/{userId}/{chatId}/`).

---

### 2. Retrieval-Augmented Generation (RAG) Chat Flow
```
[User Types Message] ──> [Next.js Client] ──> [FastAPI /chat]
                                                   │
                                                   ├──> [Load ChromaDB for {userId}/{chatId}]
                                                   ├──> [Retrieve Top-K Chunks (Similarity Search)]
                                                   ├──> [Generate Prompt (Context + Query)]
                                                   └──> [Groq LLM response] ──> [Next.js Chat UI]
```
1. **User Action**: The user asks a question in a chat session where RAG mode is active.
2. **Forward Query**: Next.js forwards the message, `userId`, and `chatId` to the FastAPI backend `/chat` endpoint.
3. **Retrieval**: FastAPI loads the ChromaDB collection for that specific `userId` and `chatId`. It runs a similarity search to fetch the top text chunks matching the user's query.
4. **Generation (Prompt Engineering)**: The retrieved text chunks are formatted as "context" and injected into a structured LLM prompt template:
   ```text
   Answer the question based only on the following context:
   ---
   [Retrieved Chunks/Context]
   ---
   Question: [User Query]
   ```
5. **LLM Query**: The prompt is sent to Groq. Groq answers the query *specifically* based on the context provided in the document.
6. **Display Response**: The FastAPI server returns the answer to Next.js, which displays it in the chat UI and logs the chat history in Firestore.

---

## 💡 Key Design Decisions & Interview Highlights

1. **Local PDF Storage vs. Remote Storage**: 
   * *Highlight*: "We moved away from Google Cloud/Firebase Storage to a local file system storage in the `public/` directory of the Next.js app. This made the app completely self-contained, eliminated remote billing dependencies, and simplified local development."
2. **User-level and Chat-level Isolation**:
   * *Highlight*: "To prevent data leaks, ChromaDB collections are dynamically instantiated and isolated using path structures: `db/{userId}/{chatId}`. A user can only retrieve context from files uploaded to their active chat session."
3. **Local Embedding Models**:
   * *Highlight*: "We chose a lightweight local embedding model (`all-MiniLM-L6-v2` via HuggingFace) rather than cloud APIs (like OpenAI Embeddings). This minimizes external API costs, protects data privacy, and works efficiently on standard CPUs."
