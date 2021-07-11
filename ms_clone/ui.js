// UI buttons
function enableAccessToUi(localTrack) {

  $("#mic-btn").prop("disabled", false);
  $("#video-btn").prop("disabled", false);
  $("#screen-share-btn").prop("disabled", false);
  $("#exit-btn").prop("disabled", false);

  $("#mic-btn").click(function () {
    toggleMic(localTrack);
  });

  $("#video-btn").click(function () {
    toggleVideo(localTrack);
  });

  $("#screen-share-btn").click(function () {
    toggleScreenShareBtn();
    $("#screen-share-btn").prop("disabled", true); // disable the button on click
    if (screenShareActive) {
      stopScreenShare();
    } else {
      var appId = 'Enter your App ID here';
      var channel = $('#form-channel').val();
      initScreenShare(appId, channel);
    }
  });

  $("#exit-btn").click(function () {
    console.log("leave the channel");
    toggleexitbtn();
    leaveChannel();
  });

}

function toggleBtn(btn) {
  btn.toggleClass('btn-dark').toggleClass('btn-danger');
}

function toggleScreenShareBtn() {
  $('#screen-share-btn').toggleClass('btn-dark').toggleClass('btn-danger');
}

function toggleexitbtn() {
  $('#exit-btn').toggleClass('btn-dark').toggleClass('btn-danger');
}

function toggleVisibility(elementID, visible) {
  if (visible) {
    $(elementID).attr("style", "display:block");
  }
  else {
    $(elementID).attr("style", "display:none");
  }
}

function toggleMic(localTrack) {
  toggleBtn($("#mic-btn")); // toggle button colors
  $("#mic-icon").toggleClass('fa-microphone').toggleClass('fa-microphone-slash'); // toggle the mic icon
  if ($("#mic-icon").hasClass('fa-microphone')) {
    localTrack.unmuteAudio(); // enable the local mic
    toggleVisibility("#mute-overlay", false); // hide the muted mic icon
  } else {
    localTrack.muteAudio(); // mute the local mic
    toggleVisibility("#mute-overlay", true); // show the muted mic icon
  }
}

function toggleVideo(localTrack) {
  toggleBtn($("#video-btn")); // toggle button colors
  $("#video-icon").toggleClass('fa-video').toggleClass('fa-video-slash'); // toggle the video icon
  if ($("#video-icon").hasClass('fa-video')) {
    localTrack.unmuteVideo(); // enable the local video
    toggleVisibility("#no-local-video", false); // hide the user icon when video is enabled
  } else {
    localTrack.muteVideo(); // disable the local video
    toggleVisibility("#no-local-video", true); // show the user icon when video is disabled
  }
}
