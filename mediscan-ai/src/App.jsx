import { useState, useRef, useEffect, useCallback } from "react";

// --- Design Tokens ----------------------------------------------------------
const T = {
  bg:          "#EEF4F9",        // cool clinical blue-grey
  surface:     "#FFFFFF",
  surfaceWarm: "#F4F9FC",
  primary:     "#0369A1",        // deep medical blue
  primarySoft: "#E0F2FE",
  primaryMid:  "#0284C7",
  primaryDark: "#075985",
  teal:        "#0D9488",
  tealSoft:    "#CCFBF1",
  gold:        "#92400E",
  goldSoft:    "#FEF3C7",
  danger:      "#DC2626",
  dangerSoft:  "#FEF2F2",
  warn:        "#D97706",
  warnSoft:    "#FFFBEB",
  safe:        "#059669",
  safeSoft:    "#ECFDF5",
  text:        "#0F172A",
  textMid:     "#475569",
  textLight:   "#94A3B8",
  border:      "#CBD5E1",
  borderLight: "#E2E8F0",
  borderFocus: "#0369A1",
};

// --- 2023 AGS Beers Criteria (abbreviated, real clinical data) --------------
const BEERS_CRITERIA = [
  { drug: "amitriptyline", reason: "Highly anticholinergic; risk of sedation, falls, confusion", severity: "high", category: "CNS" },
  { drug: "doxepin", reason: "Highly anticholinergic; CNS/cardiac adverse effects", severity: "high", category: "CNS" },
  { drug: "imipramine", reason: "Highly anticholinergic; orthostatic hypotension", severity: "high", category: "CNS" },
  { drug: "diazepam", reason: "Increased risk of falls, fractures, MVA in elderly", severity: "high", category: "Benzodiazepine" },
  { drug: "alprazolam", reason: "Cognitive impairment, delirium, falls in elderly", severity: "high", category: "Benzodiazepine" },
  { drug: "lorazepam", reason: "Benzodiazepine: increased fall and fracture risk", severity: "high", category: "Benzodiazepine" },
  { drug: "clonazepam", reason: "Benzodiazepine: sedation and fall risk", severity: "high", category: "Benzodiazepine" },
  { drug: "haloperidol", reason: "Risk of stroke, cognitive decline, mortality in dementia", severity: "high", category: "Antipsychotic" },
  { drug: "chlorpromazine", reason: "Orthostatic hypotension, anticholinergic, sedation", severity: "high", category: "Antipsychotic" },
  { drug: "olanzapine", reason: "Increased mortality risk in elderly with dementia", severity: "high", category: "Antipsychotic" },
  { drug: "indomethacin", reason: "Highest risk GI bleed/ulceration of all NSAIDs", severity: "high", category: "NSAID" },
  { drug: "piroxicam", reason: "Long half-life NSAID; GI bleeding risk", severity: "high", category: "NSAID" },
  { drug: "ketorolac", reason: "Peptic ulcer disease, acute kidney injury risk", severity: "high", category: "NSAID" },
  { drug: "glibenclamide", reason: "Prolonged hypoglycaemia; falls risk", severity: "high", category: "Hypoglycaemic" },
  { drug: "glipizide", reason: "Risk of prolonged hypoglycaemia in elderly", severity: "moderate", category: "Hypoglycaemic" },
  { drug: "digoxin", reason: "Risk of toxicity at >0.125mg/day; narrow therapeutic index", severity: "high", category: "Cardiac" },
  { drug: "nifedipine", reason: "Immediate release: hypotension and MI risk", severity: "high", category: "Cardiac" },
  { drug: "spironolactone", reason: "Hyperkalemia risk; avoid in heart failure", severity: "moderate", category: "Diuretic" },
  { drug: "chlorpheniramine", reason: "First-gen antihistamine: anticholinergic, sedation", severity: "high", category: "Antihistamine" },
  { drug: "promethazine", reason: "Highly anticholinergic; risk of falls and confusion", severity: "high", category: "Antihistamine" },
  { drug: "hydroxyzine", reason: "Anticholinergic adverse effects", severity: "moderate", category: "Antihistamine" },
  { drug: "metoclopramide", reason: "Risk of extrapyramidal effects (tardive dyskinesia)", severity: "high", category: "GI" },
  { drug: "mineral oil", reason: "Aspiration risk and impaired nutrient absorption", severity: "moderate", category: "GI" },
  { drug: "nitrofurantoin", reason: "Pulmonary toxicity risk with long-term use", severity: "moderate", category: "Antibiotic" },
  { drug: "meperidine", reason: "Neurotoxic metabolite accumulation in elderly", severity: "high", category: "Opioid" },
  { drug: "tramadol", reason: "Seizure risk; serotonin syndrome; falls", severity: "moderate", category: "Opioid" },
  { drug: "testosterone", reason: "Cardiac risk; potential for prostate cancer stimulation", severity: "moderate", category: "Hormone" },
  { drug: "oxybutynin", reason: "Anticholinergic: confusion, constipation, dry mouth", severity: "high", category: "Urological" },
  { drug: "tolterodine", reason: "Anticholinergic adverse effects in elderly", severity: "moderate", category: "Urological" },
  { drug: "cyclobenzaprine", reason: "Anticholinergic; sedation; risk of fractures", severity: "high", category: "Muscle Relaxant" },
];

// --- Known interaction pairs (seed data for offline fallback) ---------------
const KNOWN_INTERACTIONS = [
  { d1:"warfarin", d2:"aspirin", severity:"major", effect:"Increased bleeding risk; anticoagulant potentiation", mechanism:"Additive antiplatelet/anticoagulant effect" },
  { d1:"warfarin", d2:"ibuprofen", severity:"major", effect:"Severe GI bleeding and enhanced anticoagulation", mechanism:"NSAIDs displace warfarin from protein binding" },
  { d1:"metformin", d2:"alcohol", severity:"major", effect:"Risk of lactic acidosis", mechanism:"Alcohol potentiates metformin's effect on lactate metabolism" },
  { d1:"simvastatin", d2:"amlodipine", severity:"moderate", effect:"Increased myopathy/rhabdomyolysis risk", mechanism:"Amlodipine inhibits CYP3A4 raising simvastatin levels" },
  { d1:"lisinopril", d2:"potassium", severity:"moderate", effect:"Dangerous hyperkalaemia", mechanism:"ACE inhibitor + potassium supplement raises serum K+" },
  { d1:"digoxin", d2:"amiodarone", severity:"major", effect:"Digoxin toxicity - nausea, arrhythmias, vision changes", mechanism:"Amiodarone inhibits P-glycoprotein, raising digoxin levels" },
  { d1:"clopidogrel", d2:"omeprazole", severity:"moderate", effect:"Reduced antiplatelet effect of clopidogrel", mechanism:"Omeprazole inhibits CYP2C19 activation of clopidogrel" },
  { d1:"methotrexate", d2:"ibuprofen", severity:"major", effect:"Methotrexate toxicity - bone marrow suppression", mechanism:"NSAIDs reduce renal clearance of methotrexate" },
  { d1:"sildenafil", d2:"nitrates", severity:"major", effect:"Severe hypotension - potentially fatal", mechanism:"Additive NO-mediated vasodilation" },
  { d1:"fluoxetine", d2:"tramadol", severity:"major", effect:"Serotonin syndrome - confusion, fever, seizures", mechanism:"Combined serotonergic activity" },
  { d1:"ciprofloxacin", d2:"tizanidine", severity:"major", effect:"Extreme hypotension and sedation", mechanism:"Ciprofloxacin inhibits CYP1A2 metabolism of tizanidine" },
  { d1:"clarithromycin", d2:"simvastatin", severity:"major", effect:"Rhabdomyolysis risk", mechanism:"CYP3A4 inhibition raises statin levels significantly" },
  { d1:"aspirin", d2:"ibuprofen", severity:"moderate", effect:"Ibuprofen may reduce cardioprotective effect of aspirin", mechanism:"Competitive COX-1 binding" },
  { d1:"atenolol", d2:"verapamil", severity:"major", effect:"Severe bradycardia and heart block", mechanism:"Additive AV node suppression" },
  { d1:"furosemide", d2:"gentamicin", severity:"major", effect:"Enhanced ototoxicity and nephrotoxicity", mechanism:"Additive renal/hearing toxicity" },
];

// --- Medicine suggestions for quick testing --------------------------------
const SUGGESTED_MEDS = [
  { name:"Metformin",      cat:"Diabetes",        icon:"🩺" },
  { name:"Amlodipine",     cat:"Blood Pressure",  icon:"❤️" },
  { name:"Atorvastatin",   cat:"Cholesterol",     icon:"💉" },
  { name:"Aspirin",        cat:"Blood Thinner",   icon:"🩸" },
  { name:"Warfarin",       cat:"Anticoagulant",   icon:"⚠️" },
  { name:"Lisinopril",     cat:"BP / Heart",      icon:"❤️" },
  { name:"Omeprazole",     cat:"Acidity",         icon:"💊" },
  { name:"Simvastatin",    cat:"Cholesterol",     icon:"💉" },
  { name:"Ibuprofen",      cat:"Pain / Anti-inflam", icon:"💊" },
  { name:"Furosemide",     cat:"Diuretic",        icon:"💧" },
  { name:"Digoxin",        cat:"Heart Failure",   icon:"❤️" },
  { name:"Clopidogrel",    cat:"Antiplatelet",    icon:"🩸" },
  { name:"Levothyroxine",  cat:"Thyroid",         icon:"🦋" },
  { name:"Glipizide",      cat:"Diabetes",        icon:"🩺" },
  { name:"Tramadol",       cat:"Pain",            icon:"💊" },
  { name:"Ciprofloxacin",  cat:"Antibiotic",      icon:"🔬" },
];

// --- Medication schedule timing rules --------------------------------------
const SCHEDULE_RULES = {
  "with food": ["metformin","ibuprofen","aspirin","naproxen","iron"],
  "empty stomach": ["levothyroxine","alendronate","omeprazole","pantoprazole"],
  "morning": ["levothyroxine","amlodipine","lisinopril","atorvastatin"],
  "night": ["simvastatin","rosuvastatin","amlodipine","nitrates"],
  "avoid together": KNOWN_INTERACTIONS.filter(i=>i.severity==="major").map(i=>[i.d1,i.d2]),
};

// --- Utility helpers --------------------------------------------------------
const sleep = ms => new Promise(r => setTimeout(r, ms));
const normalize = s => s?.toLowerCase().trim().replace(/[^a-z0-9\s]/g,"") || "";

async function callClaude(userMsg, system) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system,
      messages:[{role:"user", content: userMsg}]
    })
  });
  const d = await r.json();
  return d.content?.[0]?.text || "";
}

async function callClaudeVision(imageBase64, prompt) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      model:"claude-sonnet-4-20250514",
      max_tokens:500,
      messages:[{role:"user", content:[
        {type:"image", source:{type:"base64", media_type:"image/jpeg", data:imageBase64}},
        {type:"text", text:prompt}
      ]}]
    })
  });
  const d = await r.json();
  return d.content?.[0]?.text || "";
}

// ── Google Cloud Vision API — pill label OCR (works in all browsers/apps) ────
// To enable outside Claude.ai:
//  1. Go to console.cloud.google.com → Enable "Cloud Vision API"
//  2. APIs & Services → Credentials → Create API Key
//  3. Paste your key below
const GOOGLE_VISION_API_KEY = "AIzaSyBoGMQxWsQMMXV5iBF-YHOmDJyc1ZV-7go"; // ← replace with your key

async function detectMedicineFromImage(imageBase64) {
  if(!GOOGLE_VISION_API_KEY || GOOGLE_VISION_API_KEY === "AIzaSyBoGMQxWsQMMXV5iBF-YHOmDJyc1ZV-7go") {
    return { name: null, confidence: 0, rawText: "", noKey: true };
  }
  try {
    const url  = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;
    const body = {
      requests: [{
        image: { content: imageBase64 },
        features: [
          { type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 },
          { type: "TEXT_DETECTION",          maxResults: 1 },
        ]
      }]
    };
    const r    = await fetch(url, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
    const data = await r.json();
    const ann  = data.responses?.[0];
    if(!ann) return { name: null, confidence: 0, rawText: "" };

    const rawText = ann.fullTextAnnotation?.text || ann.textAnnotations?.[0]?.description || "";
    if(!rawText) return { name: null, confidence: 0, rawText: "" };

    // Pick the most likely drug name: longest capitalised word/phrase in first 5 lines
    const lines   = rawText.split("\n").map(l => l.trim()).filter(l => l.length > 2).slice(0, 8);
    const scored  = lines
      .map(line => ({ line: line.replace(/[^a-zA-Z\s]/g, "").trim(), raw: line }))
      .filter(x => x.line.length > 2 && /[A-Za-z]/.test(x.line))
      .sort((a, b) => b.line.length - a.line.length);

    const name       = scored[0]?.raw || lines[0] || "Unknown";
    const confidence = rawText.length > 8 ? Math.min(92, 55 + scored[0]?.line.length) : 15;
    return { name, confidence, rawText };
  } catch(e) {
    console.error("Vision API error:", e);
    return { name: null, confidence: 0, rawText: "", error: e.message };
  }
}

async function fetchOpenFDA(drug1, drug2) {
  try {
    const q = encodeURIComponent(`"${drug1}" AND "${drug2}"`);
    const r = await fetch(`https://api.fda.gov/drug/label.json?search=drug_interactions:${q}&limit=1`);
    const d = await r.json();
    return d.results?.[0]?.drug_interactions?.[0] || null;
  } catch { return null; }
}

function checkBeers(drugName) {
  const n = normalize(drugName);
  return BEERS_CRITERIA.find(b => n.includes(normalize(b.drug)) || normalize(b.drug).includes(n));
}

function checkLocalInteraction(d1, d2) {
  const n1 = normalize(d1), n2 = normalize(d2);
  return KNOWN_INTERACTIONS.find(i =>
    (normalize(i.d1).includes(n1) || n1.includes(normalize(i.d1))) &&
    (normalize(i.d2).includes(n2) || n2.includes(normalize(i.d2))) ||
    (normalize(i.d1).includes(n2) || n2.includes(normalize(i.d1))) &&
    (normalize(i.d2).includes(n1) || n1.includes(normalize(i.d2)))
  );
}

function buildSchedule(drugs) {
  const morning=[], afternoon=[], evening=[], night=[];
  const usedPairs = new Set();

  drugs.forEach(drug => {
    const n = normalize(drug);
    const isEvening = SCHEDULE_RULES.night.some(d => n.includes(d));
    const isMorning = SCHEDULE_RULES.morning.some(d => n.includes(d));
    const withFood = SCHEDULE_RULES["with food"].some(d => n.includes(d));
    const emptyStomach = SCHEDULE_RULES["empty stomach"].some(d => n.includes(d));

    if (emptyStomach && isMorning) morning.unshift({drug, note:"30 min before breakfast"});
    else if (isEvening) night.push({drug, note:"After dinner"});
    else if (isMorning) morning.push({drug, note: withFood ? "With breakfast" : "Morning"});
    else afternoon.push({drug, note: withFood ? "With lunch" : "Afternoon"});
  });

  // Separate major-interaction pairs into different slots
  KNOWN_INTERACTIONS.filter(i=>i.severity==="major").forEach(inter => {
    const find = (list, name) => list.find(e => normalize(e.drug).includes(normalize(name)) || normalize(name).includes(normalize(e.drug)));
    const inMorn1 = find(morning, inter.d1), inMorn2 = find(morning, inter.d2);
    if (inMorn1 && inMorn2) {
      evening.push(morning.splice(morning.indexOf(inMorn2),1)[0]);
    }
  });

  return { morning, afternoon, evening, night };
}

// --- Responsive hook --------------------------------------------------------
function useBreakpoint() {
  const [bp, setBp] = useState(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1024;
    if(w < 640)  return "mobile";
    if(w < 1024) return "tablet";
    return "desktop";
  });
  useEffect(() => {
    const fn = () => {
      const w = window.innerWidth;
      setBp(w < 640 ? "mobile" : w < 1024 ? "tablet" : "desktop");
    };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return bp;
}


// --- Styles -----------------------------------------------------------------
const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;0,900;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    html { font-size:16px; }
    body { font-family:'Plus Jakarta Sans',sans-serif; -webkit-font-smoothing:antialiased; min-height:100vh; background:#EEF4F9; }
    /* Clinical crosshatch pattern on background */
    .rsp-shell { background: #EEF4F9; }
    .serif { font-family:'Merriweather',serif; }
    ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:#E7E0D8;border-radius:10px}
    @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
    @keyframes spin{to{transform:rotate(360deg)}}
    .fi{animation:fadeIn .4s ease both}
    .fi1{animation:fadeIn .4s .07s ease both}
    .fi2{animation:fadeIn .4s .14s ease both}
    .fi3{animation:fadeIn .4s .21s ease both}
    .fi4{animation:fadeIn .4s .28s ease both}
    .spin{animation:spin .9s linear infinite}
    .pulse{animation:pulse 1.5s ease infinite}
    .card{background:#fff;border:1px solid #E2E8F0;border-radius:14px;transition:box-shadow .22s,transform .18s;box-shadow:0 1px 4px rgba(3,105,161,.06)}
    .card:hover{box-shadow:0 6px 24px rgba(3,105,161,.12);transform:translateY(-2px)}
    .card-warm{background:#F4F9FC;border:1px solid #E2E8F0;border-radius:14px}
    .btn{display:inline-flex;align-items:center;gap:7px;padding:10px 18px;border-radius:10px;font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;border:none;transition:all .18s;white-space:nowrap}
    .btn-primary{background:linear-gradient(135deg,#0369A1,#0284C7);color:#fff;box-shadow:0 2px 8px rgba(3,105,161,.25)}
    .btn-primary:hover{background:linear-gradient(135deg,#075985,#0369A1);box-shadow:0 4px 16px rgba(3,105,161,.35);transform:translateY(-1px)}
    .btn-secondary{background:#fff;color:#0369A1;border:1.5px solid #0369A1}
    .btn-secondary:hover{background:#E0F2FE;border-color:#075985;color:#075985;transform:translateY(-1px)}
    .btn-teal{background:#0D6E6E;color:#fff}
    .btn-teal:hover{background:#0a5c5c}
    .btn-ghost{background:transparent;color:#57534E;padding:8px 10px}
    .btn-ghost:hover{background:#F7F3EE;color:#1C1917}
    .btn-sm{padding:7px 12px;font-size:13px;border-radius:8px}
    .btn-lg{padding:13px 20px;font-size:15px;border-radius:12px;font-weight:600}
    .input{width:100%;padding:10px 14px;border:1.5px solid #E7E0D8;border-radius:10px;font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;color:#1C1917;background:#fff;outline:none;transition:border-color .15s,box-shadow .15s}
    .input:focus{border-color:#0369A1;box-shadow:0 0 0 3px rgba(3,105,161,.12)}
    .badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:99px;font-size:11px;font-weight:600}
    .badge-major{background:#FEE2E2;color:#991B1B}
    .badge-moderate{background:#FEF3C7;color:#92400E}
    .badge-minor{background:#ECFDF5;color:#065F46}
    .badge-high{background:#FEE2E2;color:#991B1B}
    .badge-beers{background:#FFF3E0;color:#B45309;border:1px solid #FCD34D}
    .tab{padding:9px 16px;border-radius:9px;font-size:14px;font-weight:500;cursor:pointer;transition:all .15s;color:#57534E;border:none;background:transparent}
    .tab.on{background:linear-gradient(135deg,#0369A1,#0284C7);color:#fff;box-shadow:0 2px 8px rgba(3,105,161,.25)}
    .tab:not(.on):hover{background:#E0F2FE;color:#0369A1;}
    .tag{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;background:#E0F2FE;border:1.5px solid #BAE6FD;border-radius:99px;font-size:13px;font-weight:600;color:#075985}
    .sev-major{border-left:4px solid #DC2626;background:linear-gradient(to right,#FEF2F2,#fff)}
    .sev-moderate{border-left:4px solid #D97706;background:linear-gradient(to right,#FFFBEB,#fff)}
    .sev-minor{border-left:4px solid #059669;background:linear-gradient(to right,#ECFDF5,#fff)}
    .sev-beers{border-left:4px solid #F59E0B;background:linear-gradient(to right,#FFFBEB,#fff)}
    .drag{border:2px dashed #CBD5E1;border-radius:14px;padding:32px;text-align:center;cursor:pointer;transition:all .2s;background:#F0F8FF}
    .drag:hover,.drag.over{border-color:#0369A1;background:#E0F2FE;box-shadow:0 4px 16px rgba(3,105,161,.12)}
    .slot{background:#fff;border:1.5px solid #E2E8F0;border-radius:13px;padding:15px 16px;box-shadow:0 1px 4px rgba(3,105,161,.06)}
    .slot-label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px}
    .section-title{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#A8A29E;margin-bottom:10px}
    details>summary{cursor:pointer;list-style:none;outline:none}
    details>summary::-webkit-details-marker{display:none}
    .notify-sent{background:#ECFDF5;border:1px solid #A7F3D0;border-radius:10px;padding:12px 16px;color:#065F46;font-size:13px}

    /* ============================================================
       RESPONSIVE LAYOUT SYSTEM
         Mobile   < 640px       bottom nav  ·  1-col full width
         Tablet   640–1023px    bottom nav  ·  2-col content
         Laptop   1024–1279px   sidebar     ·  fluid content col
         Desktop  1280–1535px   wide sidebar·  wide content
         4K       ≥ 1536px      wider layout
       ============================================================ */

    /* Shell wrapper */
    .rsp-shell { display:flex; min-height:100vh; background:#F7F3EE; }

    /* -- Sidebar -- */
    .rsp-sidebar {
      width:230px; flex-shrink:0;
      background:#fff; border-right:1px solid #E7E0D8;
      display:flex; flex-direction:column;
      position:fixed; top:0; left:0; bottom:0; z-index:50;
    }
    .rsp-sidebar-logo { padding:20px 20px 16px; border-bottom:1px solid #E7E0D8; margin-bottom:8px; }
    .rsp-nav-item {
      display:flex; align-items:center; gap:10px;
      padding:10px 16px; margin:2px 8px; border-radius:10px;
      border:none; background:transparent; cursor:pointer;
      font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; font-weight:500;
      color:#57534E; transition:all .15s; text-align:left; width:calc(100% - 16px);
    }
    .rsp-nav-item.on { background:linear-gradient(135deg,#E0F2FE,#EFF6FF); color:#0369A1; font-weight:700; border-right:3px solid #0369A1; border-radius:10px 0 0 10px; }
    .rsp-nav-item:not(.on):hover { background:#F7F3EE; color:#1C1917; }
    .rsp-nav-badge {
      margin-left:auto; font-size:10px; font-weight:700;
      padding:2px 7px; border-radius:99px; background:#E0F2FE; color:#0369A1;
    }
    .rsp-sidebar-footer {
      padding:16px; margin-top:auto; border-top:1px solid #E7E0D8;
    }

    /* -- Main column (laptop+) -- */
    .rsp-main { flex:1; margin-left:230px; min-height:100vh; display:flex; flex-direction:column; }

    /* -- Topbar (laptop+) -- */
    .rsp-topbar {
      background:#fff; border-bottom:1px solid #E7E0D8;
      padding:14px 32px; display:flex; align-items:center; justify-content:space-between;
      position:sticky; top:0; z-index:40;
    }

    /* -- Page content area (laptop+) -- */
    .rsp-content { flex:1; padding:28px 32px; width:100%; }

    /* -- Mobile/Tablet header -- */
    .rsp-header {
      background:#fff; border-bottom:1px solid #E7E0D8;
      padding:12px 18px; display:flex; align-items:center; justify-content:space-between;
      position:sticky; top:0; z-index:40;
    }

    /* -- Bottom nav -- */
    .rsp-bottom {
      background:#fff; border-top:1px solid #E7E0D8;
      position:fixed; bottom:0; left:0; right:0; z-index:50;
      display:flex; justify-content:space-around; padding:6px 4px 10px;
    }
    .rsp-bottom-item {
      display:flex; flex-direction:column; align-items:center; gap:3px;
      padding:7px 10px; border-radius:12px; border:none; cursor:pointer;
      transition:all .15s; font-family:'Plus Jakarta Sans',sans-serif;
      font-size:10px; font-weight:600; background:transparent; color:#A8A29E;
    }
    .rsp-bottom-item.on { color:#0369A1; background:#E0F2FE; }
    .rsp-bottom-item:not(.on):hover { color:#57534E; background:#F7F3EE; }

    /* -- Page body scroll area -- */
    .rsp-body { overflow-y:auto; }

    /* -- Responsive grid helpers -- */
    /* g2: 2-col on tablet+, 1-col on mobile */
    .g2 { display:grid; gap:16px; grid-template-columns:1fr; }
    /* g2d: 2-col on desktop only */
    .g2d { display:block; }
    /* slots: 2-col on laptop+ */
    .gslots { display:block; }

    /* -- MOBILE (<640px) -- */
    @media (max-width:639px) {
      .rsp-sidebar  { display:none; }
      .rsp-main     { margin-left:0; }
      .rsp-topbar   { display:none; }
      .rsp-content  { padding:18px 14px 90px; }
      .input        { font-size:16px; }
    }

    /* -- TABLET (640–1023px) -- */
    @media (min-width:640px) and (max-width:1023px) {
      .rsp-sidebar  { display:none; }
      .rsp-main     { margin-left:0; }
      .rsp-topbar   { display:none; }
      .rsp-content  { padding:22px 20px 90px; }
      .rsp-header   { padding:13px 20px; }
      .g2           { grid-template-columns:1fr 1fr; }
      .input        { font-size:15px; }
    }

    /* -- LAPTOP (1024–1279px) -- */
    @media (min-width:1024px) {
      .rsp-sidebar    { display:flex; width:230px; }
      .rsp-main       { margin-left:230px; }
      .rsp-bottom     { display:none !important; }
      .rsp-header     { display:none !important; }
      .rsp-content    { padding:26px 32px 40px; }
      .rsp-topbar     { display:flex; padding:14px 32px; }
      .g2             { grid-template-columns:1fr 1fr; }
      .gslots         { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    }

    /* -- DESKTOP (1280–1535px) -- */
    @media (min-width:1280px) {
      .rsp-sidebar    { width:250px; }
      .rsp-main       { margin-left:250px; }
      .rsp-content    { padding:30px 40px 40px; max-width:1080px; }
      .rsp-topbar     { padding:16px 40px; }
      .g2d            { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
      .gslots         { grid-template-columns:1fr 1fr; }
    }

    /* -- 4K (≥1536px) -- */
    @media (min-width:1536px) {
      .rsp-sidebar    { width:270px; }
      .rsp-main       { margin-left:270px; }
      .rsp-content    { padding:36px 48px 40px; max-width:1260px; }
      .rsp-topbar     { padding:18px 48px; }
    }

    /* span full width in any grid */
    .span2 { grid-column:1/-1; }
  `}</style>
);

// --- Icons ------------------------------------------------------------------
const Ic = ({p,s=18,c="currentColor"}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(p)?p.map((d,i)=><path key={i} d={d}/>):<path d={p}/>}
  </svg>
);
const ICONS = {
  pill:     ["M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3","M19.5 18.5c-.83 1.44-2.15 2.5-3.5 2.5s-2.67-1.06-3.5-2.5-.83-3.06 0-4.5 2.15-2.5 3.5-2.5 2.67 1.06 3.5 2.5.83 3.06 0 4.5z"],
  warn:     "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  check:    "M20 6 9 17l-5-5",
  plus:     "M12 5v14M5 12h14",
  trash:    "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
  search:   "M11 17.25a6.25 6.25 0 1 1 0-12.5 6.25 6.25 0 0 1 0 12.5zM16 16l4.5 4.5",
  camera:   "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  bell:     "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  clock:    "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2",
  history:  "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M12 7v5l4 2",
  shield:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  map:      "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  mail:     "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  phone:    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 17z",
  close:    "M18 6 6 18M6 6l12 12",
  info:     "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8h.01M11 12h1v4h1",
  sun:      "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42",
  moon:     "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
  star:     "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
};


// --- Nav ---------------------------------------------------------------------
function Nav({page, setPage, drugs, hasDanger, user, onLogout}) {
  const bp = useBreakpoint();
  const items = [
    {id:"check",    label:"Check",    icon:"shield"},
    {id:"scan",     label:"Scan Pill",icon:"camera"},
    {id:"schedule", label:"Schedule", icon:"clock"},
    {id:"history",  label:"History",  icon:"history"},
    {id:"alerts",   label:"Alerts",   icon:"bell"},
  ];

  // Desktop/Laptop → Sidebar
  if(bp === "desktop" || bp === "laptop") return (
    <aside className="rsp-sidebar">
      <div className="rsp-sidebar-logo">
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:"#0369A1",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Ic p={ICONS.shield} s={18} c="#fff"/>
          </div>
          <div>
            <div className="serif" style={{fontSize:16,fontWeight:700,color:"#1C1917",lineHeight:1.2}}>MediCheck</div>
            <div style={{fontSize:10,color:"#A8A29E",fontWeight:500}}>Polypharmacy · </div>
          </div>
        </div>
      </div>

      <nav style={{flex:1,overflowY:"auto",padding:"4px 0"}}>
        {items.map(item => (
          <button
            key={item.id}
            className={`rsp-nav-item ${page===item.id?"on":""}`}
            onClick={() => setPage(item.id)}
          >
            <Ic p={ICONS[item.icon]} s={18}/>
            {item.label}
            {item.id==="alerts" && hasDanger && (
              <span className="rsp-nav-badge" style={{background:"#FEF2F2",color:"#B91C1C"}}>!</span>
            )}
            {item.id==="check" && drugs.length > 0 && (
              <span className="rsp-nav-badge">{drugs.length}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="rsp-sidebar-footer">
        {/* User card */}
        {user && (
          <div style={{marginBottom:10,padding:"12px",background:"linear-gradient(135deg,#EFF6FF,#E0F2FE)",borderRadius:12,border:"1px solid #BAE6FD"}}>
            <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:10}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#0369A1,#0284C7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#fff",flexShrink:0}}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:"#0F172A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div>
                <div style={{fontSize:10,color:"#64748B",textTransform:"capitalize",fontWeight:500}}>{user.role||"User"}</div>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,borderTop:"1px solid rgba(3,105,161,.12)"}}>
              <div>
                <div style={{fontSize:22,fontWeight:800,color:drugs.length>0?"#0369A1":"#CBD5E1",fontFamily:"'Merriweather',serif",lineHeight:1}}>{drugs.length}</div>
                <div style={{fontSize:9,color:"#94A3B8",fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",marginTop:2}}>Medicines</div>
              </div>
              <button onClick={onLogout} style={{background:"#fff",border:"1.5px solid #E2E8F0",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:11,color:"#64748B",fontFamily:"inherit",fontWeight:700,transition:"all .15s"}}
                onMouseOver={e=>{e.currentTarget.style.borderColor="#DC2626";e.currentTarget.style.color="#DC2626";}}
                onMouseOut={e=>{e.currentTarget.style.borderColor="#E2E8F0";e.currentTarget.style.color="#64748B";}}>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );

  // Mobile/Tablet → Bottom bar
  return (
    <nav className="rsp-bottom">
      {items.map(item => (
        <button
          key={item.id}
          className={`rsp-bottom-item ${page===item.id?"on":""}`}
          onClick={() => setPage(item.id)}
        >
          <div style={{position:"relative"}}>
            <Ic p={ICONS[item.icon]} s={bp==="tablet"?22:20}/>
            {item.id==="alerts" && hasDanger && (
              <span style={{position:"absolute",top:-3,right:-3,width:8,height:8,borderRadius:"50%",background:"#B91C1C",display:"block"}}/>
            )}
          </div>
          <span style={{fontSize:bp==="tablet"?11:10}}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

// --- Drug Input Tag ----------------------------------------------------------
function DrugTag({name,onRemove}) {
  const beers = checkBeers(name);
  return (
    <span className="tag" style={{background:beers?T.warnSoft:"",borderColor:beers?"#FCD34D":""}}>
      <Ic p={ICONS.pill} s={13} c={beers?T.warn:T.primary}/>
      {name}
      {beers && <span style={{fontSize:10,background:"#F59E0B",color:"#fff",padding:"1px 5px",borderRadius:99,fontWeight:700}}>Beers</span>}
      <button onClick={onRemove} style={{background:"none",border:"none",cursor:"pointer",color:T.textLight,padding:"0 0 0 2px",display:"flex"}}>
        <Ic p={ICONS.close} s={12}/>
      </button>
    </span>
  );
}

// --- Interaction Result Card -------------------------------------------------
function InteractionCard({inter,idx}) {
  const [exp, setExp] = useState(false);
  const cls = `sev-${inter.severity}`;
  const bc = {major:T.danger,moderate:T.warn,minor:T.safe}[inter.severity]||T.textMid;
  return (
    <div className={`card ${cls} fi`} style={{padding:"14px 16px",marginBottom:10,borderRadius:14,animationDelay:`${idx*.06}s`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
        <div>
          <span style={{fontWeight:700,fontSize:15}}>{inter.d1}</span>
          <span style={{color:T.textLight,margin:"0 6px",fontSize:13}}>+</span>
          <span style={{fontWeight:700,fontSize:15}}>{inter.d2}</span>
        </div>
        <span className={`badge badge-${inter.severity}`} style={{textTransform:"capitalize",flexShrink:0,marginLeft:8}}>
          {inter.severity==="major"&&"WARNING: "}{inter.severity}
        </span>
      </div>
      <p style={{fontSize:13,lineHeight:1.55,color:T.textMid,marginBottom:6}}>{inter.effect}</p>
      {inter.mechanism&&(
        <details open={exp}>
          <summary onClick={()=>setExp(!exp)} style={{fontSize:12,color:bc,fontWeight:600,cursor:"pointer"}}>
            {exp?"▴":"▾"} Mechanism
          </summary>
          <p style={{fontSize:12,color:T.textMid,marginTop:4,paddingLeft:8,lineHeight:1.5}}>{inter.mechanism}</p>
        </details>
      )}
      {inter.consultant&&(
        <div style={{marginTop:8,padding:"6px 10px",background:"rgba(255,255,255,.6)",borderRadius:8,fontSize:12,color:T.teal,fontWeight:500}}>
          👨‍⚕️ Consult: {inter.consultant}
        </div>
      )}
      {inter.fdaSource&&<p style={{fontSize:10,color:T.textLight,marginTop:6}}>Source: OpenFDA drug label</p>}
    </div>
  );
}

// --- Beers Card --------------------------------------------------------------
function BeersCard({drug,data,idx}) {
  return (
    <div className="sev-beers card fi" style={{padding:"14px 16px",marginBottom:10,borderRadius:14,animationDelay:`${idx*.06}s`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <span style={{fontWeight:700,fontSize:15}}>{drug}</span>
        <span className="badge badge-beers">AGS Beers 2023 · {data.category}</span>
      </div>
      <p style={{fontSize:13,color:T.textMid,lineHeight:1.5,marginBottom:4}}>{data.reason}</p>
      <span className={`badge badge-${data.severity}`} style={{textTransform:"capitalize"}}>
        {data.severity} risk
      </span>
    </div>
  );
}

// --- Check Page ---------------------------------------------------------------
function CheckPage({drugs,setDrugs,results,setResults,patientName,setPatientName,patientAge,setPatientAge,caregiverEmail,setCaregiverEmail}) {
  const [input,setInput]       = useState("");
  const [loading,setLoading]   = useState(false);
  const [phase,setPhase]       = useState("");
  const [phaseStep,setPhaseStep] = useState(0);
  const [beersFlags,setBeersFlags] = useState([]);
  const [checked,setChecked]   = useState(false);

  const addDrug = () => {
    const t = input.trim();
    if(!t) return;
    if(drugs.map(d=>d.toLowerCase()).includes(t.toLowerCase())){
      setInput(""); return;
    }
    // Capitalise first letter for display
    setDrugs(p=>[...p, t.charAt(0).toUpperCase()+t.slice(1)]);
    setInput("");
  };

  const removeDrug = name => {
    setDrugs(p=>p.filter(d=>d!==name));
    // Reset results if list changes after a check
    setChecked(false);
    setResults([]);
    setBeersFlags([]);
  };

  const PHASES = [
    "Step 1 / 4 - Checking AGS Beers Criteria…",
    "Step 2 / 4 - Scanning drug interaction database…",
    "Step 3 / 4 - Querying OpenFDA database…",
    "Step 4 / 4 - Generating AI plain-language summary…",
  ];

  const runCheck = async () => {
    if(drugs.length<2){ alert("Please enter at least 2 medicines to check."); return; }
    setLoading(true);
    setResults([]);
    setBeersFlags([]);
    setChecked(false);

    // -- Step 1: Beers Criteria (local, instant) ------------------------------
    setPhase(PHASES[0]); setPhaseStep(1);
    await sleep(400);
    const bf = drugs
      .map(d=>({ drug:d, data:checkBeers(d) }))
      .filter(x=>x.data);
    setBeersFlags(bf);

    // -- Step 2: Local known-interaction DB -----------------------------------
    setPhase(PHASES[1]); setPhaseStep(2);
    await sleep(500);
    const pairs = [];
    for(let i=0;i<drugs.length;i++){
      for(let j=i+1;j<drugs.length;j++){
        const local = checkLocalInteraction(drugs[i], drugs[j]);
        if(local) pairs.push({ ...local, fdaSource:false });
      }
    }

    // -- Step 3: OpenFDA - only for pairs NOT already found locally -----------
    setPhase(PHASES[2]); setPhaseStep(3);
    const checkedPairs = new Set(pairs.map(p=>`${normalize(p.d1)}|${normalize(p.d2)}`));
    for(let i=0;i<drugs.length;i++){
      for(let j=i+1;j<drugs.length;j++){
        const key1 = `${normalize(drugs[i])}|${normalize(drugs[j])}`;
        const key2 = `${normalize(drugs[j])}|${normalize(drugs[i])}`;
        if(!checkedPairs.has(key1)&&!checkedPairs.has(key2)){
          const fdaText = await fetchOpenFDA(drugs[i], drugs[j]);
          if(fdaText){
            pairs.push({
              d1: drugs[i], d2: drugs[j],
              severity: "moderate",
              effect: fdaText.slice(0,200),
              mechanism: "See full FDA drug label for details",
              fdaSource: true
            });
            checkedPairs.add(key1);
          }
        }
      }
    }

    // -- Step 4: Claude AI - plain-language per interaction -------------------
    setPhase(PHASES[3]); setPhaseStep(4);

    let enriched = [];
    if(pairs.length > 0){
      enriched = await Promise.all(pairs.map(async p=>{
        const consultMap = {
          major:    "Visit a doctor or emergency room immediately",
          moderate: "Consult your General Physician soon",
          minor:    "Ask your pharmacist for guidance",
        };
        try{
          const sentence = await callClaude(
            `Drug interaction between "${p.d1}" and "${p.d2}".
Severity: ${p.severity}.
Clinical effect: ${p.effect}.
Write ONE sentence (max 25 words) explaining the risk in simple English that an elderly patient's family member can understand.
Do NOT start with "This" - start directly with the risk.`,
            "You are a senior clinical pharmacist. Return ONLY the one plain-language sentence. No preamble, no quotes, no full stops at the end."
          );
          return {
            ...p,
            plainLanguage: sentence.trim().replace(/^["']|["']$/g,""),
            consultant: consultMap[p.severity] || "Ask your pharmacist",
          };
        } catch {
          return {
            ...p,
            plainLanguage: p.effect,
            consultant: consultMap[p.severity] || "Ask your pharmacist",
          };
        }
      }));
    }

    // -- Done -----------------------------------------------------------------
    setResults(enriched);
    setChecked(true);
    setLoading(false);
    setPhase("");
    setPhaseStep(0);
  };

  // Derive summary flags
  const hasMajor    = results.some(r=>r.severity==="major");
  const hasModerate = results.some(r=>r.severity==="moderate");
  const allSafe     = checked && results.length===0 && beersFlags.length===0;
  const safeButBeers = checked && results.length===0 && beersFlags.length>0;

  // Total pairs checked (for display)
  const totalPairs = drugs.length > 1
    ? (drugs.length * (drugs.length - 1)) / 2
    : 0;

  return (
    <div>

      {/* Header - hidden on desktop since topbar shows the title */}
      <div className="fi" style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
          <div style={{width:36,height:36,borderRadius:10,background:T.primary,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Ic p={ICONS.shield} s={18} c="#fff"/>
          </div>
          <h1 className="serif" style={{fontSize:22,fontWeight:700}}>Polypharmacy Risk Check</h1>
        </div>
        <p style={{fontSize:13,color:T.textMid,paddingLeft:46}}>For elderly patients on multiple medications</p>
      </div>

      {/* Patient info + Drug input side-by-side on desktop */}
      <div className="g2d">
      {/* Patient info */}
      <div className="card fi1" style={{padding:"16px",marginBottom:16}}>
        <p className="section-title">Patient Details</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div>
            <label style={{fontSize:12,color:T.textMid,display:"block",marginBottom:4}}>Patient Name</label>
            <input className="input" value={patientName} onChange={e=>setPatientName(e.target.value)} placeholder="Enter patient name"/>
          </div>
          <div>
            <label style={{fontSize:12,color:T.textMid,display:"block",marginBottom:4}}>Age</label>
            <input className="input" value={patientAge} onChange={e=>setPatientAge(e.target.value)} placeholder="Enter age" type="number" min="1" max="120"/>
          </div>
        </div>
        <div style={{marginTop:10}}>
          <label style={{fontSize:12,color:T.textMid,display:"block",marginBottom:4}}>Caregiver Email (for alerts)</label>
          <input className="input" value={caregiverEmail} onChange={e=>setCaregiverEmail(e.target.value)} placeholder="Enter caregiver email" type="email"/>
        </div>
      </div>

      {/* Drug Input */}
      <div className="card fi2" style={{padding:"16px",marginBottom:16}}>
        <p className="section-title">Add Medicines ({drugs.length})</p>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <input
            className="input"
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&addDrug()}
            placeholder="Type medicine name and press Enter…"
            disabled={loading}
          />
          <button className="btn btn-primary btn-sm" onClick={addDrug} disabled={loading||!input.trim()}>
            <Ic p={ICONS.plus} s={16}/>
          </button>
        </div>
        {drugs.length>0 ? (
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {drugs.map(d=><DrugTag key={d} name={d} onRemove={()=>removeDrug(d)}/>)}
          </div>
        ):(
          <p style={{fontSize:13,color:T.textLight,textAlign:"center",padding:"12px 0"}}>
            No medicines added yet - type a name above and press Enter
          </p>
        )}
        {drugs.length===1&&(
          <p style={{fontSize:12,color:T.warn,marginTop:10,background:T.warnSoft,padding:"7px 10px",borderRadius:8,border:`1px solid #FCD34D`,display:"flex",gap:6,alignItems:"flex-start"}}>
            <span>ℹ️</span><span>Add at least one more medicine to check interactions.</span>
          </p>
        )}
      </div>

      {/* Medicine suggestions for quick testing */}
      <div className="card fi3" style={{padding:"14px 16px",marginBottom:16,background:"linear-gradient(135deg,#F0F9FF,#EFF6FF)",border:"1px solid #BAE6FD"}}>
        <p className="section-title" style={{color:"#0369A1",marginBottom:10}}>
          Quick Add — Common Medicines to Test
        </p>
        <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
          {SUGGESTED_MEDS.filter(m => !drugs.map(d=>d.toLowerCase()).includes(m.name.toLowerCase())).map(m=>(
            <button key={m.name}
              onClick={()=>{
                if(!drugs.map(d=>d.toLowerCase()).includes(m.name.toLowerCase()))
                  setDrugs(p=>[...p, m.name]);
              }}
              style={{
                display:"inline-flex",alignItems:"center",gap:6,
                padding:"5px 12px",background:"#fff",
                border:"1.5px solid #BAE6FD",borderRadius:99,
                fontSize:12,fontWeight:600,color:"#075985",
                cursor:"pointer",transition:"all .15s",
                fontFamily:"'Plus Jakarta Sans',sans-serif"
              }}
              onMouseOver={e=>{e.currentTarget.style.background="#E0F2FE";e.currentTarget.style.borderColor="#0369A1";}}
              onMouseOut={e=>{e.currentTarget.style.background="#fff";e.currentTarget.style.borderColor="#BAE6FD";}}
            >
              <span style={{fontSize:13}}>{m.icon}</span>
              <span>{m.name}</span>
              <span style={{fontSize:10,color:"#94A3B8",fontWeight:500}}>{m.cat}</span>
            </button>
          ))}
        </div>
        <p style={{fontSize:11,color:"#94A3B8",marginTop:9}}>
          Tip: Try adding <strong>Warfarin + Aspirin</strong> or <strong>Simvastatin + Ciprofloxacin</strong> to see interactions
        </p>
      </div>
      </div>{/* end g2d */}

      {/* Run button */}
      <button
        onClick={runCheck}
        disabled={loading || drugs.length<2}
        style={{
          width:"100%", display:"flex", alignItems:"center", justifyContent:"center",
          gap:8, padding:"14px", fontSize:15, fontWeight:600, borderRadius:12, border:"none",
          fontFamily:"'Plus Jakarta Sans',sans-serif", cursor: drugs.length<2||loading ? "not-allowed":"pointer",
          background: drugs.length<2 ? T.border : loading ? "#9CA3AF" : T.primary,
          color: drugs.length<2 ? T.textLight : "#fff",
          transition:"all .2s",
        }}
      >
        {loading ? (
          <>
            <span style={{display:"inline-block",width:17,height:17,border:"2.5px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .9s linear infinite"}}/>
            {phase || "Checking…"}
          </>
        ):(
          <><Ic p={ICONS.shield} s={18}/>Check All Interactions ({totalPairs} pair{totalPairs!==1?"s":""})</>
        )}
      </button>

      {/* Progress bar while loading */}
      {loading&&(
        <div className="fi" style={{marginTop:12}}>
          <div style={{height:5,background:T.border,borderRadius:99,overflow:"hidden"}}>
            <div style={{
              height:"100%", borderRadius:99, background:T.primary,
              width:`${(phaseStep/4)*100}%`, transition:"width .4s ease"
            }}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
            {[1,2,3,4].map(s=>(
              <span key={s} style={{
                fontSize:10,fontWeight:600,
                color: phaseStep>=s ? T.primary : T.textLight
              }}>
                {["Beers","DB Scan","OpenFDA","AI"][s-1]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* -- RESULTS SECTION ------------------------------------------------ */}
      {checked && !loading && (
        <div style={{marginTop:20}}>

          {/*  ALL SAFE - no interactions, no Beers flags */}
          {allSafe && (
            <div className="card fi" style={{
              padding:"28px 20px", textAlign:"center",
              background:"linear-gradient(135deg,#ECFDF5,#D1FAE5)",
              border:`1.5px solid #6EE7B7`
            }}>
              <div style={{
                width:64,height:64,borderRadius:"50%",
                background:"#10B981",display:"flex",alignItems:"center",
                justifyContent:"center",margin:"0 auto 16px",
                boxShadow:"0 4px 20px rgba(16,185,129,.3)"
              }}>
                <Ic p={ICONS.check} s={32} c="#fff"/>
              </div>
              <h3 className="serif" style={{fontSize:20,fontWeight:700,color:"#064E3B",marginBottom:8}}>
                All medicines are safe together ✓
              </h3>
              <p style={{fontSize:14,color:"#065F46",lineHeight:1.7,maxWidth:320,margin:"0 auto 16px"}}>
                No dangerous interactions were found between{" "}
                <strong>{drugs.join(", ")}</strong>.
                This combination appears safe to take together.
              </p>
              <div style={{
                display:"inline-flex",gap:16,padding:"12px 20px",
                background:"rgba(255,255,255,.6)",borderRadius:12,marginBottom:16
              }}>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:22,fontWeight:800,color:"#059669"}}>{totalPairs}</div>
                  <div style={{fontSize:11,color:"#065F46",fontWeight:600}}>Pairs Checked</div>
                </div>
                <div style={{width:1,background:"#A7F3D0"}}/>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:22,fontWeight:800,color:"#059669"}}>0</div>
                  <div style={{fontSize:11,color:"#065F46",fontWeight:600}}>Interactions</div>
                </div>
                <div style={{width:1,background:"#A7F3D0"}}/>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:22,fontWeight:800,color:"#059669"}}>✓</div>
                  <div style={{fontSize:11,color:"#065F46",fontWeight:600}}>Beers Clear</div>
                </div>
              </div>
              <p style={{fontSize:12,color:"#6B7280",lineHeight:1.5}}>
                ℹ️ Always take medicines as prescribed. Consult your pharmacist if you add a new medicine to this list.
              </p>
            </div>
          )}

          {/*  SAFE interactions but Beers flags present */}
          {safeButBeers && (
            <div className="card fi" style={{
              padding:"20px",marginBottom:16,textAlign:"center",
              background:"linear-gradient(135deg,#FFFBEB,#FEF3C7)",
              border:`1.5px solid #FCD34D`
            }}>
              <div style={{fontSize:36,marginBottom:8}}></div>
              <h3 className="serif" style={{fontSize:18,fontWeight:700,color:"#78350F",marginBottom:6}}>
                No drug interactions found
              </h3>
              <p style={{fontSize:13,color:"#92400E",lineHeight:1.6}}>
                The {totalPairs} medicine pair{totalPairs!==1?"s":""} checked show <strong>no dangerous interactions</strong>.
                However, {beersFlags.length} medicine{beersFlags.length!==1?" is":"s are"} flagged on the
                AGS Beers Criteria as potentially inappropriate for elderly patients - see below.
              </p>
            </div>
          )}

          {/* WARNING: DANGEROUS interactions banner */}
          {hasMajor && (
            <div className="fi" style={{
              marginBottom:16,background:T.dangerSoft,
              border:`1.5px solid #FECACA`,borderRadius:14,
              padding:"16px 18px",display:"flex",gap:12,alignItems:"flex-start"
            }}>
              <div style={{
                width:36,height:36,borderRadius:"50%",background:T.danger,
                display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0
              }}>
                <Ic p={ICONS.warn} s={18} c="#fff"/>
              </div>
              <div>
                <p style={{fontWeight:700,color:T.danger,fontSize:15,marginBottom:4}}>
                  ⛔ Dangerous interaction detected
                </p>
                <p style={{fontSize:13,color:"#991B1B",lineHeight:1.6}}>
                  One or more <strong>major interactions</strong> were found in this medicine list.
                  Please <strong>do not stop medicines on your own</strong> - consult a doctor immediately.
                </p>
              </div>
            </div>
          )}

          {/*  Moderate-only banner (no major) */}
          {!hasMajor && hasModerate && (
            <div className="fi" style={{
              marginBottom:16,background:T.warnSoft,
              border:`1.5px solid #FCD34D`,borderRadius:14,
              padding:"14px 16px",display:"flex",gap:10,alignItems:"flex-start"
            }}>
              <Ic p={ICONS.warn} s={20} c={T.warn}/>
              <div>
                <p style={{fontWeight:700,color:T.warn,fontSize:14,marginBottom:2}}>
                  WARNING: Moderate interactions detected
                </p>
                <p style={{fontSize:12,color:"#92400E",lineHeight:1.5}}>
                  These combinations are generally used together but need monitoring. Consult your General Physician.
                </p>
              </div>
            </div>
          )}

          {/* Summary strip */}
          {(results.length>0 || beersFlags.length>0) && (
            <div style={{
              display:"flex",gap:8,marginBottom:16,
              padding:"12px 14px",background:T.surface,
              border:`1px solid ${T.border}`,borderRadius:12
            }}>
              <div style={{flex:1,textAlign:"center",borderRight:`1px solid ${T.border}`,paddingRight:8}}>
                <div style={{fontSize:20,fontWeight:800,color: hasMajor?T.danger:hasModerate?T.warn:T.safe}}>
                  {results.filter(r=>r.severity==="major").length}
                </div>
                <div style={{fontSize:10,color:T.textLight,fontWeight:600,textTransform:"uppercase"}}>Major</div>
              </div>
              <div style={{flex:1,textAlign:"center",borderRight:`1px solid ${T.border}`}}>
                <div style={{fontSize:20,fontWeight:800,color:T.warn}}>
                  {results.filter(r=>r.severity==="moderate").length}
                </div>
                <div style={{fontSize:10,color:T.textLight,fontWeight:600,textTransform:"uppercase"}}>Moderate</div>
              </div>
              <div style={{flex:1,textAlign:"center",borderRight:`1px solid ${T.border}`}}>
                <div style={{fontSize:20,fontWeight:800,color:T.safe}}>
                  {results.filter(r=>r.severity==="minor").length}
                </div>
                <div style={{fontSize:10,color:T.textLight,fontWeight:600,textTransform:"uppercase"}}>Minor</div>
              </div>
              <div style={{flex:1,textAlign:"center"}}>
                <div style={{fontSize:20,fontWeight:800,color:T.gold}}>
                  {beersFlags.length}
                </div>
                <div style={{fontSize:10,color:T.textLight,fontWeight:600,textTransform:"uppercase"}}>Beers</div>
              </div>
            </div>
          )}

          {/* Beers Criteria Flags */}
          {beersFlags.length>0 && (
            <div className="fi" style={{marginBottom:20}}>
              <p className="section-title">🔶 AGS Beers Criteria Flags ({beersFlags.length})</p>
              {beersFlags.map((b,i)=><BeersCard key={b.drug} drug={b.drug} data={b.data} idx={i}/>)}
            </div>
          )}

          {/* Drug-Drug Interaction cards */}
          {results.length>0 && (
            <div>
              <p className="section-title">
                Drug–Drug Interactions ({results.length} of {totalPairs} pair{totalPairs!==1?"s":""} checked)
              </p>
              {[...results]
                .sort((a,b)=>({major:0,moderate:1,minor:2}[a.severity]||1)-({major:0,moderate:1,minor:2}[b.severity]||1))
                .map((r,i)=><InteractionCard key={i} inter={r} idx={i}/>)
              }
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// --- Scan Page ----------------------------------------------------------------
function ScanPage({onDetected}) {
  const [image,setImage]       = useState(null);
  const [b64,setB64]           = useState(null);
  const [loading,setLoading]   = useState(false);
  const [result,setResult]     = useState(null);
  const [confidence,setConfidence] = useState(null);
  const [drag,setDrag]         = useState(false);
  const [scanMsg,setScanMsg]   = useState("");
  const fileRef = useRef();

  const loadFile = f => {
    if(!f) return;
    const reader = new FileReader();
    reader.onload=e=>{
      setImage(e.target.result);
      setB64(e.target.result.split(",")[1]);
      setResult(null);
      setConfidence(null);
      setScanMsg("");
    };
    reader.readAsDataURL(f);
  };

  const analyze = async () => {
    if(!b64) return;
    setLoading(true); setResult(null); setConfidence(null); setScanMsg("Scanning label...");

    // Try Google Cloud Vision first (works in all browsers / deployed apps)
    const vision = await detectMedicineFromImage(b64);

    if(vision.noKey) {
      // No Vision API key — try Claude Vision (works inside Claude.ai artifact)
      setScanMsg("Trying AI detection...");
      try {
        const resp = await callClaudeVision(b64,
          "Look at this medicine bottle or strip label image. Identify the medicine name printed on it and estimate confidence 0-100%. Return JSON ONLY: {\"name\":\"drug name\",\"confidence\":number}"
        );
        const clean = resp.replace(/```json|```/g,"").trim();
        const parsed = JSON.parse(clean);
        setResult(parsed.name || null);
        setConfidence(parsed.confidence || 0);
      } catch {
        setResult(null);
        setConfidence(0);
      }
    } else if(vision.name && vision.confidence > 20) {
      setResult(vision.name);
      setConfidence(vision.confidence);
    } else if(vision.rawText) {
      setResult(vision.rawText.split("\n")[0] || null);
      setConfidence(20);
    } else {
      setResult(null);
      setConfidence(0);
    }

    setScanMsg("");
    setLoading(false);
  };

  const confColor = confidence >= 80 ? T.safe : confidence >= 50 ? T.warn : T.danger;

  return (
    <div >
      <div className="fi" style={{marginBottom:20}}>
        <h1 className="serif" style={{fontSize:22,fontWeight:700,marginBottom:4}}>Pill Image Scanner</h1>
        <p style={{fontSize:13,color:T.textMid}}>Photograph medicine bottle/strip label - no typing needed</p>
      </div>

      {!image?(
        <div className={`drag fi1 ${drag?"over":""}`}
          onDragOver={e=>{e.preventDefault();setDrag(true)}}
          onDragLeave={()=>setDrag(false)}
          onDrop={e=>{e.preventDefault();setDrag(false);loadFile(e.dataTransfer.files[0])}}
          onClick={()=>fileRef.current.click()}>
          <div style={{width:56,height:56,borderRadius:"50%",background:T.primarySoft,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",color:T.primary}}>
            <Ic p={ICONS.camera} s={26}/>
          </div>
          <p style={{fontWeight:600,fontSize:15,marginBottom:4}}>Tap or drop medicine image</p>
          <p style={{fontSize:12,color:T.textLight}}>JPG, PNG · Bottle label, blister pack, strip</p>
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>loadFile(e.target.files[0])}/>
        </div>
      ):(
        <div className="fi">
          <div style={{borderRadius:16,overflow:"hidden",border:`2px solid ${T.border}`,marginBottom:14,position:"relative"}}>
            <img src={image} alt="medicine" style={{width:"100%",maxHeight:280,objectFit:"contain",background:"#f8f5f0",display:"block"}}/>
            <button className="btn btn-secondary btn-sm" style={{position:"absolute",top:10,right:10}} onClick={()=>{setImage(null);setB64(null);setResult(null);}}>
              <Ic p={ICONS.close} s={13}/> Clear
            </button>
          </div>
          <button className="btn btn-primary" style={{width:"100%",justifyContent:"center",padding:"12px",fontSize:15,borderRadius:12}} onClick={analyze} disabled={loading}>
            {loading
              ? <><span className="spin" style={{display:"inline-block",width:15,height:15,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%"}}/>{scanMsg||"Analyzing..."}</>
              : <><Ic p={ICONS.search} s={17}/>Detect Medicine Name</>}
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>loadFile(e.target.files[0])}/>
        </div>
      )}

      {!loading && result && confidence > 0 && (
        <div className="card fi" style={{padding:"18px 20px",marginTop:18}}>
          <p className="section-title">Detection Result</p>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:22,fontWeight:700,fontFamily:"'Merriweather',serif"}}>{result}</span>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:800,color:confColor}}>{confidence}%</div>
              <div style={{fontSize:10,color:T.textLight,fontWeight:600}}>CONFIDENCE</div>
            </div>
          </div>
          {confidence < 60 && (
            <div style={{background:T.warnSoft,border:"1px solid #FCD34D",borderRadius:10,padding:"10px 12px",marginBottom:12,fontSize:13,color:T.warn}}>
              <strong>Low confidence</strong> — please verify the name manually before adding.
            </div>
          )}
          <div style={{display:"flex",gap:8,marginTop:4}}>
            <button className="btn btn-primary btn-sm" onClick={()=>onDetected(result)} disabled={confidence < 30}>
              <Ic p={ICONS.plus} s={14}/> Add to Check List
            </button>
            <button className="btn btn-secondary btn-sm" onClick={()=>{setImage(null);setB64(null);setResult(null);setScanMsg("");}}>
              Scan Another
            </button>
          </div>
        </div>
      )}

      {!loading && image && result === null && confidence === 0 && (
        <div className="card fi" style={{padding:"18px 20px",marginTop:18,background:T.warnSoft,border:"1px solid #FCD34D"}}>
          <p style={{fontWeight:700,color:T.warn,marginBottom:8}}>Could not detect medicine name</p>
          {(!GOOGLE_VISION_API_KEY || GOOGLE_VISION_API_KEY === "YOUR_GOOGLE_VISION_API_KEY") ? (
            <div>
              <p style={{fontSize:13,color:T.textMid,lineHeight:1.6,marginBottom:10}}>
                To use Pill Scanner in your own website, add a <strong>Google Cloud Vision API key</strong>:
              </p>
              <ol style={{fontSize:12,color:T.textMid,paddingLeft:18,lineHeight:2.1}}>
                <li>Go to <strong>console.cloud.google.com</strong></li>
                <li>Enable <strong>Cloud Vision API</strong></li>
                <li>Create an API key and paste it in the code at <code style={{background:"#fff",padding:"1px 5px",borderRadius:4}}>GOOGLE_VISION_API_KEY</code></li>
              </ol>
              <p style={{fontSize:12,color:T.textMid,marginTop:8}}>Inside Claude.ai, AI-based detection runs automatically.</p>
            </div>
          ) : (
            <p style={{fontSize:13,color:T.textMid,lineHeight:1.6}}>Try a clearer image with better lighting and the medicine name clearly visible in the frame.</p>
          )}
          <button className="btn btn-secondary btn-sm" style={{marginTop:12}} onClick={()=>{setImage(null);setB64(null);setResult(null);setScanMsg("");}}>
            Try Again
          </button>
        </div>
      )}

      <div className="card-warm fi2" style={{padding:"14px 16px",marginTop:18}}>
        <p style={{fontSize:13,color:T.warn,fontWeight:500,marginBottom:4}}>📸 Tips for best scan</p>
        <ul style={{fontSize:12,color:T.textMid,paddingLeft:16,lineHeight:1.9}}>
          <li>Flat surface, no glare on packaging</li>
          <li>Medicine name should fill most of the frame</li>
          <li>Good lighting - natural light works best</li>
          <li>Low confidence = always verify manually</li>
        </ul>
      </div>
    </div>
  );
}

// --- Schedule Page ------------------------------------------------------------
const SLOT_META = [
  {key:"morning",   label:"Morning",   emoji:"🌅", color:"#FEF9C3", border:"#FDE68A", time:"6 – 9 AM"},
  {key:"afternoon", label:"Afternoon", emoji:"☀️",  color:"#FFF7ED", border:"#FDBA74", time:"12 – 2 PM"},
  {key:"evening",   label:"Evening",   emoji:"🌆", color:"#F0FDF4", border:"#A7F3D0", time:"5 – 7 PM"},
  {key:"night",     label:"Night",     emoji:"🌙", color:"#EFF6FF", border:"#BFDBFE", time:"9 – 10 PM"},
];
const FOOD_NOTES = ["With food","Before food","After food","With water","With milk","Empty stomach","No restriction"];

function SchedulePage({drugs, assignments, setAssignments}) {
  const [view, setView] = useState("assign"); // "assign" | "timeline"
  const [dragDrug, setDragDrug] = useState(null);

  // Auto-seed from buildSchedule ONLY for new drugs not yet assigned
  useEffect(() => {
    const auto = buildSchedule(drugs);
    const next = {};
    ["morning","afternoon","evening","night"].forEach(slot => {
      (auto[slot]||[]).forEach(item => {
        next[item.drug] = { slot, note: item.note||"No restriction" };
      });
    });
    // IMPORTANT: only seed drugs that do NOT already have a manual assignment
    setAssignments(prev => {
      const merged = {...prev};
      drugs.forEach(d => {
        if(!merged[d]) {
          // Drug not yet assigned at all - use auto schedule
          merged[d] = next[d] || { slot: "morning", note: "No restriction" };
        }
        // If already assigned (manually or loaded from history) - KEEP existing assignment
      });
      // Remove drugs that are no longer in the list
      Object.keys(merged).forEach(d => {
        if(!drugs.includes(d)) delete merged[d];
      });
      return {...merged};
    });
  }, [drugs.join(",")]);

  const setSlot  = (drug, slot) => setAssignments(p => ({...p, [drug]: {...(p[drug]||{}), slot, note: p[drug]?.note||"No restriction"}}));
  const setNote  = (drug, note) => setAssignments(p => ({...p, [drug]: {...(p[drug]||{}), note}}));

  // Drag-and-drop between slots
  const onDragStart = drug => setDragDrug(drug);
  const onDropSlot  = slot => { if(dragDrug) { setSlot(dragDrug, slot); setDragDrug(null); } };

  // Conflict detection for schedule
  const getConflicts = (slot) => {
    const drugsInSlot = drugs.filter(d => assignments[d]?.slot === slot);
    const conflicts = [];
    for(let i=0;i<drugsInSlot.length;i++) for(let j=i+1;j<drugsInSlot.length;j++){
      const c = checkLocalInteraction(drugsInSlot[i], drugsInSlot[j]);
      if(c && c.severity==="major") conflicts.push({d1:drugsInSlot[i], d2:drugsInSlot[j]});
    }
    return conflicts;
  };

  if(drugs.length===0) return (
    <div style={{padding:"60px 20px",textAlign:"center"}}>
      <Ic p={ICONS.clock} s={36} c={T.textLight}/>
      <p style={{color:T.textMid,marginTop:12}}>Add medicines in the Check tab first.</p>
    </div>
  );

  const unassigned = drugs.filter(d => !assignments[d]?.slot);

  return (
    <div >
      {/* Header */}
      <div className="fi" style={{marginBottom:16}}>
        <h1 className="serif" style={{fontSize:22,fontWeight:700,marginBottom:4}}>Daily Medication Schedule</h1>
        <p style={{fontSize:13,color:T.textMid}}>Assign each medicine to a time slot manually</p>
      </div>

      {/* View toggle */}
      <div style={{display:"flex",gap:6,marginBottom:18,background:T.bg,borderRadius:10,padding:4}} className="fi1">
        {["assign","timeline"].map(v=>(
          <button key={v} className={`tab ${view===v?"on":""}`} style={{flex:1,textAlign:"center",textTransform:"capitalize"}} onClick={()=>setView(v)}>
            {v==="assign"?"✏️ Assign":"📋 View Schedule"}
          </button>
        ))}
      </div>

      {/* -- ASSIGN VIEW -- */}
      {view==="assign"&&(
        <div className="fi">
          {/* Unassigned */}
          {unassigned.length>0&&(
            <div className="card" style={{padding:"14px 16px",marginBottom:16,background:"#FFF8F0",border:`1px solid #FDBA74`}}>
              <p className="section-title" style={{color:T.warn}}>WARNING: Not yet assigned ({unassigned.length})</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {unassigned.map(d=>(
                  <span key={d} style={{fontSize:13,padding:"5px 12px",borderRadius:99,background:T.warnSoft,border:`1px solid #FCD34D`,color:T.warn,fontWeight:500}}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Medicine rows */}
          {drugs.map((drug,i)=>{
            const asgn = assignments[drug]||{};
            return (
              <div key={drug} className="card fi" style={{padding:"14px 16px",marginBottom:10,animationDelay:`${i*.05}s`}}
                draggable onDragStart={()=>onDragStart(drug)}>
                {/* Drug name row */}
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                  <div style={{width:32,height:32,borderRadius:9,background:T.primarySoft,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Ic p={ICONS.pill} s={15} c={T.primary}/>
                  </div>
                  <span style={{fontWeight:700,fontSize:15}}>{drug}</span>
                  {asgn.slot&&(
                    <span style={{marginLeft:"auto",fontSize:11,padding:"2px 8px",borderRadius:99,background:T.safeSoft,color:T.safe,fontWeight:600}}>
                      {SLOT_META.find(s=>s.key===asgn.slot)?.emoji} {asgn.slot}
                    </span>
                  )}
                </div>

                {/* Time slot selector */}
                <p style={{fontSize:11,fontWeight:600,color:T.textLight,textTransform:"uppercase",letterSpacing:".07em",marginBottom:7}}>Time Slot</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
                  {SLOT_META.map(slot=>{
                    const isActive = asgn.slot===slot.key;
                    return (
                      <button key={slot.key} onClick={()=>setSlot(drug,slot.key)}
                        style={{
                          padding:"9px 10px",borderRadius:10,border:`1.5px solid ${isActive?T.primary:T.border}`,
                          background:isActive?T.primarySoft:T.surface,
                          color:isActive?T.primary:T.textMid,
                          cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:isActive?700:400,
                          display:"flex",alignItems:"center",justifyContent:"space-between",transition:"all .15s"
                        }}>
                        <span>{slot.emoji} {slot.label}</span>
                        <span style={{fontSize:10,color:isActive?T.primary:T.textLight}}>{slot.time}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Food note selector */}
                <p style={{fontSize:11,fontWeight:600,color:T.textLight,textTransform:"uppercase",letterSpacing:".07em",marginBottom:7}}>Food Instruction</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {FOOD_NOTES.map(note=>{
                    const isActive = asgn.note===note;
                    return (
                      <button key={note} onClick={()=>setNote(drug,note)}
                        style={{
                          padding:"5px 11px",borderRadius:99,border:`1.5px solid ${isActive?T.teal:T.border}`,
                          background:isActive?T.tealSoft:T.surface,
                          color:isActive?T.teal:T.textMid,
                          cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:isActive?600:400,transition:"all .15s"
                        }}>
                        {note}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* -- TIMELINE VIEW -- */}
      {view==="timeline"&&(
        <div className="fi gslots">
          {SLOT_META.map((slot,si)=>{
            const items = drugs.filter(d=>assignments[d]?.slot===slot.key);
            const conflicts = getConflicts(slot.key);
            return (
              <div key={slot.key} className={`fi${si+1}`} style={{marginBottom:14}}
                onDragOver={e=>e.preventDefault()} onDrop={()=>onDropSlot(slot.key)}>
                <div className="slot" style={{background:slot.color,borderColor:slot.border}}>
                  {/* Slot header */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:items.length>0||conflicts.length>0?12:0}}>
                    <div className="slot-label" style={{color:T.textMid,marginBottom:0}}>{slot.emoji} {slot.label}</div>
                    <span style={{fontSize:11,color:T.textLight,fontWeight:500}}>{slot.time}</span>
                  </div>

                  {/* Conflict warning */}
                  {conflicts.length>0&&(
                    <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:"8px 10px",marginBottom:10,fontSize:12,color:T.danger}}>
                      WARNING: Interaction conflict: {conflicts.map(c=>`${c.d1} + ${c.d2}`).join("; ")} - consider moving one to a different slot.
                    </div>
                  )}

                  {/* Medicines */}
                  {items.length===0?(
                    <p style={{fontSize:12,color:T.textLight,fontStyle:"italic"}}>No medicines assigned - drag a medicine here or use Assign view</p>
                  ):items.map((drug,i)=>{
                    const note = assignments[drug]?.note||"No restriction";
                    return (
                      <div key={drug} draggable onDragStart={()=>onDragStart(drug)}
                        style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                          padding:"9px 10px",marginBottom:i<items.length-1?6:0,
                          background:"rgba(255,255,255,.75)",borderRadius:9,cursor:"grab",
                          border:`1px solid ${slot.border}`}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <Ic p={ICONS.pill} s={14} c={T.primary}/>
                          <span style={{fontSize:14,fontWeight:600}}>{drug}</span>
                        </div>
                        <span style={{fontSize:11,color:T.teal,background:T.tealSoft,padding:"2px 8px",borderRadius:99,fontWeight:500}}>{note}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Tip */}
          <p style={{fontSize:12,color:T.textLight,textAlign:"center",marginTop:4}}>💡 Drag medicines between slots to reassign</p>
        </div>
      )}

      {/* General rules */}
      <div className="card fi4" style={{padding:"14px 16px",marginTop:4,background:T.tealSoft,border:`1px solid #99D6D6`}}>
        <p style={{fontSize:13,fontWeight:600,color:T.teal,marginBottom:6}}>WARNING: General Rules</p>
        <ul style={{fontSize:12,color:"#134E4A",paddingLeft:16,lineHeight:1.9}}>
          <li>Never skip doses without doctor advice</li>
          <li>Thyroid medicine always 30 min before breakfast (empty stomach)</li>
          <li>Statins (cholesterol) work best at night</li>
          <li>NSAIDs / pain killers: always with food</li>
          <li>Take blood thinners at the same time every day</li>
        </ul>
      </div>
    </div>
  );
}

// --- History Page -------------------------------------------------------------
function HistoryPage({
  sessions, setSessions,
  drugs, setDrugs,
  patientName, setPatientName,
  patientAge,  setPatientAge,
  caregiverEmail, setCaregiverEmail,
  scheduleAssignments, setScheduleAssignments,
  user, setPage
}) {
  const [saving,     setSaving]     = useState(false);
  const [loadingId,  setLoadingId]  = useState(null);
  const [toast,      setToast]      = useState(null);

  const showToast = (msg, type="success") => {
    setToast({msg, type});
    setTimeout(()=>setToast(null), 3000);
  };

  // -- Save: snapshot the entire current patient profile ---------------------
  const saveSession = async () => {
    if(drugs.length===0){ showToast("Add medicines in the Check tab first.", "info"); return; }
    setSaving(true);
    await sleep(600);

    // Auto-generate a label if name is available
    const autoLabel = patientName.trim()
      ? `${patientName.trim()}${patientAge ? ", "+patientAge+"yr" : ""} - ${new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}`
      : `Session ${sessions.length+1} - ${new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}`;

    const entry = {
      id:            Date.now(),
      label:         autoLabel,
      patientName:   patientName.trim(),
      patientAge:    patientAge.trim(),
      caregiverEmail:caregiverEmail.trim(),
      drugs:         [...drugs],
      scheduleAssignments: {...scheduleAssignments},
      date:          new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}),
    };
    const saved = await DB.addSession(user.uid, entry);
    if(saved) {
      setSessions(p => [saved, ...p]);
      showToast("Saved: " + entry.label);
    } else {
      showToast("Save failed — check Firestore connection.", "info");
    }
    setSaving(false);
  };

  // -- Load: restore entire patient profile including schedule ---------------
  const loadSession = async (s) => {
    setLoadingId(s.id);
    await sleep(700);

    setDrugs([...s.drugs]);
    if(s.patientName)    setPatientName(s.patientName);
    if(s.patientAge)     setPatientAge(s.patientAge);
    if(s.caregiverEmail) setCaregiverEmail(s.caregiverEmail);
    // Restore the EXACT schedule that was last saved for this patient
    if(s.scheduleAssignments && Object.keys(s.scheduleAssignments).length > 0) {
      setScheduleAssignments({...s.scheduleAssignments});
    } else {
      // No saved schedule - clear so SchedulePage auto-builds from scratch
      setScheduleAssignments({});
    }

    setLoadingId(null);
    showToast(`Loaded ${s.patientName||"session"} - navigating to Check tab…`);
    await sleep(900);
    setPage("check");
  };

  const deleteSession = async (s) => {
    if(s._docId) await DB.deleteSession(s._docId);
    setSessions(p => p.filter(x => x.id !== s.id));
  };

  return (
    <div style={{position:"relative"}}>

      {/* Toast */}
      {toast&&(
        <div className="fi" style={{
          position:"fixed", top:70, left:"50%", transform:"translateX(-50%)", zIndex:999,
          background: toast.type==="info" ? T.warnSoft : T.safeSoft,
          border:`1px solid ${toast.type==="info"?"#FCD34D":"#A7F3D0"}`,
          color: toast.type==="info" ? T.warn : T.safe,
          borderRadius:12, padding:"11px 20px", fontSize:13, fontWeight:600,
          boxShadow:"0 4px 20px rgba(0,0,0,.12)", maxWidth:"88vw", textAlign:"center"
        }}>
          {toast.type==="info" ? "ℹ️ " : " "}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="fi" style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
          <div>
            <h1 className="serif" style={{fontSize:22, fontWeight:700, marginBottom:4}}>Patient Records</h1>
            <p style={{fontSize:13, color:T.textMid}}>
              Logged in as <strong style={{color:T.primary}}>{user?.name||"User"}</strong> — all records are saved to your account
            </p>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 12px",background:T.primarySoft,borderRadius:10,border:`1px solid #BAE6FD`,flexShrink:0}}>
            <Ic p={ICONS.history} s={14} c={T.primary}/>
            <span style={{fontSize:13,fontWeight:700,color:T.primary}}>{sessions.length}</span>
            <span style={{fontSize:12,color:T.textMid}}>saved</span>
          </div>
        </div>
      </div>

      {/* Save card - shows what will be saved */}
      <div className="card fi1" style={{padding:16, marginBottom:18}}>
        <p className="section-title">Save Current Patient Profile</p>

        {/* Preview of what gets saved */}
        <div style={{
          background:T.bg, border:`1px solid ${T.border}`, borderRadius:10,
          padding:"12px 14px", marginBottom:12, fontSize:13
        }}>
          <div style={{display:"flex", flexWrap:"wrap", gap:"6px 20px", marginBottom:drugs.length>0?10:0}}>
            <span><span style={{color:T.textLight}}>Name: </span>
              <strong style={{color:patientName?T.text:T.textLight}}>{patientName||"Not entered"}</strong>
            </span>
            <span><span style={{color:T.textLight}}>Age: </span>
              <strong style={{color:patientAge?T.text:T.textLight}}>{patientAge||"Not entered"}</strong>
            </span>
            <span><span style={{color:T.textLight}}>Email: </span>
              <strong style={{color:caregiverEmail?T.text:T.textLight, fontSize:12}}>{caregiverEmail||"Not entered"}</strong>
            </span>
          </div>
          {drugs.length>0?(
            <div style={{display:"flex", flexWrap:"wrap", gap:5}}>
              {drugs.map(d=>(
                <span key={d} style={{
                  fontSize:11, padding:"2px 8px", borderRadius:99, fontWeight:500,
                  background:T.primarySoft, border:`1px solid #FDBA74`, color:T.primary
                }}>{d}</span>
              ))}
            </div>
          ):(
            <p style={{fontSize:12, color:T.warn, marginTop:4}}>
              WARNING: No medicines added yet - go to <strong>Check</strong> tab first.
            </p>
          )}
        </div>

        <button
          className="btn btn-primary"
          onClick={saveSession}
          disabled={saving || drugs.length===0}
          style={{
            width:"100%", justifyContent:"center", padding:"11px",
            borderRadius:10, fontSize:14, opacity: drugs.length===0 ? .5 : 1
          }}
        >
          {saving
            ? <><span className="spin" style={{display:"inline-block",width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%"}}/> Saving…</>
            : <><Ic p={ICONS.history} s={15}/> Save Profile ({drugs.length} medicine{drugs.length!==1?"s":""})</>
          }
        </button>
      </div>

      {/* Sessions list */}
      {sessions.length===0 ? (
        <div style={{textAlign:"center", padding:"50px 20px"}}>
          <Ic p={ICONS.history} s={40} c={T.textLight}/>
          <p style={{color:T.textMid, marginTop:14, fontSize:14, fontWeight:500}}>No saved profiles yet</p>
          <p style={{color:T.textLight, fontSize:12, marginTop:4}}>Fill in patient details and medicines in the Check tab, then save here.</p>
        </div>
      ):(
        <div className="g2d">
        {sessions.map((s,i)=>(
          <div key={s.id} className="card fi" style={{padding:"16px", marginBottom:12, animationDelay:`${i*.05}s`}}>

            {/* Session header */}
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10}}>
              <div style={{minWidth:0, flex:1, paddingRight:8}}>
                <p style={{fontWeight:700, fontSize:15, marginBottom:3}}>{s.patientName||"Unnamed Patient"}</p>
                <div style={{display:"flex", flexWrap:"wrap", gap:"3px 12px"}}>
                  {s.patientAge&&(
                    <span style={{fontSize:12, color:T.textMid}}>
                      👤 Age: <strong>{s.patientAge}</strong>
                    </span>
                  )}
                  {s.caregiverEmail&&(
                    <span style={{fontSize:12, color:T.textMid, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:180}}>
                      ✉️ {s.caregiverEmail}
                    </span>
                  )}
                  <span style={{fontSize:11, color:T.textLight}}>📅 {s.date}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{display:"flex", gap:6, flexShrink:0}}>
                <button
                  className="btn btn-teal btn-sm"
                  onClick={()=>loadSession(s)}
                  disabled={loadingId!==null}
                  style={{minWidth:64, justifyContent:"center"}}
                >
                  {loadingId===s.id
                    ? <><span className="spin" style={{display:"inline-block",width:12,height:12,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%"}}/> Loading</>
                    : <><Ic p={ICONS.history} s={13}/> Load</>
                  }
                </button>
                <button
                  className="btn btn-sm"
                  onClick={()=>deleteSession(s)}
                  disabled={loadingId!==null}
                  style={{background:T.dangerSoft, color:T.danger, border:"none", padding:"7px 9px"}}
                >
                  <Ic p={ICONS.trash} s={13}/>
                </button>
              </div>
            </div>

            {/* Medicine count + chips */}
            <div style={{
              background:T.bg, borderRadius:9, padding:"10px 12px",
              border:`1px solid ${T.border}`
            }}>
              <p style={{fontSize:11, fontWeight:600, color:T.textLight, textTransform:"uppercase", letterSpacing:".06em", marginBottom:7}}>
                💊 {s.drugs.length} Medicine{s.drugs.length!==1?"s":""}
              </p>
              <div style={{display:"flex", flexWrap:"wrap", gap:5}}>
                {s.drugs.map(d=>{
                  const beers = checkBeers(d);
                  return (
                    <span key={d} style={{
                      fontSize:12, padding:"3px 10px", borderRadius:99, fontWeight:500,
                      background: beers ? T.warnSoft : T.surface,
                      border:`1px solid ${beers?"#FCD34D":T.border}`,
                      color: beers ? T.warn : T.textMid
                    }}>
                      {d}{beers&&" WARNING:"}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Loading progress row */}
            {loadingId===s.id&&(
              <div style={{
                marginTop:10, padding:"9px 12px",
                background:T.tealSoft, border:`1px solid #99D6D6`,
                borderRadius:8, fontSize:12, color:T.teal,
                display:"flex", alignItems:"center", gap:8
              }}>
                <span className="spin" style={{display:"inline-block",width:12,height:12,border:"2px solid #99D6D6",borderTopColor:T.teal,borderRadius:"50%",flexShrink:0}}/>
                Restoring {s.patientName?"\""+s.patientName+"\"":""} profile - name, age, email & {s.drugs.length} medicines…
              </div>
            )}
          </div>
        ))}
        </div>
      )}
    </div>
  );
}

// --- Alerts Page --------------------------------------------------------------
function AlertsPage({results,drugs,caregiverEmail,setCaregiverEmail,patientName}) {
  const [phone,setPhone] = useState("");
  const [sent,setSent] = useState(false);
  const [sending,setSending] = useState(false);

  const majorInteractions = results.filter(r=>r.severity==="major");
  const beersFlags = drugs.map(d=>({drug:d,data:checkBeers(d)})).filter(x=>x.data);

  const sendAlerts = async () => {
    setSending(true);
    await sleep(1800); // Simulate API call
    setSent(true);
    setSending(false);
  };

  const emailBody = `URGENT: Medicine Interaction Alert for ${patientName||"Patient"}

The following DANGEROUS drug interactions were detected:
${majorInteractions.map(i=>`• ${i.d1} + ${i.d2}: ${i.effect}`).join("\n")}

Beers Criteria Flags (potentially inappropriate for elderly):
${beersFlags.map(b=>`• ${b.drug}: ${b.data.reason}`).join("\n")}

Please consult a doctor immediately. Do NOT stop medicines without medical advice.

Generated by  MediCheck`;

  const whatsappMsg = `🚨 *MEDICINE ALERT* for ${patientName||"Patient"}%0A%0A*Dangerous Interactions:*%0A${majorInteractions.map(i=>`• ${i.d1} + ${i.d2}`).join("%0A")}%0A%0AConsult doctor immediately.`;

  return (
    <div >
      <div className="fi" style={{marginBottom:20}}>
        <h1 className="serif" style={{fontSize:22,fontWeight:700,marginBottom:4}}>Caregiver Alerts</h1>
        <p style={{fontSize:13,color:T.textMid}}>Send emergency alerts when dangerous interactions are detected</p>
      </div>

      {/* Status */}
      {majorInteractions.length===0&&beersFlags.length===0?(
        <div className="card fi1" style={{padding:20,textAlign:"center",background:T.safeSoft,border:`1px solid #A7F3D0`,marginBottom:18}}>
          <Ic p={ICONS.check} s={28} c={T.safe}/>
          <p style={{fontWeight:700,color:T.safe,marginTop:8}}>No dangerous interactions detected</p>
          <p style={{fontSize:13,color:"#065F46",marginTop:4}}>Run a check first in the Check tab.</p>
        </div>
      ):(
        <div className="fi1" style={{marginBottom:18}}>
          {majorInteractions.map((inter,i)=>(
            <div key={i} className="sev-major card" style={{padding:"12px 16px",marginBottom:8,borderRadius:12}}>
              <p style={{fontWeight:700,color:T.danger,fontSize:14}}>WARNING: {inter.d1} + {inter.d2}</p>
              <p style={{fontSize:12,color:"#991B1B",marginTop:2}}>{inter.plainLanguage||inter.effect}</p>
              <p style={{fontSize:11,color:"#991B1B",marginTop:4,fontWeight:600}}>Watch for: {inter.effect?.slice(0,80)}…</p>
            </div>
          ))}
          {beersFlags.map((b,i)=>(
            <div key={i} className="sev-beers card" style={{padding:"12px 16px",marginBottom:8,borderRadius:12}}>
              <p style={{fontWeight:700,color:T.warn,fontSize:14}}>🔶 Beers Flag: {b.drug}</p>
              <p style={{fontSize:12,color:T.textMid,marginTop:2}}>{b.data.reason}</p>
            </div>
          ))}
        </div>
      )}

      {/* Alert config */}
      <div className="card fi2" style={{padding:16,marginBottom:14}}>
        <p className="section-title">Caregiver Contact</p>
        <div style={{marginBottom:10}}>
          <label style={{fontSize:12,color:T.textMid,display:"block",marginBottom:4}}>Email Address</label>
          <input className="input" value={caregiverEmail} onChange={e=>setCaregiverEmail(e.target.value)} placeholder="caregiver@example.com" type="email"/>
        </div>
        <div>
          <label style={{fontSize:12,color:T.textMid,display:"block",marginBottom:4}}>WhatsApp Number (with country code)</label>
          <input className="input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 98765 43210" type="tel"/>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{display:"flex",flexDirection:"column",gap:10}} className="fi3">
        {/* Email */}
        <a href={`mailto:${caregiverEmail}?subject=URGENT: Medicine Alert for ${patientName||"Patient"}&body=${encodeURIComponent(emailBody)}`}
          className="btn btn-primary" style={{width:"100%",justifyContent:"center",padding:"12px",fontSize:15,borderRadius:12,textDecoration:"none"}}>
          <Ic p={ICONS.mail} s={17}/> Send Email Alert
        </a>

        {/* WhatsApp */}
        {phone&&(
          <a href={`https://wa.me/${phone.replace(/[^0-9]/g,"")}?text=${whatsappMsg}`}
            target="_blank" rel="noreferrer"
            className="btn" style={{width:"100%",justifyContent:"center",padding:"12px",fontSize:15,borderRadius:12,background:"#25D366",color:"#fff",textDecoration:"none"}}>
            <span style={{fontSize:16}}>💬</span> Send WhatsApp Alert
          </a>
        )}

        {/* Simulate send */}
        <button className="btn btn-secondary" style={{width:"100%",justifyContent:"center",padding:"12px",fontSize:15,borderRadius:12}} onClick={sendAlerts} disabled={sending}>
          {sending?<><span className="spin" style={{display:"inline-block",width:15,height:15,border:"2px solid rgba(0,0,0,.15)",borderTopColor:T.primary,borderRadius:"50%"}}/>Sending demo…</>:<><Ic p={ICONS.bell} s={17}/>Demo Alert (Simulate)</>}
        </button>

        {sent&&(
          <div className="notify-sent fi">
            <Ic p={ICONS.check} s={14} c={T.safe}/> Demo alert simulated. In production, this would send an SMS/email via Twilio + SendGrid.
          </div>
        )}
      </div>

      {/* Generic alternatives note */}
      <div className="card fi4" style={{padding:"14px 16px",marginTop:18,background:T.tealSoft,border:`1px solid #99D6D6`}}>
        <p style={{fontSize:13,fontWeight:600,color:T.teal,marginBottom:6}}>💊 Generic Alternatives</p>
        <p style={{fontSize:12,color:"#134E4A",lineHeight:1.7}}>
          For medicines flagged as potentially inappropriate or expensive, ask your pharmacist for generic equivalents.
          In India, generic versions are available at <strong>Jan Aushadhi Kendras</strong> at 50–80% lower cost.
        </p>
        <a href="https://janaushadhi.gov.in/ProductList.aspx" target="_blank" rel="noreferrer"
          className="btn btn-teal btn-sm" style={{marginTop:10}}>
          Jan Aushadhi Store Locator →
        </a>
      </div>
    </div>
  );
}



// ─── PASTE YOUR FIREBASE CONFIG HERE (lines 1804-1812) ──────────────────────
// Replace the placeholder values below with your real Firebase project config.
// Get it from: Firebase Console → Project Settings → Your Apps → Web App → SDK setup
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCU1hftCJiMDZNYW2vt7qlyIqpN0OBA_a4",
  authDomain:        "medicheck-a5a34.firebaseapp.com",
  projectId:         "medicheck-a5a34",
  storageBucket:     "medicheck-a5a34.firebasestorage.app",
  messagingSenderId: "620532106170",
  appId:             "1:620532106170:web:35ab2489ed94fa9eff9383",
  measurementId:     "G-75F5WSPDZ1",
};
// ─────────────────────────────────────────────────────────────────────────────

const isConfigured = () => !FIREBASE_CONFIG.apiKey.startsWith("YOUR_");

// ─── Firebase SDK (loaded lazily from CDN) ──────────────────────────────────────
let _sdk = null, _app = null, _auth = null, _db = null;


async function getFB() {
  if (_sdk && _auth && _db) return { sdk: _sdk, auth: _auth, db: _db };
  if (!_sdk) {
    const [a, b, c] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"),
    ]);
    _sdk = { ...a, ...b, ...c };
  }
  if (!_app) {
    try { _app = _sdk.getApp(FIREBASE_CONFIG.projectId); }
    catch { _app = _sdk.initializeApp(FIREBASE_CONFIG, FIREBASE_CONFIG.projectId); }
    _auth = _sdk.getAuth(_app);
    _db   = _sdk.getFirestore(_app);
  }
  return { sdk: _sdk, auth: _auth, db: _db };
}

// ─── Firebase DB Layer ─────────────────────────────────────────────────────────
const DB = {
  async signUp(name, email, password, role) {
    const { sdk, auth, db } = await getFB();
    const cred = await sdk.createUserWithEmailAndPassword(auth, email, password);
    await sdk.updateProfile(cred.user, { displayName: name });
    await sdk.setDoc(sdk.doc(db, "users", cred.user.uid), { uid: cred.user.uid, name, email, role, createdAt: sdk.serverTimestamp() });
    return { uid: cred.user.uid, name, email, role };
  },

  async signIn(email, password) {
    const { sdk, auth, db } = await getFB();
    const cred = await sdk.signInWithEmailAndPassword(auth, email, password);
    const snap = await sdk.getDoc(sdk.doc(db, "users", cred.user.uid));
    const p = snap.exists() ? snap.data() : {};
    return { uid: cred.user.uid, name: p.name || cred.user.displayName || email, email: cred.user.email, role: p.role || "user" };
  },

  async signOut() {
    try { const { sdk, auth } = await getFB(); await sdk.signOut(auth); } catch {}
  },

  async restoreUser() {
    if (!isConfigured()) return null;
    try {
      const { sdk, auth, db } = await getFB();
      return new Promise(resolve => {
        const unsub = sdk.onAuthStateChanged(auth, async u => {
          unsub();
          if (!u) { resolve(null); return; }
          try {
            const snap = await sdk.getDoc(sdk.doc(db, "users", u.uid));
            const p = snap.exists() ? snap.data() : {};
            resolve({ uid: u.uid, name: p.name || u.displayName || u.email, email: u.email, role: p.role || "user" });
          } catch { resolve({ uid: u.uid, name: u.displayName || u.email, email: u.email, role: "user" }); }
        });
      });
    } catch { return null; }
  },

  async getSessions(uid) {
    try {
      const { sdk, db } = await getFB();
      // No orderBy — avoids needing a Firestore composite index
      const q    = sdk.query(sdk.collection(db, "sessions"), sdk.where("uid", "==", uid));
      const snap = await sdk.getDocs(q);
      const docs = snap.docs.map(d => ({ ...d.data(), _docId: d.id }));
      // Sort newest first on the client
      docs.sort((a, b) => (b.createdAt?.seconds || b.id || 0) - (a.createdAt?.seconds || a.id || 0));
      return docs;
    } catch (e) { console.error("getSessions error:", e); return []; }
  },

  async addSession(uid, entry) {
    try {
      const { sdk, db } = await getFB();
      const ref = await sdk.addDoc(sdk.collection(db, "sessions"), { ...entry, uid, createdAt: sdk.serverTimestamp() });
      return { ...entry, _docId: ref.id };
    } catch (e) { console.error(e); return null; }
  },

  async deleteSession(docId) {
    try { const { sdk, db } = await getFB(); await sdk.deleteDoc(sdk.doc(db, "sessions", docId)); return true; }
    catch (e) { console.error(e); return false; }
  },
};

// ─── Config Not Set Screen ────────────────────────────────────────────────────
function ConfigNotSetScreen() {
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#EEF4F9,#E0F2FE)",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <div style={{maxWidth:480,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{width:60,height:60,borderRadius:18,background:"linear-gradient(135deg,#0369A1,#0284C7)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 8px 24px rgba(3,105,161,.3)"}}>
            <Ic p={ICONS.shield} s={28} c="#fff"/>
          </div>
          <h1 className="serif" style={{fontSize:24,color:"#0F172A",marginBottom:8}}>MediCheck</h1>
          <p style={{fontSize:14,color:"#64748B"}}>Firebase configuration required</p>
        </div>
        <div className="card" style={{padding:"24px",marginBottom:16}}>
          <p style={{fontSize:14,fontWeight:700,color:"#DC2626",marginBottom:12}}>
            Setup needed: Open the .jsx file and update lines 1804–1811
          </p>
          <p style={{fontSize:13,color:"#475569",lineHeight:1.7,marginBottom:16}}>
            Replace the placeholder values in <code style={{background:"#F1F5F9",padding:"2px 6px",borderRadius:4,fontFamily:"monospace"}}>FIREBASE_CONFIG</code> with your actual Firebase project credentials.
          </p>
          <div style={{background:"#1E293B",borderRadius:10,padding:"16px",fontFamily:"monospace",fontSize:12,color:"#7DD3FC",lineHeight:1.8}}>
            <div style={{color:"#94A3B8",marginBottom:4}}>{"// HC03_MediCheck.jsx — lines 1804–1811"}</div>
            <div><span style={{color:"#C084FC"}}>const</span> <span style={{color:"#F8FAFC"}}>FIREBASE_CONFIG</span> <span style={{color:"#F8FAFC"}}>=</span> {"{"}</div>
            <div style={{paddingLeft:16}}><span style={{color:"#86EFAC"}}>apiKey</span><span style={{color:"#F8FAFC"}}>:</span> <span style={{color:"#FCA5A5"}}>"YOUR_API_KEY"</span><span style={{color:"#94A3B8"}}>, {"// ← replace"}</span></div>
            <div style={{paddingLeft:16}}><span style={{color:"#86EFAC"}}>projectId</span><span style={{color:"#F8FAFC"}}>:</span> <span style={{color:"#FCA5A5"}}>"YOUR_PROJECT_ID"</span><span style={{color:"#94A3B8"}}>,</span></div>
            <div style={{paddingLeft:16}}><span style={{color:"#94A3B8"}}>{"// ... other fields"}</span></div>
            <div>{"}"}</div>
          </div>
        </div>
        <div className="card" style={{padding:"20px",background:"#F0F9FF",border:"1px solid #BAE6FD"}}>
          <p style={{fontSize:12,fontWeight:700,color:"#0369A1",textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}}>Where to get the config</p>
          {["Go to console.firebase.google.com",
            "Open your project → Project Settings (gear icon)",
            "Scroll to 'Your apps' → click your Web app",
            "Copy the firebaseConfig values into lines 1804–1811"].map((s,i)=>(
            <div key={i} style={{display:"flex",gap:10,marginBottom:i<3?8:0,alignItems:"flex-start"}}>
              <div style={{width:20,height:20,borderRadius:"50%",background:"#0369A1",color:"#fff",fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
              <p style={{fontSize:13,color:"#334155",lineHeight:1.5}}>{s}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Login Page ────────────────────────────────────────────────────────────────
function LoginPage({ onLogin, goSignup }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState("");
  const [showPw, setShowPw]     = useState(false);

  const submit = async () => {
    setErr("");
    if(!email.trim() || !password) { setErr("Please fill in all fields."); return; }
    if(!/^[^@]+@[^@]+\.[^@]+$/.test(email.trim())) { setErr("Enter a valid email address."); return; }
    setLoading(true);
    try {
      const u = await DB.signIn(email.trim().toLowerCase(), password);
      onLogin(u);
    } catch(e) {
      const code = e.code || "";
      if(code.includes("user-not-found") || code.includes("invalid-credential") || code.includes("wrong-password"))
        setErr("Incorrect email or password. Please try again.");
      else if(code.includes("too-many-requests"))
        setErr("Too many attempts. Please wait a moment and try again.");
      else
        setErr("Sign-in failed: " + (e.message || code));
    }
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#EEF4F9 0%,#E0F2FE 50%,#EFF6FF 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div style={{width:"100%",maxWidth:420}}>
        {/* Brand header */}
        <div style={{textAlign:"center",marginBottom:32}} className="fi">
          <div style={{width:64,height:64,borderRadius:18,background:"linear-gradient(135deg,#0369A1,#0284C7)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 8px 24px rgba(3,105,161,.3)"}}>
            <Ic p={ICONS.shield} s={30} c="#fff"/>
          </div>
          <h1 className="serif" style={{fontSize:28,color:"#0F172A",marginBottom:6,letterSpacing:"-.02em"}}>MediCheck</h1>
          <p style={{fontSize:14,color:"#64748B",fontWeight:500}}>Polypharmacy Safety Platform</p>
        </div>

        {/* Card */}
        <div className="card fi1" style={{padding:"32px",boxShadow:"0 16px 48px rgba(3,105,161,.12)"}}>
          <h2 style={{fontSize:20,fontWeight:700,color:"#0F172A",marginBottom:4}}>Welcome back</h2>
          <p style={{fontSize:13,color:"#64748B",marginBottom:24}}>Sign in to access your patient records</p>

          {err && (
            <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#DC2626",display:"flex",gap:8,alignItems:"center"}}>
              <Ic p={ICONS.warn} s={14} c="#DC2626"/> {err}
            </div>
          )}

          <div style={{marginBottom:14}}>
            <label style={{fontSize:12,fontWeight:700,color:"#475569",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:".06em"}}>Email Address</label>
            <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="you@example.com" autoComplete="email"/>
          </div>

          <div style={{marginBottom:20}}>
            <label style={{fontSize:12,fontWeight:700,color:"#475569",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:".06em"}}>Password</label>
            <div style={{position:"relative"}}>
              <input className="input" type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Your password" autoComplete="current-password" style={{paddingRight:42}}/>
              <button onClick={()=>setShowPw(!showPw)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#94A3B8",fontSize:12,fontWeight:600}}>
                {showPw?"Hide":"Show"}
              </button>
            </div>
          </div>

          <button className="btn btn-primary btn-lg" style={{width:"100%",justifyContent:"center"}} onClick={submit} disabled={loading}>
            {loading ? <><span className="spin" style={{display:"inline-block",width:16,height:16,border:"2.5px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%"}}/>Signing in...</> : <>Sign In</>}
          </button>

          <div style={{textAlign:"center",marginTop:20,fontSize:13,color:"#64748B"}}>
            Don&#39;t have an account?{" "}
            <button onClick={goSignup} style={{background:"none",border:"none",cursor:"pointer",color:"#0369A1",fontWeight:700,fontFamily:"inherit",fontSize:13}}>Create account</button>
          </div>
        </div>

        <p style={{textAlign:"center",fontSize:11,color:"#94A3B8",marginTop:20}}>
          Your data is stored securely and privately per account.
        </p>
      </div>
    </div>
  );
}

// ─── Signup Page ──────────────────────────────────────────────────────────────
function SignupPage({ onLogin, goLogin }) {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [role, setRole]         = useState("caregiver");
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState("");
  const [showPw, setShowPw]     = useState(false);

  const ROLES = [
    { value:"doctor",    label:"Doctor",    desc:"Prescribing physician" },
    { value:"pharmacist",label:"Pharmacist",desc:"Medication specialist" },
    { value:"caregiver", label:"Caregiver", desc:"Family / home care" },
    { value:"nurse",     label:"Nurse",     desc:"Clinical staff" },
  ];

  const submit = async () => {
    setErr("");
    if(!name.trim())  { setErr("Please enter your full name."); return; }
    if(!email.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(email.trim())) { setErr("Enter a valid email address."); return; }
    if(password.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if(password !== confirm) { setErr("Passwords do not match."); return; }
    setLoading(true);
    try {
      const u = await DB.signUp(name.trim(), email.trim().toLowerCase(), password, role);
      onLogin(u);
    } catch(e) {
      const code = e.code || "";
      if(code.includes("email-already-in-use"))
        setErr("An account with this email already exists. Please sign in.");
      else if(code.includes("weak-password"))
        setErr("Password is too weak. Use at least 8 characters.");
      else if(code.includes("invalid-email"))
        setErr("Enter a valid email address.");
      else
        setErr("Sign-up failed: " + (e.message || code));
    }
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#EEF4F9 0%,#E0F2FE 50%,#EFF6FF 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div style={{width:"100%",maxWidth:460}}>
        {/* Brand */}
        <div style={{textAlign:"center",marginBottom:28}} className="fi">
          <div style={{width:56,height:56,borderRadius:16,background:"linear-gradient(135deg,#0369A1,#0284C7)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",boxShadow:"0 8px 24px rgba(3,105,161,.3)"}}>
            <Ic p={ICONS.shield} s={26} c="#fff"/>
          </div>
          <h1 className="serif" style={{fontSize:24,color:"#0F172A",marginBottom:4}}>Create Account</h1>
          <p style={{fontSize:13,color:"#64748B"}}>Join MediCheck to manage patient medication safety</p>
        </div>

        <div className="card fi1" style={{padding:"28px",boxShadow:"0 16px 48px rgba(3,105,161,.12)"}}>
          {err && (
            <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#DC2626",display:"flex",gap:8,alignItems:"center"}}>
              <Ic p={ICONS.warn} s={14} c="#DC2626"/> {err}
            </div>
          )}

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
            <div style={{gridColumn:"1/-1"}}>
              <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:".06em"}}>Full Name</label>
              <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Enter full name"/>
            </div>
            <div style={{gridColumn:"1/-1"}}>
              <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:".06em"}}>Email Address</label>
              <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:".06em"}}>Password</label>
              <div style={{position:"relative"}}>
                <input className="input" type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min. 8 characters" style={{paddingRight:42}}/>
                <button onClick={()=>setShowPw(!showPw)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#94A3B8",fontSize:11,fontWeight:600}}>
                  {showPw?"Hide":"Show"}
                </button>
              </div>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:".06em"}}>Confirm Password</label>
              <input className="input" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Repeat password"/>
            </div>
          </div>

          {/* Role selector */}
          <div style={{marginBottom:20}}>
            <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>Your Role</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {ROLES.map(r=>(
                <button key={r.value} onClick={()=>setRole(r.value)} style={{
                  padding:"10px 12px",borderRadius:10,border:`1.5px solid ${role===r.value?"#0369A1":"#E2E8F0"}`,
                  background:role===r.value?"#E0F2FE":"#fff",
                  cursor:"pointer",textAlign:"left",transition:"all .15s",fontFamily:"inherit"
                }}>
                  <div style={{fontSize:13,fontWeight:700,color:role===r.value?"#0369A1":"#0F172A"}}>{r.label}</div>
                  <div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary btn-lg" style={{width:"100%",justifyContent:"center"}} onClick={submit} disabled={loading}>
            {loading ? <><span className="spin" style={{display:"inline-block",width:16,height:16,border:"2.5px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%"}}/>Creating account...</> : <>Create Account</>}
          </button>

          <div style={{textAlign:"center",marginTop:18,fontSize:13,color:"#64748B"}}>
            Already have an account?{" "}
            <button onClick={goLogin} style={{background:"none",border:"none",cursor:"pointer",color:"#0369A1",fontWeight:700,fontFamily:"inherit",fontSize:13}}>Sign in</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- App Shell ----------------------------------------------------------------
export default function App() {
  // ── Auth state ─────────────────────────────────────────────────────────────
  const [authScreen, setAuthScreen] = useState("login"); // "login" | "signup"
  const [user, setUser]             = useState(null);    // { uid, name, email, role }
  const [authChecking, setAuthChecking] = useState(true);

  // ── App state ───────────────────────────────────────────────────────────────
  const [page, setPage]               = useState("check");
  const [drugs, setDrugs]             = useState([]);
  const [results, setResults]         = useState([]);
  const [sessions, setSessions]       = useState([]);
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge]   = useState("");
  const [caregiverEmail, setCaregiverEmail] = useState("");
  const [scheduleAssignments, setScheduleAssignments] = useState({});
  const bp = useBreakpoint();

  // ── Check if Firebase is configured ────────────────────────────────────────
  const fbReady = isConfigured();

  // ── Restore Firebase Auth session on mount ───────────────────────────────
  useEffect(() => {
    if(!fbReady) { setAuthChecking(false); return; }
    const restore = async () => {
      try {
        const u = await DB.restoreUser();
        if(u) {
          setUser(u);
          const saved = await DB.getSessions(u.uid);
          setSessions(saved);
        }
      } catch(e) { console.warn("Restore failed:", e); }
      setAuthChecking(false);
    };
    restore();
  }, [fbReady]);

  // ── Handle login / signup ────────────────────────────────────────────────
  const handleLogin = async (u) => {
    setUser(u);
    const saved = await DB.getSessions(u.uid);
    setSessions(saved);
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await DB.signOut();
    setUser(null);
    setSessions([]);
    setDrugs([]);
    setResults([]);
    setPatientName(""); setPatientAge(""); setCaregiverEmail("");
    setScheduleAssignments({});
    setPage("check");
    setAuthScreen("login");
  };

  const handleDetected = name => {
    if(!drugs.includes(name)) setDrugs(p => [...p, name]);
    setPage("check");
  };

  const hasDanger = results.some(r => r.severity === "major");

  const PAGE_TITLES = {
    check:    "Polypharmacy Risk Check",
    scan:     "Scan Pill Label",
    schedule: "Daily Medication Schedule",
    history:  "Medication History",
    alerts:   "Caregiver Alerts",
  };

  // ── Firebase setup gate ───────────────────────────────────────────────────
  if(!fbReady) return (
    <>
      <GS/>
      <ConfigNotSetScreen/>
    </>
  );

  // ── Auth loading splash ────────────────────────────────────────────────────
  if(authChecking) return (
    <>
      <GS/>
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#EEF4F9,#E0F2FE)"}}>
        <div style={{textAlign:"center"}}>
          <div style={{width:56,height:56,borderRadius:16,background:"linear-gradient(135deg,#0369A1,#0284C7)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 8px 24px rgba(3,105,161,.3)"}}>
            <Ic p={ICONS.shield} s={26} c="#fff"/>
          </div>
          <div className="serif" style={{fontSize:20,color:"#0F172A",marginBottom:8}}>MediCheck</div>
          <div style={{display:"flex",gap:6,justifyContent:"center"}}>
            {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#0369A1",animation:`pulse 1.2s ${i*.2}s ease infinite`}}/>)}
          </div>
        </div>
      </div>
    </>
  );

  // ── Auth screens ───────────────────────────────────────────────────────────
  if(!user) return (
    <>
      <GS/>
      {authScreen==="login"
        ? <LoginPage  onLogin={handleLogin} goSignup={()=>setAuthScreen("signup")}/>
        : <SignupPage onLogin={handleLogin} goLogin={()=>setAuthScreen("login")}/>
      }
    </>
  );

  // ── Main app (authenticated) ───────────────────────────────────────────────
  const pageEl = {
    check: <CheckPage
              drugs={drugs} setDrugs={setDrugs}
              results={results} setResults={setResults}
              patientName={patientName} setPatientName={setPatientName}
              patientAge={patientAge} setPatientAge={setPatientAge}
              caregiverEmail={caregiverEmail} setCaregiverEmail={setCaregiverEmail}
            />,
    scan:     <ScanPage onDetected={handleDetected}/>,
    schedule: <SchedulePage drugs={drugs} assignments={scheduleAssignments} setAssignments={setScheduleAssignments}/>,
    history:  <HistoryPage
                sessions={sessions} setSessions={setSessions}
                drugs={drugs} setDrugs={setDrugs}
                patientName={patientName} setPatientName={setPatientName}
                patientAge={patientAge} setPatientAge={setPatientAge}
                caregiverEmail={caregiverEmail} setCaregiverEmail={setCaregiverEmail}
                scheduleAssignments={scheduleAssignments} setScheduleAssignments={setScheduleAssignments}
                user={user} setPage={setPage}
              />,
    alerts:   <AlertsPage
                results={results} drugs={drugs}
                caregiverEmail={caregiverEmail} setCaregiverEmail={setCaregiverEmail}
                patientName={patientName}
              />,
  };

  const isDesktop = bp === "desktop" || bp === "laptop";

  return (
    <>
      <GS/>
      <div className="rsp-shell">
        <Nav page={page} setPage={setPage} drugs={drugs} hasDanger={hasDanger} user={user} onLogout={handleLogout}/>

        <div className="rsp-main">
          {/* Mobile/tablet header */}
          {!isDesktop && (
            <div className="rsp-header">
              <div style={{display:"flex",alignItems:"center",gap:9}}>
                <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#0369A1,#0284C7)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 3px 8px rgba(3,105,161,.3)"}}>
                  <Ic p={ICONS.shield} s={16} c="#fff"/>
                </div>
                <div>
                  <span className="serif" style={{fontSize:16,fontWeight:700,color:"#0F172A",letterSpacing:"-.01em"}}>MediCheck</span>
                  <span style={{fontSize:10,color:"#94A3B8",display:"block",lineHeight:1,fontWeight:600,letterSpacing:".05em",textTransform:"uppercase"}}>Polypharmacy Safety</span>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                {hasDanger && (
                  <button className="btn btn-sm" onClick={() => setPage("alerts")}
                    style={{background:"#FEF2F2",color:"#DC2626",animation:"pulse 1.5s ease infinite",fontSize:12}}>
                    <Ic p={ICONS.warn} s={13}/> Alert
                  </button>
                )}
                <div style={{fontSize:12,color:"#0369A1",fontWeight:600,padding:"5px 11px",background:"#E0F2FE",borderRadius:99,border:"1px solid #BAE6FD"}}>
                  {drugs.length} med{drugs.length!==1?"s":""}
                </div>
                <button onClick={handleLogout} style={{background:"none",border:"1px solid #E2E8F0",borderRadius:8,padding:"5px 9px",cursor:"pointer",fontSize:11,color:"#64748B",fontFamily:"inherit",fontWeight:600}}>
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* Desktop topbar */}
          {isDesktop && (
            <div className="rsp-topbar">
              <div>
                <h2 className="serif" style={{fontSize:20,fontWeight:700,color:"#0F172A",marginBottom:2}}>{PAGE_TITLES[page]}</h2>
                <p style={{fontSize:12,color:"#94A3B8",fontWeight:500}}>
                  {patientName ? `Patient: ${patientName}${patientAge ? ", age "+patientAge : ""}` : "Polypharmacy risk checker for elderly patients"}
                </p>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                {hasDanger && (
                  <button className="btn btn-sm" onClick={() => setPage("alerts")}
                    style={{background:"#FEF2F2",color:"#DC2626",borderRadius:10,animation:"pulse 1.5s ease infinite"}}>
                    <Ic p={ICONS.warn} s={14}/> Dangerous Interaction
                  </button>
                )}
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:"#E0F2FE",borderRadius:10,border:"1px solid #BAE6FD"}}>
                  <Ic p={ICONS.pill} s={14} c="#0369A1"/>
                  <span style={{fontSize:13,color:"#0369A1",fontWeight:600}}>{drugs.length} medicine{drugs.length!==1?"s":""}</span>
                </div>
                {/* User avatar + logout */}
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"#F8FAFC",borderRadius:10,border:"1px solid #E2E8F0"}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#0369A1,#0284C7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff"}}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{lineHeight:1.2}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#0F172A"}}>{user.name}</div>
                    <div style={{fontSize:10,color:"#94A3B8",textTransform:"capitalize"}}>{user.role||"User"}</div>
                  </div>
                  <button onClick={handleLogout} style={{background:"none",border:"1px solid #E2E8F0",borderRadius:7,padding:"4px 8px",cursor:"pointer",fontSize:11,color:"#64748B",fontFamily:"inherit",fontWeight:600,marginLeft:4}}>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="rsp-content">{pageEl[page]}</div>
        </div>
      </div>
    </>
  );
}