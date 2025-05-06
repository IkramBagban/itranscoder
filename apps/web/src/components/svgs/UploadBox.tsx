import React from "react";
import { CloudUploadIcon } from "./CloudUploadIcon";

type Props = {
  dragActive: boolean;
  handleDrag: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const MAX_SIZE_BYTES = 1 * 1024 * 1024 * 1024; 
const UploadBox: React.FC<Props> = ({
  dragActive,
  handleDrag,
  handleDrop,
  handleFileChange,
}) => {
  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center ${
        dragActive
          ? "border-yellow-400 bg-gray-700"
          : "border-gray-600 hover:border-gray-500"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        onChange={(event) => {
          const file = event.target.files?.[0];
          console.log('file', {file, fileSize: file?.size, MAX_SIZE_BYTES});
          if (file && file.size > MAX_SIZE_BYTES) {
            alert("File size exceeds 1GB limit.");
            return;
          }

          handleFileChange(event);
        }}
        accept="video/*"
        className="hidden"
      />

      <label
        htmlFor="file-upload"
        className="flex flex-col items-center justify-center cursor-pointer"
      >
        <CloudUploadIcon />

        <p className="text-gray-300 mb-2">
          <span className="font-semibold text-yellow-400">Click to upload</span>{" "}
          or drag and drop
        </p>
        <p className="text-gray-500 text-sm">
          MP4, MOV, AVI, WMV, FLV (max 2GB)
        </p>
      </label>
    </div>
  );
};

export default UploadBox;
