"use client";

import React, { useState, useRef } from "react";
import { Download, Scissors, Play, Pause, RefreshCw } from "lucide-react";

export default function VideoTrimmer() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [duration, setDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(5);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [trimmedUrl, setTrimmedUrl] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setTrimmedUrl("");
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setStartTime(0);
      setEndTime(Math.min(dur, Math.max(1, Math.min(10, dur))));
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.currentTime >= endTime) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.currentTime < startTime || videoRef.current.currentTime >= endTime) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTrim = async () => {
    if (!videoRef.current || !videoFile) return;
    setIsProcessing(true);
    setProgress(0);

    const video = videoRef.current;
    const v = video as HTMLVideoElement & {
      captureStream?: () => MediaStream;
      mozCaptureStream?: () => MediaStream;
    };
    const stream = v.captureStream ? v.captureStream() : v.mozCaptureStream ? v.mozCaptureStream() : null;

    if (!stream) {
      alert("Browser does not support in-browser stream capture. Try on Chrome, Firefox, or Edge.");
      setIsProcessing(false);
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : "video/mp4";

    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];

    recorder.ondataavailable = e => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setTrimmedUrl(url);
      setIsProcessing(false);
      setProgress(100);
      video.pause();
      setIsPlaying(false);
    };

    // Seek to startTime, start recording, play until endTime
    video.currentTime = startTime;
    video.muted = false;

    video.onseeked = () => {
      video.onseeked = null;
      recorder.start(100);
      video.play();
      setIsPlaying(true);

      const checkInterval = setInterval(() => {
        if (!video || video.currentTime >= endTime) {
          clearInterval(checkInterval);
          if (recorder.state === "recording") {
            recorder.stop();
          }
        } else {
          const currentProgress = ((video.currentTime - startTime) / (endTime - startTime)) * 100;
          setProgress(Math.min(99, Math.round(currentProgress)));
        }
      }, 100);
    };
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m}:${s < 10 ? "0" : ""}${s}.${ms}`;
  };

  return (
    <div className="tool-panel">
      <h3 className="text-lg font-semibold mb-2">In-Browser Video Trimmer & Clip Cutter</h3>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
        Trim and slice video clips locally inside your browser using hardware-accelerated MediaStream APIs. Zero uploads.
      </p>

      {!videoSrc ? (
        <div className="p-8 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg text-center bg-gray-50 dark:bg-slate-900">
          <input
            type="file"
            accept="video/*"
            id="video-upload"
            className="hidden"
            onChange={handleFileChange}
          />
          <label htmlFor="video-upload" className="button cursor-pointer inline-flex items-center gap-2">
            <Scissors size={16} /> Select Video to Trim (MP4, WebM, MOV)
          </label>
          <p className="text-xs text-gray-500 mt-2">Maximum recommended size: 250 MB for optimal browser memory.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-black rounded-lg overflow-hidden max-h-96 flex justify-center items-center">
            <video
              ref={videoRef}
              src={videoSrc}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              className="max-h-96 w-auto"
            />
          </div>

          <div className="flex items-center gap-3 justify-center">
            <button
              onClick={togglePlay}
              className="button secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
              type="button"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />} {isPlaying ? "Pause" : "Preview Segment"}
            </button>
            <span className="text-xs text-gray-500 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded border dark:border-slate-700">
            <div>
              <label className="text-xs font-semibold block mb-1">
                Start Cut Time: {formatTime(startTime)}
              </label>
              <input
                type="range"
                min="0"
                max={Math.max(0, endTime - 0.5)}
                step="0.1"
                value={startTime}
                onChange={e => {
                  const val = Number(e.target.value);
                  setStartTime(val);
                  if (videoRef.current) videoRef.current.currentTime = val;
                }}
                className="w-full cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">
                End Cut Time: {formatTime(endTime)}
              </label>
              <input
                type="range"
                min={startTime + 0.5}
                max={duration || 10}
                step="0.1"
                value={endTime}
                onChange={e => {
                  const val = Number(e.target.value);
                  setEndTime(val);
                  if (videoRef.current) videoRef.current.currentTime = val;
                }}
                className="w-full cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Selected Clip Length: <strong>{(endTime - startTime).toFixed(1)} seconds</strong>
            </div>
            <div className="flex gap-2">
              <label htmlFor="change-video" className="button secondary text-xs cursor-pointer inline-flex items-center gap-1">
                <RefreshCw size={12} /> Change Video
                <input type="file" id="change-video" accept="video/*" className="hidden" onChange={handleFileChange} />
              </label>
              <button
                onClick={handleTrim}
                disabled={isProcessing}
                className="button text-xs flex items-center gap-1.5 py-1.5 px-4"
                type="button"
              >
                <Scissors size={14} /> {isProcessing ? `Trimming (${progress}%)...` : "Trim & Export Video"}
              </button>
            </div>
          </div>

          {trimmedUrl && (
            <div className="p-4 bg-green-50 dark:bg-slate-800 rounded border border-green-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2 mt-4">
              <div>
                <strong className="text-sm text-green-900 dark:text-green-300 block">Trim Complete!</strong>
                <p className="text-xs text-green-700 dark:text-green-400 m-0">
                  Your trimmed clip is ready to download.
                </p>
              </div>
              <a
                href={trimmedUrl}
                download={`trimmed-${videoFile?.name.replace(/\.[^.]+$/, "") || "clip"}.webm`}
                className="button text-xs flex items-center gap-1.5 py-1.5 px-4"
              >
                <Download size={14} /> Download Trimmed Clip
              </a>
            </div>
          )}
        </div>
      )}

      <p className="hint text-xs opacity-75 mt-4">
        Processes video frames locally using HTML5 MediaStream and MediaRecorder. Video bytes never leave your device.
      </p>
    </div>
  );
}
