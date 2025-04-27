import React from "react";
import { ErrorIcon } from "../components/svgs/ErrorIcon";
import UploadBox from "../components/svgs/UploadBox";
import { useUpload } from "../hooks/useUpload";
import LightningEffect from "../components/LightningEffect";
import Footer from "../components/Footer";
import UploadButton from "../components/Home/UploadButton";
import UploadProgressBar from "../components/Home/UploadProgressBar";
import Heading from "../components/Heading";
import SelectedFile from "../components/Home/SelectedFile";

const Home: React.FC = () => {
  const {
    file,
    dragActive,
    uploading,
    uploadProgress,
    error,
    handleFileChange,
    handleDrag,
    handleDrop,
    handleUpload,
    setFile,
  } = useUpload();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <LightningEffect />

      <div className="w-full max-w-md bg-gray-800 shadow-2xl rounded-2xl p-8 space-y-6 border border-gray-700 relative z-10">
        <Heading title="Video Transcoder" />

        <p className="text-center text-gray-300 pb-2">
          Convert your videos with lightning speed
        </p>

        <UploadBox
          dragActive={dragActive}
          handleDrag={handleDrag}
          handleDrop={handleDrop}
          handleFileChange={handleFileChange}
        />

        {file && <SelectedFile file={file} setFile={setFile} />}

        {error && (
          <div className="text-center text-red-400 font-semibold p-4 bg-gray-700 rounded-lg border border-red-500">
            <ErrorIcon />
            {error}
          </div>
        )}

        {uploading && <UploadProgressBar uploadProgress={uploadProgress} />}

        <UploadButton
          handleUpload={handleUpload}
          file={file}
          uploading={uploading}
        />

        <Footer />
      </div>
    </div>
  );
};

export default Home;
