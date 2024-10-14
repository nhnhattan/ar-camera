let stream;
let mediaRecorder;
let chunks = [];
let recording = false;
let isHolding = false;
let timer;
let seconds = 0;
let facingMode = "user"; // Default to user (front) camera
let isCameraStopped = false; // Check camera state
let isCameraTurnedOff = false; // Check if the camera was turned off by the toggle button

// Function to start video stream
function startVideoStream() {
  navigator.mediaDevices
    .getUserMedia({
      video: { facingMode: facingMode },
    })
    .then(function (streamData) {
      stream = streamData;
      $("#videoElement")[0].srcObject = stream;
    })
    .catch(function (error) {
      console.log("Error accessing camera: ", error);
    });
}

// Start video stream on page load
startVideoStream();

// Start recording or capture photo
$("#cameraButton").on("mousedown touchstart", function () {
  isHolding = true;
  $("#timeCounter").text("0s");

  // Differentiate between click and hold
  timer = setTimeout(function () {
    if (isHolding) {
      startRecording();
    }
  }, 500); // Hold for 500ms to start recording
});

// Stop recording or take a photo on button release
$(document).on("mouseup touchend", function () {
  clearTimeout(timer);
  if (isHolding) {
    isHolding = false;
    if (recording) {
      stopRecording();
    } else {
      capturePhoto();
    }
  }
});

// Start recording
function startRecording() {
  recording = true;
  $("#cameraButton").addClass("recording");
  chunks = [];
  seconds = 0;

  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = function (e) {
    chunks.push(e.data);
  };
  mediaRecorder.start();

  timer = setInterval(function () {
    seconds++;
    $("#timeCounter").text(seconds + "s");
    if (seconds >= 20) {
      stopRecording(); // Stop after 20 seconds
    }
  }, 1000);
}

// Stop recording
function stopRecording() {
  recording = false;
  $("#cameraButton").removeClass("recording");
  clearInterval(timer);
  mediaRecorder.stop();
  mediaRecorder.onstop = function () {
    const videoBlob = new Blob(chunks, { type: "video/webm" });
    const videoURL = URL.createObjectURL(videoBlob);
    $("#displayArea").html('<video controls src="' + videoURL + '"></video>');

    // Hide camera and show display area
    $("#videoElement").hide();
    $("#displayArea").show();
    $("#toggleCameraButton").hide();
    $("#closeDisplayButton").show(); // Show the "Close" button
  };
}

// Capture photo
function capturePhoto() {
  const canvas = document.createElement("canvas");
  const videoElement = $("#videoElement")[0];
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const context = canvas.getContext("2d");
  context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  const imageURL = canvas.toDataURL("image/png");
  $("#displayArea").html('<img src="' + imageURL + '" alt="Captured Image">');

  // Hide camera and show display area
  $("#videoElement").hide();
  $("#displayArea").show();
  $("#closeDisplayButton").show(); // Show the "Close" button
  $("#toggleCameraButton").hide();
}

// Upload file from user's device
$("#uploadButton").on("click", function () {
  $("#fileInput").click(); // Trigger hidden file input
});

$("#fileInput").on("change", function () {
  const file = this.files[0];
  if (file) {
    const fileURL = URL.createObjectURL(file);
    if (file.type.startsWith("image/")) {
      $("#displayArea").html(
        '<img src="' + fileURL + '" alt="Uploaded Image">'
      );
    } else if (file.type.startsWith("video/")) {
      $("#displayArea").html('<video controls src="' + fileURL + '"></video>');
    }

    // Hide camera and show display area
    $("#videoElement").hide();
    $("#displayArea").show();
    $("#toggleCameraButton").hide();
    $("#closeDisplayButton").show(); // Show the "Close" button
  }
  $("#fileInput").val(""); // Reset file input
});

// Switch camera between front and rear
$("#switchCameraButton").on("click", function () {
  facingMode = facingMode === "user" ? "environment" : "user"; // Toggle camera
  startVideoStream(); // Restart video stream
});

// Toggle camera off and on
$("#toggleCameraButton").on("click", function () {
  if (isCameraTurnedOff) {
    startVideoStream(); // Start camera
    $(this).html('<i class="fas fa-video"></i>');
    isCameraTurnedOff = false;
  } else {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop()); // Stop camera
      $("#videoElement")[0].srcObject = null;
    }
    $(this).html('<i class="fas fa-video-slash"></i>');
    isCameraTurnedOff = true;
  }
});

// Close display button to hide display and show video again
$("#closeDisplayButton").on("click", function () {
  $(this).hide(); // Hide close button
  $("#toggleCameraButton").show();
  $("#displayArea").hide(); // Hide display area
  $("#videoElement").show(); // Show camera video again
});
