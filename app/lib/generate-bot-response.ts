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
    const data = await res.json();
    return data.answer;
  } catch (error) {
    console.log("Chat Error", error);
    return "Something went wrong.";
  }
}
