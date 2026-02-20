"use client";

import { useProctor } from "../../context/ProctorContext";

export default function InterviewerPage() {
  const { activities } = useProctor();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      
      <h1 className="text-3xl font-bold text-center mb-8">
        Interviewer Dashboard
      </h1>

      <div className="bg-white border rounded-lg p-6 max-w-3xl mx-auto">

        <h2 className="text-xl font-semibold mb-4">
          Live Suspicious Activity Alerts
        </h2>

        {activities.length === 0 && (
          <p className="text-gray-500">
            No suspicious activity detected.
          </p>
        )}

        <ul className="space-y-3">
          {activities.map((activity) => (
            <li
              key={activity.id}
              className="bg-red-100 border border-red-400 text-red-700 p-3 rounded"
            >
              {activity.time} - {activity.message}
            </li>
          ))}
        </ul>

      </div>
    </div>
  );
}
