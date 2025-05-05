import React from "react";
import { ExclamationTriangleIcon } from "../svgs/ExclamationTriangleIcon";

interface FailedResolution {
  resolution: string;
  error: string;
  stage: string;
}

interface Props {
  failedResolutions: FailedResolution[];
}

const FailedResolutionsAlert: React.FC<Props> = ({ failedResolutions }) => {
  if (!failedResolutions || failedResolutions.length === 0) return null;

  return (
    <div className="mt-4 bg-gray-700 border border-yellow-500 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-2">
        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
        <h3 className="text-yellow-400 font-medium">Partial Success</h3>
      </div>
      
      <p className="text-gray-300 mb-3 text-sm">
        Some resolutions failed to process. Other resolutions are available for download.
      </p>
      
      <div className="space-y-2">
        {failedResolutions.map((item, index) => (
          <div key={index} className="bg-gray-800 rounded p-3 border border-gray-600">
            <p className="text-gray-200 font-medium">
              {item.resolution.toUpperCase()} failed
            </p>
            <p className="text-gray-400 text-sm">
              Error during {item.stage}: {item.error}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FailedResolutionsAlert;