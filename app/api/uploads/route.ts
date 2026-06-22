import fs from "fs";
import path from "path";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { createChat } from "@/app/lib/chat-service";
import { getAdminDb } from "@/firebase/firebase-admin";
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

    // Save PDF locally to the public directory
    const fileUUID = crypto.randomUUID();
    const relativePath = `uploads/${userId}/${chatId}/${fileUUID}.pdf`;
    const localPath = path.join(process.cwd(), "public", relativePath);

    // Ensure the directory exists
    fs.mkdirSync(path.dirname(localPath), { recursive: true });

    // Write the buffer to disk
    fs.writeFileSync(localPath, buffer);

    // Construct the public URL serving the local file
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const fileUrl = `${protocol}://${host}/${relativePath}`;

    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8000";
    await fetch(`${backendUrl}/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl, userId, chatId }),
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
          storedFileName: relativePath,
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
