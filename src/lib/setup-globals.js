/* ============================================================
   setup-globals.js
   The TOOB design export was written for a plain-<script> page where
   React, ReactDOM and lucide live on `window`. Vite uses ES modules,
   so we re-expose those three as globals BEFORE any TOOB code runs.

   This file must be the very first import in main.jsx. ES modules
   execute in source order, so by importing it first we guarantee the
   globals exist before the vendor bundle and page scripts evaluate.
   ============================================================ */
import React from "react";
import { createRoot } from "react-dom/client";
import { createIcons, icons } from "lucide";

// The TOOB modules call bare `React.*` and `ReactDOM.createRoot(...)`.
window.React = React;
window.ReactDOM = { createRoot };

// Icon components render <i data-lucide="name"> then call
// window.lucide.createIcons() to swap them for SVGs after each render.
window.lucide = {
  icons,
  createIcons: (opts) => createIcons({ icons, ...(opts || {}) }),
};
