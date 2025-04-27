import React from "react";

interface Props {
  progress: number;
  status: string;
}
const TranscodeProgressBar: React.FC<Props> = ({ progress, status }) => {
  return (
    <div className="relative w-full h-4 bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full transition-all duration-500 ${
          status === "TRANSCODING"
            ? "bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-400"
            : "bg-green-500"
        }`}
        style={{ width: `${progress}%` }}
      />

      {status === "TRANSCODING" && (
        <div
          className="absolute top-0 left-0 bottom-0 w-4 bg-yellow-400 opacity-70 blur-sm"
          style={{ left: `calc(${progress}% - 2px)` }}
        />
      )}
    </div>
  );
};

export default TranscodeProgressBar;
