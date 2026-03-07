import { getAdminDb } from "@/firebase/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const db = getAdminDb();
export async function createChat(userId: string, initialMessage?: string) {
  const title = initialMessage
    ? initialMessage.length > 30
      ? initialMessage.substring(0, 30) + "..."
      : initialMessage
    : "New Chat";

  const chatRef = await db
    .collection("users")
    .doc(userId)
    .collection("chats")
    .add({
      title: title,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      isRagActive: false,
      activeDocumentName: null,
    });

  return chatRef.id;
}

export async function getChatById(userId: string, chatId: string) {
  const doc = await db
    .collection("users")
    .doc(userId)
    .collection("chats")
    .doc(chatId)
    .get();

  if (!doc.exists) return null;
  return doc.data();
}

export async function saveMessage(
  userId: string,
  chatId: string,
  text: string,
  sender: "user" | "bot",
) {
  await db
    .collection("users")
    .doc(userId)
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .add({
      text,
      sender,
      createdAt: FieldValue.serverTimestamp(),
    });

  // update chat updatedAt
  await db
    .collection("users")
    .doc(userId)
    .collection("chats")
    .doc(chatId)
    .update({
      updatedAt: FieldValue.serverTimestamp(),
    });
}
