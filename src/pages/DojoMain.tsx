import React, { useEffect, useState } from "react";
import { getAllDojos, getDojoById } from "../api/dojoApi";
import { Dojo } from "../../backend/models/dojo.js";

const MainPage: React.FC = () => {
  const [dojos, setDojos] = useState<Dojo[]>([]);
  const [selectedDojoId, setSelectedDojoId] = useState<string>("");
  const [dojoDetails, setDojoDetails] = useState<Dojo | null>(null);

  useEffect(() => {
    // Fetch all dojos on mount
    getDojos().then(setDojos);
  }, []);

  useEffect(() => {
    if (selectedDojoId) {
      getDojoDetails(selectedDojoId).then(setDojoDetails);
    } else {
      setDojoDetails(null);
    }
  }, [selectedDojoId]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dojo Information</h1>
      <div className="mb-6">
        <label className="block mb-2 font-semibold" htmlFor="dojo-select">
          Select a Dojo:
        </label>
        <select
          id="dojo-select"
          className="w-full border p-2 rounded"
          value={selectedDojoId}
          onChange={(e) => setSelectedDojoId(e.target.value)}
        >
          <option value="">-- Choose a Dojo --</option>
          {dojos.map((dojo) => (
            <option key={dojo._id} value={dojo._id}>
              {dojo.name}
            </option>
          ))}
        </select>
      </div>

      {dojoDetails && (
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-2xl font-semibold mb-2">{dojoDetails.name}</h2>
          <p className="mb-2">
            <span className="font-semibold">Location:</span> {dojoDetails.location}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Instructor:</span> {dojoDetails.instructorName}
          </p>
          <p className="mb-4">
            <span className="font-semibold">Contact:</span> {dojoDetails.contactEmail}
          </p>
          <h3 className="text-xl font-bold mb-2">Students</h3>
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border">Name</th>
                <th className="py-2 px-4 border">Grade</th>
                <th className="py-2 px-4 border">Active</th>
              </tr>
            </thead>
            <tbody>
              {dojoDetails.students && dojoDetails.students.length > 0 ? (
                dojoDetails.students.map((student: Student) => (
                  <tr key={student._id}>
                    <td className="py-2 px-4 border">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="py-2 px-4 border">
                      {student.gradeId?.name || "N/A"}
                    </td>
                    <td className="py-2 px-4 border">
                      {student.active ? "Yes" : "No"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-2 px-4 border" colSpan={3}>
                    No students found for this dojo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MainPage;