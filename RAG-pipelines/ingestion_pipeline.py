import os
import re
import requests
import io
from langchain_text_splitters import CharacterTextSplitter
from langchain_chroma import Chroma
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from pypdf import PdfReader
from langchain_core.documents import Document

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def extract_text_from_pdf(pdf_source) -> str:
    reader = PdfReader(pdf_source)
    text = ""
    for page in reader.pages:
        text += (page.extract_text() or "") + "\n"
    return text

def normalize_extracted_text(text: str) -> str:
    text = re.sub(r'(?<=\w)\s(?=\w)', '', text)

    # Normalize excessive whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]{2,}', ' ', text)

    return text.strip()


def split_documents(documents, chunk_size=1000, chunk_overlap=0):
    """Split documents into smaller chunks with overlap"""
    print("Splitting documents into chunks...")
    
    text_splitter = CharacterTextSplitter(
        chunk_size=chunk_size, 
        chunk_overlap=chunk_overlap
    )
    
    chunks = text_splitter.split_documents(documents)
    
    if chunks:
    
        for i, chunk in enumerate(chunks[:5]):
            print(f"\n--- Chunk {i+1} ---")
            print(f"Metadata: {chunk.metadata}")
            print(f"Length: {len(chunk.page_content)} characters")
            print(f"Content:")
            print(chunk.page_content)
            print("-" * 50)
        
        if len(chunks) > 5:
            print(f"\n... and {len(chunks) - 5} more chunks")
    
    return chunks

def create_vector_store(chunks, persist_directory):
    """Create and persist ChromaDB vector store"""
    print("Creating embeddings and storing in ChromaDB...")

    print("Chunk count before embedding:", len(chunks))

        
    embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)
    
    # Create ChromaDB vector store
    print("--- Creating vector store ---")
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embedding_model,
        persist_directory=persist_directory, 
        collection_metadata={"hnsw:space": "cosine"}
    )
    print("--- Finished creating vector store ---")
    print("Vector count after creation:", vectorstore._collection.count())

    print(f"Vector store created and saved to {persist_directory}")
    return vectorstore

def run_ingestion(file_url, user_id, chat_id):
    print("=== RAG Ingestion Pipeline ===")

    print(f"Downloading and extracting text from: {file_url}")

    response = requests.get(file_url)
    response.raise_for_status()
    pdf_stream = io.BytesIO(response.content)

    text = extract_text_from_pdf(pdf_stream)
    clean_text = normalize_extracted_text(text)

    persist_directory = os.path.join(
    BASE_DIR,
    "db",
    user_id,
    chat_id
)
    os.makedirs(persist_directory, exist_ok=True)


    # documents = load_documents(docs_path)
    documents = [Document(page_content=clean_text)]

    chunks = split_documents(documents)
    create_vector_store(chunks, persist_directory)

    print("✅ Ingestion complete")


# CLI support (optional but correct)
if __name__ == "__main__":
    # example usage
    # run_ingestion("http://example.com/file.pdf", "user_123", "chat_456")
    pass