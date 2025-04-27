import React from "react";
import { LightningBolt } from "./svgs/LightningBolt";

interface Props {
  title: string;
}

const Heading: React.FC<Props> = ({ title }) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      <LightningBolt />
      <h1 className="text-3xl font-bold text-center text-yellow-400">
        {title}
      </h1>
      <LightningBolt />
    </div>
  );
};

export default Heading;
