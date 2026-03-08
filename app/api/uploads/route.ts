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

    const uploadDir = path.join(process.cwd(), "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });

    const safeName = `${crypto.randomUUID()}.pdf`;
    const filePath = path.resolve(uploadDir, safeName);

    fs.writeFileSync(filePath, buffer);

    await fetch("http://localhost:8000/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath, userId, chatId }), // we need to send chatId to backend so each file has a seperate vectorstore
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
