const start = document.getElementById("start");
const stop = document.getElementById("stop");
const video = document.querySelector("video");
let recorder, stream;

async function startRecording() {
    //Create a Video Stream
    stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: "screen" }
    });
    // Record the Stream
    recorder = new MediaRecorder(stream);
    const chunks = [];
    //since video stream is quite big we can periodically call ondataavailable
    recorder.ondataavailable = e => chunks.push(e.data);
    //convert the recording to a Blob
    recorder.onstop = e => {

        const mediaBlob = new Blob(chunks, { type: chunks[0].type });
        const mediaBlobUrl = URL.createObjectURL(mediaBlob);
        let downloadButton = document.getElementById("downloadButton");
        downloadButton.href = mediaBlobUrl;
        downloadButton.download = "RecordedVideo.MP4";
    }
    recorder.start();
};


start.addEventListener("click", () => {
    start.setAttribute("disabled", true);
    stop.removeAttribute("disabled");
    startRecording();
});

stop.addEventListener("click", () => {
    stop.setAttribute("disabled", true);
    start.removeAttribute("disabled");

    recorder.stop();
    stream.getVideoTracks()[0].stop();
});
