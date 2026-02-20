"use client";

import { createContext, useContext, useState } from "react";

const ProctorContext = createContext();

export function ProctorProvider({ children }) {
  const [activities, setActivities] = useState([]);

  const addActivity = (message) => {
    const newActivity = {
      id: Date.now() + Math.random(),
      message,
      time: new Date().toLocaleTimeString(),
    };

    setActivities((prev) => [newActivity, ...prev]);
  };

  return (
    <ProctorContext.Provider value={{ activities, addActivity }}>
      {children}
    </ProctorContext.Provider>
  );
}

export function useProctor() {
  return useContext(ProctorContext);
}
