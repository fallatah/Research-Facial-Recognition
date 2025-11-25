"use client";

import { useState, useRef, useEffect } from "react";
import cvModule from "@techstark/opencv-js";

export default function Home() {
  const [cv, setCv] = useState(null);
  const [ready, setReady] = useState(false);
  const canvasRef = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => {
    cvModule.then(mod => {
      setCv(mod);
      setReady(true);
    });
  }, []);

  const onFileChange = (e) => {
    if (!ready) return;
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const src = cv.imread(canvas);
      const dst = new cv.Mat();

      cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);

      const resultCanvas = resultRef.current;
      resultCanvas.width = img.width;
      resultCanvas.height = img.height;
      cv.imshow(resultCanvas, dst);

      src.delete();
      dst.delete();
    };

    img.src = URL.createObjectURL(file);
  };

  return (
    <div className="p-5 flex flex-col gap-4">
      <input
        type="file"
        className="bg-gray-100 rounded p-2 border cursor-pointer w-48"
        onChange={onFileChange}
      />

      <canvas ref={canvasRef} className="w-[200px]"/>
      <canvas ref={resultRef} className="w-[200px]"/>
    </div>
  );
}