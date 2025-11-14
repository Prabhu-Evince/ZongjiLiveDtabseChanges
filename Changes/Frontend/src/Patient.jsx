import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";

const API_URL = "http://localhost:5000";
const socket = io(API_URL);

export default function PatientPage() {
  const [patients, setPatients] = useState([]);
  const [email, setEmail] = useState("");
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchPatients = async (hospitalId) => {
    if (!hospitalId) return;
    try {
      const res = await fetch(`${API_URL}/api/patients?hospitalId=${hospitalId}`);
      const data = await res.json();
      setPatients(data);
    } catch (err) {
      console.error("Error fetching patients:", err);
    }
  };

  const handleLogin = async () => {
    if (!email.trim()) return alert("Enter email");

    try {
      const res = await fetch(`${API_URL}/api/user/exists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.exists) return alert("Email not registered!");

      setUser(data.user);
      setIsAuthenticated(true);
      socket.emit("joinHospital", data.user.hospitalId);
      fetchPatients(data.user.hospitalId);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  useEffect(() => {
    socket.on("dbChange", ({ module, operation, data }) => {
      if (module !== "patients") return;
      if (!user || data.hospitalId != user.hospitalId) return;

      toast.success(`${operation.toUpperCase()} in ${module}`);
      fetchPatients(user.hospitalId);
    });

    return () => socket.off("dbChange");
  }, [user]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100 p-6">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full">
          <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Login</h2>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 px-4 py-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="Enter email"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition duration-200 font-semibold"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">🏥 Patients</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-green-100 text-green-800">
            <tr>
              <th className="text-left py-3 px-6 uppercase font-medium text-sm">ID</th>
              <th className="text-left py-3 px-6 uppercase font-medium text-sm">Name</th>
              <th className="text-left py-3 px-6 uppercase font-medium text-sm">Status</th>
            </tr>
          </thead>
          <tbody>
            {patients.length > 0 ? (
              patients.map((p) => (
                <tr
                  key={p.id}
                  className="border-b hover:bg-green-50 transition duration-150"
                >
                  <td className="py-4 px-6">{p.id}</td>
                  <td className="py-4 px-6 font-medium text-gray-700">{p.name}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        p.status === "active"
                          ? "bg-green-200 text-green-800"
                          : "bg-red-200 text-red-800"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center py-6 text-gray-500">
                  No patients found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
