import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto pt-28 px-6 text-gray-800 leading-relaxed">

      <h1 className="text-3xl font-bold text-orange-700 mb-6">
        Privacy Policy – Virtual Electrochemist
      </h1>

      {/* 1 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">1. General Information</h2>
      <p>
        This website is part of the research project “Virtual Electrochemist”.
        We take the protection of your personal data seriously and process your data
        in accordance with the General Data Protection Regulation (GDPR) and
        applicable national data protection laws, including §17 DSG NRW.
      </p>

      {/* 2 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">2. Research Project Description</h2>
      <p>
        This project aims to create a benchmark of expert narrative descriptions
        of cyclic and linear sweep voltammograms, combined with metadata such as
        catalyst composition, electrode material, electrolyte, and scan parameters.
      </p>
      <p className="mt-2">
        The collected data will be used for scientific research, including the
        development of AI and large language models (LLMs) for automated
        interpretation and feature extraction of electrochemical data.
      </p>

      {/* 3 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">3. Responsible Entity</h2>
      <p>
        Ruhr University Bochum <br />
        Universitätsstraße 150 <br />
        44801 Bochum, Germany
      </p>

      {/* 4 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">4. Contact</h2>
      <p>
        Project Contact: <br />
        Doaa Mohamed / Markus Stricker <br />
        doaa.mohamed@ruhr-uni-bochum.de <br />
        markus.stricker@ruhr-uni-bochum.de
      </p>

      <p className="mt-3">
        <strong>Data Protection Officer:</strong><br />
        Dr. Kai-Uwe Loser <br />
        Email: dsb@rub.de <br />
        <a
          href="https://dsb.ruhr-uni-bochum.de/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-600 underline"
        >
          https://dsb.ruhr-uni-bochum.de/
        </a>
      </p>

      {/* 5 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">5. Categories of Data Processed</h2>

      <h3 className="font-semibold mt-4">a) Website Usage Data</h3>
      <ul className="list-disc ml-6">
        <li>IP address (anonymized where possible)</li>
        <li>Date and time of access</li>
        <li>Browser type and operating system</li>
      </ul>

      <h3 className="font-semibold mt-4">b) Voluntarily Provided Data</h3>
      <ul className="list-disc ml-6">
        <li>Audio recordings (voice data)</li>
        <li>Transcribed text</li>
        <li>Scientific descriptions</li>
        <li>Optional: name and contact details</li>
      </ul>

      {/* 6 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">6. Purpose of Processing</h2>
      <ul className="list-disc ml-6">
        <li>Scientific research in electrochemistry</li>
        <li>Development of narrative descriptors</li>
        <li>AI/LLM-based analysis and modeling</li>
        <li>Scientific publications and dissemination</li>
      </ul>

      {/* 7 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">7. Legal Basis</h2>
      <ul className="list-disc ml-6">
        <li>Art. 6(1)(a) GDPR (consent)</li>
        <li>Art. 9(2)(a) GDPR (explicit consent for voice data, if applicable)</li>
        <li>§17 DSG NRW (scientific research purposes)</li>
      </ul>

      {/* 8 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">8. Consent</h2>
      <p>
        Participation in this research project is voluntary. By providing data,
        you explicitly consent to its processing for the purposes described above.
      </p>
      <p className="mt-2">
        You may withdraw your consent at any time without giving reasons.
        Withdrawal applies only to future processing and does not affect data
        already processed in anonymized form or used in scientific results.
      </p>

      {/* 9 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">9. Data Minimization</h2>
      <p>
        Only data necessary for achieving the research objectives will be collected
        and processed, in accordance with the principle of data minimization.
      </p>

      {/* 10 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">10. Data Sharing</h2>
      <ul className="list-disc ml-6">
        <li>Authorized project researchers</li>
        <li>Scientific collaborators</li>
        <li>Publishers and research platforms (in anonymized form)</li>
      </ul>

      {/* 11 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">11. Data Transfers</h2>
      <p>
        If external service providers (e.g., cloud or AI services) are used,
        data processing will comply with GDPR requirements. Any transfer outside
        the European Union will be safeguarded by appropriate legal mechanisms.
      </p>

      {/* 12 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">12. Data Storage and Retention</h2>
      <ul className="list-disc ml-6">
        <li>Website data: stored temporarily for security purposes</li>
        <li>Audio recordings: stored until transcription or withdrawal</li>
        <li>Transcriptions: stored for research documentation (up to 10 years)</li>
      </ul>

      {/* 13 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">13. Pseudonymization and Anonymization</h2>
      <p>
        Personal data will be pseudonymized as early as possible.
        Identifying information will be stored separately and securely.
      </p>
      <p className="mt-2">
        Data will be anonymized when it is no longer necessary to identify
        individuals for research purposes.
      </p>

      {/* 14 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">14. Data Security</h2>
      <ul className="list-disc ml-6">
        <li>Access restricted to authorized personnel</li>
        <li>Secure storage on university systems</li>
        <li>Encryption and secure data transmission</li>
        <li>Regular review of security measures</li>
      </ul>

      {/* 15 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">15. Your Rights</h2>
      <ul className="list-disc ml-6">
        <li>Access (Art. 15 GDPR)</li>
        <li>Rectification (Art. 16 GDPR)</li>
        <li>Erasure (Art. 17 GDPR)</li>
        <li>Restriction of processing (Art. 18 GDPR)</li>
        <li>Data portability (Art. 20 GDPR)</li>
      </ul>

      {/* 16 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">16. Complaint</h2>
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

      {/* 17 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">17. Voluntary Nature</h2>
      <p>
        Providing personal data is voluntary. Refusal or withdrawal of consent
        will not result in any disadvantages.
      </p>

      {/* Footer */}
      <p className="mt-10 text-sm text-gray-500">
        Last updated: 07.05.2026
      </p>

    </div>
  );
};

export default PrivacyPolicy;