from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os


from ingestion_pipeline import BASE_DIR, run_ingestion
from retrieval_pipeline import retrieve_chunks
from generation_pipeline import generate_answer
from generation_pipeline import generate_llm_answer

# Load environment variables once, globally
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all domains including local and Vercel deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str 
    userId: str
    chatId: str
    is_rag_active : bool
    is_pdf_uploaded : bool

class IngestRequest(BaseModel):
    fileUrl: str
    userId: str
    chatId: str

@app.post("/ingest")
def ingest(req: IngestRequest):
    """
    Ingest a document from a URL.
    This runs chunking + embedding and stores vectors.
    """
    run_ingestion(req.fileUrl, req.userId, req.chatId)
    return {"status": "ingestion completed"}


def rag_chat(query: str, user_id: str, chat_id: str) -> str:


    print(">>> ENTERED RAG CHAT <<<")
    print("User:", user_id)
    print("Chat:", chat_id)

    persist_directory = os.path.join(
        BASE_DIR,
        "db",
        user_id,
        chat_id
    )

    if not os.path.exists(persist_directory):
        # No vectorstore for this chat
        return llm_chat(query)

    docs = retrieve_chunks(query, persist_directory)
    chunks = [doc.page_content for doc in docs]
    return generate_answer(query, chunks)


def llm_chat(query : str) -> str :
    return generate_llm_answer(query)

@app.post("/chat")
def chat(req: QueryRequest):
    """
    Production chat endpoint.
    Returns a final, grounded answer.
    """
    print("RAG Active:", req.is_rag_active)
    print("PDF Uploaded:", req.is_pdf_uploaded)
    print("User:", req.userId)
    print("Chat:", req.chatId)
    if req.is_rag_active and req.is_pdf_uploaded:
       answer = rag_chat(req.query, req.userId, req.chatId)
    else:
       answer = llm_chat(req.query )
    return {
        "query": req.query,
        "answer": answer
    }

@app.post("/clear")
def clear_vectors():
    persist_directory = "db/chroma_db"

    if os.path.exists(persist_directory):
        shutil.rmtree(persist_directory)

    return {"status": "cleared"}