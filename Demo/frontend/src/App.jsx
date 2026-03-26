import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import Home from "./components/Home";
import Start from "./components/Start";
import ExperimentDataUpload from "./components/UploadPage";
import ExperimentDetailedViewer from "./components/ExperimentDetailedViewer";
import Contact from "./components/contact";
import MetadataForm from "./components/MetadataForm";

const App = () => {
  return (
    <Router>
      {/* Add top padding so content is not hidden under navbar */}
      <div className="min-h-screen font-sans pt-24">

        {/* Navbar */}
        <nav className="flex items-center justify-between px-8 py-4 bg-white/90 shadow-md border-b border-orange-100 fixed top-0 left-0 w-full z-50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <img src="/src/assets/logo.png" alt="Logo" className="w-15 h-15" />
            <h1 className="text-2xl font-bold text-orange-600">
              Virtual Electrochemist
            </h1>
          </div>

          <ul className="hidden sm:flex gap-6 text-gray-700 font-medium">
            <li>
              <Link to="/" className="hover:text-orange-600 transition-colors">
                Home
              </Link>
            </li>

            <li>
              <Link to="/metadata" className="hover:text-orange-600 transition-colors">
                Add Experiment Metadata
              </Link>
            </li>

            <li>
              <Link to="/contact" className="hover:text-orange-600 transition-colors">
                Contact
              </Link>
            </li>
          </ul>
        </nav>

        {/* Page Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/start" element={<Start />} />
          <Route path="/upload/:metadataId" element={<ExperimentDataUpload />} />
          {/* Experiment Viewer */}
          <Route path="/experiment" element={<ExperimentDetailedViewer />} />
          <Route path="/experiment/:id" element={<ExperimentDetailedViewer />} />

          <Route path="/metadata" element={<MetadataForm />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>

      </div>
    </Router>
  );
};

export default App;

