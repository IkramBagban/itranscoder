import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const CLOUDFRONT_BASEURL = import.meta.env.VITE_CLOUDFRONT_BASEURL;

const Progress: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string | null>(null);
  const [outputKeys, setOutputKeys] = useState<{ resolution: string; url: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!jobId) {
      setError("Invalid Job ID");
      setLoading(false);
      return;
    }

    const fetchProgress = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/poll/progress?jobId=${jobId}`);
        const { progress, status: jobStatus, transcodedVideos } = response.data.data || {};

        setProgress(progress || 0);
        setStatus(jobStatus);

        if (jobStatus === "TRANSCODED") {
          setOutputKeys(transcodedVideos || []);
          clearInterval(interval);
        } else if (jobStatus === "FAILED") {
          setError("Transcoding failed. Please try again later.");
          clearInterval(interval);
        }
      } catch (err: unknown) {
        console.error("Error fetching progress:", err);
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || "Failed to fetch progress.");
        }
        else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred.");
        }
        clearInterval(interval);
      } finally {
        setLoading(false);
      }
    };

    const interval = setInterval(fetchProgress, 2000);
    fetchProgress(); 

    return () => clearInterval(interval);
  }, [jobId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r  px-4">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center text-indigo-700">Video Transcoding</h1>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 font-semibold">{error}</div>
        ) : (
          <>
            {status && (
              <>
                <p className="text-center text-gray-600 text-sm">
                  {status === "TRANSCODING"
                    ? `Processing... ${progress.toFixed(2)}%`
                    : "✅ Transcoding Complete!"}
                </p>

                <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      status === "TRANSCODING" ? "bg-indigo-500" : "bg-green-500"
                    }`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </>
            )}

            {status === "TRANSCODED" && outputKeys.length > 0 && (
              <div className="pt-4 space-y-3">
                <h2 className="text-md font-medium text-center text-gray-700">
                  Download your videos
                </h2>
                {outputKeys.map((key) => (
                  <a
                    key={key.resolution}
                    href={CLOUDFRONT_BASEURL + key.url}
                    className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center py-2 rounded-lg transition"
                    download
                  >
                    {key.resolution.toUpperCase()} Video
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Progress;
