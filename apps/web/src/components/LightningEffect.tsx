import { LightningBolt } from "./svgs/LightningBolt";

const LightningEffect = () => {
  return (
    <div className="absolute inset-0 overflow-hidden z-0 opacity-10">
      <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
        <LightningBolt />
      </div>
      <div className="absolute top-3/4 right-1/4 transform -translate-x-1/2 -translate-y-1/2">
        <LightningBolt />
      </div>
      <div className="absolute bottom-1/4 left-3/4 transform -translate-x-1/2 -translate-y-1/2">
        <LightningBolt />
      </div>
    </div>
  );
};

export default LightningEffect;
