"use client";

import { useState, useRef, useEffect } from "react";
import cvModule from "@techstark/opencv-js";

export default function Home()
{
  const [cv, setCv] = useState(null);          // store OpenCV instance
  const [ready, setReady] = useState(false);   // track when OpenCV is loaded

  const originalRef = useRef(null);            // canvas for the original image
  const grayRef = useRef(null);                // canvas for grayscale result
  const cannyRef = useRef(null);               // canvas for canny edges
  const haarRef = useRef(null);                // canvas for Haar eye detection
  const haarLoadedRef = useRef(false);         // ensure Haar XML is loaded only once

  useEffect(() => {
    cvModule.then(mod => {
      setCv(mod);
      setReady(true);
    });
  }, []);

  const loadHaar = async () => {
    if (!cv) return;
    if (haarLoadedRef.current) return;

    // haar_face.xml in public folder should be an eye Haar cascade,
    // for example haarcascade_eye.xml renamed to haar_face.xml
    const res = await fetch("/haar_face.xml");
    const buffer = await res.arrayBuffer();
    const data = new Uint8Array(buffer);

    // mount XML inside OpenCV FS with the same name used in classifier.load
    cv.FS_createDataFile("/", "haar_face.xml", data, true, false);
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

  const runHaarEyes = async () => {
    if (!cv) return;

    await loadHaar();

    const classifier = new cv.CascadeClassifier();
    classifier.load("haar_face.xml"); // this should now be an eye cascade

    // read original color image
    const srcColor = cv.imread(originalRef.current);

    // grayscale only for detection
    const gray = new cv.Mat();
    cv.cvtColor(srcColor, gray, cv.COLOR_RGBA2GRAY);

    const eyes = new cv.RectVector();

    // detect eyes
    classifier.detectMultiScale(gray, eyes, 1.1, 3, 0);

    // draw rectangles on the color image for each detected eye
    for (let i = 0; i < eyes.size(); i++) {
      const r = eyes.get(i);
      cv.rectangle(
        srcColor,
        { x: r.x, y: r.y },
        { x: r.x + r.width, y: r.y + r.height },
        [255, 0, 0, 255],
        2
      );
    }

    // show result in the separate Haar canvas
    const h = haarRef.current;
    h.width = srcColor.cols;
    h.height = srcColor.rows;
    cv.imshow(h, srcColor);

    srcColor.delete();
    gray.delete();
    eyes.delete();
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

      // auto run canny and eye detection
      runCanny();
      await runHaarEyes();

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