"use client";

import { useEffect, useRef } from "react";
import { useProctor } from "../../context/ProctorContext";
import * as tf from "@tensorflow/tfjs";
import * as blazeface from "@tensorflow-models/blazeface";



export default function IntervieweePage() {
  const { activities, addActivity } = useProctor();
  const videoRef = useRef(null);

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
useEffect(() => {
  let model;
  let interval;

  let baselineCenterX = null;
  let baselineCenterY = null;

  let currentViolation = null;
  let violationStartTime = null;

  const VIOLATION_TIME_THRESHOLD = 4; // seconds

  const loadModel = async () => {
    await tf.setBackend("webgl");
    await tf.ready();

    model = await blazeface.load();

    const video = videoRef.current;

    const waitForVideo = () =>
      new Promise((resolve) => {
        if (video.readyState === 4) resolve();
        else video.onloadeddata = () => resolve();
      });

    await waitForVideo();

    interval = setInterval(async () => {
      if (!video || !model) return;

      const predictions = await model.estimateFaces(video, false);

      let detectedViolation = null;

      // -------- NO FACE --------
      if (predictions.length === 0) {
        detectedViolation = "No face detected";
      }

      // -------- MULTIPLE FACES --------
      else if (predictions.length > 1) {
        detectedViolation = "Multiple faces detected";
      }

      // -------- HEAD POSITION --------
      else {
        const face = predictions[0];
        const topLeft = face.topLeft;
        const bottomRight = face.bottomRight;

        const faceCenterX =
          (topLeft[0] + bottomRight[0]) / 2;

        const faceCenterY =
          (topLeft[1] + bottomRight[1]) / 2;

        // 🔥 BASELINE CALIBRATION (only once)
        if (baselineCenterX === null) {
          baselineCenterX = faceCenterX;
          baselineCenterY = faceCenterY;
          console.log("Baseline calibrated");
          return; // wait next cycle
        }

        const horizontalDeviation =
          faceCenterX - baselineCenterX;

        const verticalDeviation =
          faceCenterY - baselineCenterY;

        console.log("Horizontal:", horizontalDeviation);

        // 🔥 Better thresholds (adjusted to your logs)
        const horizontalThreshold = 35;
        const verticalThreshold = 30;

        if (horizontalDeviation > horizontalThreshold) {
          detectedViolation = "Looking Right";
        } else if (horizontalDeviation < -horizontalThreshold) {
          detectedViolation = "Looking Left";
        } else if (verticalDeviation > verticalThreshold) {
          detectedViolation = "Looking Down";
        }
      }

      const now = Date.now();

      // 🔥 CASE 1: Violation STARTS
      if (detectedViolation && !currentViolation) {
        currentViolation = detectedViolation;
        violationStartTime = now;
      }

      // 🔥 CASE 2: Violation CONTINUES
      else if (
        detectedViolation &&
        currentViolation === detectedViolation
      ) {
        // Still same violation → do nothing
      }

      // 🔥 CASE 3: Violation CHANGES
      else if (
        detectedViolation &&
        currentViolation !== detectedViolation
      ) {
        const duration = Math.floor(
          (now - violationStartTime) / 1000
        );

        if (duration >= VIOLATION_TIME_THRESHOLD) {
          addActivity(
            `${currentViolation} for ${duration} seconds`
          );
        }

        currentViolation = detectedViolation;
        violationStartTime = now;
      }

      // 🔥 CASE 4: Violation ENDS (Back to Normal)
      else if (!detectedViolation && currentViolation) {
        const duration = Math.floor(
          (now - violationStartTime) / 1000
        );

        if (duration >= VIOLATION_TIME_THRESHOLD) {
          addActivity(
            `${currentViolation} for ${duration} seconds`
          );
        }

        currentViolation = null;
        violationStartTime = null;
      }

    }, 2000);
  };

  loadModel();

  return () => clearInterval(interval);
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

          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-367 h-180 bg-black rounded object-cover"
          />

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
