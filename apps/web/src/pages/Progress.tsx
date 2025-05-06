import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

import { DownloadIcon } from "../components/svgs/DownloadIcon";
import { LightningBolt } from "../components/svgs/LightningBolt";
import { getStatusDescription, JOB_STATUS } from "../lib/jobStatus";

import Error from "../components/Error";
import Footer from "../components/Footer";
import Heading from "../components/Heading";
import Spinner from "../components/Spinner";
import LightningEffect from "../components/LightningEffect";
import RenderStatusInfo from "../components/RenderStatusInfo";
import TranscodeProgressBar from "../components/Progress/TranscodeProgressBar";
import FailedResolutionsAlert from "../components/Progress/FailedResolutionsAlert";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const CLOUDFRONT_BASEURL = import.meta.env.VITE_CLOUDFRONT_BASEURL;

interface FailedResolution {
  resolution: string;
  error: string;
  stage: string;
}

const Progress: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string | null>(null);
  const [outputKeys, setOutputKeys] = useState<
    { resolution: string; url: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [failedResolutions, setFailedResolutions] = useState<
    FailedResolution[]
  >([]);
  const [partialFailure, setPartialFailure] = useState<boolean>(false);

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
          partial_failure,
          failed_resolutions,
        } = response.data.data || {};

        setProgress(Math.floor(progress) || 0);
        setStatus(jobStatus);

        if (jobStatus === JOB_STATUS.TRANSCODED) {
          setOutputKeys(transcodedVideos || []);
          setPartialFailure(partial_failure || false);
          setFailedResolutions(failed_resolutions || []);
          clearInterval(interval);
        } else if (jobStatus === JOB_STATUS.FAILED) {
          setError("Transcoding failed. Please try again later.");
          clearInterval(interval);
        }
      } catch (err: unknown) {
        console.error("Error fetching progress:", err);
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || "Failed to fetch progress.");
        } else if (err instanceof Error) {
          setError((err as Error)?.message);
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
                <div className="flex items-center justify-center">
                  <RenderStatusInfo status={status} />
                </div>

                <p className="text-center text-gray-300 text-sm">
                  {getStatusDescription(status)}
                </p>

                <p className="text-center text-gray-300 text-xl font-bold">
                  {progress}%
                </p>
                <TranscodeProgressBar progress={progress} status={status} />

                {(status === JOB_STATUS.UPLOADING ||
                  status === JOB_STATUS.PENDING ||
                  status === JOB_STATUS.TRANSCODING ||
                  status === JOB_STATUS.RETRYING) && (
                  <p className="text-center text-gray-400 text-sm italic">
                    {status === JOB_STATUS.UPLOADING
                      ? "Upload speed depends on your internet connection"
                      : status === JOB_STATUS.PENDING
                        ? "Your job will start soon"
                        : "Processing time depends on video length and complexity"}
                  </p>
                )}

                {partialFailure && failedResolutions.length > 0 && (
                  <FailedResolutionsAlert
                    failedResolutions={failedResolutions}
                  />
                )}
              </div>
            )}

            {status === JOB_STATUS.TRANSCODED && outputKeys.length > 0 && (
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
