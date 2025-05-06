import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const useUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a video file first");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append("video", file);

    try {
      const uploadResponse = await axios.post(
        `${API_BASE_URL}/upload/get-presigned-url`,
        {
          fileName: file.name,
          contentType: file.type,
        }
      );

      // @ts-ignore
      const { presignedUrl, jobId, key } = uploadResponse.data.data || {};

      const response = await axios.put(presignedUrl, file, {
        headers: { "Content-Type": file.type },

        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        },
      });

      console.log("Upload response:", response);
      navigate(`/progress/${jobId}`);
    } catch (err: unknown) {
      console.error("Upload error:", err);
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message || "Upload failed. Please try again."
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred during upload.");
      }
      setUploading(false);
    }
  };

  return {
    file,
    setFile,
    dragActive,
    uploading,
    uploadProgress,
    error,
    handleFileChange,
    handleDrag,
    handleDrop,
    handleUpload,
  };
};
