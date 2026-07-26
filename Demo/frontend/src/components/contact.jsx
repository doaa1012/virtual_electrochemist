import React, { useState } from "react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
});

const [loading, setLoading] = useState(false);
const handleChange = (e) => {
    setFormData({
        ...formData,
        [e.target.name]: e.target.value,
    });
};
const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
        const response = await fetch(
            "http://localhost:8001/api/contact/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Something went wrong.");
        }

        alert("Message sent successfully!");

        setFormData({
            name: "",
            email: "",
            subject: "",
            message: "",
        });

    } catch (err) {
        alert(err.message);
    }

    setLoading(false);
};
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-rose-50 text-gray-800 font-sans pt-24 px-6 flex flex-col items-center">
      <h2 className="text-4xl font-extrabold text-orange-700 mb-6">
        Contact Us
      </h2>
      <p className="text-lg text-gray-700 mb-10 text-center max-w-xl">
        Have questions, suggestions, or collaboration ideas? We'd love to hear from you.
      </p>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-md border border-orange-100 w-full max-w-lg">
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-600 mb-2">
              Subject
          </label>

          <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
              required
          />
      </div>
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-600 mb-2">Name</label>
          <input type="text"  name="name" value={formData.name}  onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
            required
            />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
          <input type="email"  name="email" value={formData.email}  onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
            required
            />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-600 mb-2">Message</label>
          <textarea  name="message" value={formData.message}  onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-400 h-28" />
        </div>

       <button
          type="submit"
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-full font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
      >
          {loading ? "Sending..." : "Send Message"}
      </button>
      </form>
    </div>
  );
};

export default Contact;

