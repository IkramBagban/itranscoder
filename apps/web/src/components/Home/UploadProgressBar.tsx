import React from "react";

interface Props {
  uploadProgress: number;
}

const UploadProgressBar: React.FC<Props> = ({ uploadProgress }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-400">
        <span>Uploading...</span>
        <span>{uploadProgress}%</span>
      </div>
      <div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300 bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-400"
          style={{ width: `${uploadProgress}%` }}
        />
        <div
          className="absolute top-0 left-0 bottom-0 w-2 bg-yellow-400 opacity-70 blur-sm"
          style={{ left: `calc(${uploadProgress}% - 1px)` }}
        />
      </div>
    </div>
  );
};

export default UploadProgressBar;
