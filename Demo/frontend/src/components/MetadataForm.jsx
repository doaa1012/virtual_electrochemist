import React, { useState, useEffect } from "react";
import { config } from "../config";
import { useNavigate } from "react-router-dom";


const MetadataForm = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState({ text: "", type: "" });
  const [participant, setParticipant] = useState(null);

const [restore, setRestore] = useState({
    participant_id:"",
    recovery_key:""
});
  const [form, setForm] = useState({
    intended_reaction: "",
    catalyst_id: "",
    catalyst_composition: "",
    electrode_material: "",
    electrode_area: "",
    catalyst_loading: "",
    catalyst_morphology: "",
    catalyst_structure: "",
    electrolyte: "",
    nitrogen_purging_time: "",
    electrolyte_pH: "",
    temperature: "",
    reference_electrode: "",
    scan_rate: "",
    cycles: "",
    potential_range: "",
    ir_compensation: "",
    rhe_conversion: "",
    initial_conditioning: "",
    current_density_reported: "",
    forward_scan_note: "",
    triplicate_measurements: "",
    reference_electrode_testing: "",
    article_doi: "",
    article_link: "",
  });

  const [uploading, setUploading] = useState(false);

  const showMessage = (text, type = "info") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };
useEffect(()=>{

loadParticipant();
},[]);
const loadParticipant = async () => {

    try{

        const res = await fetch(

            "/api/virtualuser/",
            {
                credentials:"include"
            }

        );


        if(res.ok){

            const data = await res.json();

            console.log("participant",data);


            setParticipant(data);


            setRestore({

                participant_id:
                    data.participant_id || "",

                recovery_key:
                    data.recovery_key || ""

            });

        }

        else{

            setParticipant(null);

        }

    }

    catch(err){

        console.log(err);

    }

}
const handleChange = (e) => {
  const { name, value } = e.target;

  setForm((prev) => ({
    ...prev,
    [name]: value,
  }));
};
  // -------------------------------
  // UPLOAD + AUTO-FILL METADATA
  // -------------------------------
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
 const res = await fetch(`${config.BASE_URL}api/metadata/extract/`, {
  method: "POST",
  credentials: "include",
  body: formData,
});

      const data = await res.json();

      if (res.ok) {
        setForm((prev) => ({ ...prev, ...data }));
        showMessage("Metadata extracted successfully!", "success");
      } else {
        showMessage(data.error || "Failed to extract metadata", "error");
      }
    } catch (err) {
      console.error("Upload error:", err);
      showMessage("Server error while uploading metadata", "error");
    }

    setUploading(false);
  };

  // -------------------------------
  // SAVE METADATA + REDIRECT
  // -------------------------------
  const handleSubmit = async (e) => {

    e.preventDefault();

const payload = {

    ...form,

    participant_id:
        restore.participant_id || null,

    recovery_key:
        restore.recovery_key || null

};
    try {
        const res = await fetch(

            `${config.BASE_URL}api/metadata/create/`,

            {

                method: "POST",

                credentials: "include",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify(payload)
            }
        );
        let data;


        try {

            data = await res.json();

        }

        catch {

            showMessage(

                "Server returned invalid response",

                "error"

            );

            return;

        }



        if (

            res.ok &&

            data.status === "success"

        ) {
            showMessage(
                "Metadata saved successfully!",
                "success"
            );
            setTimeout(() => {

                navigate(

                    `/upload/${data.id}`
                );
            }, 800);

        }
        else {
            showMessage(
                data.message ||
                "Error saving metadata",
                "error"
            );
        }
    }
    catch (err) {
        console.error(err);
        showMessage(
            "Server error while saving metadata",
            "error"
        );
    }
};

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-rose-50 text-gray-800 pt-28 px-6 flex flex-col items-center">
      <div className="max-w-6xl w-full p-10 bg-white shadow-lg rounded-2xl border border-orange-200">

        <h2 className="text-4xl font-extrabold text-orange-700 mb-3 text-center">
          Experiment Metadata
        </h2>
<div className="bg-orange-50 p-5 rounded-xl mb-6">

<div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8">

    <h3 className="text-lg font-semibold text-slate-800 mb-2">
        Participant Credentials
    </h3>

    <p className="text-sm text-slate-500 mb-5">
        Loaded automatically from your current browser session.
        You may edit them manually if you want to associate this
        experiment with another participant.
    </p>


    <div className="grid md:grid-cols-2 gap-4">

        <div>

            <label className="block text-sm font-medium mb-2">
                Participant ID
            </label>

            <input
                value={restore.participant_id}
                onChange={(e)=>
                    setRestore(prev=>({
                        ...prev,
                        participant_id:e.target.value
                    }))
                }
                placeholder="VE-XXXXXXXX"
                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400"
            />

        </div>



        <div>

            <label className="block text-sm font-medium mb-2">
                Recovery Key
            </label>

            <input
                value={restore.recovery_key}
                onChange={(e)=>
                    setRestore(prev=>({
                        ...prev,
                        recovery_key:e.target.value
                    }))
                }
                placeholder="Recovery Key"
                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400"
            />

        </div>

    </div>


    {participant && (

        <div className="mt-5 bg-green-50 border border-green-200 rounded-xl p-4">

            <p className="text-green-700 text-sm">

                ✓ Credentials loaded from current session

            </p>

        </div>

    )}

</div>
</div>
        <p className="text-gray-600 text-center mb-6">
          Upload metadata from Excel or enter values manually.
        </p>

        {/* MESSAGE BOX */}
        {message.text && (
          <div
            className={`mb-6 p-3 rounded-lg text-center font-medium transition-all ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-300"
                : message.type === "error"
                ? "bg-red-50 text-red-700 border border-red-300"
                : "bg-blue-50 text-blue-700 border border-blue-300"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* UPLOAD SECTION */}
        <div className="w-full mb-10">
          <label className="block font-semibold text-orange-700 mb-2">
            Upload Metadata Excel (.xlsx)
          </label>

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            disabled={uploading}
            className="block w-full border border-gray-300 p-3 rounded-lg bg-white cursor-pointer"
          />

          {uploading && (
            <p className="text-sm text-gray-500 mt-2 animate-pulse">
              Extracting metadata…
            </p>
          )}
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.keys(form).map((key) => (
            <div key={key} className="flex flex-col">
              <label className="text-sm font-semibold text-orange-700 mb-1">
                {key.replace(/_/g, " ").toUpperCase()}
              </label>

              <input
                type="text"
                name={key}
                value={form[key] || ""}
                onChange={handleChange}
                className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
          ))}

          <button
            type="submit"
            className="col-span-full bg-orange-600 text-white px-6 py-3 rounded-lg shadow hover:bg-orange-700 transition"
          >
            Save Metadata
          </button>
        </form>
      </div>
    </div>
  );
};

export default MetadataForm;
