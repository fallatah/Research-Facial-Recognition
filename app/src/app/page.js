"use client";

import { useState, useRef, useEffect } from "react";
import cvModule from "@techstark/opencv-js";

export default function Home() {
  const [cv, setCv] = useState(null);
  const [ready, setReady] = useState(false);

  const originalRef = useRef(null);
  const grayRef = useRef(null);
  const cannyRef = useRef(null);

  const haarFaceRef = useRef(null);
  const haarEyeRef = useRef(null);
  const haarSmileRef = useRef(null);

  const haarFaceLoadedRef = useRef(false);
  const haarEyeLoadedRef = useRef(false);
  const haarSmileLoadedRef = useRef(false);

  useEffect(() => {
    cvModule.then(mod => {
      setCv(mod);
      setReady(true);
    });
  }, []);

  const loadFaceCascade = async () => {
    if (!cv) return;
    if (haarFaceLoadedRef.current) return;

    try {
      const res = await fetch("/haar_face.xml");
      const buffer = await res.arrayBuffer();
      const data = new Uint8Array(buffer);
      cv.FS_createDataFile("/", "haar_face.xml", data, true, false);
    } catch (e) {
      // ignore "file exists" or FS errors
    }
    haarFaceLoadedRef.current = true;
  };

  const loadEyeCascade = async () => {
    if (!cv) return;
    if (haarEyeLoadedRef.current) return;

    try {
      const res = await fetch("/haar_eye.xml");
      const buffer = await res.arrayBuffer();
      const data = new Uint8Array(buffer);
      cv.FS_createDataFile("/", "haar_eye.xml", data, true, false);
    } catch (e) {
      // ignore
    }
    haarEyeLoadedRef.current = true;
  };

  const loadSmileCascade = async () => {
    if (!cv) return;
    if (haarSmileLoadedRef.current) return;

    try {
      const res = await fetch("/haar_smile.xml");
      const buffer = await res.arrayBuffer();
      const data = new Uint8Array(buffer);
      cv.FS_createDataFile("/", "haar_smile.xml", data, true, false);
    } catch (e) {
      // ignore
    }
    haarSmileLoadedRef.current = true;
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

  const runHaarFace = async () => {
    if (!cv) return;

    await loadFaceCascade();

    let classifier;
    try {
      classifier = new cv.CascadeClassifier();
      const ok = classifier.load("haar_face.xml");
      if (!ok) {
        classifier.delete();
        return;
      }
    } catch (e) {
      if (classifier) classifier.delete();
      return;
    }

    const srcColor = cv.imread(originalRef.current);
    const gray = new cv.Mat();
    cv.cvtColor(srcColor, gray, cv.COLOR_RGBA2GRAY);

    const faces = new cv.RectVector();

    try {
      classifier.detectMultiScale(gray, faces, 1.1, 3, 0);
    } catch (e) {
      srcColor.delete();
      gray.delete();
      faces.delete();
      classifier.delete();
      return;
    }

    for (let i = 0; i < faces.size(); i++) {
      const r = faces.get(i);
      cv.rectangle(
        srcColor,
        { x: r.x, y: r.y },
        { x: r.x + r.width, y: r.y + r.height },
        [255, 0, 0, 255],
        2
      );
    }

    const canvas = haarFaceRef.current;
    canvas.width = srcColor.cols;
    canvas.height = srcColor.rows;
    cv.imshow(canvas, srcColor);

    srcColor.delete();
    gray.delete();
    faces.delete();
    classifier.delete();
  };

  const runHaarEyes = async () => {
    if (!cv) return;

    await loadEyeCascade();

    let classifier;
    try {
      classifier = new cv.CascadeClassifier();
      const ok = classifier.load("haar_eye.xml");
      if (!ok) {
        classifier.delete();
        return;
      }
    } catch (e) {
      if (classifier) classifier.delete();
      return;
    }

    const srcColor = cv.imread(originalRef.current);
    const gray = new cv.Mat();
    cv.cvtColor(srcColor, gray, cv.COLOR_RGBA2GRAY);

    const eyes = new cv.RectVector();

    try {
      classifier.detectMultiScale(gray, eyes, 1.1, 3, 0);
    } catch (e) {
      srcColor.delete();
      gray.delete();
      eyes.delete();
      classifier.delete();
      return;
    }

    for (let i = 0; i < eyes.size(); i++) {
      const r = eyes.get(i);
      cv.rectangle(
        srcColor,
        { x: r.x, y: r.y },
        { x: r.x + r.width, y: r.y + r.height },
        [0, 255, 0, 255],
        2
      );
    }

    const canvas = haarEyeRef.current;
    canvas.width = srcColor.cols;
    canvas.height = srcColor.rows;
    cv.imshow(canvas, srcColor);

    srcColor.delete();
    gray.delete();
    eyes.delete();
    classifier.delete();
  };

  const runHaarSmile = async () => {
    if (!cv) return;

    await loadSmileCascade();

    let classifier;
    try {
      classifier = new cv.CascadeClassifier();
      const ok = classifier.load("haar_smile.xml");
      if (!ok) {
        classifier.delete();
        return;
      }
    } catch (e) {
      if (classifier) classifier.delete();
      return;
    }

    const srcColor = cv.imread(originalRef.current);
    const gray = new cv.Mat();
    cv.cvtColor(srcColor, gray, cv.COLOR_RGBA2GRAY);

    const smiles = new cv.RectVector();

    try {
      classifier.detectMultiScale(gray, smiles, 1.1, 3, 0);
    } catch (e) {
      srcColor.delete();
      gray.delete();
      smiles.delete();
      classifier.delete();
      return;
    }

    for (let i = 0; i < smiles.size(); i++) {
      const r = smiles.get(i);
      cv.rectangle(
        srcColor,
        { x: r.x, y: r.y },
        { x: r.x + r.width, y: r.y + r.height },
        [0, 0, 255, 255],
        2
      );
    }

    const canvas = haarSmileRef.current;
    canvas.width = srcColor.cols;
    canvas.height = srcColor.rows;
    cv.imshow(canvas, srcColor);

    srcColor.delete();
    gray.delete();
    smiles.delete();
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
      await runHaarFace();
      await runHaarEyes();
      await runHaarSmile();

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

      <canvas ref={haarFaceRef} className="w-[200px]" />
      <canvas ref={haarEyeRef} className="w-[200px]" />
      <canvas ref={haarSmileRef} className="w-[200px]" />
    </div>
  );
}