import React, { useState } from "react";
import { config } from "../config";
import { useLocation, useNavigate } from "react-router-dom";
const ExperimentDataUpload = () => {
  const location = useLocation();
  const metadataId = location.state?.metadataId;
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    const selected = [...e.target.files];

    //  Prevent multiple ZIP files
    const zipCount = selected.filter(f => f.name.toLowerCase().endsWith(".zip")).length;

    if (zipCount > 1) {
      setMessage("Only one ZIP file is allowed.");
      return;
    }

    setFiles(selected);
  };

  const handleUpload = async () => {
    if (!metadataId) {
      setMessage("⚠ No metadata ID found. Please create metadata first.");
      return;
    }

    if (files.length === 0) {
      setMessage("Please select files.");
      return;
    }

    const formData = new FormData();
    formData.append("metadata_id", metadataId);

    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const res = await fetch(`${config.BASE_URL}experiment/upload/`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Upload successful!");
        setTimeout(() => {
          navigate("/");
        }, 1200);
      } else {
        setMessage("Upload failed: " + data.error);
      }

    } catch (err) {
      console.error(err);
      setMessage("Server error.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-rose-50 text-gray-800 pt-28 px-6 flex flex-col items-center">
      <div className="max-w-xl w-full p-8 bg-white shadow-lg rounded-2xl border border-orange-200">

        <h2 className="text-3xl font-extrabold text-orange-700 mb-4 text-center">
          Upload Experiment Data
        </h2>

        <p className="text-gray-600 text-center mb-6">
          Upload ONE zip or individual data files (.txt, .dat, .csv, .xlsx).
        </p>

        <input
          type="file"
          accept=".zip,.dat,.txt,.csv,.xlsx"
          multiple
          onChange={handleFileChange}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 bg-white"
        />

        <button
          onClick={handleUpload}
          className="w-full bg-orange-600 text-white p-3 rounded-lg shadow hover:bg-orange-700 transition font-semibold"
        >
          Upload
        </button>

        {message && (
          <div className="mt-4 p-3 text-center border rounded-lg font-medium bg-blue-50 text-blue-700 border-blue-300">
            {message}
          </div>
        )}

      </div>
    </div>
  );
};

export default ExperimentDataUpload;

