import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";


/***************************************
* src/lib/api.ts - axios wrapper
***************************************/
import axios from "axios";


const API_BASE = process.env.VITE_API_BASE || "http://localhost:4000";


export const api = axios.create({ baseURL: `${API_BASE}/api` });


api.interceptors.request.use((config) => {
// Dev headers: attach role & club from localStorage (stub until real auth)
const role = localStorage.getItem("role") || undefined;
const clubId = localStorage.getItem("clubId") || undefined;
if (role) config.headers["x-role"] = role;
if (clubId) config.headers["x-club-id"] = clubId;
return config;
});