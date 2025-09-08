import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";


/***************************************
 * src/components/Input.tsx (tiny UI helpers)
 ***************************************/
export const Label: React.FC<{ htmlFor?: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-200 mb-1">{children}</label>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={[
      "w-full rounded-xl bg-gray-800/60 border border-gray-700 px-4 py-2 text-gray-100",
      "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
    ].join(" ")}
  />
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => (
  <button
    {...props}
    className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-2 transition disabled:opacity-50"
  >
    {children}
  </button>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select
    {...props}
    className="w-full rounded-xl bg-gray-800/60 border border-gray-700 px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
  />
);
