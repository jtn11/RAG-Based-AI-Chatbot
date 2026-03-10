import { FilePlus, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { uploadPdf } from "./upload-doc-function";
import { useChat } from "../context/chatContext";

interface UploadDocumentProps {
  setPdfUploaded: React.Dispatch<React.SetStateAction<boolean>>;
  pdfUploaded: boolean;
  userid: string | null;
}

export const UploadDocument = ({
  setPdfUploaded,
  pdfUploaded,
  userid,
}: UploadDocumentProps) => {
  const { currentChatId, setCurrentChatId, isRagActive, activeDocumentName } = useChat();
  const [pdfloading, setpdfloading] = useState(false);

  const handleUpload = async () => {
    try {
      if (!userid) return;
      const res = await uploadPdf(setpdfloading, userid, currentChatId); // async upload function
      setCurrentChatId(res.chatId);
      setPdfUploaded(true);
    } catch (err) {
      console.error(err);
    } finally {
      setpdfloading(false);
    }
  };

  const handleDelete = async () => {
    setPdfUploaded(false);

    await fetch("/api/remove-doc", {
      method: "POST",
      body: JSON.stringify({ userid, currentChatId }),
    });
  };

  return (
    <div className="p-4 border-b justify-center items-center border-gray-700 text-gray-300">
      {/* Upload / Replace */}
      <button
        onClick={handleUpload}
        className="w-full flex items-center justify-center space-x-2 
               bg-gray-800 hover:bg-gray-700 px-4 py-3 
               rounded-lg transition-colors"
      >
        <FilePlus className="h-4 w-4" />
        <span className="font-medium">Upload Pdf</span>
      </button>

      {/* Active Document */}
      {pdfloading ? (
        <LoaderCircle className="w-full h-6 mt-2 text-gray-600 animate-spin" />
      ) : (
        (pdfUploaded || isRagActive) && (
          <div className="mt-4 bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-sm truncate mr-2" title={activeDocumentName || "Document"}>{activeDocumentName || "Document"}</span>

              <button
                onClick={handleDelete}
                className="text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
};
