import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const Consent = () => {
  const navigate = useNavigate();

const [consent, setConsent] = useState({
  all: false,
  participate: false,
  audio: false,
  ai: false,
  publish: false,
  privacy: false,
  author: false,
});
  const allChecked =
    consent.participate &&
    consent.audio &&
    consent.ai &&
    consent.publish &&
    consent.privacy;

const handleChange = (e) => {
  const { name, checked } = e.target;

  // Handle "Accept All"
  if (name === "all") {
    setConsent({
      ...consent,
      all: checked,
      participate: checked,
      audio: checked,
      ai: checked,
      publish: checked,
      privacy: checked,
      // keep author optional
      author: consent.author,
    });

    return;
  }

  // Normal checkbox handling
  const updatedConsent = {
    ...consent,
    [name]: checked,
  };

  // Automatically update "all"
  updatedConsent.all =
    updatedConsent.participate &&
    updatedConsent.audio &&
    updatedConsent.ai &&
    updatedConsent.publish &&
    updatedConsent.privacy;

  setConsent(updatedConsent);
};

  const handleStart = async () => {
  const timestamp = new Date().toISOString();

  const payload = {
    ...consent,
    timestamp,
  };

  try {
    const response = await fetch("/api/consent/", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log("Consent saved:", data);

    localStorage.setItem(
      "virtual_user_id",
      data.virtual_user_id
    );

    navigate("/start");

  } catch (error) {
    console.error("Error saving consent:", error);
  }
};
  return (
    <div className="max-w-4xl mx-auto pt-28 px-6 text-gray-800 leading-relaxed">

      <h1 className="text-3xl font-bold text-orange-700 mb-6">
        Consent for Participation – Virtual Electrochemist
      </h1>

      {/* Explicit Consent */}
      <p className="font-semibold bg-orange-50 p-4 rounded-lg border border-orange-100">
        By selecting the options below, you give your explicit consent to the processing
        of your personal data for the purposes of this scientific research project
        in accordance with the GDPR.
      </p>

      {/* 1 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">1. Project Description</h2>
      <p>
        The “Virtual Electrochemist” project collects spoken descriptions of cyclic
        and linear sweep voltammograms to create a benchmark dataset and develop
        AI-based models for electrochemical analysis.
      </p>

      {/* 2 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">2. Data Collected</h2>
      <ul className="list-disc ml-6">
        <li>Audio recordings (voice data)</li>
        <li>Transcribed text</li>
        <li>Scientific descriptions</li>
        <li>Optional: name and contact details (for authorship)</li>
      </ul>

      {/* 3 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">3. Processing of Data</h2>
      <ul className="list-disc ml-6">
        <li>Audio recordings are securely stored and transcribed</li>
        <li>Audio may be deleted after transcription</li>
        <li>Text data is used for research and AI model development</li>
      </ul>

      {/* 4 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">4. Data Usage</h2>
      <ul className="list-disc ml-6">
        <li>Scientific research and publications</li>
        <li>AI/LLM-based analysis</li>
        <li>Publication in anonymized or attributed form</li>
      </ul>

      {/* 5 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">5. Data Sharing</h2>
      <ul className="list-disc ml-6">
        <li>Authorized project researchers</li>
        <li>Scientific collaborators</li>
        <li>Publishers (in anonymized form)</li>
      </ul>

      {/* 6 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">6. Data Storage</h2>
      <p>
        Audio recordings are stored until transcription or withdrawal.
        Transcriptions may be stored for up to 10 years for research documentation.
      </p>

      {/* 7 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">7. Data Protection Measures</h2>
      <p>
        Personal data will be pseudonymized as early as possible.
        Identifying information is stored separately and securely.
        Only data necessary for the research purposes will be collected and processed.
        Appropriate technical and organizational measures are implemented to ensure data security.
      </p>

      {/* 8 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">8. Voluntary Participation</h2>
      <p>
        Participation is voluntary. Refusal or withdrawal of consent will not result
        in any disadvantages.
      </p>
      <p className="mt-2">
        You may withdraw your consent at any time by contacting:
        doaa.mohamed@ruhr-uni-bochum.de or markus.stricker@ruhr-uni-bochum.de.

        Withdrawal applies only to future processing and does not affect already
        anonymized or published data.
      </p>

      {/* 9 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">9. Legal Basis</h2>
      <ul className="list-disc ml-6">
        <li>Art. 6(1)(a) GDPR (consent)</li>
        <li>Art. 9(2)(a) GDPR (explicit consent for voice data)</li>
        <li>§17 DSG NRW (scientific research)</li>
      </ul>

      {/* 10 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">10. Your Rights</h2>
      <p>
        You have the right to access, rectify, delete, or restrict the processing
        of your personal data.
      </p>
      {/* 10b */}
      <h2 className="text-xl font-semibold mt-6 mb-2">11. Complaint</h2>
      <p>
        You have the right to lodge a complaint with the supervisory authority:
      </p>
      <p className="mt-2">
        State Commissioner for Data Protection and Freedom of Information North Rhine-Westphalia <br />
        <a
          href="https://www.ldi.nrw.de"
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-600 underline"
        >
          https://www.ldi.nrw.de
        </a>
      </p>
      {/* 11 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">11. Responsible Entity</h2>
      <p>
        <strong>Ruhr University Bochum</strong><br />
        Universitätsstraße 150<br />
        44801 Bochum, Germany
      </p>

      {/* 12 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">12. Data Protection Officer</h2>
      <p>
        Dr. Kai-Uwe Loser<br />
        dsb@rub.de
      </p>

      {/* Privacy link */}
      <p className="mt-4 text-sm">
        Please read our{" "}
        <Link to="/privacy" className="text-orange-600 underline">
          Privacy Policy
        </Link>{" "}
        before giving consent.
      </p>

      {/* Checkboxes */}
<div className="mt-8 bg-orange-50 p-5 rounded-xl border border-orange-100 space-y-4">

  {/* Accept All */}
  <label className="flex items-center space-x-2 border-b pb-4 mb-2">
    <input
      type="checkbox"
      name="all"
      checked={consent.all}
      onChange={handleChange}
    />
    <span className="font-semibold">
      I confirm all required consents
    </span>
  </label>

  <label className="flex items-center space-x-2">
    <input
      type="checkbox"
      name="privacy"
      checked={consent.privacy}
      onChange={handleChange}
    />
    <span>
      I have read and understood the Privacy Policy and agree to the processing of my data
    </span>
  </label>

  <label className="flex items-center space-x-2">
    <input
      type="checkbox"
      name="participate"
      checked={consent.participate}
      onChange={handleChange}
    />
    <span>I agree to participate in this research project</span>
  </label>

  <label className="flex items-center space-x-2">
    <input
      type="checkbox"
      name="audio"
      checked={consent.audio}
      onChange={handleChange}
    />
    <span>
      I explicitly consent to the processing of my voice data
      (audio recording), which may be considered biometric data under GDPR
    </span>
  </label>

  <label className="flex items-center space-x-2">
    <input
      type="checkbox"
      name="ai"
      checked={consent.ai}
      onChange={handleChange}
    />
    <span>
      I agree that my data may be processed using AI/LLM systems
    </span>
  </label>

  <label className="flex items-center space-x-2">
    <input
      type="checkbox"
      name="publish"
      checked={consent.publish}
      onChange={handleChange}
    />
    <span>
      I agree that my contribution may be published in anonymized or attributed form
    </span>
  </label>

  {/* Optional */}
  <label className="flex items-center space-x-2">
    <input
      type="checkbox"
      name="author"
      checked={consent.author}
      onChange={handleChange}
    />
    <span>
      I agree to be named as an author (optional)
    </span>
  </label>

</div>

      {/* Button */}
      <button
        disabled={!allChecked}
        onClick={handleStart}
        className={`mt-6 px-6 py-3 rounded-full text-white ${allChecked ? "bg-orange-600" : "bg-gray-400"
          }`}
      >
        Continue to Recording
      </button>

    </div>
  );
};

export default Consent;