"use client"; // tells NextJS this component runs on the client side

import { useState, useRef, useEffect } from "react"; // import React hooks
import cvModule from "@techstark/opencv-js"; // import OpenCV JS module

export default function Home() {
  const [cv, setCv] = useState(null); // OpenCV instance holder
  const [ready, setReady] = useState(false); // indicates when OpenCV is ready

  const originalRef = useRef(null); // canvas that shows original image
  const grayRef = useRef(null); // canvas for grayscale processing result
  const cannyRef = useRef(null); // canvas for Canny edge result

  const haarFaceRef = useRef(null); // canvas for face detection result
  const haarEyeRef = useRef(null); // canvas for eye detection result
  const haarSmileRef = useRef(null); // canvas for smile detection result

  const haarFaceLoadedRef = useRef(false); // track if face cascade loaded
  const haarEyeLoadedRef = useRef(false); // track if eye cascade loaded
  const haarSmileLoadedRef = useRef(false); // track if smile cascade loaded

  useEffect(() => {
    cvModule.then(mod => { // wait until OpenCV JS loads fully
      setCv(mod); // store OpenCV module
      setReady(true); // mark OpenCV as ready
    });
  }, []); // run once on component mount

  const loadFaceCascade = async () => {
    if (!cv) return; // stop if OpenCV not ready
    if (haarFaceLoadedRef.current) return; // do not load twice

    try {
      const res = await fetch("/haar_face.xml"); // load face cascade XML from public
      const buffer = await res.arrayBuffer(); // convert response to array buffer
      const data = new Uint8Array(buffer); // convert to byte array
      cv.FS_createDataFile("/", "haar_face.xml", data, true, false); // load into OpenCV virtual FS
    } catch (e) {
      // ignore errors if file already exists
    }
    haarFaceLoadedRef.current = true; // mark flag
  };

  const loadEyeCascade = async () => {
    if (!cv) return; // stop if OpenCV not ready
    if (haarEyeLoadedRef.current) return; // stop if already loaded

    try {
      const res = await fetch("/haar_eye.xml"); // load eye cascade XML
      const buffer = await res.arrayBuffer(); // convert to buffer
      const data = new Uint8Array(buffer); // convert to bytes
      cv.FS_createDataFile("/", "haar_eye.xml", data, true, false); // mount inside OpenCV FS
    } catch (e) {
      // ignore
    }
    haarEyeLoadedRef.current = true; // mark flag
  };

  const loadSmileCascade = async () => {
    if (!cv) return; // stop if OpenCV not ready
    if (haarSmileLoadedRef.current) return; // skip if already loaded

    try {
      const res = await fetch("/haar_smile.xml"); // load smile cascade XML
      const buffer = await res.arrayBuffer(); // convert to buffer
      const data = new Uint8Array(buffer); // convert to bytes
      cv.FS_createDataFile("/", "haar_smile.xml", data, true, false); // mount file in FS
    } catch (e) {
      // ignore
    }
    haarSmileLoadedRef.current = true; // mark flag
  };

  const runCanny = () => {
    if (!cv) return; // stop if OpenCV not ready

    const src = cv.imread(grayRef.current); // read grayscale image matrix
    const edges = new cv.Mat(); // storage for Canny output

    cv.Canny(src, edges, 50, 150, 3, false); // perform Canny edge detection

    const c = cannyRef.current; // target canvas reference
    c.width = src.cols; // set canvas width to match image
    c.height = src.rows; // set canvas height to match image

    cv.imshow(c, edges); // display edges to canvas

    src.delete(); // free memory
    edges.delete(); // free memory
  };

  const runHaarFace = async () => {
    if (!cv) return; // ensure OpenCV available

    await loadFaceCascade(); // load cascade file once

    let classifier;
    try {
      classifier = new cv.CascadeClassifier(); // create new classifier instance
      const ok = classifier.load("haar_face.xml"); // load cascade from FS
      if (!ok) {
        classifier.delete(); // cleanup if failed
        return; // exit
      }
    } catch (e) {
      if (classifier) classifier.delete(); // cleanup
      return; // exit
    }

    const srcColor = cv.imread(originalRef.current); // read original color image
    const gray = new cv.Mat(); // grayscale holder
    cv.cvtColor(srcColor, gray, cv.COLOR_RGBA2GRAY); // convert to grayscale

    const faces = new cv.RectVector(); // container for detections

    try {
      classifier.detectMultiScale(gray, faces, 1.1, 3, 0); // detect faces
    } catch (e) {
      srcColor.delete(); gray.delete(); faces.delete(); classifier.delete();
      return; // exit if fail
    }

    for (let i = 0; i < faces.size(); i++) { // iterate all detected faces
      const r = faces.get(i); // read rectangle
      cv.rectangle( // draw blue rectangle
        srcColor,
        { x: r.x, y: r.y },
        { x: r.x + r.width, y: r.y + r.height },
        [255, 0, 0, 255],
        2
      );
    }

    const canvas = haarFaceRef.current; // get canvas
    canvas.width = srcColor.cols; // set width
    canvas.height = srcColor.rows; // set height
    cv.imshow(canvas, srcColor); // show annotated image

    srcColor.delete(); // cleanup
    gray.delete();
    faces.delete();
    classifier.delete();
  };

  const runHaarEyes = async () => {
    if (!cv) return; // ensure OpenCV is ready

    await loadEyeCascade(); // load cascade if needed

    let classifier;
    try {
      classifier = new cv.CascadeClassifier(); // create classifier
      const ok = classifier.load("haar_eye.xml"); // load FS file
      if (!ok) {
        classifier.delete();
        return;
      }
    } catch (e) {
      if (classifier) classifier.delete();
      return;
    }

    const srcColor = cv.imread(originalRef.current); // read original color image
    const gray = new cv.Mat(); // grayscale container
    cv.cvtColor(srcColor, gray, cv.COLOR_RGBA2GRAY); // convert

    const eyes = new cv.RectVector(); // detection container

    try {
      classifier.detectMultiScale(gray, eyes, 1.1, 3, 0); // detect eyes
    } catch (e) {
      srcColor.delete(); gray.delete(); eyes.delete(); classifier.delete();
      return;
    }

    for (let i = 0; i < eyes.size(); i++) { // draw each rectangle
      const r = eyes.get(i);
      cv.rectangle(
        srcColor,
        { x: r.x, y: r.y },
        { x: r.x + r.width, y: r.y + r.height },
        [0, 255, 0, 255], // green
        2
      );
    }

    const canvas = haarEyeRef.current; // get canvas
    canvas.width = srcColor.cols; // resize
    canvas.height = srcColor.rows; // resize
    cv.imshow(canvas, srcColor); // display

    srcColor.delete(); gray.delete(); eyes.delete(); classifier.delete(); // cleanup
  };

  const runHaarSmile = async () => {
    if (!cv) return; // ensure OpenCV ready

    await loadSmileCascade(); // load smile cascade

    let classifier;
    try {
      classifier = new cv.CascadeClassifier(); // create classifier
      const ok = classifier.load("haar_smile.xml"); // load cascade XML
      if (!ok) {
        classifier.delete();
        return;
      }
    } catch (e) {
      if (classifier) classifier.delete();
      return;
    }

    const srcColor = cv.imread(originalRef.current); // read image
    const gray = new cv.Mat(); // grayscale holder
    cv.cvtColor(srcColor, gray, cv.COLOR_RGBA2GRAY); // convert

    const smiles = new cv.RectVector(); // container for detection

    try {
      classifier.detectMultiScale(gray, smiles, 1.7, 22, 0); // stricter smile detection
    } catch (e) {
      srcColor.delete(); gray.delete(); smiles.delete(); classifier.delete();
      return;
    }

    for (let i = 0; i < smiles.size(); i++) { // draw detection boxes
      const r = smiles.get(i);
      cv.rectangle(
        srcColor,
        { x: r.x, y: r.y },
        { x: r.x + r.width, y: r.y + r.height },
        [0, 0, 255, 255], // red
        2
      );
    }

    const canvas = haarSmileRef.current; // get canvas
    canvas.width = srcColor.cols; // resize
    canvas.height = srcColor.rows; // resize
    cv.imshow(canvas, srcColor); // show result

    srcColor.delete(); gray.delete(); smiles.delete(); classifier.delete(); // cleanup
  };

  const onFileChange = (e) => {
    if (!ready || !cv) return; // ensure OpenCV loaded

    const file = e.target.files[0]; // take uploaded file
    if (!file) return; // exit if null

    const img = new Image(); // create image loader

    img.onload = async () => {
      const canvas = originalRef.current; // original canvas
      const ctx = canvas.getContext("2d"); // drawing context

      canvas.width = img.width; // set canvas size
      canvas.height = img.height; // match image size
      ctx.drawImage(img, 0, 0); // draw the image

      const src = cv.imread(canvas); // read into OpenCV matrix
      const gray = new cv.Mat(); // grayscale holder

      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY); // convert to grayscale

      const g = grayRef.current; // grayscale canvas ref
      g.width = img.width; // size match
      g.height = img.height;
      cv.imshow(g, gray); // show grayscale

      src.delete(); // cleanup

      runCanny(); // auto-run Canny
      await runHaarFace(); // detect faces
      await runHaarEyes(); // detect eyes
      await runHaarSmile(); // detect smiles

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

      <canvas ref={haarFaceRef} className="w-[200px]" />
      <canvas ref={haarEyeRef} className="w-[200px]" />
      <canvas ref={haarSmileRef} className="w-[200px]" />

    </div>
  );
}