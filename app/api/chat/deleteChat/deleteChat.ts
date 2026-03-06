import { getFirestore } from "firebase-admin/firestore";

export function deleteChat(userid: string, chatId: string) {
    
    const db = getFirestore();
    const docRef = db.collection("users").doc(userid).collection("chats").doc(chatId).delete();
    return docRef;
    
}