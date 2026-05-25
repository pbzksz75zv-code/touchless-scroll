let fistFrameCount = 0;
let lastGestureTime = 0;
let lastLikeTime = 0;

const REQUIRED_FRAMES = 3;

const statusText =
  document.getElementById("status");

const likeMessage =
  document.getElementById("likeMessage");


// Reel Videos
const videos = [
  "videos/video1.mov",
  "videos/video2.mov",
];

let currentVideo = 0;

const reel =
  document.getElementById("reel");


// Next Video Function
function nextVideo() {

  currentVideo++;

  if (currentVideo >= videos.length) {
    currentVideo = 0;
  }

  reel.src = videos[currentVideo];

  reel.load();

  reel.play();
}


// Keyboard Testing
document.addEventListener("keydown", function(event) {

  if (event.key === "ArrowUp") {
    nextVideo();
  }

});


// Webcam
const webcamElement =
  document.getElementById("webcam");

navigator.mediaDevices.getUserMedia({
  video: true
})
.then((stream) => {
  webcamElement.srcObject = stream;
});


// MediaPipe Hands
const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.9,
  minTrackingConfidence: 0.9
});


// =========================
// Gesture Detection Functions
// =========================

function isOpenPalm(landmarks) {

  return (
    landmarks[8].y < landmarks[6].y &&
    landmarks[12].y < landmarks[10].y &&
    landmarks[16].y < landmarks[14].y &&
    landmarks[20].y < landmarks[18].y
  );

}


function isFist(landmarks) {

  return (
    landmarks[8].y > landmarks[6].y &&
    landmarks[12].y > landmarks[10].y &&
    landmarks[16].y > landmarks[14].y &&
    landmarks[20].y > landmarks[18].y
  );

}


function isPeaceSign(landmarks) {

  const indexOpen =
    landmarks[8].y < landmarks[6].y;

  const middleOpen =
    landmarks[12].y < landmarks[10].y;

  const ringClosed =
    landmarks[16].y > landmarks[14].y;

  const pinkyClosed =
    landmarks[20].y > landmarks[18].y;

  return (
    indexOpen &&
    middleOpen &&
    ringClosed &&
    pinkyClosed
  );
}


// =========================
// Hand Detection Results
// =========================

hands.onResults(onResults);

function onResults(results) {

  if (
    results.multiHandLandmarks &&
    results.multiHandLandmarks.length > 0
  ) {

    const landmarks =
      results.multiHandLandmarks[0];

    // =====================
    // PEACE SIGN → LIKE
    // =====================

    if (isPeaceSign(landmarks)) {

      fistFrameCount = 0;

      const now = Date.now();

      if (now - lastLikeTime > 1500) {

        statusText.innerText =
          "Peace Sign Detected";

        likeMessage.innerText =
          "❤️ Video Liked";

        lastLikeTime = now;

        setTimeout(() => {
          likeMessage.innerText = "";
        }, 1500);
      }

    }

    // =====================
    // FIST → NEXT VIDEO
    // =====================

    else if (isFist(landmarks)) {

      fistFrameCount++;

      statusText.innerText =
        `Fist detected (${fistFrameCount})`;

      if (fistFrameCount >= REQUIRED_FRAMES) {

        const now = Date.now();

        if (now - lastGestureTime > 1000) {

          nextVideo();

          lastGestureTime = now;
        }

        fistFrameCount = 0;
      }

    }

    // =====================
    // OPEN PALM
    // =====================

    else if (isOpenPalm(landmarks)) {

      fistFrameCount = 0;

      statusText.innerText =
        "Open Palm Detected";
    }

    // =====================
    // OTHER HAND
    // =====================

    else {

      fistFrameCount = 0;

      statusText.innerText =
        "Hand Detected";
    }

  }

  // =====================
  // NO HAND
  // =====================

  else {

    fistFrameCount = 0;

    statusText.innerText =
      "Waiting for hand...";
  }
}


// =========================
// Camera Connection
// =========================

const camera = new Camera(webcamElement, {
  onFrame: async () => {
    await hands.send({ image: webcamElement });
  },
  width: 640,
  height: 480
});

camera.start();