let stream;
let mediaRecorder;
let chunks = [];
let recording = false;
let isHolding = false;
let timer;
let seconds = 0;
let facingMode = "user"; // Default to user (front) camera
let isCameraStopped = false;
let isCameraTurnedOff = false;
const maxRecordingTime = 20;

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
  $("#timeCounter").text("0" + "/" + maxRecordingTime);
  $(".progress circle").css("stroke-dashoffset", 314);
  timer = setTimeout(function () {
    if (isHolding) {
      startRecording();
    }
  }, 300);
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
    $("#timeCounter").text(seconds + "/" + maxRecordingTime);
    const offset = 314 - (seconds / maxRecordingTime) * 314;
    $(".progress circle").css({
      "stroke-dashoffset": 0,
      transition: "stroke-dashoffset 20s linear",
    });

    if (seconds >= maxRecordingTime + 1) {
      stopRecording();
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
    $("#videoElement").hide();
    $("#displayArea").show();
    $("#toggleCameraButton").hide();
    $("#closeDisplayButton").show();
    $(".progress circle").css("stroke-dashoffset", 314); // Reset progress
    $(".button-wrapper").hide();
    $("#timeCounter").text("");
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
  $("#videoElement").hide();
  $("#displayArea").show();
  $(".button-wrapper").hide();
  $("#closeDisplayButton").show();
  $("#toggleCameraButton").hide();
}

$("#uploadButton").on("click", function () {
  $("#fileInput").click();
});

$("#fileInput").on("change", function () {
  const file = this.files[0];
  if (file) {
    const fileURL = URL.createObjectURL(file);
    if (file.type.startsWith("image/")) {
      $("#displayArea").empty();
      $("#displayArea").html(
        '<img src="' + fileURL + '" alt="Uploaded Image">'
      );
    } else if (file.type.startsWith("video/")) {
      $("#displayArea").empty();
      $("#recorded").attr("src", fileURL);
    }
    $("#videoElement").hide();
    $("#displayArea").show();
    $("#toggleCameraButton").hide();
    $("#closeDisplayButton").show();
    $(".button-wrapper").hide();
  }
  $("#fileInput").val("");
});

// Switch camera between front and rear
$("#switchCameraButton").on("click", function () {
  // Toggle between 'user' (front camera) and 'environment' (rear camera)
  facingMode = facingMode === "user" ? "environment" : "user";

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }

  // Restart video stream with the updated facing mode
  startVideoStream();
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
  $(this).hide();
  $("#toggleCameraButton").show();
  $("#displayArea").hide();
  $("#videoElement").show();
  $(".button-wrapper").show();
});
