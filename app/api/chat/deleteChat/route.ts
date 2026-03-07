import { NextRequest, NextResponse } from "next/server";
import { deleteChat } from "./deleteChat";

export async function DELETE(req: NextRequest) {
  try {
    const { userid, chatId } = await req.json();
    const deletedChat = await deleteChat(userid, chatId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
