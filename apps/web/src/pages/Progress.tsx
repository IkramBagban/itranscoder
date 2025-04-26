import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { LightningBolt } from "../components/svgs/LightningBolt";
import { CheckIcon } from "../components/svgs/CheckIcon";
import { DownloadIcon } from "../components/svgs/DownloadIcon";
import { ErrorIcon } from "../components/svgs/ErrorIcon";
import LightningEffect from "../components/LightningEffect";
import Footer from "../components/Footer";
import Heading from "../components/Heading";
import Error from "../components/Error";
import Spinner from "../components/Spinner";
import TranscodeProgressBar from "../components/Progress/TranscodeProgressBar";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const CLOUDFRONT_BASEURL = import.meta.env.VITE_CLOUDFRONT_BASEURL;

const Progress: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string | null>(null);
  const [outputKeys, setOutputKeys] = useState<
    { resolution: string; url: string }[]
  >([]);
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
        const response = await axios.get(
          `${API_BASE_URL}/poll/progress?jobId=${jobId}`
        );
        const {
          progress,
          status: jobStatus,
          transcodedVideos,
        } = response.data.data || {};

        setProgress(Math.floor(progress) || 0);
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
        } else if (err instanceof Error) {
          // @ts-ignore
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
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <LightningEffect />

      <div className="w-full max-w-md bg-gray-800 shadow-2xl rounded-2xl p-8 space-y-6 border border-gray-700 relative z-10">
        <Heading title="Video Transcoder" />

        {loading ? (
          <Spinner />
        ) : error ? (
          <Error error={error} />
        ) : (
          <>
            {status && (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  {status === "TRANSCODED" ? (
                    <div className="flex items-center space-x-2">
                      <CheckIcon />
                      <p className="text-center text-green-400 font-medium">
                        Transcoding Complete!
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <LightningBolt />
                      <p className="text-center text-yellow-300 font-medium">
                        Processing...
                      </p>
                    </div>
                  )}
                </div>

                <p className="text-center text-gray-300 text-xl font-bold">
                  {progress}%
                </p>
                <TranscodeProgressBar progress={progress} status={status} />
              </div>
            )}

            {status === "TRANSCODED" && outputKeys.length > 0 && (
              <div className="pt-6 space-y-4">
                <h2 className="text-lg font-medium text-center text-yellow-300 flex items-center justify-center space-x-2">
                  <DownloadIcon className="w-5 h-5 text-yellow-300" />
                  <span>Download Your Videos</span>
                </h2>
                <div className="space-y-3">
                  {outputKeys.map((key) => (
                    <a
                      key={key.resolution}
                      href={CLOUDFRONT_BASEURL + key.url}
                      className="block w-full bg-gray-700 hover:bg-gray-600 text-yellow-300 text-center py-3 px-4 rounded-lg transition-all duration-300 border border-gray-600 hover:border-yellow-400 flex items-center justify-center space-x-2"
                      download
                    >
                      <LightningBolt />
                      <span>{key.resolution.toUpperCase()} Video</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <Footer />
      </div>
    </div>
  );
};

export default Progress;
