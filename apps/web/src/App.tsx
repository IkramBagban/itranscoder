
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "processing" | "completed" | "failed"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setStatus("idle");
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a video file.");
      return;
    }

    setStatus("uploading",);
    console.log('file detail',{
      fileName: file.name,
      fileType: file.type,
    })
    try {
      //
      const uploadResponse = await axios.post(`${API_BASE_URL}/upload/get-presigned-url`, {
        fileName: file.name || 'testing-presigned-vidoe',
        fileType: file.type || 'video/mp4',
      });
      console.log('uploadResponse',uploadResponse)

      const { presignedUrl, jobId } = uploadResponse.data.data || {};
      console.log({presignedUrl, jobId })

      const res = await axios.put(presignedUrl, file, {
        headers: { "Content-Type": file.type },
      });
      console.log('put response', res)

      setJobId(jobId);
      setStatus("processing");
    } catch (err) {
      setError("Failed to upload video.");
      setStatus("idle");
      console.error(err);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-xl p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-800">
             Video Transcoder
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload your video to start transcoding
          </p>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            disabled={status === "uploading" || status === "processing"}
            className="w-full border border-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-indigo-50 file:text-indigo-600"
          />
          <button
            type="submit"
            disabled={
              !file || status === "uploading" || status === "processing"
            }
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {status === "uploading" ? "Uploading..." : "Upload Video"}
          </button>
        </form>

        {error && <p className="text-center text-sm text-red-500">{error}</p>}

       
      </div>
    </div>
  );
}

export default App;
