// src/components/LogoHeader.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const LogoHeader = () => {
  const navigate = useNavigate();

  return (
    <div
      className="flex items-center justify-center gap-4 py-6 cursor-pointer"
      onClick={() => navigate("/")}
    >
      <img
        src={logo}
        alt="Virtual Electrochemist Logo"
        className="w-16 h-16 md:w-20 md:h-20 drop-shadow-lg transition-transform duration-300 hover:scale-105"
      />
    
    </div>
  );
};

export default LogoHeader;


