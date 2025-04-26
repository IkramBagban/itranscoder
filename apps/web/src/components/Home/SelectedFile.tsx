import React from "react";
import { VideoIcon } from "../svgs/VideoIcon";
import { CloseIcon } from "../svgs/CloseIcon";

interface Props {
  file: File | null;
  setFile: (file: File | null) => void;
}

const SelectedFile: React.FC<Props> = ({ file, setFile }) => {
  return (
    <div className="bg-gray-700 p-4 rounded-lg flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <VideoIcon />

        <div className="text-left">
          <p className="text-gray-300 text-sm truncate max-w-xs">
            {file!.name}
          </p>
          <p className="text-gray-500 text-xs">
            {(file!.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
      </div>

      <button
        onClick={() => setFile(null)}
        className="text-gray-400 hover:text-red-400"
      >
        <CloseIcon />
      </button>
    </div>
  );
};

export default SelectedFile;
