🧠 AI Model Architecture

1️⃣ Gaze Monitoring:
MediaPipe FaceMesh via TensorFlow.js
Landmark-based gaze direction estimation
Head pose calculation
Frame throttling (process every 2nd frame)

2️⃣ Object Detection:
MobileNet SSD (TensorFlow.js optimized)

Filter classes:
cell phone
person
book (if detected via label)
Confidence threshold ≥ 0.65

3️⃣ Screen Monitoring:

Using:
document.visibilitychange
window.blur
window.focus

Track:
Tab switch count
Total focus lost duration