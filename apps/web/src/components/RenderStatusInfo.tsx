import React from "react";
import { JOB_STATUS } from "../lib/jobStatus";
import { CheckIcon } from "./svgs/CheckIcon";
import { LightningBolt } from "./svgs/LightningBolt";
import { useDotAnimation } from "../hooks/useDotAnimation";

const STATUS_INFO = {
  [JOB_STATUS.UPLOADING]: {
    message: "Uploading your video",
    icon: <LightningBolt />,
    animate: true,
  },
  [JOB_STATUS.PENDING]: {
    message: "Provisioning resources",
    icon: <LightningBolt />,
    animate: true,
  },
  [JOB_STATUS.TRANSCODING]: {
    message: "Transcoding in progress",
    icon: <LightningBolt />,
    animate: true,
  },
  [JOB_STATUS.RETRYING]: {
    message: "Retrying transcoding",
    icon: <LightningBolt />,
    animate: true,
  },
  [JOB_STATUS.TRANSCODED]: {
    message: "Transcoding Complete!",
    icon: <CheckIcon />,
    animate: false,
  },
  [JOB_STATUS.FAILED]: {
    message: "Transcoding failed",
    icon: <span className="text-red-400">❌</span>,
    animate: false,
  },
};

interface RenderStatusInfoProps {
  status: string | null;
}

const RenderStatusInfo: React.FC<RenderStatusInfoProps> = ({ status }) => {
  const { dots } = useDotAnimation();

  if (!status) return null;

  const statusData = STATUS_INFO[status] || {
    message: "Processing",
    icon: <LightningBolt />,
    animate: true,
  };

  const fullMessage = statusData.animate
    ? `${statusData.message}${dots}`
    : statusData.message;

  return (
    <div className="flex items-center space-x-2">
      {statusData.icon}
      <p
        className={`text-center font-medium ${
          status === JOB_STATUS.FAILED ? "text-red-400" : "text-yellow-300"
        }`}
      >
        {fullMessage}
      </p>
    </div>
  );
};

export default RenderStatusInfo;
