import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-rose-50 text-gray-800 font-sans">
      
      
      {/* Main Content */}
      <div className="pt-28 px-6 flex flex-col items-center text-center">
        
        {/* Hero Section */}
        <div className="max-w-3xl">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-orange-700 mb-6 leading-tight">
            Digital Platform for Electrochemical Research
          </h2>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            A collaborative research platform for collecting expert narrative descriptions
            of cyclic and linear sweep voltammograms (CV/LSV), enabling data-driven understanding
            and automated feature discovery in electrochemical analysis.
          </p>
          <button
            onClick={() => navigate("/start")}
            className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-full font-semibold shadow-md hover:shadow-lg transition-all"
          >
            Get Started
          </button>
        </div>

        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-20 w-full max-w-5xl">
          {/* About Card */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all border border-orange-100">
            <h2 className="text-2xl font-bold text-orange-800 mb-3 border-l-4 border-orange-500 pl-3">
              About
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              This project aims to create a benchmark of expert narrative descriptions
              of cyclic and linear sweep voltammograms, combined with detailed metadata
              such as catalyst composition, electrode material, electrolyte, and scan parameters.
            </p>
            <p className="mt-3 text-base text-gray-700 leading-relaxed">
              Future goals include a web interface for expert input, audio-to-text conversion,
              and applying LLM-based models for feature extraction and interpretation.
            </p>
          </div>

          {/* Example Card */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all border border-orange-100 flex flex-col items-center justify-between">
            <h2 className="text-2xl font-bold text-orange-800 mb-3 border-l-4 border-orange-500 pl-3">
              Example
            </h2>
            <div className="w-full h-44 flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 to-amber-100 text-orange-700 font-medium border border-orange-200 mb-5">
              🎥 Video Placeholder
            </div>
            
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 text-gray-500 text-sm">
          © {new Date().getFullYear()} Virtual Electrochemist — All Rights Reserved.
        </footer>
      </div>
    </div>
  );
};

export default Home;
