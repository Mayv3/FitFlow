'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import Link from 'next/link'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, PieChart, Pie, Cell,
} from 'recharts'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import esLocale from '@fullcalendar/core/locales/es'

/* ─── Static mock data ─── */
const BAR_DATA = [
  { m: 'Ene', v: 285000 }, { m: 'Feb', v: 312000 }, { m: 'Mar', v: 298000 },
  { m: 'Abr', v: 380000 }, { m: 'May', v: 425000 }, { m: 'Jun', v: 397000 },
  { m: 'Jul', v: 451000 }, { m: 'Ago', v: 413000 }, { m: 'Sep', v: 488000 },
  { m: 'Oct', v: 523000 }, { m: 'Nov', v: 478000 }, { m: 'Dic', v: 562000 },
]

const DONUT_DATA = [
  { name: 'Activos',   value: 347 },
  { name: 'Inactivos', value:  89 },
  { name: 'Altas',     value:  28 },
  { name: 'Bajas',     value:   7 },
]
const DONUT_GRADS: [string, string][] = [
  ['#FFA45B', '#FF6CA3'],
  ['#1DC8FF', '#1674FF'],
  ['#6B00FF', '#FF30C8'],
  ['#FF0202', '#FFBCBC'],
]

const MEMBERS = [
  { id: 1, name: 'Lucía Fernández',  plan: 'Plan Mensual Full', exp: '31/03/2026', ok: true,  col: '#22C55E', ini: 'LF' },
  { id: 2, name: 'Marcos Delgado',   plan: 'Plan Trimestral',   exp: '15/05/2026', ok: true,  col: '#3B82F6', ini: 'MD' },
  { id: 3, name: 'Valeria Romero',   plan: 'Plan Mensual',      exp: '15/03/2026', ok: false, col: '#8B5CF6', ini: 'VR' },
  { id: 4, name: 'Pablo Torres',     plan: 'Plan Mensual Full', exp: '28/03/2026', ok: true,  col: '#F59E0B', ini: 'PT' },
  { id: 5, name: 'Sofía Martínez',   plan: 'Plan Mensual',      exp: '01/03/2026', ok: false, col: '#EF4444', ini: 'SM' },
  { id: 6, name: 'Diego Herrera',    plan: 'Plan Anual',        exp: '31/12/2026', ok: true,  col: '#14B8A6', ini: 'DH' },
]

const CAL_EVENTS = [
  { title: 'Funcional',           date: '2026-03-03', backgroundColor: '#22C55E', borderColor: '#16A34A' },
  { title: 'Yoga — Lucía F.',     date: '2026-03-05', backgroundColor: '#4ADE80', borderColor: '#22C55E' },
  { title: 'Spinning',            date: '2026-03-10', backgroundColor: '#16A34A', borderColor: '#16A34A' },
  { title: 'Funcional',           date: '2026-03-12', backgroundColor: '#22C55E', borderColor: '#16A34A' },
  { title: 'Personal Training',   date: '2026-03-17', backgroundColor: '#4ADE80', borderColor: '#22C55E' },
  { title: 'Yoga',                date: '2026-03-19', backgroundColor: '#22C55E', borderColor: '#16A34A' },
  { title: 'Funcional',           date: '2026-03-21', backgroundColor: '#4ADE80', borderColor: '#22C55E' },
  { title: 'Spinning — Diego H.', date: '2026-03-24', backgroundColor: '#16A34A', borderColor: '#16A34A' },
  { title: 'Yoga',                date: '2026-03-26', backgroundColor: '#22C55E', borderColor: '#16A34A' },
]

/* ─── All CSS scoped under .lp ─── */
const CSS = `
  .lp {
    --bg:    #060C17;
    --bg2:   #09121F;
    --bg3:   #0D1A2D;
    --green: #22C55E;
    --br:    #4ADE80;
    --dim:   #16A34A;
    --glow:  rgba(34,197,94,0.10);
    --bgreen:rgba(34,197,94,0.22);
    --text:  #E8F0FF;
    --text2: #7A90B5;
    --text3: #3E5470;
    --line:  rgba(255,255,255,0.06);
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: 'Quicksand', sans-serif;
    line-height: 1.6;
    overflow-x: hidden;
    scroll-behavior: smooth;
  }
  .lp *, .lp *::before, .lp *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* NAV — floating pill */
  .lp-nav {
    position: fixed; top: 1.1rem;
    left: 50%; transform: translateX(-50%);
    z-index: 200;
    width: calc(100% - 3rem); max-width: 1360px;
    background: rgba(9,18,31,0.78);
    backdrop-filter: blur(28px);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 999px;
    padding: .5rem .5rem .5rem 1.4rem;
    display:flex; align-items:center; justify-content:space-between;
    transition: all .35s;
    box-shadow: 0 4px 24px rgba(0,0,0,0.3);
  }
  .lp-nav.scrolled {
    background: rgba(6,12,23,0.96);
    border-color: rgba(255,255,255,0.13);
    box-shadow: 0 8px 40px rgba(0,0,0,0.5);
  }
  .lp-logo {
    display:flex; align-items:center; gap:.55rem;
    text-decoration:none;
    font-family:'Quicksand',sans-serif; font-weight:800; font-size:1.35rem; color:var(--text);
  }
  .lp-logo-short { display:none; width:28px; height:28px; object-fit:contain; border-radius:0; }
  .lp-nav-icon { display:none; align-items:center; justify-content:center; }
  .lp-logo-mark {
    width:30px; height:30px; background:none; border-radius:0;
    display:flex; align-items:center; justify-content:center;
  }
  .lp-nav-links { display:flex; gap:2.2rem; list-style:none; }
  .lp-nav-links a { text-decoration:none; color:var(--text2); font-size:.9rem; transition:color .2s; }
  .lp-nav-links a:hover { color:var(--text); }
  .lp-nav-end { display:flex; gap:.8rem; align-items:center; }
  .lp-btn-ghost {
    padding:.5rem 1.1rem; background:transparent; border:1px solid var(--line);
    border-radius:999px; color:var(--text2); font-size:.88rem; cursor:pointer;
    text-decoration:none; transition:all .2s; font-family:'Quicksand',sans-serif;
  }
  .lp-btn-ghost:hover { border-color:var(--bgreen); color:var(--br); }
  .lp-btn-green {
    padding:.5rem 1.3rem; background:var(--green); border:none; border-radius:999px;
    color:#fff; font-size:.88rem; font-weight:600; cursor:pointer; text-decoration:none;
    font-family:'Quicksand',sans-serif; transition:all .2s;
  }
  .lp-btn-green:hover { background:var(--br); transform:translateY(-1px); box-shadow:0 8px 24px rgba(34,197,94,.3); }

  /* HERO */
  #lp-hero {
    position:relative; width:100%; min-height:100vh;
    display:flex; flex-direction:column; align-items:center;
    justify-content:flex-start; overflow:hidden; padding-bottom:5rem;
  }
  #lp-canvas { position:absolute; top:0; left:0; width:100%; height:100%; z-index:0; }
  .lp-fade-top {
    position:absolute; top:0; left:0; right:0; height:180px;
    background:linear-gradient(to bottom,var(--bg),transparent); z-index:1; pointer-events:none;
  }
  .lp-fade-bot {
    position:absolute; bottom:0; left:0; right:0; height:260px;
    background:linear-gradient(to top,var(--bg) 30%,transparent); z-index:1; pointer-events:none;
  }
  .lp-hero-inner {
    position:relative; z-index:2; width:100%; max-width:1800px;
    padding:0 6rem; padding-top:calc(2rem + 90px);
    display:grid; grid-template-columns:1fr 1.2fr;
    gap:4rem; align-items:center; min-height:100vh;
  }
  .lp-hero-inner::before {
    content:''; position:absolute; top:40%; right:10%;
    width:600px; height:400px;
    background:radial-gradient(ellipse,rgba(34,197,94,0.06) 0%,transparent 68%);
    pointer-events:none; z-index:-1;
  }
  .lp-hero-text { text-align:left; }
  .lp-pill {
    display:inline-flex; align-items:center; gap:.45rem; padding:.42rem 1.1rem;
    background:rgba(34,197,94,.08); border:1px solid var(--bgreen); border-radius:999px;
    font-size:.88rem; color:var(--br); font-weight:500; margin-bottom:2.2rem;
  }
  .lp-pill-dot {
    width:6px; height:6px; background:var(--br); border-radius:50%;
    animation:lp-blink 2.2s ease-in-out infinite;
  }
  @keyframes lp-blink { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }

  .lp-h1 {
    font-family:'Quicksand',sans-serif;
    font-size: clamp(2.4rem, 4.2vw, 4rem);
    font-weight:800; line-height:1.06; letter-spacing:-.035em;
    color:var(--text); margin-bottom:1.8rem;
  }
  .lp-h1 .hl { color:var(--br); }
  .lp-sub {
    font-size:clamp(1.05rem,1.7vw,1.22rem); color:#9EB0CC; font-weight:400;
    max-width:480px; margin:0 0 3rem; line-height:1.85;
  }
  .lp-actions { display:flex; align-items:center; justify-content:flex-start; gap:1.2rem; flex-wrap:wrap; margin-bottom:2.5rem; }
  .lp-btn-primary {
    display:inline-flex; align-items:center; gap:.65rem; padding:.95rem 2.3rem;
    background:var(--green); border:none; border-radius:999px; color:#fff;
    font-size:1rem; font-weight:700; cursor:pointer; text-decoration:none;
    font-family:'Quicksand',sans-serif; transition:all .25s; letter-spacing:.01em;
  }
  .lp-btn-primary:hover { background:var(--br); transform:translateY(-2px); box-shadow:0 14px 40px rgba(34,197,94,.42); }
  .lp-arrow {
    width:22px; height:22px; background:rgba(255,255,255,.2); border-radius:50%;
    display:flex; align-items:center; justify-content:center; font-size:.82rem;
  }
  .lp-btn-outline {
    display:inline-flex; align-items:center; gap:.5rem; padding:.95rem 2rem;
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.14); border-radius:999px;
    color:var(--text); font-size:1rem; cursor:pointer; text-decoration:none;
    font-family:'Quicksand',sans-serif; transition:all .25s;
  }
  .lp-btn-outline:hover { border-color:var(--bgreen); color:var(--br); background:rgba(34,197,94,.05); }

  /* TRUST */
  .lp-trust { display:flex; align-items:center; justify-content:flex-start; gap:2.2rem; flex-wrap:wrap; }
  .lp-trust-item { display:flex; align-items:center; gap:.45rem; font-size:.88rem; color:var(--text2); }
  .lp-trust-dot { width:6px; height:6px; border-radius:50%; background:var(--green); flex-shrink:0; }

  /* HERO MOCKUP */
  @keyframes lp-float  { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-7px)} }
  @keyframes lp-float2 { 0%,100%{transform:translateY(-3px)} 50%{transform:translateY(4px)} }
  .lp-hero-mockup { position:relative; width:100%; max-width:920px; padding-bottom:2.8rem; }
  .lp-dash-card {
    background:rgba(9,18,31,0.90);
    backdrop-filter:blur(28px);
    border:1px solid rgba(255,255,255,0.08);
    border-radius:18px; overflow:hidden;
    box-shadow:0 40px 90px rgba(0,0,0,.65), 0 0 0 1px rgba(74,222,128,0.05), 0 0 80px rgba(34,197,94,0.04);
  }
  .lp-dash-topbar {
    background:rgba(13,26,45,0.96);
    padding:.9rem 1.5rem; border-bottom:1px solid rgba(255,255,255,0.06);
    display:flex; align-items:center; gap:.5rem;
  }
  .lp-dash-kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; padding:1.5rem 1.6rem .9rem; }
  .lp-dash-kpi {
    background:rgba(255,255,255,0.03);
    border:1px solid rgba(255,255,255,0.06);
    border-radius:12px; padding:1.1rem 1.2rem;
  }
  .lp-dash-kpi-l { font-size:.68rem; color:var(--text2); text-transform:uppercase; letter-spacing:.07em; margin-bottom:.55rem; }
  .lp-dash-kpi-v { font-family:'Quicksand',sans-serif; font-size:1.75rem; font-weight:800; color:var(--text); line-height:1; }
  .lp-dash-kpi-d { font-size:.68rem; color:var(--green); margin-top:.35rem; }
  .lp-dash-kpi-d.r { color:#F87171; }
  .lp-dash-chart { padding:.8rem 1.6rem 1.6rem; }
  .lp-dash-chart-label { font-size:.68rem; color:var(--text2); text-transform:uppercase; letter-spacing:.07em; margin-bottom:.9rem; }
  .lp-side-l, .lp-side-r {
    position:absolute; bottom:.3rem; z-index:10;
    background:rgba(9,18,31,0.92);
    backdrop-filter:blur(24px);
    border:1px solid rgba(255,255,255,0.10);
    border-radius:16px; padding:1.3rem 1.5rem;
    box-shadow:0 20px 50px rgba(0,0,0,.55);
    min-width:210px;
  }
  .lp-side-l { left:-1rem; animation:lp-float 7s ease-in-out infinite; }
  .lp-side-r { right:-1rem; animation:lp-float2 6s ease-in-out infinite; }
  .lp-side-label { font-size:.68rem; color:var(--text2); text-transform:uppercase; letter-spacing:.07em; margin-bottom:.65rem; }
  .lp-side-val { font-family:'Quicksand',sans-serif; font-size:1.75rem; font-weight:800; color:var(--text); line-height:1; margin-bottom:.4rem; }
  .lp-side-sub { font-size:.7rem; color:var(--text2); }
  .lp-side-chip { display:inline-flex; align-items:center; gap:.25rem; padding:.18rem .55rem; border-radius:999px; font-size:.62rem; font-weight:600; margin-top:.5rem; }
  .lp-side-chip.ok  { background:rgba(34,197,94,.12); color:var(--br); }
  .lp-side-chip.inf { background:rgba(59,130,246,.12); color:#60A5FA; }

  /* responsive hero */
  @media (max-width:960px) {
    .lp-hero-inner { grid-template-columns:1fr; gap:3rem; padding:calc(5rem + 70px) 2rem 4rem; min-height:auto; }
    .lp-hero-text { text-align:center; }
    .lp-sub { margin:0 auto 2.4rem; max-width:520px; }
    .lp-actions { justify-content:center; }
    .lp-trust { justify-content:center; }
    .lp-side-l, .lp-side-r { display:none; }
    .lp-hero-mockup { padding-bottom:0; }
    .lp-dash-kpis { grid-template-columns:repeat(2,1fr); }
  }
  @media (max-width:640px) {
    .lp-hero-inner { padding-left:1.25rem; padding-right:1.25rem; }
    .lp-dash-kpis { grid-template-columns:repeat(2,1fr); }
  }

  /* STATS */
  .lp-stats { display:grid; grid-template-columns:repeat(4,1fr); border-top:1px solid var(--line); border-bottom:1px solid var(--line); max-width:1360px; margin:0 auto; width:100%; padding:0 5rem; }
  .lp-stat { padding:2.8rem 2rem; text-align:center; border-right:1px solid var(--line); opacity:0; transform:translateY(16px); transition:opacity .6s ease,transform .6s ease; }
  .lp-stat:last-child { border-right:none; }
  .lp-stat.in { opacity:1; transform:translateY(0); }
  .lp-stat-n { display:block; font-family:'Quicksand',sans-serif; font-size:2.6rem; font-weight:800; color:var(--br); line-height:1; margin-bottom:.45rem; }
  .lp-stat-l { font-size:.88rem; color:var(--text2); }

  /* SECTIONS */
  .lp-section { padding:7rem 5rem; max-width:1360px; margin:0 auto; }
  .lp-head { text-align:center; margin-bottom:4.5rem; }
  .lp-tag { display:inline-block; padding:.28rem .9rem; background:var(--glow); border:1px solid var(--bgreen); border-radius:999px; font-size:.75rem; font-weight:600; color:var(--green); letter-spacing:.08em; text-transform:uppercase; margin-bottom:1.1rem; }
  .lp-stitle { font-family:'Quicksand',sans-serif; font-size:clamp(1.9rem,3.5vw,2.9rem); font-weight:800; line-height:1.12; letter-spacing:-.025em; margin-bottom:.9rem; }
  .lp-sdesc { font-size:1rem; color:var(--text2); max-width:520px; margin:0 auto; line-height:1.75; }

  /* FEAT GRID — bento */
  .lp-bento {
    display:grid;
    grid-template-columns:repeat(3,1fr);
    grid-template-areas:
      "a a b"
      "c d e"
      "f f g"
      "h i i";
    gap:1.1rem;
  }
  .lp-bc {
    background:var(--bg2);
    border:1px solid rgba(255,255,255,0.07);
    border-radius:20px; padding:2rem 2.2rem;
    display:flex; flex-direction:column; justify-content:space-between;
    min-height:200px; position:relative; overflow:hidden;
    transition:border-color .25s, background .25s;
    opacity:0; transform:translateY(22px); transition:opacity .55s ease,transform .55s ease,background .25s,border-color .25s;
  }
  .lp-bc.in { opacity:1; transform:translateY(0); }
  .lp-bc:hover { border-color:rgba(34,197,94,0.28); background:var(--bg3); }
  .lp-bc-label { font-size:.65rem; font-weight:600; text-transform:uppercase; letter-spacing:.1em; color:var(--text2); }
  .lp-bc-title {
    font-family:'Quicksand',sans-serif;
    font-size:clamp(1.25rem,1.8vw,1.65rem);
    font-weight:800; line-height:1.15; letter-spacing:-.02em;
    color:var(--text); margin-top:.9rem;
  }
  .lp-bc-top { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:.85rem; }
  .lp-bc-bottom { display:flex; align-items:flex-end; justify-content:flex-end; margin-top:1.8rem; }
  .lp-bc-icon {
    width:46px; height:46px; background:rgba(34,197,94,0.08);
    border:1px solid rgba(34,197,94,0.2); border-radius:12px;
    display:flex; align-items:center; justify-content:center; color:var(--green);
  }
  .lp-bc-arrow {
    width:36px; height:36px; border:1px solid rgba(255,255,255,0.12);
    border-radius:50%; display:flex; align-items:center; justify-content:center;
    font-size:.95rem; color:var(--text2); flex-shrink:0; transition:all .2s;
  }
  .lp-bc:hover .lp-bc-arrow { border-color:var(--green); color:var(--green); }
  .lp-bc-a { grid-area:a; }
  .lp-bc-b { grid-area:b; }
  .lp-bc-c { grid-area:c; }
  .lp-bc-d { grid-area:d; }
  .lp-bc-e { grid-area:e; }
  .lp-bc-f { grid-area:f; }
  .lp-bc-g { grid-area:g; }
  .lp-bc-h { grid-area:h; }
  .lp-bc-i { grid-area:i; }
  .lp-bc-a .lp-bc-title { font-size:clamp(1.6rem,2.4vw,2.2rem); }
  /* featured — green glow */
  .lp-bc.feat {
    background:rgba(34,197,94,0.10);
    border:1px solid rgba(74,222,128,0.38);
    box-shadow:0 0 50px rgba(34,197,94,0.12), inset 0 0 30px rgba(34,197,94,0.05);
  }
  .lp-bc.feat .lp-bc-icon { background:rgba(34,197,94,0.2); border-color:rgba(74,222,128,0.5); }
  .lp-bc.feat .lp-bc-arrow { border-color:var(--green); color:var(--green); background:rgba(34,197,94,0.1); }
  .lp-bc.feat::after { content:''; position:absolute; bottom:-40px; right:-40px; width:200px; height:200px; background:radial-gradient(circle,rgba(34,197,94,0.22) 0%,transparent 70%); pointer-events:none; }
  /* solid green CTA */
  .lp-bc.solid { background:#22C55E; border-color:#22C55E; }
  .lp-bc.solid:hover { background:#4ADE80; border-color:#4ADE80; }
  .lp-bc.solid .lp-bc-label { color:rgba(0,0,0,0.5); }
  .lp-bc.solid .lp-bc-title { color:#000; }
  .lp-bc.solid .lp-bc-icon { background:rgba(0,0,0,0.1); border-color:rgba(0,0,0,0.15); color:#000; }
  .lp-bc.solid .lp-bc-arrow { border-color:rgba(0,0,0,0.25); color:#000; }
  @media (max-width:860px) {
    .lp-bento { grid-template-columns:1fr 1fr; grid-template-areas:"a a" "b c" "d e" "f f" "g h" "i i"; gap:.8rem; }
    .lp-bc { padding:1.4rem 1.5rem; min-height:170px; }
    .lp-bc-icon { width:38px; height:38px; border-radius:10px; }
    .lp-bc-icon svg { width:18px; height:18px; }
    .lp-bc-arrow { width:30px; height:30px; font-size:.82rem; }
    .lp-bc-title { font-size:1.1rem !important; margin-top:.6rem; }
    .lp-bc-label { font-size:.6rem; }
    .lp-bc-top { margin-bottom:.6rem; }
    .lp-bc-bottom { margin-top:1.2rem; }
  }
  @media (max-width:540px) {
    .lp-bento { grid-template-columns:1fr 1fr; grid-template-areas:"a a" "b c" "d e" "f f" "g h" "i i"; gap:.65rem; }
    .lp-bc { padding:1.1rem 1.1rem; min-height:150px; }
    .lp-bc-icon { width:32px; height:32px; border-radius:8px; }
    .lp-bc-icon svg { width:15px; height:15px; }
    .lp-bc-arrow { width:26px; height:26px; font-size:.75rem; }
    .lp-bc-title { font-size:.95rem !important; margin-top:.5rem; }
    .lp-bc-label { font-size:.55rem; letter-spacing:.07em; }
    .lp-bc-top { margin-bottom:.5rem; gap:.5rem; }
    .lp-bc-bottom { margin-top:1rem; }
  }

  /* DIVIDER */
  .lp-div { width:100%; height:1px; background:var(--line); }

  /* SHOWCASE */
  .lp-sc { padding:6rem 5rem; max-width:1360px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:5rem; align-items:center; }
  .lp-sc.flip { direction:rtl; }
  .lp-sc.flip > * { direction:ltr; }
  .lp-sc-text { opacity:0; transform:translateX(-28px); transition:opacity .7s ease,transform .7s ease; }
  .lp-sc.flip .lp-sc-text { transform:translateX(28px); }
  .lp-sc-text.in { opacity:1; transform:translateX(0); }
  .lp-sc-vis { opacity:0; transform:translateX(28px); transition:opacity .7s ease .15s,transform .7s ease .15s; }
  .lp-sc.flip .lp-sc-vis { transform:translateX(-28px); }
  .lp-sc-vis.in { opacity:1; transform:translateX(0); }
  .lp-sc-text .lp-tag { margin-bottom:1.1rem; }
  .lp-sc-text h2 { font-family:'Quicksand',sans-serif; font-size:clamp(2.2rem,3.4vw,3rem); font-weight:800; line-height:1.1; letter-spacing:-.025em; margin-bottom:1.4rem; }
  .lp-sc-text p { font-size:1.35rem; color:var(--text2); line-height:1.8; margin-bottom:2rem; }
  .lp-list { list-style:none; display:flex; flex-direction:column; gap:1rem; }
  .lp-list li { display:flex; align-items:flex-start; gap:.8rem; font-size:1.2rem; color:var(--text2); }
  .lp-list li::before {
    content:''; width:17px; height:17px; flex-shrink:0; margin-top:2px;
    background:var(--glow); border:1px solid var(--bgreen); border-radius:50%;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='9' viewBox='0 0 9 9'%3E%3Cpath d='M1.5 4.5l2 2L7.5 2' stroke='%2322C55E' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:center;
  }

  /* MOCK SHARED — iOS style window */
  .lp-mock { background:var(--bg2); border:1px solid var(--line); border-radius:14px; overflow:hidden; box-shadow:0 28px 72px rgba(0,0,0,.5); }
  .lp-mock-bar { background:var(--bg3); padding:.7rem 1rem; border-bottom:1px solid var(--line); display:flex; align-items:center; gap:.4rem; }
  .lp-dot { width:9px; height:9px; border-radius:50%; background:var(--line); }
  .lp-dot.g { background:var(--green); }

  /* DASHBOARD MOCK */
  .lp-kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:.6rem; padding:1rem 1rem .5rem; }
  .lp-kpi { background:var(--bg3); border:1px solid var(--line); border-radius:9px; padding:.75rem .85rem; }
  .lp-kpi-l { font-size:.58rem; color:var(--text3); text-transform:uppercase; letter-spacing:.07em; margin-bottom:.3rem; }
  .lp-kpi-v { font-family:'Quicksand',sans-serif; font-size:1.35rem; font-weight:700; color:var(--text); line-height:1; }
  .lp-kpi-d { font-size:.6rem; color:var(--green); margin-top:.2rem; }
  .lp-kpi-d.r { color:#F87171; }
  .lp-chart-wrap { padding:.5rem 1rem 1rem; height:180px; }

  /* MEMBERS TABLE */
  .lp-msearch { margin:.75rem .85rem; background:var(--bg3); border:1px solid var(--line); border-radius:7px; padding:.4rem .75rem; display:flex; align-items:center; gap:.45rem; font-size:.75rem; color:var(--text3); }
  .lp-table { width:100%; border-collapse:collapse; }
  .lp-table th { background:var(--bg3); color:var(--text3); font-size:.62rem; font-weight:600; text-transform:uppercase; letter-spacing:.06em; padding:.5rem .85rem; text-align:left; border-bottom:1px solid var(--line); white-space:nowrap; }
  .lp-table td { padding:.6rem .85rem; border-bottom:1px solid var(--line); color:var(--text2); font-size:.78rem; vertical-align:middle; }
  .lp-table tr:last-child td { border-bottom:none; }
  .lp-table tr:hover td { background:rgba(255,255,255,.018); }
  .lp-av-wrap { display:flex; align-items:center; gap:.5rem; }
  .lp-av { width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.65rem; font-weight:700; color:#fff; flex-shrink:0; }
  .lp-mname { color:var(--text); font-weight:500; }
  .lp-badge { display:inline-block; padding:.15rem .55rem; border-radius:999px; font-size:.62rem; font-weight:600; }
  .lp-badge.ok  { background:rgba(34,197,94,.12); color:var(--br); }
  .lp-badge.exp { background:rgba(239,68,68,.10);  color:#F87171; }

  /* CALENDAR DARK THEME */
  .lp-cal-host { padding:.75rem; }
  .lp-cal-host .fc { background:transparent; color:var(--text); }
  .lp-cal-host .fc-scrollgrid,
  .lp-cal-host .fc-scrollgrid td,
  .lp-cal-host .fc-scrollgrid th { border-color:var(--line) !important; }
  .lp-cal-host .fc-toolbar-title { color:var(--text); font-family:'Quicksand',sans-serif; font-size:.95rem; font-weight:700; }
  .lp-cal-host .fc-col-header-cell { background:var(--bg3); color:var(--text3); font-size:.65rem; }
  .lp-cal-host .fc-col-header-cell-cushion { color:var(--text3); text-decoration:none; padding:.3rem; }
  .lp-cal-host .fc-daygrid-day { background:var(--bg2); }
  .lp-cal-host .fc-daygrid-day-number { color:var(--text2); font-size:.7rem; text-decoration:none; padding:.25rem .4rem; }
  .lp-cal-host .fc-day-today { background:rgba(34,197,94,.07) !important; }
  .lp-cal-host .fc-day-today .fc-daygrid-day-number { color:var(--br); font-weight:700; }
  .lp-cal-host .fc-event { border:none !important; border-radius:4px; font-size:.62rem; }
  .lp-cal-host .fc-daygrid-event { padding:1px 4px; }
  .lp-cal-host .fc-button { background:transparent !important; border:none !important; color:var(--text2) !important; font-size:.7rem; padding:.2rem .5rem; }
  .lp-cal-host .fc-button:hover { background:rgba(255,255,255,0.07) !important; }
  .lp-cal-host .fc-scroller { overflow:hidden !important; }
  .lp-cal-host *::-webkit-scrollbar { display:none; }
  .lp-cal-host * { scrollbar-width:none; -ms-overflow-style:none; }

  /* MOCK WHATSAPP */
  .lp-wpp-head { background:#075E54; padding:.9rem 1rem; display:flex; align-items:center; gap:.65rem; }
  .lp-wpp-av { width:34px; height:34px; border-radius:50%; background:var(--green); }
  .lp-wpp-nm { font-size:.85rem; font-weight:600; color:#fff; }
  .lp-wpp-st { font-size:.68rem; color:rgba(255,255,255,.55); }
  .lp-wpp-chat { background:#0D1117; padding:1rem; min-height:120px; }
  .lp-bubble { background:#1F2C34; border-radius:0 10px 10px 10px; padding:.65rem .9rem; font-size:.77rem; color:var(--text2); max-width:85%; line-height:1.55; }
  .lp-bubble .hl { color:var(--br); font-weight:600; }
  .lp-wpp-foot { background:var(--bg3); padding:.75rem 1rem; display:flex; align-items:center; justify-content:space-between; border-top:1px solid var(--line); }
  .lp-wpp-info { font-size:.72rem; color:var(--text3); }
  .lp-wpp-btn { padding:.35rem .9rem; background:var(--green); border:none; border-radius:999px; color:#fff; font-size:.7rem; font-weight:600; cursor:pointer; }

  /* MOCK PHONE */
  .lp-phone-wrap { display:flex; justify-content:center; }
  .lp-phone { width:300px; background:#0f1623; border:2px solid rgba(255,255,255,0.1); border-radius:32px; overflow:hidden; box-shadow:0 32px 80px rgba(0,0,0,.6),0 0 0 1px rgba(74,222,128,.15); }
  .lp-phone-notch { background:#0a1020; height:24px; display:flex; align-items:center; justify-content:center; }
  .lp-phone-bar { width:60px; height:4px; background:rgba(255,255,255,.1); border-radius:999px; }
  .lp-pi { padding:1.1rem; display:flex; flex-direction:column; gap:.75rem; }
  .lp-ph { padding-bottom:.9rem; border-bottom:1px solid rgba(255,255,255,.07); }
  .lp-ph-gym  { font-family:'Quicksand',sans-serif; font-size:1rem; font-weight:800; color:var(--green); }
  .lp-ph-user { font-size:.85rem; font-weight:700; color:var(--text); margin-top:.2rem; }
  /* plan card */
  .lp-pcard { background:#161f2e; border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:.9rem 1rem; }
  .lp-pcard-label { font-size:.6rem; color:var(--text3); text-transform:uppercase; letter-spacing:.08em; margin-bottom:.35rem; }
  .lp-pcard-name { font-family:'Quicksand',sans-serif; font-size:1.05rem; font-weight:800; color:var(--green); }
  .lp-pcard-price { font-size:.75rem; color:var(--text2); margin-top:.2rem; }
  /* membership status */
  .lp-mcard { background:#161f2e; border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:.9rem 1rem; }
  .lp-mcard-label { font-size:.6rem; color:var(--text3); text-transform:uppercase; letter-spacing:.08em; margin-bottom:.3rem; }
  .lp-mcard-days { font-family:'Quicksand',sans-serif; font-size:1.5rem; font-weight:800; color:var(--text); line-height:1.1; }
  .lp-mcard-exp { font-size:.7rem; color:var(--text2); margin-top:.2rem; margin-bottom:.6rem; }
  .lp-mbar-wrap { background:rgba(255,255,255,.08); border-radius:999px; height:5px; width:100%; margin-bottom:.55rem; }
  .lp-mbar { background:var(--green); height:5px; border-radius:999px; width:72%; }
  .lp-mbadge { display:inline-block; background:rgba(34,197,94,.15); color:var(--green); border:1px solid rgba(34,197,94,.3); border-radius:999px; font-size:.6rem; font-weight:600; padding:.18rem .55rem; float:right; }
  /* classes card */
  .lp-clcard { background:#161f2e; border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:.9rem 1rem; }
  .lp-clcard-label { font-size:.6rem; color:var(--text3); text-transform:uppercase; letter-spacing:.08em; margin-bottom:.3rem; }
  .lp-clcard-num { font-family:'Quicksand',sans-serif; font-size:1.5rem; font-weight:800; color:var(--text); }
  .lp-clcard-sub { font-size:.7rem; color:var(--text2); margin-top:.1rem; margin-bottom:.6rem; }
  .lp-clbar-wrap { background:rgba(255,255,255,.08); border-radius:999px; height:5px; width:100%; margin-bottom:.55rem; }
  .lp-clbar { background:rgba(255,255,255,.25); height:5px; border-radius:999px; width:100%; }

  /* CTA */
  .lp-cta { padding:7rem 5rem; text-align:center; position:relative; overflow:hidden; }
  .lp-cta::before { content:''; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:700px; height:500px; background:radial-gradient(ellipse,rgba(34,197,94,.09) 0%,transparent 70%); pointer-events:none; }
  .lp-cta h2 { font-family:'Quicksand',sans-serif; font-size:clamp(2.3rem,5vw,3.8rem); font-weight:800; line-height:1.1; letter-spacing:-.03em; margin-bottom:1.1rem; }
  .lp-cta p { font-size:1.05rem; color:var(--text2); max-width:480px; margin:0 auto 2.4rem; }

  /* FOOTER */
  .lp-footer { padding:2.5rem 5rem; border-top:1px solid var(--line); display:flex; align-items:center; justify-content:space-between; max-width:1360px; margin:0 auto; }
  .lp-copy { font-size:.82rem; color:var(--text3); }

  /* REVEAL */
  .lp-rev { opacity:0; transform:translateY(26px); transition:opacity .7s ease,transform .7s ease; }
  .lp-rev.in { opacity:1; transform:translateY(0); }

  /* RESPONSIVE */
  @media (max-width:1080px) {
    .lp-nav,.lp-nav.scrolled { padding:.5rem .5rem .5rem 1.2rem; }
    .lp-nav-links { display:none; }
    .lp-logo-mark { display:none; }
    .lp-logo-full { display:none; }
    .lp-logo-short { display:inline-block; }
    .lp-nav-label { display:none; }
    .lp-nav-icon { display:inline-flex; }
    .lp-btn-ghost { width:36px; height:36px; padding:0; border-radius:100%; display:inline-flex; align-items:center; justify-content:center; }
    .lp-btn-green { width:36px; height:36px; padding:0; border-radius:100%; display:inline-flex; align-items:center; justify-content:center; }
    .lp-section,.lp-sc,.lp-cta { padding-left:2rem; padding-right:2rem; }
    .lp-sc { grid-template-columns:1fr; gap:2.5rem; overflow:hidden; }
    .lp-sc.flip { direction:ltr; }
    .lp-sc.flip > * { direction:ltr; }
    .lp-sc-text { text-align:center; transform:none !important; width:100%; }
    .lp-sc-text p { text-align:left; }
    .lp-sc-text h2 { text-align:center; }
    .lp-sc-text.in { opacity:1; transform:none !important; }
    .lp-sc-vis { transform:none !important; width:100%; }
    .lp-sc-vis.in { opacity:1; transform:none !important; }
    .lp-sc-text .lp-tag { display:inline-block; }
    .lp-list { align-items:flex-start; width:fit-content; margin:0 auto; }
    .lp-list li { justify-content:flex-start; text-align:left; align-items:flex-start; }
    .lp-grid { grid-template-columns:1fr 1fr; }
    .lp-stats { grid-template-columns:repeat(2,1fr); padding:0 2rem; }
    .lp-stat { text-align:center; border-right:none; border-bottom:1px solid var(--line); padding:1.8rem 1rem; }
    .lp-stat:nth-child(odd) { border-right:1px solid var(--line); }
    .lp-stat:nth-last-child(-n+2) { border-bottom:none; }
    .lp-footer { padding:2rem; flex-direction:column; gap:.8rem; text-align:center; }
    .lp-kpis { grid-template-columns:repeat(2,1fr); }
    .lp-head { text-align:center; }
    .lp-stitle,.lp-sdesc { text-align:center; }
    .lp-cta-inner { text-align:center; align-items:center; }
    .lp-cta h2,.lp-cta p { text-align:center; }
    .lp-actions { justify-content:center; }
    /* mock table scaling */
    .lp-mock { width:100%; overflow:hidden; }
    .lp-table th { font-size:.52rem; padding:.4rem .45rem; white-space:nowrap; }
    .lp-table td { font-size:.68rem; padding:.45rem .45rem; }
    .lp-av { width:22px; height:22px; font-size:.55rem; }
    .lp-mname { font-size:.68rem; }
    .lp-badge { font-size:.55rem; padding:.1rem .4rem; }
    .lp-msearch { font-size:.68rem; margin:.5rem .6rem; }
    .lp-sc-text h2 { font-size:clamp(1.4rem,5vw,2rem); }
    .lp-sc-text p { font-size:.88rem; }
    .lp-list li { font-size:.85rem; }
    .lp-sc { padding-top:3.5rem; padding-bottom:3.5rem; }
  }
  @media (max-width:640px) {
    .lp-grid { grid-template-columns:1fr; }
    .lp-stats { grid-template-columns:repeat(2,1fr); }
    .lp-kpis { grid-template-columns:repeat(2,1fr); }
    .lp-table th { font-size:.48rem; padding:.35rem .35rem; }
    .lp-table td { font-size:.62rem; padding:.4rem .35rem; }
  }
`

function LogoSVG() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 8h2M5.5 4v8M9.5 2v12M13 6v4M7.5 6v4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  )
}

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const navRef    = useRef<HTMLElement>(null)

  /* ── Three.js hero ── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const W = () => window.innerWidth
    const H = () => window.innerHeight

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W(), H())
    renderer.setClearColor(0x000000, 0)

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, W() / H(), 0.1, 1000)
    camera.position.set(0, 5, 26)
    camera.lookAt(0, 5, 0)

    interface Bar { m: THREE.Mesh; phase: number; speed: number; base: number; amp: number }

    function makeRow(count: number, z: number, opacity: number, hex: number, spacing: number): Bar[] {
      const arr: Bar[] = []
      const total = (count - 1) * spacing
      for (let i = 0; i < count; i++) {
        const geo = new THREE.BoxGeometry(spacing * 0.62, 1, 0.12)
        const mat = new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity })
        const m   = new THREE.Mesh(geo, mat)
        m.position.set(-total / 2 + i * spacing, 0, z)
        scene.add(m)
        arr.push({ m, phase: Math.random() * Math.PI * 2, speed: 0.12 + Math.random() * 0.28, base: 2.8 + Math.random() * 4.5, amp: 1.2 + Math.random() * 3.2 })
      }
      return arr
    }

    const rows = [
      makeRow(110,  0,    0.06, 0x4ADE80, 0.82),
      makeRow(90,  -3.5,  0.03, 0x22C55E, 0.98),
      makeRow(75,  -7,    0.015, 0x16A34A, 1.15),
    ]

    const N = 70
    const PP = new Float32Array(N * 3)
    const PC = new Float32Array(N * 3)
    const PV: number[] = []
    const yMin = -13, yMax = 15
    for (let i = 0; i < N; i++) {
      PP[i*3]   = (Math.random() - 0.5) * 100
      PP[i*3+1] = yMin + Math.random() * (yMax - yMin)
      PP[i*3+2] = (Math.random() - 0.5) * 9
      PV.push(0.005 + Math.random() * 0.016)
      const t = Math.random()
      PC[i*3]   = 0.08 + t * 0.82
      PC[i*3+1] = 0.68 + t * 0.32
      PC[i*3+2] = 0.15 + t * 0.35
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(PP, 3))
    pGeo.setAttribute('color',    new THREE.BufferAttribute(PC, 3))
    const pMat = new THREE.PointsMaterial({ size: 0.09, vertexColors: true, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })
    scene.add(new THREE.Points(pGeo, pMat))

    let tick = 0, raf: number
    const animate = () => {
      raf = requestAnimationFrame(animate)
      tick += 0.007
      rows.forEach(row => row.forEach(b => {
        const h = b.base + Math.sin(tick * b.speed + b.phase) * b.amp
        b.m.scale.y = Math.max(0.05, h)
        b.m.position.y = h / 2 - 8
      }))
      const pos = pGeo.attributes.position.array as Float32Array
      for (let i = 0; i < N; i++) {
        pos[i*3+1] += PV[i]
        if (pos[i*3+1] > yMax) { pos[i*3+1] = yMin; pos[i*3] = (Math.random() - 0.5) * 100 }
      }
      pGeo.attributes.position.needsUpdate = true
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => { camera.aspect = W() / H(); camera.updateProjectionMatrix(); renderer.setSize(W(), H()) }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); renderer.dispose(); window.removeEventListener('resize', onResize) }
  }, [])

  /* ── Navbar scroll ── */
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const fn = () => nav.classList.toggle('scrolled', window.scrollY > 50)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  /* ── Scroll reveal + counters ── */
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') }),
      { threshold: 0.08, rootMargin: '0px 0px -50px 0px' }
    )
    document.querySelectorAll('.lp-rev,.lp-bc,.lp-stat,.lp-sc-text,.lp-sc-vis').forEach(el => io.observe(el))

    const cio = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return
        const el = e.target as HTMLElement
        const target = parseInt(el.dataset.target ?? '0')
        const suffix = el.dataset.suffix ?? ''
        let cur = 0; const step = target / 55
        const timer = setInterval(() => { cur = Math.min(cur + step, target); el.textContent = Math.round(cur) + suffix; if (cur >= target) clearInterval(timer) }, 16)
        cio.unobserve(el)
      })
    }, { threshold: 0.5 })
    document.querySelectorAll('[data-target]').forEach(el => cio.observe(el))

    return () => { io.disconnect(); cio.disconnect() }
  }, [])

  return (
    <div className="lp">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── NAVBAR ── */}
      <nav className="lp-nav" ref={navRef}>
        <Link href="/" className="lp-logo">
          <img src="/images/icon.png" alt="FitFlow" className="lp-logo-mark" style={{width:'30px',height:'30px',objectFit:'contain',borderRadius:0}} />
          <span className="lp-logo-full">Fitness Flow</span>
          <img src="/images/icon.png" alt="FitFlow" className="lp-logo-short" />
        </Link>
        <ul className="lp-nav-links">
          <li><a href="#lp-features">Funcionalidades</a></li>
          <li><a href="#lp-dashboard">Dashboard</a></li>
          <li><a href="#lp-automation">Automatización</a></li>
          <li><a href="#lp-portal">Portal</a></li>
        </ul>
        <div className="lp-nav-end">
          <Link href="/login" className="lp-btn-ghost">
            <span className="lp-nav-label">Iniciar sesión</span>
            <span className="lp-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
            </span>
          </Link>
          <a href="https://wa.me/5493516978330?text=Hola%20que%20tal%2C%20quiero%20empezar%20a%20contratar%20con%20FitFlow%2C%20podr%C3%ADas%20darme%20m%C3%A1s%20informaci%C3%B3n%3F" target="_blank" rel="noopener noreferrer" className="lp-btn-green">
            <span className="lp-nav-label">Empezar gratis</span>
            <span className="lp-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z"/></svg>
            </span>
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="lp-hero">
        <canvas ref={canvasRef} id="lp-canvas" />
        <div className="lp-fade-top" />
        <div className="lp-fade-bot" />

        <div className="lp-hero-inner">
          {/* text block */}
          <div className="lp-hero-text">
            <div className="lp-pill"><span className="lp-pill-dot" />Software para Gimnasios</div>
            <h1 className="lp-h1">
              Gestioná tu gimnasio<br />desde un <span className="hl">solo lugar</span>
            </h1>
            <p className="lp-sub">
              Miembros, pagos, clases, turnos y analítica avanzada — todo centralizado en una plataforma moderna.
            </p>
            <div className="lp-actions">
              <a href="https://wa.me/5493516978330?text=Hola%20que%20tal%2C%20quiero%20empezar%20a%20contratar%20con%20FitFlow%2C%20podr%C3%ADas%20darme%20m%C3%A1s%20informaci%C3%B3n%3F" target="_blank" rel="noopener noreferrer" className="lp-btn-primary">Empezar gratis <span className="lp-arrow">→</span></a>
              <a href="#lp-features" className="lp-btn-outline">Ver funcionalidades</a>
            </div>
          </div>

          {/* main mockup */}
          <div className="lp-hero-mockup">
            <div className="lp-dash-card">
              <div className="lp-dash-topbar">
                <div className="lp-dot"/><div className="lp-dot"/><div className="lp-dot g"/>
                <span style={{marginLeft:'.6rem',fontSize:'.72rem',color:'var(--text2)',fontWeight:500}}>FitFlow — Dashboard</span>
              </div>
              <div className="lp-dash-kpis">
                {[
                  {l:'Activos',     v:'347',   d:'+28 altas'},
                  {l:'Facturación', v:'$523k', d:'+9.4%'},
                  {l:'Clases hoy',  v:'3',     d:'36 inscriptos'},
                  {l:'Vencidos',    v:'89',    d:'14 alertas', r:true},
                ].map((k,i) => (
                  <div className="lp-dash-kpi" key={i}>
                    <div className="lp-dash-kpi-l">{k.l}</div>
                    <div className="lp-dash-kpi-v">{k.v}</div>
                    <div className={`lp-dash-kpi-d${k.r?' r':''}`}>{k.d}</div>
                  </div>
                ))}
              </div>
              <div className="lp-dash-chart">
                <div className="lp-dash-chart-label">Facturación 2026</div>
                <svg viewBox="0 0 132 130" style={{width:'100%',height:'130px',display:'block'}} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF6A00" stopOpacity="0.9"/>
                      <stop offset="100%" stopColor="#FF2D55" stopOpacity="0.6"/>
                    </linearGradient>
                  </defs>
                  {[.5,.56,.53,.68,.76,.71,.80,.73,.87,.95,.85,1.0].map((h,i) => (
                    <rect key={i} x={i*11} y={130-h*128} width={10} height={h*128} fill="url(#hg)" rx={2}/>
                  ))}
                </svg>
              </div>
            </div>

            {/* floating card left — member */}
            <div className="lp-side-l">
              <div className="lp-side-label">Miembro activo</div>
              <div style={{display:'flex',alignItems:'center',gap:'.5rem',margin:'.5rem 0 .6rem'}}>
                <div style={{width:34,height:34,borderRadius:'50%',background:'#22C55E',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.72rem',fontWeight:700,color:'#fff',flexShrink:0}}>LF</div>
                <div>
                  <div style={{fontSize:'.82rem',fontWeight:600,color:'var(--text)'}}>Lucía Fernández</div>
                  <div style={{fontSize:'.65rem',color:'var(--text2)',marginTop:'.1rem'}}>Plan Mensual Full</div>
                </div>
              </div>
              <div className="lp-side-chip ok">✓ Al día — vence 31/03</div>
            </div>

            {/* floating card right — revenue */}
            <div className="lp-side-r">
              <div className="lp-side-label">Facturación del mes</div>
              <div className="lp-side-val">$523.000</div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'.25rem'}}>
                <span className="lp-side-sub">vs $478k anterior</span>
                <span style={{fontSize:'.72rem',fontWeight:700,color:'var(--br)'}}>↑ +9.4%</span>
              </div>
              <div className="lp-side-chip ok" style={{marginTop:'.6rem'}}>Marzo 2026</div>
            </div>
          </div>

        </div>
      </section>

      {/* ── STATS ── */}
      <div className="lp-stats">
        {[
          { n: 2500, s: '+', l: 'Miembros gestionados'    },
          { n: 40,   s: '+', l: 'Gimnasios activos'       },
          { n: 98,   s: '%', l: 'Satisfacción de usuarios'},
          { n: 12,   s: '',  l: 'Módulos integrados'      },
        ].map((st, i) => (
          <div className="lp-stat" key={i} style={{ transitionDelay: `${i * 0.1}s` }}>
            <span className="lp-stat-n" data-target={st.n} data-suffix={st.s}>0</span>
            <span className="lp-stat-l">{st.l}</span>
          </div>
        ))}
      </div>

      {/* ── FEATURES GRID ── */}
      <section className="lp-section" id="lp-features">
        <div className="lp-head lp-rev">
          <div className="lp-tag">Funcionalidades</div>
          <h2 className="lp-stitle">Todo lo que tu gimnasio necesita</h2>
          <p className="lp-sdesc">Una plataforma completa diseñada para simplificar la gestión de tu negocio fitness.</p>
        </div>
        <div className="lp-bento">

          {/* a — Gestión de Miembros (wide) */}
          <div className="lp-bc lp-bc-a lp-rev">
            <div>
              <div className="lp-bc-top">
                <div className="lp-bc-label">Gestión de Miembros</div>
                <div className="lp-bc-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                </div>
              </div>
              <div className="lp-bc-title">Control total<br/>sobre cada alumno</div>
            </div>
            <div className="lp-bc-bottom">
              <div className="lp-bc-arrow">→</div>
            </div>
          </div>

          {/* b — Analytics */}
          <div className="lp-bc lp-bc-b lp-rev" style={{transitionDelay:'.07s'}}>
            <div>
              <div className="lp-bc-top">
                <div className="lp-bc-label">Analytics</div>
                <div className="lp-bc-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/></svg>
                </div>
              </div>
              <div className="lp-bc-title">Estadísticas en tiempo real</div>
            </div>
            <div className="lp-bc-bottom">
              <div className="lp-bc-arrow">→</div>
            </div>
          </div>

          {/* c — Pagos */}
          <div className="lp-bc lp-bc-c lp-rev" style={{transitionDelay:'.14s'}}>
            <div>
              <div className="lp-bc-top">
                <div className="lp-bc-label">Pagos y Facturación</div>
                <div className="lp-bc-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
                </div>
              </div>
              <div className="lp-bc-title">Ingresos bajo control</div>
            </div>
            <div className="lp-bc-bottom">
              <div className="lp-bc-arrow">→</div>
            </div>
          </div>

          {/* d — Control de Asistencias (featured green) */}
          <div className="lp-bc lp-bc-d feat lp-rev" style={{transitionDelay:'.21s'}}>
            <div>
              <div className="lp-bc-top">
                <div className="lp-bc-label">Control de Asistencias</div>
                <div className="lp-bc-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                </div>
              </div>
              <div className="lp-bc-title">Check-in por DNI al instante</div>
            </div>
            <div className="lp-bc-bottom">
              <div className="lp-bc-arrow">→</div>
            </div>
          </div>

          {/* e — Clases */}
          <div className="lp-bc lp-bc-e lp-rev" style={{transitionDelay:'.28s'}}>
            <div>
              <div className="lp-bc-top">
                <div className="lp-bc-label">Clases y Sesiones</div>
                <div className="lp-bc-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 5.57 2 7.71 3.43 9.14 2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22 14.86 20.57 16.29 22 18.43 19.86 19.86 18.43 22 16.29 20.57 14.86z"/></svg>
                </div>
              </div>
              <div className="lp-bc-title">Cupos e inscripciones</div>
            </div>
            <div className="lp-bc-bottom">
              <div className="lp-bc-arrow">→</div>
            </div>
          </div>

          {/* f — Automatización (feat green, wide) */}
          <div className="lp-bc lp-bc-f feat lp-rev" style={{transitionDelay:'.35s'}}>
            <div>
              <div className="lp-bc-top">
                <div className="lp-bc-label">Email para tus alumnos</div>
                <div className="lp-bc-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/></svg>
                </div>
              </div>
              <div className="lp-bc-title">Recordatorios de vencimiento<br/>automáticos por email</div>
            </div>
            <div className="lp-bc-bottom">
              <div className="lp-bc-arrow">→</div>
            </div>
          </div>

          {/* g — Portal del Alumno */}
          <div className="lp-bc lp-bc-g lp-rev" style={{transitionDelay:'.42s'}}>
            <div>
              <div className="lp-bc-top">
                <div className="lp-bc-label">Portal del Alumno</div>
                <div className="lp-bc-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>
                </div>
              </div>
              <div className="lp-bc-title">Acceso self-service 24/7</div>
            </div>
            <div className="lp-bc-bottom">
              <div className="lp-bc-arrow">→</div>
            </div>
          </div>

          {/* h — Planes */}
          <div className="lp-bc lp-bc-h lp-rev" style={{transitionDelay:'.49s'}}>
            <div>
              <div className="lp-bc-top">
                <div className="lp-bc-label">Planes de Membresía</div>
                <div className="lp-bc-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z"/></svg>
                </div>
              </div>
              <div className="lp-bc-title">Precios y duración personalizados</div>
            </div>
            <div className="lp-bc-bottom">
              <div className="lp-bc-arrow">→</div>
            </div>
          </div>

          {/* i — Turnos y Citas (wide) */}
          <div className="lp-bc lp-bc-i lp-rev" style={{transitionDelay:'.56s'}}>
            <div>
              <div className="lp-bc-top">
                <div className="lp-bc-label">Turnos y Citas</div>
                <div className="lp-bc-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/></svg>
                </div>
              </div>
              <div className="lp-bc-title">Calendario completo con reservas vinculadas a servicios</div>
            </div>
            <div className="lp-bc-bottom">
              <div className="lp-bc-arrow">→</div>
            </div>
          </div>

        </div>
      </section>

      <div className="lp-div" />

      {/* ── DASHBOARD — Recharts real ── */}
      <div className="lp-sc" id="lp-dashboard">
        <div className="lp-sc-text">
          <div className="lp-tag">Dashboard</div>
          <h2>Analítica en tiempo real para decisiones inteligentes</h2>
          <p>Visualizá el rendimiento de tu gimnasio con KPIs actualizados, gráficos de facturación histórica y métricas de asistencia. Filtrá por año, mes o rango de fechas.</p>
          <ul className="lp-list">
            <li>KPIs: miembros activos, bajas, altas del mes y cancelaciones</li>
            <li>Facturación: últimas 24h, 7 días, 30 días o 12 meses</li>
            <li>Demografía: distribución por edad y género</li>
            <li>Asistencias: horas pico y patrones diarios</li>
            <li>Origen de alumnos: identificá tus mejores canales</li>
          </ul>
        </div>
        <div className="lp-sc-vis">
          <div className="lp-mock">
            <div className="lp-mock-bar">
              <div className="lp-dot"/><div className="lp-dot"/><div className="lp-dot g"/>
            </div>
            {/* KPI cards */}
            <div className="lp-kpis">
              {[
                { l:'Activos',   v:'347', d:'+12 este mes', r:false },
                { l:'Inactivos', v:'89',  d:'-4 este mes',  r:true  },
                { l:'Altas',     v:'28',  d:'Este mes',     r:false },
                { l:'Bajas',     v:'7',   d:'Este mes',     r:false },
              ].map((k, i) => (
                <div className="lp-kpi" key={i}>
                  <div className="lp-kpi-l">{k.l}</div>
                  <div className="lp-kpi-v">{k.v}</div>
                  <div className={`lp-kpi-d${k.r?' r':''}`}>{k.d}</div>
                </div>
              ))}
            </div>
            {/* Recharts BarChart — mismo gradiente que FacturacionSection */}
            <div className="lp-chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={BAR_DATA} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barCategoryGap={6}>
                  <defs>
                    <linearGradient id="lp-revenue-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#FF6A00" />
                      <stop offset="100%" stopColor="#FF2D55" />
                    </linearGradient>
                    {DONUT_GRADS.map(([c1, c2], i) => (
                      <linearGradient key={i} id={`lp-dg-${i}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%"   stopColor={c1} />
                        <stop offset="100%" stopColor={c2} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="m" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#7A90B5' }} />
                  <YAxis hide domain={[0, 'auto']} />
                  <Bar dataKey="v" fill="url(#lp-revenue-grad)" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Donut mini */}
            <div style={{ height: 90, padding: '0 1rem .75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 80, height: 80, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={DONUT_DATA} dataKey="value" innerRadius="55%" outerRadius="90%" startAngle={90} endAngle={-270} stroke="transparent">
                      {DONUT_DATA.map((_, i) => <Cell key={i} fill={`url(#lp-dg-${i})`} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem 0.75rem' }}>
                {DONUT_DATA.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: `linear-gradient(135deg,${DONUT_GRADS[i][0]},${DONUT_GRADS[i][1]})` }} />
                    <span style={{ fontSize: '0.65rem', color: '#7A90B5' }}>{d.name}</span>
                    <span style={{ fontSize: '0.65rem', color: '#E8F0FF', fontWeight: 700 }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lp-div" />

      {/* ── MEMBERS — tabla real estilizada ── */}
      <div className="lp-sc flip">
        <div className="lp-sc-text">
          <div className="lp-tag">Miembros</div>
          <h2>Control total sobre cada alumno</h2>
          <p>Llevá un registro completo de tus miembros: datos personales, plan asignado, vencimiento y estado. Identificá vencimientos al instante y actuá rápido.</p>
          <ul className="lp-list">
            <li>Ficha completa: DNI, teléfono, email, fecha de nacimiento</li>
            <li>Panel de vencidos con acceso directo a WhatsApp</li>
            <li>Búsqueda instantánea por nombre, DNI o teléfono</li>
            <li>Baja lógica: historial preservado en todo momento</li>
            <li>Captura de origen para analítica de adquisición</li>
          </ul>
        </div>
        <div className="lp-sc-vis">
          <div className="lp-mock">
            <div className="lp-mock-bar">
              <div className="lp-dot"/><div className="lp-dot"/><div className="lp-dot g"/>
            </div>
            <div className="lp-msearch">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{opacity:.5,flexShrink:0}}><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
              Buscar por nombre o DNI…
            </div>
            <table className="lp-table">
              <thead>
                <tr>
                  <th>Miembro</th>
                  <th>Plan</th>
                  <th>Vencimiento</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {MEMBERS.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div className="lp-av-wrap">
                        <div className="lp-av" style={{ background: m.col }}>{m.ini}</div>
                        <span className="lp-mname">{m.name}</span>
                      </div>
                    </td>
                    <td style={{ color: '#7A90B5' }}>{m.plan}</td>
                    <td style={{ color: '#7A90B5' }}>{m.exp}</td>
                    <td><span className={`lp-badge ${m.ok ? 'ok' : 'exp'}`}>{m.ok ? 'Activo' : 'Vencido'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="lp-div" />

      {/* ── CLASSES — FullCalendar real ── */}
      <div className="lp-sc">
        <div className="lp-sc-text">
          <div className="lp-tag">Turnos</div>
          <h2>Reservas de servicios organizadas en un calendario</h2>
          <p>Gestioná turnos para servicios como antropometrías, sesiones de fisioterapia, evaluaciones y más. Todo en un calendario visual con vistas flexibles.</p>
          <ul className="lp-list">
            <li>Turnos vinculados a servicios del gimnasio</li>
            <li>Calendario con vistas día, semana y mes</li>
            <li>Creación y cancelación de turnos por alumno</li>
            <li>Link directo a Google Calendar por turno</li>
            <li>Ideal para antropometrías, fisioterapia, evaluaciones y más</li>
          </ul>
        </div>
        <div className="lp-sc-vis">
          <div className="lp-mock">
            <div className="lp-mock-bar">
              <div className="lp-dot"/><div className="lp-dot"/><div className="lp-dot g"/>
            </div>
            <div className="lp-cal-host" style={{ height: 380 }}>
              <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                initialDate="2026-03-01"
                locale={esLocale}
                height="100%"
                events={CAL_EVENTS}
                headerToolbar={{ left: 'prev', center: 'title', right: 'next' }}
                titleFormat={{ month: 'long', year: 'numeric' }}
                editable={false}
                selectable={false}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="lp-div" />

      {/* ── ASISTENCIAS ── */}
      <div className="lp-sc flip">
        <div className="lp-sc-text">
          <div className="lp-tag">Asistencias</div>
          <h2>Check-in rápido con verificación automática</h2>
          <p>El recepcionista ingresa el DNI del alumno y el sistema verifica al instante si tiene una membresía activa, muestra su plan y registra la asistencia.</p>
          <ul className="lp-list">
            <li>Check-in por DNI — sin tarjetas ni apps</li>
            <li>Verificación automática de membresía activa</li>
            <li>Alerta visual si el plan está vencido</li>
          </ul>
        </div>
        <div className="lp-sc-vis">
          <div className="lp-mock">
            <div className="lp-mock-bar">
              <div className="lp-dot"/><div className="lp-dot"/><div className="lp-dot g"/>
            </div>
            <div style={{ padding: '1rem' }}>
              <div className="lp-msearch" style={{ marginLeft:0, marginRight:0 }}>
                <span>38402195</span>
                <span style={{ fontSize:'.7rem', color:'var(--green)', marginLeft:'auto' }}>↵ Ingresar</span>
              </div>
              <div style={{ background:'var(--bg3)', border:'1px solid var(--bgreen)', borderRadius:10, padding:'1rem', marginTop:'.5rem' }}>
                <div style={{ fontFamily:'Quicksand,sans-serif', fontSize:'.95rem', fontWeight:700, marginBottom:'.3rem' }}>Lucía Fernández</div>
                <div style={{ fontSize:'.75rem', color:'var(--text2)', marginBottom:'.6rem' }}>Plan Mensual Full · vence 31/03/2026</div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:'.4rem', padding:'.3rem .8rem', background:'rgba(34,197,94,.12)', border:'1px solid var(--bgreen)', borderRadius:999, fontSize:'.72rem', color:'var(--br)' }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--br)' }}/>
                  Membresía activa
                </div>
                <div style={{ marginTop:'.8rem', background:'var(--bg2)', borderRadius:999, height:5, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:'70%', background:'linear-gradient(90deg,var(--dim),var(--br))', borderRadius:999 }}/>
                </div>
                <div style={{ fontSize:'.65rem', color:'var(--text3)', marginTop:'.3rem' }}>14 de 20 clases utilizadas</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lp-div" />

      {/* ── AUTOMATION ── */}
      <div className="lp-sc" id="lp-automation">
        <div className="lp-sc-text">
          <div className="lp-tag">Automatización</div>
          <h2>Recordatorios automáticos y contacto directo</h2>
          <p>Emails automaticos a alumnos vencidos o por vencer. Y cuando necesitás un toque personal, mandales el mensaje pre-armado por WhatsApp con un clic.</p>
          <ul className="lp-list">
            <li>Mails automáticos a alumnos vencidos o por vencer</li>
            <li>Nombre del alumno incluido automáticamente en el mensaje</li>
            <li>Mensaje de WhatsApp pre-armado por alumno individual</li>
            <li>Panel de vencidos con acceso rápido a cada contacto</li>
          </ul>
        </div>
        <div className="lp-sc-vis">
          <div className="lp-mock">
            <div className="lp-wpp-head">
              <div className="lp-wpp-av"/>
              <div><div className="lp-wpp-nm">Fitness Flow Gym</div><div className="lp-wpp-st">Mensaje personalizado</div></div>
            </div>
            <div className="lp-wpp-chat">
              <div className="lp-bubble">
                Hola <span className="hl">Valeria</span> 👋 Te recordamos que tu membresía en <span className="hl">Fitness Flow Gym</span> venció hace 3 días. ¡Renovála hoy y seguí entrenando!
              </div>
            </div>
            <div className="lp-wpp-foot">
              <span className="lp-wpp-info" style={{display:'inline-flex',alignItems:'center',gap:'.35rem'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                Enviar a Valeria
              </span>
              <button className="lp-wpp-btn">Enviar c:</button>
            </div>
          </div>
        </div>
      </div>

      <div className="lp-div" />

      {/* ── PORTAL ── */}
      <div className="lp-sc flip" id="lp-portal">
        <div className="lp-sc-text">
          <div className="lp-tag">Portal del Alumno</div>
          <h2>Self-service para tus alumnos, sin fricción</h2>
          <p>Cada gimnasio tiene su portal único. Los alumnos acceden solo con su DNI — sin apps, sin contraseñas. Membresía, clases y turnos desde el celular.</p>
          <ul className="lp-list">
            <li>URL y QR únicos por gimnasio</li>
            <li>Acceso con DNI, sin contraseña</li>
            <li>Vista de plan activo y fecha de vencimiento</li>
            <li>Inscripción y cancelación de clases</li>
            <li>Branding personalizado: color y logo del gym</li>
          </ul>
        </div>
        <div className="lp-sc-vis">
          <div className="lp-phone-wrap">
            <div className="lp-phone">
              <div className="lp-phone-notch"><div className="lp-phone-bar"/></div>
              <div className="lp-pi">
                {/* header */}
                <div className="lp-ph">
                  <div className="lp-ph-gym">Fitness Flow Gym</div>
                  <div className="lp-ph-user">¡Bienvenido, Lucía!</div>
                </div>
                {/* plan actual */}
                <div className="lp-pcard">
                  <div className="lp-pcard-label">Plan Actual</div>
                  <div className="lp-pcard-name">Plan Mensual Full</div>
                  <div className="lp-pcard-price">Precio del plan: $45.000</div>
                </div>
                {/* estado membresía */}
                <div className="lp-mcard">
                  <div className="lp-mcard-label">Estado de Membresía</div>
                  <div className="lp-mcard-days">18 días restantes</div>
                  <div className="lp-mcard-exp">Fin: 08/04/2026</div>
                  <div className="lp-mbar-wrap"><div className="lp-mbar"/></div>
                  <div style={{display:'flex',justifyContent:'flex-end'}}><span className="lp-mbadge">Activo</span></div>
                </div>
                {/* clases restantes */}
                <div className="lp-clcard">
                  <div className="lp-clcard-label">Clases Restantes</div>
                  <div className="lp-clcard-num">8</div>
                  <div className="lp-clcard-sub">De 12 clases del plan</div>
                  <div className="lp-clbar-wrap"><div className="lp-clbar" style={{width:'67%',background:'var(--green)'}}/></div>
                  <div style={{display:'flex',justifyContent:'flex-end'}}><span className="lp-mbadge">Activo</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lp-div" />

      {/* ── CTA ── */}
      <div className="lp-cta">
        <div className="lp-tag lp-rev">Para gimnasios de todos los tamaños</div>
        <h2 className="lp-rev" style={{transitionDelay:'.1s'}}>Empezá a gestionar<br/>de forma inteligente</h2>
        <p className="lp-rev" style={{transitionDelay:'.2s'}}>Registrá tu gimnasio hoy y descubrí cómo FitFlow simplifica tu operación desde el primer día.</p>
        <div className="lp-rev" style={{transitionDelay:'.3s'}}>
          <a href="https://wa.me/5493516978330?text=Hola%20que%20tal%2C%20quiero%20empezar%20a%20contratar%20con%20FitFlow%2C%20podr%C3%ADas%20darme%20m%C3%A1s%20informaci%C3%B3n%3F" target="_blank" rel="noopener noreferrer" className="lp-btn-primary">Empezar gratis<span className="lp-arrow">→</span></a>
        </div>
      </div>

      <div className="lp-div" />
      <div className="lp-footer">
        <Link href="/" className="lp-logo">
          <img src="/images/icon.png" alt="FitFlow" style={{width:'30px',height:'30px',objectFit:'contain',borderRadius:0}} />FitFlow
        </Link>
        <span className="lp-copy">© 2026 FitFlow. Software para gimnasios.</span>
      </div>
    </div>
  )
}
