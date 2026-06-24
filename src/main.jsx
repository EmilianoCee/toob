/* ============================================================
   main.jsx — TOOB entry point.

   Import order matters. Each TOOB file is an IIFE that reads some
   window globals and writes others, exactly like the original
   <script> tags. They must run in dependency order:

     globals  ->  styles  ->  design system  ->  data
              ->  tweaks  ->  vintage  ->  shell  ->  stages  ->  App

   App.jsx ends by mounting <Root/> into #root, so it must be last.
   ============================================================ */
import "./lib/setup-globals.js"; // window.React / ReactDOM / lucide  (must be first)
import "./styles/toob.css";

import "./vendor/toob-design-system.js"; // window.TOOBDesignSystem_7cdcf9 + TOOB_V* primitives
import "./data.js"; // window.TOOB_DATA (books, members, Borda-count helpers)

import "./components/tweaks-panel.jsx"; // window.useTweaks / TweaksPanel / Tweak*
import "./components/vintage-components.jsx"; // window.TOOB_VWordmark / TOOB_VStage / TOOB_VCard ...
import "./components/shell.jsx"; // window.TOOB_Backdrop / Header / Landing / SignIn / Icon
import "./components/stages.jsx"; // window.TOOB_Submission / Voting / Results / Admin / Details

import "./App.jsx"; // orchestrator + Tweaks Root; mounts to #root
