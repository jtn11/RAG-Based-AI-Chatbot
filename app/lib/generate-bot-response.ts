export async function GenerateBotResponse(
  userInput: string,
  isRagActive: boolean,
  pdfUploaded: boolean,
  userid: string,
  finalChatId: string,
) {
  try {
    const backendUrl =
      process.env.BACKEND_API_URL ||
      process.env.RAG_BACKEND_URL ||
      "http://localhost:8000";
    const res = await fetch(`${backendUrl}/chat`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        query: userInput,
        userId: userid,
        chatId: finalChatId,
        is_rag_active: isRagActive,
        is_pdf_uploaded: pdfUploaded,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      console.error(`Backend returned HTTP ${res.status}:`, errorText);
      return `Backend error (${res.status}): Unable to process the request.`;
    }

    const data = await res.json();
    return data?.answer || "No response received from the assistant.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Unable to connect to the assistant backend. Please ensure the Python backend is running on port 8000.";
  }
}
