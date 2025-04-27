import React from "react";
import { ErrorIcon } from "./svgs/ErrorIcon";

interface Props {
  error: string;
}
const Error: React.FC<Props> = ({ error }) => {
  return (
    <div className="text-center text-red-400 font-semibold p-4 bg-gray-700 rounded-lg border border-red-500">
      <ErrorIcon />
      {error}
    </div>
  );
};

export default Error;
