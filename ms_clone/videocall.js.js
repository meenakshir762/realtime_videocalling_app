/*
 * JS Interface for Agora.io SDK
 */
//MINCHI STOP
// video profile settings
var cameraVideoProfile = '480p_4'; // 640 × 480 @ 30fps  & 750kbs
var screenVideoProfile = '480p_2'; // 640 × 480 @ 30fps

// create a client  for camera and screen share  seperately
var client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
var screenClient;

// to keep track of active streams 
var remoteUsers = {}; // On initiation no users are connected.

var localTracks = { //Clear the video and audio tracks used by `client` on initiation.
  camera: {
    id: "",
    stream: {}
  },
  screen: {
    id: "",
    stream: {}
  }
};

AgoraRTC.Logger.enableLogUpload(); // enable log upload to Agora’s server
var masterStreamId; // main stream
var screenShareActive = false;

function clientInitAndJoin(appId, token, channel, uid) {
  // init Agora SDK
  client.init(appId, function () {
    console.log("client initialized");
    joinChannel(channel, uid, token); // join channel upon successfull init
  }, function (err) {
    console.log("[ERROR] : client init failed", err);
  });
}


client.on('stream-published', function (evt) { //a method in client provided by Agora SDK
  console.log("Published local stream successfully :)");
});

// connect remote streams
client.on('stream-added', function (evt) { //the SDK reports to the app about the existing remote streams i
  var stream = evt.stream;
  var streamId = stream.getId();
  console.log("new stream added: " + streamId);
  // Check if the stream is local
  if (streamId != localTracks.screen.id) {
    console.log('subscribe to remote stream:' + streamId);
    // Subscribe to the stream.
    client.subscribe(stream, function (err) {
      console.log("[ERROR] : subscribe stream failed", err);
    });
  }
});

client.on('stream-subscribed', function (evt) {  // when a user subscribes to a remote stream.
  var remoteUser = evt.stream;
  var remoteId = remoteUser.getId();
  remoteUsers[remoteId] = remoteUser;
  console.log("Subscribe remote stream successfully: " + remoteId);
  if ($('#full-screen-video').is(':empty')) {
    masterStreamId = remoteId;
    remoteUser.play('full-screen-video');
    $('#main-stats-btn').show();
    $('#main-stream-stats-btn').show();
  } else if (remoteId == 49024) {
    // move the current master stream to miniview
    remoteUsers[masterStreamId].stop(); // stop the main video stream playback
    client.setRemoteVideoStreamType(remoteUsers[masterStreamId], 1); // subscribe to the low stream
    addRemoteStreamMiniView(remoteUsers[masterStreamId]); // send the main video stream to a container
    // set the screen-share as the main 
    masterStreamId = remoteId;
    remoteUser.play('full-screen-video'); s
  } else {
    client.setRemoteVideoStreamType(remoteUser, 1); // subscribe to the low stream
    addRemoteStreamMiniView(remoteUser);
  }
});

// remove the remote-container when a user leaves the channel
client.on("peer-leave", function (evt) {
  var streamId = evt.stream.getId(); // the the stream id
  if (remoteUsers[streamId] != undefined) {
    remoteUsers[streamId].stop(); // stop playing the feed
    delete remoteUsers[streamId]; // remove stream from list
    if (streamId == masterStreamId) {
      var streamIds = Object.keys(remoteUsers);
      var randomId = streamIds[Math.floor(Math.random() * streamIds.length)]; // select from the remaining streams
      remoteUsers[randomId].stop(); // stop the stream's existing playback
      var remoteContainerID = '#' + randomId + '_container';
      $(remoteContainerID).empty().remove(); // remove the stream's miniView container
      remoteUsers[randomId].play('full-screen-video'); // play the random stream as the master stream
      masterStreamId = randomId; // set the new main remote stream
    } else {
      var remoteContainerID = '#' + streamId + '_container';
      $(remoteContainerID).empty().remove(); // 
    }
  }
});

// show mute icon whenever a remote has muted their mic
client.on("mute-audio", function (evt) {
  toggleVisibility('#' + evt.uid + '_mute', true);
});

client.on("unmute-audio", function (evt) {
  toggleVisibility('#' + evt.uid + '_mute', false);
});

// show user icon whenever a remote has disabled their video
client.on("mute-video", function (evt) {
  var remoteId = evt.uid;
  // if the main user stops their video select a random user from the list
  if (remoteId != masterStreamId) {
    // if not the main vidiel then show the user icon
    toggleVisibility('#' + remoteId + '_no-video', true);
  }
});

client.on("unmute-video", function (evt) {
  toggleVisibility('#' + evt.uid + '_no-video', false);
});

// join a channel
function joinChannel(channel, uid, token) {
  client.join(token, channel, uid, function (uid) {
    console.log("User " + uid + " join channel successfully");
    createCameraStream(uid);
    localTracks.camera.id = uid; // keep track of the stream uid 
  }, function (err) {
    console.log("[ERROR] : join channel failed", err);
  });
}

// video streams for channel
function createCameraStream(uid) {
  var localTrack = AgoraRTC.createStream({
    streamID: uid,
    audio: true,
    video: true,
    screen: false
  });
  localTrack.setVideoProfile(cameraVideoProfile);
  localTrack.init(function () {
    console.log("getUserMedia successfully");
    // TODO: add check for other streams. play local stream full size if alone in channel
    localTrack.play('local-video'); // play the given stream within the local-video div

    // publish local stream
    client.publish(localTrack, function (err) {
      console.log("[ERROR] : publish local stream error: " + err);
    });

    enableUiControls(localTrack); // move after testing
    localTracks.camera.stream = localTrack; // keep track of the camera stream for later
  }, function (err) {
    console.log("[ERROR] : getUserMedia failed", err);
  });
}

// SCREEN SHARING
function initScreenShare(appId, channel) {
  screenClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  console.log("AgoraRTC screenClient initialized");
  var uid = 49024; // hardcoded uid to make it easier to identify on remote clients
  screenClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  screenClient.init(appId, function () {
    console.log("AgoraRTC screenClient initialized");
  }, function (err) {
    console.log("[ERROR] : AgoraRTC screenClient init failed", err);
  });
  // keep track of the uid of the screen stream. 
  localTracks.screen.id = uid;

  // Create the stream for screen sharing.
  var screenStream = AgoraRTC.createStream({
    streamID: uid,
    audio: false, // Set the audio attribute as false to avoid any echo during the call.
    video: false,
    screen: true, // screen stream
    screenAudio: true,
    mediaSource: 'screen',
  });
  // initialize the stream 
  // -- NOTE: this must happen directly from user interaction, if called by a promise or callback it will fail.
  screenStream.init(function () {
    console.log("getScreen successful");
    localTracks.screen.stream = screenStream; // keep track of the screen stream
    screenShareActive = true;
    $("#screen-share-btn").prop("disabled", false); // enable button
    screenClient.join(token, channel, uid, function (uid) {
      screenClient.publish(screenStream, function (err) {
        console.log("[ERROR] : publish screen stream error: " + err);
      });
    }, function (err) {
      console.log("[ERROR] : join channel as screen-share failed", err);
    });
  }, function (err) {
    console.log("[ERROR] : getScreen failed", err);
    localTracks.screen.id = ""; // reset screen stream id
    localTracks.screen.stream = {}; // reset the screen stream
    screenShareActive = false; // resest screenShare
    toggleScreenShareBtn(); // toggle the button icon back
    $("#screen-share-btn").prop("disabled", false); // enable button
  });
  var token = generateToken();
  screenClient.on('stream-published', function (evt) {
    console.log("Publish screen stream successfully");
    if ($('#full-screen-video').is(':empty')) {
      $('#main-stats-btn').show();
      $('#main-stream-stats-btn').show();
    } else {
      // move the current master stream to miniview
      remoteUsers[masterStreamId].stop(); // stop the main video stream playback
      client.setRemoteVideoStreamType(remoteUsers[masterStreamId], 1); // subscribe to the low stream
      addRemoteStreamMiniView(remoteUsers[masterStreamId]); // send the main video stream to a container
    }
    masterStreamId = localTracks.screen.id;
    localTracks.screen.stream.play('full-screen-video');
  });

  screenClient.on('stopScreenSharing', function (evt) {
    console.log("screen sharing stopped", err);
  });
}

function stopScreenShare() {
  localTracks.screen.stream.disableVideo(); // disable the local video stream (will send a mute signal)
  localTracks.screen.stream.stop(); // stop playing the local stream
  localTracks.camera.stream.enableVideo(); // enable the camera feed
  localTracks.camera.stream.play('local-video'); // play the camera within the full-screen-video div
  $("#video-btn").prop("disabled", false);
  screenClient.leave(function () {
    screenShareActive = false;
    console.log("screen client leaves channel");
    $("#screen-share-btn").prop("disabled", false); // enable button
    screenClient.unpublish(localTracks.screen.stream); // unpublish the screen client
    localTracks.screen.stream.close(); // close the screen client stream
    localTracks.screen.id = ""; // reset the screen id
    localTracks.screen.stream = {}; // reset the stream obj
  }, function (err) {
    console.log("client leave failed ", err); //error handling
  });
}

// REMOTE STREAMS UI
function addRemoteStreamMiniView(remoteUser) {
  var streamId = remoteUser.getId();
  // append the remote stream template to #remote-streams
  $('#remote-streams').append(
    $('<div/>', { 'id': streamId + '_container', 'class': 'remote-stream-container col' }).append(
      $('<div/>', { 'id': streamId + '_mute', 'class': 'mute-overlay' }).append(
        $('<i/>', { 'class': 'fas fa-microphone-slash' })
      ),
      $('<div/>', { 'id': streamId + '_no-video', 'class': 'no-video-overlay text-center' }).append(
        $('<i/>', { 'class': 'fas fa-user' })
      ),
      $('<div/>', { 'id': 'agora_remote_' + streamId, 'class': 'remote-video' })
    )
  );
  remoteUser.play('agora_remote_' + streamId);

  var containerId = '#' + streamId + '_container';
  $(containerId).dblclick(function () {
    // play selected container as full screen - swap out current full screen stream
    remoteUsers[masterStreamId].stop(); // stop the main video stream playback
    addRemoteStreamMiniView(remoteUsers[masterStreamId]); // send the main video stream to a container
    $(containerId).empty().remove(); // remove the stream's miniView container
    remoteUsers[streamId].stop() // stop the container's video stream playback
    remoteUsers[streamId].play('full-screen-video'); // play the remote stream as the full screen video
    masterStreamId = streamId; // set the container stream id as the new master stream id
  });
}

function leaveChannel() {

  if (screenShareActive) {
    stopScreenShare();
  }

  client.leave(function () {
    console.log("client leaves channel");
    localTracks.camera.stream.stop() // stop the camera stream playback
    client.unpublish(localTracks.camera.stream); // unpublish the camera stream
    localTracks.camera.stream.close(); // clean up and close the camera stream
    $("#remote-streams").empty() // clean up the remote feeds
    //disable the UI elements
    $("#mic-btn").prop("disabled", true);
    $("#video-btn").prop("disabled", true);
    $("#screen-share-btn").prop("disabled", true);
    $("#exit-btn").prop("disabled", true);
    // hide the mute/no-video overlays
    toggleVisibility("#mute-overlay", false);
    toggleVisibility("#no-local-video", false);
    // show the modal overlay to join
    $("#modalForm").modal("show");
  }, function (err) {
    console.log("client leave failed ", err); //error handling
  });
}

//tokens for added security
function generateToken() {
  return null; // TODO: add a token generation
}