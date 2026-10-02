import { getAdminDb } from "@/firebase/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userid } = await req.json();
    if (!userid) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(userid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      userDoc: userDoc.data(),
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 });
  }
}
