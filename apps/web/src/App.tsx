import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const CLOUDFRONT_BASEURL = import.meta.env.VITE_CLOUDFRONT_BASEURL;

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<
    | "idle"
    | "UPLOADING"
    // | "VIDEO_UPLOADED"
    | "TRANSCODING"
    | "TRANSCODED"
    | "failed"
  >("idle");
  const [outputKeys, setOutputKeys] = useState<
    { resolution: string; url: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setStatus("idle");
      setProgress(0);
      setOutputKeys([]);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a video file.");
      return;
    }

    setStatus("UPLOADING");
    console.log("file detail", {
      fileName: file.name,
      fileType: file.type,
    });
    try {
      //
      const uploadResponse = await axios.post(
        `${API_BASE_URL}/upload/get-presigned-url`,
        {
          fileName: file.name,
          contentType: file.type,
        }
      );
      console.log("uploadResponse", uploadResponse);

      const { presignedUrl, jobId, key } = uploadResponse.data.data || {};
      console.log({ presignedUrl, jobId, key });

      const res = await axios.put(presignedUrl, file, {
        headers: { "Content-Type": file.type },
      });
      console.log("put response", res);

      setJobId(jobId);
      // setStatus("TRANSCODING");
    } catch (err) {
      setError("Failed to upload video.");
      setStatus("idle");
      console.error(err);
    }
  };
  console.log("outkeys", outputKeys);

  console.log("Status", status);
  useEffect(() => {
    if (!jobId || status !== "TRANSCODED") console.log({ status, jobId });

    const interval = setInterval(async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/poll/progress?jobId=${jobId}`
        );
        const {
          progress,
          status: jobStatus,
          transcodedVideos,
        } = response.data.data || {};
        console.log("response", response.data?.data);

        if (progress) {
          setProgress(progress);
        }
        setStatus(jobStatus);

        if (jobStatus === "TRANSCODED") {
          console.log("status is not transcoded");
          setOutputKeys(transcodedVideos);
          // setOutputKeys(outputKeys);
          clearInterval(interval);
          console.log("video transcoded successfully.");
        } else if (jobStatus === "failed") {
          setError("TRANSCODING failed.");
          clearInterval(interval);
        }
      } catch (err) {
        console.log("errrrror", err);
        setError("Failed to fetch progress.");
        setStatus("idle");
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, status]);

  const handleDownload = async (key: string) => {
    try {
      const url = CLOUDFRONT_BASEURL + key
      window.open(url);
    } catch (err) {
      setError("Failed to get download URL.");
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
            Upload your video to start TRANSCODING
          </p>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            disabled={status === "UPLOADING" || status === "TRANSCODING"}
            className="w-full border border-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-indigo-50 file:text-indigo-600"
          />
          <button
            type="submit"
            disabled={
              !file || status === "UPLOADING" || status === "TRANSCODING"
            }
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {status === "UPLOADING" ? "UPLOADING..." : "Upload Video"}
          </button>
        </form>

        {error && <p className="text-center text-sm text-red-500">{error}</p>}

        {(status === "TRANSCODING" || status === "TRANSCODED") && (
          <div>
            <p className="text-sm text-center mb-2 text-gray-600">
              {status === "TRANSCODING"
                ? `TRANSCODING: ${progress}%`
                : "✅ TRANSCODING Complete"}
            </p>
            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {status === "TRANSCODED" && outputKeys.length > 0 && (
          <div className="pt-4 space-y-2">
            <h2 className="text-sm font-medium text-center text-gray-700">
              Download Videos
            </h2>
            {outputKeys.map((key) => (
              <button
                key={key.resolution}
                onClick={() => handleDownload(key.url)}
                className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition"
              >
                Download {key.url.split("-").pop()?.replace(".mp4", "")}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
