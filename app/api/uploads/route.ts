import crypto from "crypto";
import { NextResponse } from "next/server";
import { createChat } from "@/app/lib/chat-service";
import { getAdminDb, getAdminStorage } from "@/firebase/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    let chatId = formData.get("currentChatId") as string | null;

    if (!file || !userId) {
      return NextResponse.json(
        { error: "Missing file or userId" },
        { status: 400 }
      );
    }
    if (!chatId) {
      chatId = await createChat(userId);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const adminStorage = getAdminStorage(); 

    // Upload to Firebase Storage
    const safeName = `${userId}/${chatId}/${crypto.randomUUID()}.pdf`;
    const bucket = adminStorage.bucket("chatbot-ai-2e002.firebasestorage.app");
    const fileRef = bucket.file(`uploads/${safeName}`);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Make the file public or generate a signed URL
    // Actually, making it public or generating a long-lived signed URL allows the python backend to read it
    await fileRef.makePublic();
    const fileUrl = fileRef.publicUrl();

    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8000";
    await fetch(`${backendUrl}/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl, userId, chatId }), // pass the URL instead of filePath
    });

    const db = getAdminDb();

    await db
      .collection("users")
      .doc(userId)
      .collection("chats")
      .doc(chatId)
      .set(
        {
          activeDocumentName: file.name,
          storedFileName: safeName,
          isRagActive: true,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return NextResponse.json({
      success: true,
      chatId,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
