import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

const Consent = () => {

  const navigate = useNavigate();
const [alreadyConsented, setAlreadyConsented] = useState(false);
  const [consent, setConsent] = useState({
    all: false,
    privacy: false,
    participate: false,
    audio: false,
    author: false
  });
  useEffect(()=>{

loadParticipant();

},[]);



const loadParticipant = async()=>{


try{


const res = await fetch(

"/api/virtualuser/",

{
credentials:"include"
}
);

if (res.ok) {
  const data = await res.json();

  if (data.participant_id) {
    setCredentials(data);
    setAlreadyConsented(true);

    setConsent({
      all: true,
      privacy: true,
      participate: true,
      audio: true,
      author: data.author_consent || false,
    });
  }
}
}
catch(err){
console.log(err);}}
  const [credentials,setCredentials]=useState(null);
  const [error, setError] = useState("");

  const allChecked =
    consent.privacy &&
    consent.participate &&
    consent.audio;

  const handleChange = (e) => {

    const { name, checked } = e.target;


    // Accept all required consents
    if (name === "all") {

      setConsent(prev => ({

        ...prev,

        all: checked,

        privacy: checked,

        participate: checked,

        audio: checked,

        // keep optional checkbox untouched
        author: prev.author

      }));

      return;
    }

    // Normal checkbox handling
    const updatedConsent = {

      ...consent,

      [name]: checked

    };


    updatedConsent.all =

      updatedConsent.privacy &&

      updatedConsent.participate &&

      updatedConsent.audio;


    setConsent(updatedConsent);};

  const handleStart = async () => {
    setError("");
    const payload = {
      privacy: consent.privacy,

      participate: consent.participate,

      audio: consent.audio,

      author: consent.author,

      timestamp: new Date().toISOString()

    };
    try {


      const response = await fetch(

        "/api/consent/",

        {

          method: "POST",

          credentials: "include",

          headers: {

            "Content-Type": "application/json"

          },

          body: JSON.stringify(payload)

        }

      );



      const data = await response.json();



      if (!response.ok) {

        throw new Error(

          data.error ||

          "Consent submission failed"

        );

      }
      console.log(
        "Consent saved",
        data
      );

setCredentials({
participant_id:data.participant_id,
recovery_key:data.recovery_key,
name:data.name,
affiliation:data.affiliation,
email:data.email
});
toast.success(
"Consent saved successfully"
);

    }

    catch (err) {

      console.error(err);

      setError(

        err.message ||

        "Unable to save consent"

      );

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
        The “Virtual Electrochemist” project hosted on this website
        collects audio recordings of spoken narrative descriptions
        of cyclic voltammograms to develop standardized descriptors
        based on expert narrative for electrochemical characterization.
      </p>

      {/* 2 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">2. Data Collected</h2>
      <ul className="list-disc ml-6">
        <li>Audio recording of your voice</li>
        <li>Transcribed text</li>
        <li>Optional: name and contact details (for authorship)</li>
      </ul>

      {/* 3 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">
        3. Processing of Data
      </h2>
      <ul className="list-disc ml-6 space-y-1">

        <li>Audio recordings are stored securely</li>

        <li>Recordings are converted into text</li>

        <li>Audio recordings will be deleted after transcription</li>

        <li>
          Transcribed text is used for scientific research
        </li>

        <li>
          Transcribed text may be analyzed using AI-based methods, including Large Language Models (LLMs).
        </li>

        <li>
          Transcribed text may be published in anonymized or attributed form, depending on the participant's choice.
        </li>

      </ul>



      {/* 4 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">4. Data Sharing</h2>
      <ul className="list-disc ml-6">
        <li>
          Raw data (voice recordings) may be shared with researchers in the Collaborative Research Centre 1625
        </li>

        <li>
          Anonymized transcriptions may be shared with scientific collaborators
        </li>

        <li>
          Anonymized transcriptions may be shared with publishers
        </li>

        <li>
          Anonymized transcriptions may be deposited in repositories under a CC-BY-SA 4.0 license
        </li>
      </ul>



      {/* 5 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">5. Voluntary Participation</h2>
      <p className="text-sm">

      You may withdraw your consent at any time without giving reasons.

      Withdrawal applies only to future processing and does not affect data already processed in anonymized form or included in scientific results.

      </p>

      <ul className="list-disc ml-6 mt-2">

        <li>
          Already published or anonymized data will not be removed.
        </li>
      </ul>

      <p className="mt-3">
        To withdraw your consent, please contact:

        <br />

        <a
          href="mailto:crc1625@rub.de"
          className="text-orange-600 underline"
        >
          crc1625@rub.de

        </a>
      </p>

      <p>
        Providing data is voluntary.
        Refusal or withdrawal has no disadvantages.
      </p>

      {/* 6 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">6. Legal Basis</h2>
      <ul className="list-disc ml-6">
        <li>Art. 6(1)(a) GDPR</li>
        <li>§17 DSG NRW</li>
        <li>Art. 9(2)(a) GDPR (explicit consent)</li>
      </ul>

      {/* 7 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">7. Your Rights</h2>
      <p>
        You have the right to access, rectify, erase, or restrict the processing of your personal data in accordance with applicable data protection laws.
      </p>

      <p>
        You also have the right to lodge a complaint with the competent data protection supervisory authority.
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
      {/* 8 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">8. Responsible Entity</h2>
      <p>
        <strong>Ruhr University Bochum</strong><br />
        Universitätsstraße 150<br />
        44801 Bochum, Germany
      </p>

      {/* 9 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">9. Data Protection Officer</h2>
      <p>
        Dr. Kai-Uwe Loser<br />
        <a
          href="mailto:kai-uwe.loser@ruhr-uni-bochum.de"
          className="text-orange-600 underline"
        >

          kai-uwe.loser@ruhr-uni-bochum.de

        </a>
      </p>



      {/* Privacy link */}
      <p className="mt-4 text-sm">
        Please read our{" "}
        <Link to="/privacy" className="text-orange-600 underline">
          Privacy Policy
        </Link>{" "}
        before giving consent.
      </p>
{alreadyConsented && (
  <div className="mt-6 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4">
    You already completed consent for this browser session.
    Your existing participant credentials are shown below.
    You do not need to confirm consent again.
  </div>
)}
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
            I have read and understood the Privacy Policy and agree to participate in the project.
          </span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="participate"
            checked={consent.participate}
            onChange={handleChange}
          />
          <span>
            I understand that my data may be used for scientific analysis
            (including AI methods) and that my contribution may be
            published anonymously or in attributed form,
            depending on my choice.
          </span>
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
            (audio recording), which may constitute biometric or
            personally identifiable data under GDPR.
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
{/* Button */}
{!credentials && (

<button
disabled={!allChecked}
onClick={handleStart}
className={`
mt-6
px-6
py-3
rounded-full
text-white
transition-colors

${
allChecked
?
"bg-orange-600 hover:bg-orange-700"
:
"bg-gray-400 cursor-not-allowed"
}

`}
>
Continue to Recording
</button>
)}
{/* Error Message */}
{error && (

    <div className="mt-4 text-red-600">

        {error}

    </div>

)}
{/* Credentials */}

{credentials && (

<div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6">

<h2 className="text-xl font-bold text-green-700 mb-4">

Participant Credentials

</h2>

<div className="mt-4 p-4 rounded-xl bg-yellow-50 border border-yellow-200">

⚠️ Save these credentials carefully.

We cannot recover your recovery key.

You need them to restore sessions,
export data,
withdraw consent,
and request deletion.

</div>

<label className="font-semibold block mb-1">

Participant ID

</label>

<input

readOnly

value={credentials.participant_id}

className="w-full border rounded-xl p-3 bg-white mb-4"

/>




<label className="font-semibold block mb-1">

Recovery Key

</label>

<textarea

readOnly

rows={3}

value={credentials.recovery_key}

className="w-full border rounded-xl p-3 bg-white mb-4"

/>




<div className="flex gap-3">


<button

onClick={()=>{

navigator.clipboard.writeText(

`Participant ID:
${credentials.participant_id}

Recovery Key:
${credentials.recovery_key}`

);

toast.success(
"Credentials copied"
);

}}

className="px-5 py-2 rounded-full border border-green-600 text-green-700"

>

Copy Credentials


</button>

<button

onClick={()=>{

navigate("/start");
}}
className="px-5 py-2 rounded-full bg-orange-600 text-white"
>
Continue to Start Page

</button>

</div>

</div>

)}

    </div>
  );
};

export default Consent;