import React from "react";
import { Route, Routes } from "react-router-dom";
import Progress from "../pages/Progress";
import Home from "../pages/Home";

const RootRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/progress/:jobId" element={<Progress />} />
    </Routes>
  );
};

export default RootRouter;
