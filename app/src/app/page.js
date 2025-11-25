"use client";

import { useState, useRef, useEffect } from "react";
import cvModule from "@techstark/opencv-js";

export default function Home() {
  const [cv, setCv] = useState(null);
  const [ready, setReady] = useState(false);

  const originalRef = useRef(null);
  const grayRef = useRef(null);
  const cannyRef = useRef(null);
  const haarRef = useRef(null);
  const haarLoadedRef = useRef(false);

  useEffect(() => {
    cvModule.then(mod => {
      setCv(mod);
      setReady(true);
    });
  }, []);

  const loadHaar = async () => {
    if (!cv || haarLoadedRef.current) return;

    const res = await fetch("/haar.xml");
    const buffer = await res.arrayBuffer();
    const data = new Uint8Array(buffer);

    cv.FS_createDataFile("/", "haar.xml", data, true, false);
    haarLoadedRef.current = true;
  };

  const runCanny = () => {
    if (!cv) return;

    const src = cv.imread(grayRef.current);
    const edges = new cv.Mat();

    cv.Canny(src, edges, 50, 150, 3, false);

    const c = cannyRef.current;
    c.width = src.cols;
    c.height = src.rows;
    cv.imshow(c, edges);

    src.delete();
    edges.delete();
  };

  const runHaar = async () => {
    if (!cv) return;

    await loadHaar();

    const classifier = new cv.CascadeClassifier();
    classifier.load("haar.xml");

    const src = cv.imread(grayRef.current);
    const faces = new cv.RectVector();

    classifier.detectMultiScale(src, faces, 1.1, 3, 0);

    for (let i = 0; i < faces.size(); i++) {
      const r = faces.get(i);
      cv.rectangle(
        src,
        { x: r.x, y: r.y },
        { x: r.x + r.width, y: r.y + r.height },
        [255, 0, 0, 255],
        2
      );
    }

    const h = haarRef.current;
    h.width = src.cols;
    h.height = src.rows;
    cv.imshow(h, src);

    src.delete();
    faces.delete();
    classifier.delete();
  };

  const onFileChange = (e) => {
    if (!ready || !cv) return;
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = async () => {
      const canvas = originalRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const src = cv.imread(canvas);
      const gray = new cv.Mat();

      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      const g = grayRef.current;
      g.width = img.width;
      g.height = img.height;
      cv.imshow(g, gray);

      src.delete();

      runCanny();
      await runHaar();

      gray.delete();
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

      <canvas ref={originalRef} className="w-[200px]" />
      <canvas ref={grayRef} className="w-[200px]" />
      <canvas ref={cannyRef} className="w-[200px]" />
      <canvas ref={haarRef} className="w-[200px]" />
    </div>
  );
}