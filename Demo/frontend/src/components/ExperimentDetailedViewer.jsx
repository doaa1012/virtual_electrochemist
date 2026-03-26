import React, { useEffect, useState, useCallback } from "react";
import { config } from "../config";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";

const ExperimentDetailedViewer = () => {
  const [allMetadataIds, setAllMetadataIds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [metadata, setMetadata] = useState(null);
  const [files, setFiles] = useState([]);
  const [ecFiles, setEcFiles] = useState([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [showRecorder, setShowRecorder] = useState(false);
  const mediaRecorderRef = React.useRef(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const speechRecRef = React.useRef(null);
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const id = routeId ? Number(routeId) : null;
  const singleMode = !!id;
  const stopRecorderAndWait = () =>
    new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;

      if (!recorder || recorder.state !== "recording") {
        resolve();
        return;
      }

      const oldOnStop = recorder.onstop;

      recorder.onstop = (e) => {
        oldOnStop?.(e);
        setTimeout(resolve, 80); // wait for React state update
      };

      recorder.stop();
    });

  const autoSaveIfNeeded = async () => {
    if (isSaving) return false;

    await stopRecorderAndWait();

    if (audioBlob) {
      toast.info("Saving your audio before switching...");
      const ok = await uploadAudio(audioBlob);
      return ok;
    }

    return false;
  };

  const metadataGroups = {
    "Chemical Description": [
      "intended_reaction",
      "catalyst_id",
      "catalyst_composition",
      "catalyst_loading",
      "catalyst_structure",
      "catalyst_morphology",
    ],

    "Electrode Setup": [
      "electrode_material",
      "electrode_area",
      "reference_electrode",
    ],

    "Electrolyte Details": [
      "electrolyte",
      "electrolyte_ph",
      "nitrogen_purging_time",
      "rhe_conversion"
    ],

    "Experimental Conditions": [
      "temperature",
      "scan_rate",
      "cycles",
      "initial_conditioning",
      "potential_range",
      "ir_compensation",
      "forward_scan_note",
      "triplicate_measurements"
    ],

    "Admin Info": [
      "id",
      "created_by",
      "virtual_user",
      "article_doi",
      "article_link"
    ],
  };

  //const [isRecording, setIsRecording] = useState(false);
  const chunksRef = React.useRef([]);
  const startSpeechToText = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Live transcription is not supported in this browser. Use Chrome/Edge.");
      return false;
    }

    const rec = new SpeechRecognition();
    speechRecRef.current = rec;

    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US"; // change if needed, e.g. "de-DE"

    rec.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += text + " ";
        else interimText += text;
      }

      if (finalText) setTranscript((prev) => (prev + " " + finalText).trim());
      setInterimTranscript(interimText);
    };

    rec.onerror = (e) => {
      console.error("SpeechRecognition error:", e);
      toast.error("Transcription error. Try again.");
    };

    rec.onend = () => {
      // When recording stops, recognition may end too
      setInterimTranscript("");
    };

    // reset text each new recording (optional)
    setTranscript("");
    setInterimTranscript("");

    rec.start();
    return true;
  };

  const stopSpeechToText = () => {
    const rec = speechRecRef.current;
    if (!rec) return;

    try {
      rec.onresult = null;
      rec.onerror = null;
      rec.stop();
    } catch { }
  };

  const startRecording = async () => {
    try {
      startSpeechToText();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstart = () => {
        setIsRecording(true);
        setAudioBlob(null);
        setAudioURL(null);
      };

      mediaRecorder.onstop = () => {
        // stop mic
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });

        if (blob.size === 0) {
          toast.error("No audio detected. Try speaking louder.");
          return;
        }

        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        setIsRecording(false);

        stopSpeechToText();
        toast.info("Recording complete. Review it before saving.");
      };

      mediaRecorder.start();
    } catch (error) {
      console.error("Microphone error:", error);
      alert("Microphone permission is required.");
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    stopSpeechToText();
  };

  const uploadAudio = async (blob) => {
    setIsSaving(true);

    try {
      const fileId = ecFiles[currentFileIndex]?.id;
      if (!fileId) {
        toast.error("No file selected.");
        return false;
      }

      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const res = await fetch(`${config.BASE_URL}files/${fileId}/save-audio/`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.status === "success") {

        //  FIX: show toast BEFORE state updates
        toast.success("Recording saved!", { autoClose: 1500 });

        //  FIX: delay so toast remains visible
        await new Promise(r => setTimeout(r, 700));

        // Now clear blob and re-render safely
        setAudioBlob(null);
        setAudioURL(null);
        setTranscript("");
        setInterimTranscript("");
        return true;
      } else {
        toast.error("Upload failed");
        return false;
      }
    } catch (err) {
      toast.error("Error uploading audio");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const formatKey = (key) => {
    const clean = key.replace(/_/g, " ");
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };
  const [plotData, setPlotData] = useState(null);

  const currentMetadataId =
    id ?? allMetadataIds[currentIndex];
  // ---- Voice Recording Logic ----
  const [isRecording, setIsRecording] = useState(false);

  // 1) Load list of all metadata IDs
  const loadAllMetadataIds = useCallback(async () => {
    const res = await fetch(`${config.BASE_URL}experiment/list/`);
    const data = await res.json();
    console.log("Experiment list loaded:", data.ids);

    setAllMetadataIds(data.ids);
    setCurrentIndex(0);
  }, []);

  const renderValue = (key, value) => {
  if (!value) return "";

  // ---- DOI becomes clickable ----
  if (key === "article_doi") {
    const doiUrl = value.startsWith("http")
      ? value
      : `https://doi.org/${value}`;

    return (
      <a
        href={doiUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800"
      >
        {value}
      </a>
    );
  }

  // ---- Article link clickable ----
  if (key === "article_link") {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800"
      >
        Open Article
      </a>
    );
  }

  // normal values
  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return value;
};

  // 2) Load data for a single metadata ID
  const loadMetadata = useCallback(async () => {
    if (!currentMetadataId) return;

    console.log("Loading experiment:", currentMetadataId);

    const res = await fetch(
      `${config.BASE_URL}experiment/${currentMetadataId}/details/`
    );
    const data = await res.json();

    setMetadata(data.metadata);
    setFiles(data.files);

    const electrochemFiles = data.files.filter(
      (f) =>
        f.filename.toLowerCase().includes("cv") ||
        f.filename.toLowerCase().includes("lsv")
    );

    setEcFiles(electrochemFiles);
    setCurrentFileIndex(0);

  }, [currentMetadataId]);

  // 3) Load plot for selected file (still uses your Django endpoint)
  const loadPlot = useCallback(async () => {
    if (!ecFiles[currentFileIndex]) {
      setPlotData(null);
      return;
    }

    const fileUrl = ecFiles[currentFileIndex].url;
    console.log("Loading plot for:", fileUrl);

    const res = await fetch(
      `${config.BASE_URL}experiment/plot/?file_url=${encodeURIComponent(fileUrl)}&file_id=${ecFiles[currentFileIndex].id}`
    );


    const data = await res.json();
    console.log("plotData received:", data);

    if (!data || !Array.isArray(data.x) || !Array.isArray(data.y)) {
      console.error(" Invalid plot data returned:", data);
      setPlotData(null);
      return;
    }

    setPlotData({
      x: data.x,
      y: data.y,
      xlabel: data.xlabel ?? "",
      ylabel: data.ylabel ?? "",
    });
  }, [ecFiles, currentFileIndex]);

  // 4) Effects
  useEffect(() => {

    const init = async () => {

      // -------- SINGLE EXPERIMENT MODE --------
      if (id) {
        console.log("Single experiment mode:", id);

        setAllMetadataIds([id]);
        setCurrentIndex(0);
        return;
      }

      // -------- BROWSE ALL MODE --------
      await loadAllMetadataIds();
    };

    init();

  }, [id, loadAllMetadataIds]);

  useEffect(() => {
    loadMetadata();
  }, [currentMetadataId, loadMetadata]);

  useEffect(() => {
    loadPlot();
  }, [currentFileIndex, ecFiles, loadPlot]);

  // 5) Metadata navigation
  const goNextMetadata = async () => {
    if (isSaving) return toast.info("Saving audio, please wait...");
    const ok = await autoSaveIfNeeded();

    if (ok) {
      toast.success("Recording autosaved!");
      await new Promise(r => setTimeout(r, 700));
    }

    setCurrentIndex((prev) => (prev + 1) % allMetadataIds.length);
  };
  
  const goPrevMetadata = async () => {
    if (isSaving) return toast.info("Saving audio, please wait...");
    const ok = await autoSaveIfNeeded();

    if (ok) {
      toast.success("Recording autosaved!");
      await new Promise(r => setTimeout(r, 700));
    }

    setCurrentIndex((prev) => (prev - 1 + allMetadataIds.length) % allMetadataIds.length);
  };


  // 6) File navigation
  const nextFile = async () => {
    if (isSaving) return toast.info("Saving audio...");
    if (ecFiles.length === 0) return;

    await autoSaveIfNeeded();
    setCurrentFileIndex((i) => (i + 1) % ecFiles.length);
  };

  const prevFile = async () => {
    if (isSaving) return toast.info("Saving audio...");
    if (ecFiles.length === 0) return;

    await autoSaveIfNeeded();
    setCurrentFileIndex((i) => (i - 1 + ecFiles.length) % ecFiles.length);
  };

  if (!metadata) return <div className="p-10">Loading...</div>;

  // ---------- SIMPLE SVG PLOT HELPERS ----------
  const renderSvgPlot = () => {
    if (!plotData) {
      return <p className="text-gray-500">Loading plot…</p>;
    }

    const { x, y } = plotData;
    const n = Math.min(x.length, y.length);
    if (n === 0) return <p className="text-gray-500">No data points.</p>;

    const width = 700;
    const height = 450;
    const margin = 90;

    const xVals = x.slice(0, n);
    const yVals = y.slice(0, n);

    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const minY = Math.min(...yVals);
    const maxY = Math.max(...yVals);

    const dx = maxX - minX || 1;
    const dy = maxY - minY || 1;

    // --- Generate curve points ---
    const points = xVals
      .map((vx, i) => {
        const vy = yVals[i];
        const nx = (vx - minX) / dx;
        const ny = (vy - minY) / dy;

        const sx = margin + nx * (width - 2 * margin);
        const sy = height - (margin + ny * (height - 2 * margin));
        return `${sx},${sy}`;
      })
      .join(" ");

    // --- Axis ticks ---
    const TICKS = 5;
    const xTicks = Array.from(
      { length: TICKS + 1 },
      (_, i) => minX + (dx * i) / TICKS
    );
    const yTicks = Array.from(
      { length: TICKS + 1 },
      (_, i) => minY + (dy * i) / TICKS
    );

    // fixed, safe x-position for Y-axis label
    const yLabelX = 7; // left of tick labels (which are at x = 50)

    

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-96 bg-white rounded-xl shadow-inner border border-orange-200"
      >
        {/* Grid + ticks */}
        {Array.from({ length: TICKS + 1 }).map((_, i) => {
          const xPos = margin + (i / TICKS) * (width - 2 * margin);
          const yPos = margin + (i / TICKS) * (height - 2 * margin);

          return (
            <g key={i}>
              {/* Vertical grid */}
              <line
                x1={xPos}
                y1={margin}
                x2={xPos}
                y2={height - margin}
                stroke="#E5E7EB"
              />
              {/* Horizontal grid */}
              <line
                x1={margin}
                y1={yPos}
                x2={width - margin}
                y2={yPos}
                stroke="#E5E7EB"
              />
              {/* X tick */}
              <text
                x={xPos}
                y={height - margin + 25}
                textAnchor="middle"
                fontSize="12"
                fill="#444"
              >
                {xTicks[i].toFixed(2)}
              </text>
              {/* Y tick */}
              <text
                x={margin - 10} // 50
                y={height - yPos + 5}
                textAnchor="end"
                fontSize="12"
                fill="#444"
              >
                {yTicks[i].toExponential(2)}
              </text>
            </g>
          );
        })}

        {/* Axes */}
        <line
          x1={margin}
          y1={height - margin}
          x2={width - margin}
          y2={height - margin}
          stroke="#555"
          strokeWidth="1.5"
        />
        <line
          x1={margin}
          y1={margin}
          x2={margin}
          y2={height - margin}
          stroke="#555"
          strokeWidth="1.5"
        />

        {/* Data line */}
        <polyline
          fill="none"
          stroke="#e67e22"
          strokeWidth="2.2"
          points={points}
        />

        {/* X-axis label */}
        <text
          x={width / 2}
          y={height - 10}
          textAnchor="middle"
          fontSize="16"
          fill="#333"
        >
          {plotData.xlabel}
        </text>

        {/* Y-axis label – now visible */}
        <text
          x={yLabelX}
          y={(height / 2) + 10}   // pushes label down slightly

          textAnchor="middle"
          fontSize="16"
          fill="#333"
          transform={`rotate(-90 ${yLabelX} ${height / 2})`}
        >
          {plotData.ylabel}
        </text>
      </svg>
    );
  };

  const groupedMetadata = {};

  Object.entries(metadata).forEach(([key, value]) => {
    for (const [groupName, fields] of Object.entries(metadataGroups)) {
      if (fields.includes(key)) {
        if (!groupedMetadata[groupName]) groupedMetadata[groupName] = [];
        groupedMetadata[groupName].push({ key, value });
      }
    }
  });


  return (
    <div className="min-h-screen bg-[#FFF7ED] p-6 md:p-10">

      {/* ---- Navigation Header ---- */}
      <div className="flex items-center justify-between mb-10">

  {/* LEFT SIDE */}
  <div className="flex gap-3">

    {/* Back to ALL experiments (only in single mode) */}
    {singleMode && (
      <button
        onClick={() => navigate("/experiment")}
        className="px-5 py-2 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600 transition"
      >
        ← All Experiments
      </button>
    )}

    {/* Previous button (browse mode only) */}
    {!singleMode && (
      <button
        onClick={goPrevMetadata}
        className="px-5 py-2 bg-orange-500 text-white rounded-lg shadow hover:bg-orange-600 transition"
      >
        ← Previous
      </button>
    )}

  </div>

  {/* TITLE */}
  <div className="text-center">
    <h1 className="text-3xl font-extrabold text-orange-700 drop-shadow-sm">
      {metadata.intended_reaction}
      <span className="text-gray-700 font-semibold">
        {" "}— Catalyst ID {metadata.catalyst_id}
      </span>
    </h1>
  </div>

  {/* RIGHT SIDE */}
  <div>
    {!singleMode && (
      <button
        onClick={goNextMetadata}
        className="px-5 py-2 bg-orange-500 text-white rounded-lg shadow hover:bg-orange-600 transition"
      >
        Next →
      </button>
    )}
  </div>

</div>

      {/* ---- Two Column Layout ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* ---- METADATA CARD ---- */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-orange-200">
          <h2 className="text-2xl font-bold text-orange-700 mb-6">
            Metadata
          </h2>

          <div className="space-y-4">
            {Object.entries(groupedMetadata)
              .sort(([a], [b]) => (a === "Admin Info" ? 1 : b === "Admin Info" ? -1 : 0))
              .map(([groupName, items]) => (

                <div
                  key={groupName}
                  className="bg-white p-3 rounded-lg border border-orange-200"
                >
                  {/* GROUP TITLE */}
                  <h3 className="text-[15px] font-bold text-orange-700 mb-2">
                    {groupName}
                  </h3>

                  {/* 4-COLUMN ULTRA-COMPACT GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-1">
                    {items.map(({ key, value }) => (
                      <div key={key} className="leading-tight">
                        <div className="text-[12px] font-semibold text-orange-700">
                          {formatKey(key)}
                        </div>
                        <div className="text-[12px] text-gray-800 truncate">
                        {renderValue(key, value)}
                      </div>
                        <div className="border-b border-orange-100 mt-1 mb-1"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* ---- ELECTROCHEM PLOT CARD ---- */}
        <div Plotdiv className="bg-white p-8 rounded-2xl shadow-lg border border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-orange-700">
              Electrochemistry Plot
            </h2>

            {/* RECORD LINK */}
            <button
              onClick={() => setShowRecorder(!showRecorder)}
              className="text-blue-600 text-lg hover:underline hover:text-blue-800"
            >
              🎤 Record
            </button>
          </div>
          {ecFiles.length > 0 ? (
            <>
              {/* ---- FILE NAVIGATION ---- */}
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={prevFile}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg shadow hover:bg-orange-600 transition"
                >
                  ← Previous File
                </button>

                <div className="text-center">
                  <p className="text-gray-600 text-sm">
                    {currentFileIndex + 1} / {ecFiles.length}
                  </p>
                </div>
                <button
                  onClick={nextFile}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg shadow hover:bg-orange-600 transition"
                >
                  Next File →
                </button>
              </div>

              {/* ---- PLOT ---- */}
              <div className="bg-[#FFF8F1] border border-orange-200 rounded-xl p-4 shadow-inner">
                {renderSvgPlot()}
              </div>
              <br />
              {/* ---- RECORD PANEL BELOW TITLE ---- */}
              {showRecorder && (
                <div className="mb-4 p-4 bg-white border border-orange-200 rounded-xl shadow-sm">

                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`px-6 py-2 rounded-lg font-semibold text-white shadow 
        ${isRecording ? "bg-red-600" : "bg-blue-600 hover:bg-blue-700"}`}
                  >
                    {isRecording ? "⏹ Stop Recording" : "🎤 Start Recording"}
                  </button>

                  {/*  TRANSCRIPT BOX ALWAYS VISIBLE */}
                  <div className="mt-4 p-3 rounded-lg border border-orange-200 bg-[#FFF8F1]">
                    <div className="text-sm font-semibold text-orange-700 mb-1">
                      Live transcript
                    </div>

                    <textarea
                      value={(transcript + " " + interimTranscript).trim()}
                      onChange={(e) => {
                        setTranscript(e.target.value);
                        setInterimTranscript("");
                      }}
                      placeholder="Transcript will appear here..."
                      className="w-full min-h-[80px] p-2 text-sm border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />

                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText((transcript + " " + interimTranscript).trim())
                        }
                        className="px-3 py-1 text-sm bg-white border border-orange-200 rounded hover:bg-orange-50"
                      >
                        Copy
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTranscript("");
                          setInterimTranscript("");
                          toast.info("Transcript cleared. Recording kept.");
                        }}
                        className="px-3 py-1 text-sm bg-white border border-orange-200 rounded hover:bg-orange-50"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/*  AUDIO PREVIEW ONLY AFTER STOP */}
                  {audioURL && (
                    <div className="mt-4">
                      <audio controls src={audioURL} className="w-full mb-3" />

                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={async () => {
                            const ok = await uploadAudio(audioBlob);
                            if (ok) toast.success("Audio saved!");
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
                        >
                          Save
                        </button>

                        <button
                          onClick={() => {
                            setAudioBlob(null);
                            setAudioURL(null);
                            setTranscript("");
                            setInterimTranscript("");

                            toast.info("Recording deleted.");
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </>
          ) : (
            <p className="text-gray-600">No CV/LSV files available.</p>
          )}
        </div>
      </div>
    </div>
  );

};
export default ExperimentDetailedViewer;
