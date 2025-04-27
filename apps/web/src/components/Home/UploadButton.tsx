import React from "react";
import { LightningBolt } from "../svgs/LightningBolt";
interface Props {
  handleUpload: () => void;
  file: File | null;
  uploading: boolean;
}

const UploadButton: React.FC<Props> = ({ handleUpload, file, uploading }) => {
  return (
    <button
      onClick={handleUpload}
      disabled={!file || uploading}
      className={`w-full py-3 rounded-lg flex items-center justify-center space-x-2 font-medium transition-all duration-300 ${
        !file || uploading
          ? "bg-gray-700 text-gray-500 cursor-not-allowed"
          : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white"
      }`}
    >
      {!uploading && (
        <>
          <LightningBolt />
          <span>Start Transcoding</span>
        </>
      )}
      {uploading && (
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-yellow-400"></div>
      )}
    </button>
  );
};

export default UploadButton;
