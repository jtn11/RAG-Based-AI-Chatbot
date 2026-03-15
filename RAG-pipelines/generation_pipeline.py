import os
from dotenv import load_dotenv
from groq import Groq
from typing import List

# Load environment variables once
load_dotenv()

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def build_rag_prompt(query: str, chunks: List[str]) -> str:
    """
    Build a grounded RAG prompt from retrieved document chunks.
    """
    # Limit context to avoid token overflow and noise
    context = "\n\n".join(chunks[:3])

    # here [ act as a normal conversation assistant ] from prompt should be fixed 
    return f"""
You are an AI assistant answering questions based on the provided document context
analyze the document and answer the realed questions if asked about document,  
if the question is not related to document act as a normal conversation assistant
.

Instructions:
- The context may be unstructured (e.g., extracted from a PDF).
- You may summarize, reorganize, and rephrase the information.
- Do NOT add facts that are not supported by the context.
- If the answer is not present, respond exactly with:
  "I don't know based on the provided document."

Context:
{context}

Question:
{query}

Answer:
""".strip()


def generate_answer(query: str, chunks: List[str]) -> str:
    """
    Generate a grounded answer using Groq + retrieved chunks.
    """
    if not chunks:
        return "I don't know based on the provided document."

    prompt = build_rag_prompt(query, chunks)

    response = client.chat.completions.create(
       model="llama-3.1-8b-instant",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=512,
    )

    return response.choices[0].message.content.strip()


def generate_llm_answer(query: str) -> str:
    """
    Normal conversational LLM call (no RAG).
    """
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful and intelligent AI assistant."
            },
            {
                "role": "user",
                "content": query
            }
        ],
        temperature=0.7,
        max_tokens=512,
    )

    return response.choices[0].message.content.strip()
