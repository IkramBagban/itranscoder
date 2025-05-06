export const JOB_STATUS = {
  UPLOADING: "UPLOADING",
  PENDING: "PENDING",
  TRANSCODING: "TRANSCODING",
  TRANSCODED: "TRANSCODED",
  FAILED: "FAILED",
  RETRYING: "RETRYING",
};

export const getStatusDescription = (status: string) => {
  switch (status) {
    case JOB_STATUS.UPLOADING:
      return "Your video is being securely uploaded to our servers.";
    case JOB_STATUS.PENDING:
      return "Preparing to start the transcoding process.";
    case JOB_STATUS.TRANSCODING:
      return "We're transforming your video into multiple formats.";
    case JOB_STATUS.RETRYING:
      return "We encountered an issue but are automatically retrying the process.";
    case JOB_STATUS.TRANSCODED:
      return "Your video has been successfully processed into multiple formats.";
    default:
      return "";
  }
};
