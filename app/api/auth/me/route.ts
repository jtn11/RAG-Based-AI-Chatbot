import { getFirestore } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const db = getFirestore();
  try {
    const { userid } = await req.json();
    const userDoc = await db.collection("users").doc(userid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      userDoc: userDoc.data(),
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Not found" }, { status: 401 });
  }
}
