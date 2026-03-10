import { getAdminDb } from "@/firebase/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userid, chatId } = await req.json();
  const db = getAdminDb();

  if (!chatId || !userid) {
    return new Response("Unauthorized", { status: 401 });
  }

  const chatDoc = await db
    .collection("users")
    .doc(userid)
    .collection("chats")
    .doc(chatId)
    .get();

  const isRagActive = chatDoc.data()?.isRagActive || false;
  const activeDocumentName = chatDoc.data()?.activeDocumentName || "";

  const messagesSnapshot = await db
    .collection("users")
    .doc(userid)
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .get();

  const messages = messagesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return NextResponse.json({ messages, isRagActive, activeDocumentName });
}
