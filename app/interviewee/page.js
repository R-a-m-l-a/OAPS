"use client";

import { useEffect, useRef } from "react";
import { useProctor } from "../../context/ProctorContext";
import * as tf from "@tensorflow/tfjs";
import * as blazeface from "@tensorflow-models/blazeface"; 
import * as cocoSsd from "@tensorflow-models/coco-ssd"; //object detection




export default function IntervieweePage() {
  const { activities, addActivity } = useProctor();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);


  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Camera access denied:", error);
        addActivity("Camera access denied");
      }
    };

    startCamera();



    

    // Cleanup function to stop camera when leaving page
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);


  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        addActivity("User switched tab or minimized window");
      }
    };
  
    document.addEventListener("visibilitychange", handleVisibilityChange);
  
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);


//screencapture


// const captureScreenshot = () => {
//   if (!videoRef.current) return;

//   const canvas = document.createElement("canvas");
//   canvas.width = videoRef.current.videoWidth;
//   canvas.height = videoRef.current.videoHeight;

//   const ctx = canvas.getContext("2d");
//   ctx.drawImage(videoRef.current, 0, 0);

//   const imageData = canvas.toDataURL("image/png");

//   // For now we just log it
//   console.log("Screenshot captured");

//   addActivity("Screenshot captured due to violation");

//   // OPTIONAL: you can later send this imageData to backend
// };

  
// model
const modelInitializedRef = useRef(false);

useEffect(() => {
  if (modelInitializedRef.current) return;
  modelInitializedRef.current = true;

  let model = null;
  let interval = null;

  let baselineX = null;
  let baselineY = null;

  let calibrationCount = 0;
  const REQUIRED_CALIBRATION_FRAMES = 15;

  let smoothedX = null;
  let smoothedY = null;
  const SMOOTHING = 0.35;

  let currentViolation = null;
  let violationStart = null;

  const VIOLATION_THRESHOLD = 2000; // 2 seconds
  const H_THRESHOLD = 28;
  const V_THRESHOLD = 25;
  const MAX_DEVIATION = 120;

  const loadModel = async () => {
    await tf.setBackend("webgl");
    await tf.ready();

    model = await blazeface.load();

    // ---------- SAFE VIDEO WAIT ----------
    const waitForVideo = () =>
      new Promise((resolve) => {
        const check = () => {
          const video = videoRef.current;
          if (!video) {
            requestAnimationFrame(check);
            return;
          }
          if (video.readyState === 4) resolve();
          else video.onloadeddata = () => resolve();
        };
        check();
      });

    await waitForVideo();

    interval = setInterval(async () => {
      const video = videoRef.current;
      if (!video || !model) return;

      const predictions = await model.estimateFaces(video, false);

      let detected = null;

      // ---------------- NO FACE ----------------
      if (predictions.length === 0) {
        detected = "No face detected";
      }

      // ---------------- MULTIPLE FACES ----------------
      else if (predictions.length > 1) {
        detected = "Multiple faces detected";
      }

      // ---------------- SINGLE FACE ----------------
      else {
        const face = predictions[0];
        const [x1, y1] = face.topLeft;
        const [x2, y2] = face.bottomRight;

        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;

        // -------- CALIBRATION --------
        if (calibrationCount < REQUIRED_CALIBRATION_FRAMES) {
          if (baselineX === null) {
            baselineX = centerX;
            baselineY = centerY;
          } else {
            baselineX =
              (baselineX * calibrationCount + centerX) /
              (calibrationCount + 1);

            baselineY =
              (baselineY * calibrationCount + centerY) /
              (calibrationCount + 1);
          }

          calibrationCount++;
          return;
        }

        // -------- SMOOTHING --------
        if (smoothedX === null) {
          smoothedX = centerX;
          smoothedY = centerY;
        } else {
          smoothedX =
            smoothedX * (1 - SMOOTHING) +
            centerX * SMOOTHING;

          smoothedY =
            smoothedY * (1 - SMOOTHING) +
            centerY * SMOOTHING;
        }

        // Mirror compensation (if video is mirrored)
        const horizontalDeviation = baselineX - smoothedX;
        const verticalDeviation = smoothedY - baselineY;

        if (
          Math.abs(horizontalDeviation) > MAX_DEVIATION ||
          Math.abs(verticalDeviation) > MAX_DEVIATION
        ) {
          return;
        }

        // -------- DIRECTION DETECTION --------
        if (horizontalDeviation > H_THRESHOLD) {
          detected = "Looking Right";
        } else if (horizontalDeviation < -H_THRESHOLD) {
          detected = "Looking Left";
        } else if (verticalDeviation > V_THRESHOLD) {
          detected = "Looking Down";
        }
      }

      const now = Date.now();

      // -------- STATE MACHINE --------
      if (detected && !currentViolation) {
        currentViolation = detected;
        violationStart = now;
      }

      else if (detected && currentViolation === detected) {
        // still same violation
      }

      else if (detected && currentViolation !== detected) {
        const duration = now - violationStart;

        if (duration >= VIOLATION_THRESHOLD) {
          addActivity(
            `${currentViolation} for ${Math.floor(duration / 1000)} seconds`
          );
        }

        currentViolation = detected;
        violationStart = now;
      }

      else if (!detected && currentViolation) {
        const duration = now - violationStart;

        if (duration >= VIOLATION_THRESHOLD) {
          addActivity(
            `${currentViolation} for ${Math.floor(duration / 1000)} seconds`
          );
        }

        currentViolation = null;
        violationStart = null;
      }

    }, 400); // faster detection (more real-time)
  };

  loadModel();

  return () => {
    if (interval) clearInterval(interval);
  };
}, []);

//cocossd model for object detection

useEffect(() => {
  let model = null;
  let interval = null;

  let currentViolation = null;
  let violationStart = null;

  const CONFIDENCE_THRESHOLD = 0.65;
  const VIOLATION_THRESHOLD = 2000;

  const UNAUTHORIZED_OBJECTS = [
    "cell phone",
    "laptop",
    "book",
    "remote",
    "keyboard"
  ];

  const loadModel = async () => {
    await tf.setBackend("webgl");
    await tf.ready();

    model = await cocoSsd.load();

    interval = setInterval(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || !model) return;

      const ctx = canvas.getContext("2d");
      const predictions = await model.detect(video);

      // Clear previous drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let detectedObject = null;

      predictions.forEach((prediction) => {
        const [x, y, width, height] = prediction.bbox;
        const text = `${prediction.class} (${Math.round(
          prediction.score * 100
        )}%)`;

        // Draw ALL boxes
        // ctx.strokeStyle = "lime";
        // ctx.lineWidth = 2;
        // ctx.strokeRect(x, y, width, height);

        // ctx.fillStyle = "lime";
        // ctx.font = "16px Arial";
        // ctx.fillText(text, x, y > 10 ? y - 5 : 10);

        // Check unauthorized objects
        if (
          UNAUTHORIZED_OBJECTS.includes(prediction.class) &&
          prediction.score > CONFIDENCE_THRESHOLD
        ) {
          detectedObject = prediction.class;
        }
      });

      const now = Date.now();

      // ---------- VIOLATION STATE MACHINE ----------

      if (detectedObject && !currentViolation) {
        currentViolation = detectedObject;
        violationStart = now;
      }

      else if (
        detectedObject &&
        currentViolation === detectedObject
      ) {
        // still same object
      }

      else if (
        detectedObject &&
        currentViolation !== detectedObject
      ) {
        const duration = now - violationStart;

        if (duration >= VIOLATION_THRESHOLD) {
          addActivity(
            `${currentViolation} detected for ${Math.floor(
              duration / 1000
            )} seconds`
          );
        }

        currentViolation = detectedObject;
        violationStart = now;
      }

      else if (!detectedObject && currentViolation) {
        const duration = now - violationStart;

        if (duration >= VIOLATION_THRESHOLD) {
          addActivity(
            `${currentViolation} detected for ${Math.floor(
              duration / 1000
            )} seconds`
          );
        }

        currentViolation = null;
        violationStart = null;
      }

    }, 800); // detection speed
  };

  loadModel();

  return () => {
    if (interval) clearInterval(interval);
  };
}, []);


  

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      
      <h1 className="text-3xl text-black font-bold text-center mb-8">
        Interviewee Panel
      </h1>

      {/* <div className="grid grid-cols-3 gap-6"> */}

        {/* Camera Section */}
        <div className="col-span-2 bg-white border rounded-lg p-8">
          <h2 className="text-xl font-semibold mb-4 text-black">
            Live Camera Feed
          </h2>


  {/* NEW WRAPPER */}
  <div className="relative w-full aspect-video">
  
  <video
    ref={videoRef}
    autoPlay
    playsInline
    className="absolute top-0 left-0 w-340 h-150 bg-black rounded object-cover"
  />

  <canvas
    ref={canvasRef}
    className="absolute top-0 left-0 w-full h-full"
  />

</div>
          <button
            onClick={() => addActivity("Suspicious activity detected")}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
          >
            Simulate Suspicious Activity
          </button>
        </div>

        {/* Activity Log i commented out* / }
        {/* <div className="bg-white border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">
            Activity Log
          </h2>

          <ul className="space-y-2 text-sm">
            {activities.length === 0 && (
              <li className="text-gray-500">
                No suspicious activity detected
              </li>
            )}

            {activities.map((activity) => (
              <li key={activity.id} className="text-red-600">
                {activity.time} - {activity.message}
              </li>
            ))}
          </ul>
        </div> */}

      {/* </div> */}
    </div>
  );
}
