"use client";

import { useState, useRef, useEffect } from "react";
import cvModule from "@techstark/opencv-js";

export default function Home()
{
  const [cv, setCv] = useState(null); // store OpenCV instance
  const [ready, setReady] = useState(false); // track when OpenCV is loaded

  const originalRef = useRef(null); // canvas for the original image
  const grayRef = useRef(null); // canvas for grayscale result
  const cannyRef = useRef(null); // canvas for canny edges
  const haarRef = useRef(null); // canvas for Haar face detection
  const haarLoadedRef = useRef(false); // ensure Haar XML is loaded only once

  useEffect(() => {
    cvModule.then(mod => { // wait for OpenCV to be ready
      setCv(mod); // store OpenCV instance
      setReady(true); // mark OpenCV loaded
    });
  }, []); // run once on mount

  const loadHaar = async () => {
    if (!cv) return; // stop if OpenCV is not ready
    if (haarLoadedRef.current) return; // stop if XML already loaded

    const res = await fetch("/haar.xml"); // fetch Haar XML from public folder
    const buffer = await res.arrayBuffer(); // convert to array buffer
    const data = new Uint8Array(buffer); // convert buffer to byte array

    cv.FS_createDataFile("/", "haar_face.xml", data, true, false); // mount XML inside OpenCV FS
    haarLoadedRef.current = true; // mark as loaded
  };

  const runCanny = () => {
    if (!cv) return; // stop if OpenCV unavailable

    const src = cv.imread(grayRef.current); // read grayscale image
    const edges = new cv.Mat(); // output matrix

    cv.Canny(src, edges, 50, 150, 3, false); // apply canny edge detection

    const c = cannyRef.current; // target canvas
    c.width = src.cols; // match width
    c.height = src.rows; // match height

    cv.imshow(c, edges); // draw result on canvas

    src.delete(); // cleanup
    edges.delete(); // cleanup
  };

  const runHaar = async () => {
    if (!cv) return; // stop if OpenCV not ready

    await loadHaar(); // ensure Haar XML is loaded

    const classifier = new cv.CascadeClassifier(); // create classifier
    classifier.load("haar.xml"); // load Haar XML from virtual FS

    const srcColor = cv.imread(originalRef.current); // read original color image

    const gray = new cv.Mat(); // matrix for grayscale conversion
    cv.cvtColor(srcColor, gray, cv.COLOR_RGBA2GRAY); // convert to grayscale internally

    const faces = new cv.RectVector(); // store detected faces

    classifier.detectMultiScale(gray, faces, 1.1, 3, 0); // detect faces

    for (let i = 0; i < faces.size(); i++) { // loop through detected faces
      const r = faces.get(i); // get face rectangle
      cv.rectangle( // draw rectangle on color image
        srcColor,
        { x: r.x, y: r.y },
        { x: r.x + r.width, y: r.y + r.height },
        [255, 0, 0, 255],
        2
      );
    }

    const h = haarRef.current; // output canvas
    h.width = srcColor.cols; // match width
    h.height = srcColor.rows; // match height

    cv.imshow(h, srcColor); // show color image with rectangles

    srcColor.delete(); // cleanup
    gray.delete(); // cleanup
    faces.delete(); // cleanup
    classifier.delete(); // cleanup
  };

  const onFileChange = (e) => {
    if (!ready || !cv) return; // stop if OpenCV not ready

    const file = e.target.files[0]; // get selected file
    if (!file) return; // stop if no file

    const img = new Image(); // create image object

    img.onload = async () => { // when image loads
      const canvas = originalRef.current; // original canvas reference
      const ctx = canvas.getContext("2d"); // canvas context

      canvas.width = img.width; // set canvas width
      canvas.height = img.height; // set canvas height
      ctx.drawImage(img, 0, 0); // draw uploaded image

      const src = cv.imread(canvas); // read original image
      const gray = new cv.Mat(); // matrix for grayscale output

      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY); // convert to grayscale

      const g = grayRef.current; // grayscale canvas
      g.width = img.width; // match width
      g.height = img.height; // match height
      cv.imshow(g, gray); // draw grayscale image

      src.delete(); // cleanup

      runCanny(); // auto run canny
      await runHaar(); // auto run Haar

      gray.delete(); // cleanup
    };

    img.src = URL.createObjectURL(file); // create local image URL
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