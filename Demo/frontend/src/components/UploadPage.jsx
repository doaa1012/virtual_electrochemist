import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";


const ExperimentDataUpload = () => {
  const { metadataId } = useParams();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const handleFileChange = (e) => {

    const selected = e.target.files[0];

    if (!selected) return;

    setFile(selected);

};
const handleUpload = async () => {

  if (!metadataId) {
    setMessage(
      "No metadata ID found. Please create metadata first."
    );
    return;
  }

if (!file) {

    setMessage("Please select a file.");

    return;

}

  const formData = new FormData();

  formData.append(
    "metadata_id",
    metadataId
  );

formData.append("files", file);
  try {
const res = await fetch("/api/experiment/upload/", {
  method: "POST",
  credentials: "include",
  body: formData,
});

    console.log(
      "Status:",
      res.status
    );

    console.log(
      "Content-Type:",
      res.headers.get("content-type")
    );


    // Read body ONCE
    const text = await res.text();

    console.log(
      "Raw response:",
      text
    );


    let data = {};

    try {

      data = text
        ? JSON.parse(text)
        : {};

    }

    catch {

      setMessage(
        `Server returned an invalid response (${res.status}).`
      );

      return;
    }


    if (res.ok) {

      setMessage(
        "Upload successful!"
      );

      setTimeout(() => {

        navigate(
          `/experiment/${metadataId}`
        );

      }, 1200);

    }

    else {

      setMessage(

        data.error ||

        data.message ||

        `Upload failed (${res.status})`

      );

    }

  }

  catch (err) {

    console.error(
      "Upload error:",
      err
    );

    setMessage(
      "Server error."
    );

  }

};
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-rose-50 text-gray-800 pt-28 px-6 flex flex-col items-center">
      <div className="max-w-xl w-full p-8 bg-white shadow-lg rounded-2xl border border-orange-200">

        <h2 className="text-3xl font-extrabold text-orange-700 mb-4 text-center">
          Upload Experiment Data
        </h2>

        <p className="text-gray-600 text-center mb-6">
          Each experiment consists of one metadata record and one data file.
        </p>

<input
    type="file"
    accept=".dat,.txt,.csv,.xlsx"
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

