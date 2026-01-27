import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Start = () => {
  const [formData, setFormData] = useState({
    name: "",
    affiliation: "",
    email: "",
    consent: false,
  });

  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // ----------------------------------------------------
  // AUTO-LOGIN USING COOKIE-BASED SESSION (no localStorage)
  // ----------------------------------------------------
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(
          "http://127.0.0.1:8001/api/virtualuser/",
          { credentials: "include" }  // IMPORTANT
        );

        if (res.ok) {
          // user exists → check session state
          const sessionInfo = await fetch(
            "http://127.0.0.1:8001/api/session/status/",
            { credentials: "include" }
          );

          const info = await sessionInfo.json();

          if (info.session_saved) {
            navigate("/experiment");
            return;
          }
        }
      } catch (err) {
        console.error("Session check failed:", err);
      }

      setCheckingSession(false);
    };

    checkSession();
  }, [navigate]);

  // ----------------------------------------------------
  // CREATE NEW SESSION (cookie is set by backend)
  // ----------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.consent) {
      toast.error("Please agree to the consent terms before continuing.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8001/api/users/start/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // IMPORTANT
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setTimeout(() => navigate("/experiment"), 300);
      } else {
        console.error("Failed to start session");
        toast.error("Failed to start session. Please try again.");

      }
    } catch (error) {
      console.error("Network error:", error);
      toast.error("Network error. Please try again.");

    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex flex-col items-center justify-center pt-32 px-6">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-lg border border-orange-100 p-10">
        <h1 className="text-4xl font-bold text-center text-orange-600 mb-8">
          Participant Information
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Name */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Name <span className="text-sm text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-orange-200 rounded-xl shadow-sm"
            />
          </div>

          {/* Affiliation */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Affiliation <span className="text-sm text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              name="affiliation"
              value={formData.affiliation}
              onChange={handleChange}
              placeholder="e.g., Ruhr University Bochum"
              className="w-full px-4 py-2 border border-orange-200 rounded-xl shadow-sm"
            />
          </div>

          {/* Email — now optional */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Email <span className="text-sm text-gray-400">(optional)</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full px-4 py-2 border border-orange-200 rounded-xl shadow-sm"
            />
          </div>

          {/* Consent */}
          <div className="flex items-start space-x-3 mt-6 bg-orange-50 p-4 rounded-xl border border-orange-100">
            <input
              type="checkbox"
              name="consent"
              checked={formData.consent}
              onChange={handleChange}
              className="w-5 h-5 text-orange-600 border-orange-300 rounded"
            />
            <p className="text-sm text-gray-700 leading-relaxed">
              I consent to the collection and processing of data (cursor,
              handwriting, sound, audio/video recording, and transcription)
              for research and analysis purposes.
            </p>
          </div>

          <div className="text-center mt-10">
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-3 rounded-full font-semibold shadow-md"
            >
              Start
            </button>
          </div>
        </form>
      </div>

      <footer className="mt-10 text-gray-500 text-sm">
        © {new Date().getFullYear()}{" "}
        <span className="font-semibold text-gray-600">Virtual Electrochemist</span>
        — All Rights Reserved.
      </footer>
    </div>
  );
};

export default Start;
