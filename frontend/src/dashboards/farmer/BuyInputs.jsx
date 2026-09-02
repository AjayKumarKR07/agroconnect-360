import { useCallback, useEffect, useState } from "react";
import { DS } from "../../styles/ds";
import { API_URL } from "../../config/api";
import RazorpayCheckout from "../../components/RazorpayCheckout";

/* ─────────────────────────────────────────────────────────────────
   PRODUCT CATALOG — 10 categories, 40+ realistic products
   stock: "in" | "low" | "out"
   img: emoji placeholder (reliable, no broken links)
───────────────────────────────────────────────────────────────── */
const CATEGORIES = [
  {
    id: "seeds", emoji: "🌱", label: "Seeds & Saplings",
    items: [
      { id: "s1",  name: "Hybrid Tomato Seeds",       brand: "Syngenta",       price: 350,  unit: "50g pkt",    rating: 4.8, stock: "in",  img: "🍅", desc: "High-yield hybrid variety. Resistant to TMV and Fusarium wilt." },
      { id: "s2",  name: "BT Cotton Seeds",           brand: "Mahyco",         price: 820,  unit: "450g pkt",   rating: 4.5, stock: "in",  img: "🌿", desc: "Bollworm-resistant transgenic cotton. Suitable for black soil regions." },
      { id: "s3",  name: "Paddy Seeds (IR-64)",       brand: "TNAU",           price: 180,  unit: "1 kg",       rating: 4.7, stock: "in",  img: "🌾", desc: "High-yielding semi-dwarf variety. Suitable for irrigated lowlands." },
      { id: "s4",  name: "Onion Seeds (Nasik Red)",   brand: "Advanta",        price: 290,  unit: "50g pkt",    rating: 4.6, stock: "in",  img: "🧅", desc: "Popular bulb onion variety with deep red colour and pungent taste." },
      { id: "s5",  name: "Maize Hybrid Seeds",        brand: "Pioneer",        price: 540,  unit: "5 kg bag",   rating: 4.7, stock: "in",  img: "🌽", desc: "High-yielding hybrid maize. 90-day crop with drought tolerance." },
      { id: "s6",  name: "Chilli Seeds (Jwala)",      brand: "East-West Seed", price: 210,  unit: "10g pkt",    rating: 4.5, stock: "in",  img: "🌶️", desc: "Traditional long green chilli. Pungent with high oleoresin content." },
      { id: "s7",  name: "Groundnut Seeds (TAG-24)",  brand: "ICRISAT",        price: 130,  unit: "1 kg",       rating: 4.6, stock: "in",  img: "🥜", desc: "Bold-seeded runner variety. Suitable for rain-fed conditions." },
      { id: "s8",  name: "Ragi Seeds (GPU-28)",       brand: "UAS Dharwad",    price: 95,   unit: "1 kg",       rating: 4.5, stock: "low", img: "🌾", desc: "Nutritious finger millet variety. Tolerant to moisture stress." },
      { id: "s9",  name: "Potato Seed Tubers",        brand: "CPRI",           price: 650,  unit: "10 kg net",  rating: 4.7, stock: "in",  img: "🥔", desc: "Certified disease-free tubers. Variety: Kufri Jyoti." },
      { id: "s10", name: "Vegetable Seed Kit",        brand: "Kisaan Store",   price: 399,  unit: "10 varieties",rating: 4.6, stock: "in",  img: "🥗", desc: "Includes tomato, brinjal, capsicum, okra, cucumber and more." },
    ],
  },
  {
    id: "fertilizers", emoji: "🧪", label: "Fertilizers",
    items: [
      { id: "f1", name: "DAP (18-46-0)",               brand: "IFFCO",          price: 1350, unit: "50 kg bag",  rating: 4.9, stock: "in",  img: "🪣", desc: "Di-ammonium phosphate. Best for root development and flowering." },
      { id: "f2", name: "Urea (46% N)",                brand: "NFL",            price: 266,  unit: "45 kg bag",  rating: 4.8, stock: "in",  img: "🪣", desc: "High nitrogen fertilizer. Promotes leafy growth in all crops." },
      { id: "f3", name: "NPK 12-32-16",                brand: "Coromandel",     price: 1250, unit: "50 kg bag",  rating: 4.6, stock: "in",  img: "🧴", desc: "Balanced NPK for all-round crop nutrition." },
      { id: "f4", name: "Vermicompost",                brand: "Organic India",  price: 450,  unit: "25 kg bag",  rating: 4.7, stock: "in",  img: "🌿", desc: "Pure worm castings. Improves soil structure and microbial activity." },
      { id: "f5", name: "Potash (MOP 60%)",            brand: "IPL",            price: 780,  unit: "50 kg bag",  rating: 4.7, stock: "in",  img: "🪣", desc: "Muriate of Potash. Improves fruit quality, size and shelf life." },
      { id: "f6", name: "Neem Cake Fertilizer",        brand: "Agro Products",  price: 280,  unit: "10 kg bag",  rating: 4.5, stock: "in",  img: "🌿", desc: "Organic neem seed cake. Natural soil conditioner and pest repellent." },
      { id: "f7", name: "Zinc Sulphate 21%",           brand: "Tata Chemicals", price: 320,  unit: "5 kg bag",   rating: 4.6, stock: "in",  img: "🧴", desc: "Corrects zinc deficiency. Improves grain filling and yield." },
      { id: "f8", name: "Micronutrient Mix",           brand: "Multiplex",      price: 490,  unit: "5 kg bag",   rating: 4.5, stock: "low", img: "🧪", desc: "Complete mix of Zn, Fe, Mn, Cu, B, Mo for deficiency correction." },
      { id: "f9", name: "Organic Compost",             brand: "Godrej Agrovet", price: 350,  unit: "20 kg bag",  rating: 4.6, stock: "in",  img: "🌱", desc: "Certified organic compost. Improves water-holding capacity." },
      { id: "f10",name: "Biofertilizer (Rhizobium)",  brand: "IARI",           price: 75,   unit: "200g pkt",   rating: 4.4, stock: "in",  img: "🧫", desc: "Nitrogen-fixing Rhizobium for legume crops. Reduces urea use." },
    ],
  },
  {
    id: "pesticides", emoji: "🛡️", label: "Pesticides & Fungicides",
    items: [
      { id: "p1", name: "Chlorpyrifos 20 EC",         brand: "Rallis",         price: 380,  unit: "500 ml",     rating: 4.4, stock: "in",  img: "🧴", desc: "Broad-spectrum insecticide for soil and foliar pests." },
      { id: "p2", name: "Mancozeb 75 WP",             brand: "Indofil",        price: 240,  unit: "500g",       rating: 4.6, stock: "in",  img: "🛡️", desc: "Protective fungicide for blight, anthracnose and downy mildew." },
      { id: "p3", name: "Imidacloprid 17.8 SL",       brand: "Bayer",          price: 590,  unit: "250 ml",     rating: 4.7, stock: "in",  img: "🧴", desc: "Systemic insecticide for sucking pests, aphids and whiteflies." },
      { id: "p4", name: "Copper Oxychloride 50 WP",   brand: "Coromandel",     price: 190,  unit: "500g",       rating: 4.5, stock: "in",  img: "🛡️", desc: "Contact fungicide for fruit rot, leaf spot and bacterial diseases." },
      { id: "p5", name: "Neem Oil 10000 PPM",         brand: "AgroStar",       price: 360,  unit: "1 litre",    rating: 4.6, stock: "in",  img: "🌿", desc: "Certified organic bio-pesticide. Controls mites, aphids and whiteflies." },
      { id: "p6", name: "Glyphosate 41% SL",          brand: "Monsanto",       price: 420,  unit: "1 litre",    rating: 4.3, stock: "in",  img: "🌿", desc: "Non-selective herbicide for pre-cultivation weed control." },
      { id: "p7", name: "Propiconazole 25 EC",        brand: "Syngenta",       price: 550,  unit: "250 ml",     rating: 4.7, stock: "low", img: "🧴", desc: "Systemic fungicide for rust, powdery mildew and leaf spot diseases." },
      { id: "p8", name: "Trichoderma Bio-Fungicide",  brand: "Multiplex",      price: 210,  unit: "1 kg",       rating: 4.5, stock: "in",  img: "🧫", desc: "Biological fungicide. Controls soil-borne fungal pathogens naturally." },
    ],
  },
  {
    id: "equipment", emoji: "🚜", label: "Equipment & Tools",
    items: [
      { id: "e1",  name: "Knapsack Sprayer 16L",      brand: "Neptune",        price: 890,  unit: "1 piece",    rating: 4.7, stock: "in",  img: "🚿", desc: "Manual back-mounted sprayer. Adjustable nozzle for fine mist." },
      { id: "e2",  name: "Battery Sprayer 16L",       brand: "Fortune",        price: 2200, unit: "1 piece",    rating: 4.8, stock: "in",  img: "🔋", desc: "Rechargeable electric sprayer. 2-hour charge for full-day operation." },
      { id: "e3",  name: "Garden Hoe (Khurpa)",       brand: "Visko",          price: 280,  unit: "1 piece",    rating: 4.5, stock: "in",  img: "⛏️", desc: "Heavy-duty forged steel hoe. Ergonomic wooden handle." },
      { id: "e4",  name: "Soil pH Meter",             brand: "HM Digital",     price: 1250, unit: "1 piece",    rating: 4.6, stock: "in",  img: "📊", desc: "Digital meter for quick soil pH and moisture measurement." },
      { id: "e5",  name: "Pruning Shears (Secateurs)",brand: "Bahco",          price: 650,  unit: "1 piece",    rating: 4.7, stock: "in",  img: "✂️", desc: "Professional by-pass pruning shears. Stainless steel blades." },
      { id: "e6",  name: "Sickle / Daranti",          brand: "Kamdhenu",       price: 180,  unit: "1 piece",    rating: 4.5, stock: "in",  img: "🌾", desc: "Traditional serrated-edge harvesting sickle. Forged steel." },
      { id: "e7",  name: "Wheelbarrow (2 cu.ft)",     brand: "Goblin",         price: 1850, unit: "1 piece",    rating: 4.6, stock: "in",  img: "🛒", desc: "Steel pan wheelbarrow. Puncture-proof tyre. Load capacity: 60 kg." },
      { id: "e8",  name: "Seed Drill (Hand)",         brand: "Agro India",     price: 480,  unit: "1 piece",    rating: 4.4, stock: "out", img: "🌱", desc: "Manual seed drill for row sowing. Adjustable row spacing." },
      { id: "e9",  name: "Cultivator (5-tine)",       brand: "Kissan Krishi",  price: 320,  unit: "1 piece",    rating: 4.5, stock: "in",  img: "🔧", desc: "Five-tine steel cultivator for soil loosening and weeding." },
    ],
  },
  {
    id: "irrigation", emoji: "💧", label: "Irrigation Supplies",
    items: [
      { id: "i1", name: "Drip Irrigation Kit (1 Acre)",brand: "Jain",          price: 3500, unit: "per acre kit",rating: 4.8, stock: "in",  img: "💧", desc: "Complete drip system: lateral pipes, emitters, filters, connectors." },
      { id: "i2", name: "Sprinkler Set (10 heads)",   brand: "Netafim",        price: 1800, unit: "set of 10",  rating: 4.6, stock: "in",  img: "🌊", desc: "Pop-up brass sprinkler heads with 360° coverage. 4–8m radius." },
      { id: "i3", name: "Water Pump 1 HP (Mono)",     brand: "Kirloskar",      price: 4200, unit: "1 piece",    rating: 4.9, stock: "in",  img: "⚙️", desc: "Single-phase monoblock centrifugal pump. Max head: 30m." },
      { id: "i4", name: "HDPE Pipe 63mm (50m Roll)",  brand: "Finolex",        price: 3200, unit: "50m roll",   rating: 4.7, stock: "in",  img: "🔵", desc: "High-density PE pipe for main water line. Pressure rated 6 kg/cm²." },
      { id: "i5", name: "Drip Emitters 4 LPH (100 pc)",brand: "Jain",         price: 480,  unit: "100 pieces", rating: 4.8, stock: "in",  img: "🔵", desc: "Pressure-compensating drip emitters. Self-flushing, clog-resistant." },
      { id: "i6", name: "Sand Media Filter (2 inch)",  brand: "Netafim",       price: 2800, unit: "1 piece",    rating: 4.7, stock: "in",  img: "🔧", desc: "For removing sand and suspended particles from irrigation water." },
      { id: "i7", name: "Lay Flat Hose 3 inch",       brand: "Finolex",        price: 55,   unit: "per metre",  rating: 4.5, stock: "in",  img: "🔵", desc: "Heavy-duty collapsible hose for temporary field irrigation." },
    ],
  },
  {
    id: "organic", emoji: "🌿", label: "Organic & Bio Inputs",
    items: [
      { id: "o1", name: "Vermicompost 25kg",           brand: "Organic India",  price: 450,  unit: "25 kg bag",  rating: 4.7, stock: "in",  img: "🪱", desc: "Premium worm castings. Boosts soil biology and plant immunity." },
      { id: "o2", name: "Neem Cake Powder",            brand: "PNMB",           price: 280,  unit: "10 kg bag",  rating: 4.5, stock: "in",  img: "🌿", desc: "Cold-pressed neem cake. NPK: 6-1-1. Effective soil pesticide." },
      { id: "o3", name: "Jeevamrut Ready Mix",         brand: "Sahaj Krishi",   price: 180,  unit: "2 litre",    rating: 4.6, stock: "in",  img: "🧴", desc: "Ready-to-use Jeevamrut for foliar spray and soil drench." },
      { id: "o4", name: "Trichoderma Granules",        brand: "Multiplex",      price: 210,  unit: "1 kg",       rating: 4.5, stock: "in",  img: "🧫", desc: "Beneficial fungal biocontrol agent. Controls damping-off and wilt." },
      { id: "o5", name: "Organic Growth Booster",     brand: "Aries Agro",     price: 320,  unit: "500 ml",     rating: 4.5, stock: "in",  img: "🌱", desc: "Seaweed extract + humic acid. Improves germination and yield." },
      { id: "o6", name: "Soil Conditioner (Humic)",   brand: "Coromandel",     price: 490,  unit: "5 kg",       rating: 4.6, stock: "in",  img: "🌍", desc: "Humic + fulvic acid complex. Improves cation exchange capacity." },
    ],
  },
  {
    id: "nursery", emoji: "🪴", label: "Nursery & Planting",
    items: [
      { id: "n1", name: "Seedling Trays 98-cell",      brand: "AgriSupply",     price: 85,   unit: "per tray",   rating: 4.6, stock: "in",  img: "🪴", desc: "High-impact PS trays. Reusable. Ideal for vegetable nursery." },
      { id: "n2", name: "Grow Bags 18x18 inch (10pc)", brand: "Kisaan Store",   price: 199,  unit: "10 bags",    rating: 4.5, stock: "in",  img: "🛍️", desc: "UV-stabilised HDPE grow bags for vegetables and fruit trees." },
      { id: "n3", name: "Cocopeat Block 5kg",          brand: "Classic Coir",   price: 120,  unit: "5 kg block", rating: 4.7, stock: "in",  img: "🪨", desc: "Compressed coir pith. Expands 15× in water. Excellent seedling media." },
      { id: "n4", name: "Shade Net 50% (10x6m)",       brand: "Agronet",        price: 850,  unit: "10×6 m roll",rating: 4.6, stock: "in",  img: "🌤️", desc: "UV-stabilised HDPE shade net. Reduces heat and pest pressure." },
      { id: "n5", name: "Plastic Mulching Sheet",      brand: "Kissan Agro",    price: 1200, unit: "400 m roll", rating: 4.7, stock: "in",  img: "🟤", desc: "Black LDPE mulch film 25 micron. Suppresses weeds, conserves moisture." },
      { id: "n6", name: "Bamboo Support Sticks 4ft",   brand: "Natural",        price: 150,  unit: "25 sticks",  rating: 4.4, stock: "in",  img: "🎋", desc: "Natural bamboo stakes for staking tomato, chilli and climbers." },
    ],
  },
  {
    id: "safety", emoji: "🧤", label: "Farm Safety & PPE",
    items: [
      { id: "sf1", name: "Agricultural Gloves (Pair)",  brand: "Karam",         price: 120,  unit: "1 pair",     rating: 4.5, stock: "in",  img: "🧤", desc: "Nitrile-coated cotton gloves. Chemical-resistant, cut-resistant." },
      { id: "sf2", name: "Anti-Dust Mask N95",          brand: "3M",            price: 95,   unit: "5 pieces",   rating: 4.8, stock: "in",  img: "😷", desc: "N95 respirator. Protects from pesticide dust and crop allergens." },
      { id: "sf3", name: "Chemical Safety Goggles",     brand: "Karam",         price: 280,  unit: "1 piece",    rating: 4.7, stock: "in",  img: "🥽", desc: "Anti-splash chemical goggles. Indirect ventilation. Fog-resistant." },
      { id: "sf4", name: "PVC Gumboots",                brand: "Lotus",         price: 450,  unit: "1 pair",     rating: 4.5, stock: "in",  img: "👢", desc: "Waterproof PVC gumboots. Anti-slip sole. For field and wet areas." },
      { id: "sf5", name: "Protective Apron (PVC)",      brand: "Karam",         price: 350,  unit: "1 piece",    rating: 4.5, stock: "low", img: "🦺", desc: "Full-length chemical-resistant PVC apron for spray operations." },
      { id: "sf6", name: "Rain Poncho / Raincoat",      brand: "Columbia",      price: 580,  unit: "1 piece",    rating: 4.6, stock: "in",  img: "🌧️", desc: "Waterproof EVA poncho for field work during monsoon operations." },
    ],
  },
  {
    id: "storage", emoji: "📦", label: "Storage & Post-Harvest",
    items: [
      { id: "st1", name: "HDPE Grain Storage Bag 50kg",brand: "Tara",           price: 55,   unit: "per bag",    rating: 4.7, stock: "in",  img: "🛍️", desc: "Hermetic 3-layer HDPE bag. Keeps grain pest-free for 6 months." },
      { id: "st2", name: "Plastic Produce Crates",     brand: "Cello",          price: 320,  unit: "1 piece",    rating: 4.6, stock: "in",  img: "📦", desc: "Stackable ventilated crate for fruits and vegetables. 30 kg capacity." },
      { id: "st3", name: "Digital Weighing Scale 150kg",brand: "Essae",         price: 2800, unit: "1 piece",    rating: 4.8, stock: "in",  img: "⚖️", desc: "Platform scale with LED display. 50g accuracy. Battery + AC." },
      { id: "st4", name: "HDPE Tarpaulin 20x15ft",     brand: "Devi",           price: 850,  unit: "1 piece",    rating: 4.6, stock: "in",  img: "🟦", desc: "150 GSM heavy-duty blue tarpaulin. UV-treated. Waterproof." },
      { id: "st5", name: "Jute Bags 50kg (Pack of 10)",brand: "Natural Fibre",  price: 280,  unit: "10 bags",    rating: 4.5, stock: "in",  img: "🛍️", desc: "Eco-friendly jute gunny bags. Breathable storage for grains." },
      { id: "st6", name: "Moisture Meter (Grain)",     brand: "Sukam",          price: 1200, unit: "1 piece",    rating: 4.6, stock: "in",  img: "📊", desc: "Digital grain moisture meter. Tests wheat, rice, maize and pulses." },
    ],
  },
  {
    id: "protection", emoji: "🌾", label: "Crop Protection",
    items: [
      { id: "cp1", name: "Yellow Sticky Traps (25pc)",  brand: "Pheronine",     price: 180,  unit: "25 traps",   rating: 4.6, stock: "in",  img: "🟡", desc: "Reusable yellow sticky cards for monitoring and trapping flying insects." },
      { id: "cp2", name: "Pheromone Traps (Fruit Fly)", brand: "Pheronine",    price: 250,  unit: "5 traps",    rating: 4.7, stock: "in",  img: "🪤", desc: "Fruit fly lure + funnel trap. Certified for mango and guava orchards." },
      { id: "cp3", name: "Bird Scare Net 10×6m",        brand: "Agronet",       price: 620,  unit: "10×6m",      rating: 4.5, stock: "in",  img: "🐦", desc: "UV-resistant anti-bird net. Protects grapes, berries and sunflower." },
      { id: "cp4", name: "Anti-Hail Net 8×5m",          brand: "Agronet",       price: 890,  unit: "8×5m",       rating: 4.6, stock: "low", img: "🌩️", desc: "Hail-protection HDPE net. Protects polyhouse crops from storm damage." },
      { id: "cp5", name: "Sticky Stem Band",            brand: "GreenTech",     price: 95,   unit: "10m roll",   rating: 4.4, stock: "in",  img: "🎗️", desc: "Adhesive stem band. Prevents crawling insects from reaching canopy." },
    ],
  },
];

/* recommendation map: crop keyword → category ids to highlight */
const CROP_RECOMMENDATIONS = {
  tomato:    ["seeds","fertilizers","pesticides","irrigation","nursery"],
  paddy:     ["seeds","fertilizers","irrigation","equipment"],
  rice:      ["seeds","fertilizers","irrigation","equipment"],
  cotton:    ["seeds","fertilizers","pesticides","equipment"],
  onion:     ["seeds","fertilizers","pesticides","storage"],
  maize:     ["seeds","fertilizers","pesticides","irrigation"],
  chilli:    ["seeds","fertilizers","pesticides","protection"],
  wheat:     ["seeds","fertilizers","equipment","storage"],
  groundnut: ["seeds","fertilizers","organic","storage"],
  sugarcane: ["seeds","fertilizers","irrigation","equipment"],
};

/* ── Stars ── */
const Stars = ({ rating }) => (
  <span style={{ color: "#fbbf24", fontSize: 12 }}>
    {"★".repeat(Math.floor(rating))}{"☆".repeat(5 - Math.floor(rating))}
    <span style={{ color: "#7a8fa6", marginLeft: 4, fontSize: 11 }}>{rating}</span>
  </span>
);

/* ── Stock badge ── */
const StockBadge = ({ stock }) => {
  const cfg = {
    in:  { label: "In Stock",    cls: "badge-green" },
    low: { label: "Low Stock",   cls: "badge-amber" },
    out: { label: "Out of Stock",cls: "badge-red"   },
  }[stock] || { label: "In Stock", cls: "badge-green" };
  return <span className={`badge ${cfg.cls}`} style={{ fontSize: 10 }}>{cfg.label}</span>;
};

/* ── Product card ── */
function ProductCard({ item, onAdd, onQuickView }) {
  const disabled = item.stock === "out";
  return (
    <div className="item-card" style={{ cursor: "pointer" }} onClick={() => onQuickView(item)}>
      {/* Image area */}
      <div style={{
        height: 90, borderRadius: 10,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 44, lineHeight: 1, position: "relative",
        overflow: "hidden", flexShrink: 0,
      }}>
        {item.img}
        {disabled && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "#f87171",
          }}>OUT OF STOCK</div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        <div className="item-name" style={{ lineHeight: 1.3 }}>{item.name}</div>
        <div className="item-brand">by {item.brand}</div>
        <Stars rating={item.rating} />
        <StockBadge stock={item.stock} />
      </div>

      {/* Price + Add */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 4 }}>
        <div>
          <div className="item-price">₹{item.price.toLocaleString("en-IN")}</div>
          <div className="item-unit">per {item.unit}</div>
        </div>
        <button
          className={disabled ? "btn-ghost" : "btn-green"}
          style={{ padding: "8px 14px", fontSize: 12, fontWeight: 700, opacity: disabled ? 0.45 : 1 }}
          disabled={disabled}
          onClick={(e) => { e.stopPropagation(); if (!disabled) onAdd(item); }}
        >
          {disabled ? "—" : "+ Add"}
        </button>
      </div>
    </div>
  );
}

/* ── Quick View Modal ── */
function QuickViewModal({ item, onClose, onAdd }) {
  const disabled = item.stock === "out";
  // Escape key
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box" style={{ maxWidth: 420 }}>
        {/* image */}
        <div style={{
          height: 120, borderRadius: 12, marginBottom: 20,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56,
        }}>{item.img}</div>

        {/* info */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div className="modal-title" style={{ fontSize: 18, marginBottom: 0 }}>{item.name}</div>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, color: "#7a8fa6", cursor: "pointer", width: 30, height: 30, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
          >×</button>
        </div>

        <div style={{ fontSize: 13, color: "#7a8fa6", marginBottom: 10 }}>by {item.brand}</div>
        <Stars rating={item.rating} />

        <div style={{ margin: "12px 0", display: "flex", gap: 8, alignItems: "center" }}>
          <StockBadge stock={item.stock} />
          <span style={{ fontSize: 12, color: "#7a8fa6" }}>/ {item.unit}</span>
        </div>

        <div style={{ fontSize: 13, color: "#b0c4d8", lineHeight: 1.6, marginBottom: 16 }}>{item.desc}</div>

        <div style={{ fontSize: 24, fontWeight: 800, color: "#4ade80", fontFamily: "'Space Grotesk',sans-serif", marginBottom: 16 }}>
          ₹{item.price.toLocaleString("en-IN")}
          <span style={{ fontSize: 13, color: "#7a8fa6", fontWeight: 400, marginLeft: 6 }}>per {item.unit}</span>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>Close</button>
          <button
            className={disabled ? "btn-ghost" : "btn-green"}
            style={{ flex: 2, justifyContent: "center", opacity: disabled ? 0.45 : 1 }}
            disabled={disabled}
            onClick={() => { if (!disabled) { onAdd(item); onClose(); } }}
          >
            {disabled ? "Out of Stock" : "🛒 Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────── */
export default function BuyInputs() {
  const [activeCategory, setActiveCategory] = useState("seeds");
  const [cart,           setCart]           = useState([]);
  const [search,         setSearch]         = useState("");
  const [toast,          setToast]          = useState("");
  const [showCheckout,   setShowCheckout]   = useState(false);
  const [placing,        setPlacing]        = useState(false);
  const [orderSuccess,   setOrderSuccess]   = useState(null);
  // { orderId, rzpData } — set after DB order created, triggers Razorpay popup
  const [pendingRzpOrder,setPendingRzpOrder]= useState(null);
  const [paymentError,   setPaymentError]   = useState("");
  const [form,           setForm]           = useState({ name: "", phone: "", address: "", city: "", payment: "cod" });
  const [formError,      setFormError]      = useState("");
  const [quickView,      setQuickView]      = useState(null);
  const [farm,           setFarm]           = useState(null);

  const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");

  // Load farm profile for personalised recommendations
  useEffect(() => {
    const token = localStorage.getItem("agroconnect_token");
    if (!token) return;
    fetch(`${API_URL}/api/profile/farm`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.farm) setFarm(d.farm); })
      .catch(() => {});
  }, []);

  // Derive recommended categories from farm's crop / previousCrop
  const recommendedCatIds = (() => {
    if (!farm) return [];
    const cropStr = (farm.previousCrop || farm.mainCrop || "").toLowerCase();
    for (const [key, cats] of Object.entries(CROP_RECOMMENDATIONS)) {
      if (cropStr.includes(key)) return cats;
    }
    return [];
  })();

  /* ── Cart ─────────────────────────────────────────────────────── */
  const addToCart = (item) => {
    if (item.stock === "out") return;
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id);
      if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
    setToast(`✅ ${item.name} added to cart`);
    setTimeout(() => setToast(""), 2500);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(c => c.id !== id));
  const updateQty = (id, delta) =>
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c));

  const totalAmount = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const totalItems  = cart.reduce((s, c) => s + c.qty, 0);
  const deliveryFee = totalAmount >= 2000 ? 0 : 150;

  /* ── Form ─────────────────────────────────────────────────────── */
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const v = name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setForm(p => ({ ...p, [name]: v }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address || !form.city) {
      setFormError("Please fill all required fields."); return;
    }
    if (placing) return; // duplicate-click guard
    setFormError(""); setPaymentError(""); setPlacing(true);

    try {
      const token = localStorage.getItem("agroconnect_token");

      // Step 1: Create application order in DB.
      //   - Backend calculates totalAmount from items — we never trust frontend total.
      //   - paymentMethod: "cod" or "razorpay"
      const isOnline = form.payment !== "cod";
      const r = await fetch(`${API_URL}/api/inputs/order`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: cart.map(c => ({ name: c.name, brand: c.brand, qty: c.qty, price: c.price, unit: c.unit })),
          delivery: { name: form.name, phone: form.phone, address: form.address, city: form.city },
          paymentMethod: isOnline ? "razorpay" : "cod",
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.success) {
        setFormError(d.message || "Failed to place order. Please try again.");
        setPlacing(false);
        return;
      }

      const dbOrderId  = d.orderId;
      const dbTotal    = d.totalAmount; // authoritative total from backend

      // ── COD: instant success ──────────────────────────────────────────────
      if (!isOnline) {
        setOrderSuccess({ orderId: dbOrderId, totalAmount: dbTotal, items: cart, delivery: form, payment: "cod" });
        setCart([]); setShowCheckout(false);
        setPlacing(false);
        return;
      }

      // ── Online (Razorpay): Step 2 — get Razorpay checkout data ───────────
      //   Amount is read from DB by the backend — frontend cannot inject amount.
      const rzpRes = await fetch(`${API_URL}/api/inputs/payment/create-order`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: String(dbOrderId) }),
      });
      const rzpData = await rzpRes.json();
      if (!rzpRes.ok || !rzpData.success) {
        setFormError(rzpData.message || "Payment initiation failed. Your order is saved — use retry later.");
        setPlacing(false);
        return;
      }

      // Step 3: Open Razorpay popup (handled by RazorpayCheckout via pendingRzpOrder).
      //   Do NOT show success yet — success is only shown after backend verification.
      setShowCheckout(false);
      setPendingRzpOrder({
        orderId:  String(dbOrderId),
        rzpData,  // { razorpayOrderId, amount, currency, keyId }
        snapshot: { totalAmount: dbTotal, items: cart, delivery: form, payment: "razorpay" },
      });
    } catch {
      setFormError("Network error. Please check your connection and try again.");
    } finally {
      setPlacing(false);
    }
  };

  // Called by RazorpayCheckout after backend payment verification succeeds.
  const onRzpSuccess = useCallback((orderId) => {
    if (!pendingRzpOrder) return;
    setOrderSuccess({
      orderId,
      totalAmount: pendingRzpOrder.snapshot.totalAmount,
      items:       pendingRzpOrder.snapshot.items,
      delivery:    pendingRzpOrder.snapshot.delivery,
      payment:     "razorpay",
    });
    setCart([]);
    setPendingRzpOrder(null);
    setPaymentError("");
  }, [pendingRzpOrder]);

  // Called by RazorpayCheckout on failure or popup dismiss.
  const onRzpFailure = useCallback((msg) => {
    setPendingRzpOrder(null);
    setPaymentError(msg || "Payment was not completed. Your order is saved — you can retry payment from your orders.");
  }, []);

  /* ── Filtered product list ────────────────────────────────────── */
  const q = search.toLowerCase();
  const activeItems = search
    ? CATEGORIES.flatMap(cat =>
        cat.items
          .filter(i => i.name.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q) || cat.label.toLowerCase().includes(q))
          .map(i => ({ ...i, _catLabel: cat.label }))
      )
    : (CATEGORIES.find(c => c.id === activeCategory)?.items || []);

  /* ── All-products count for stats ────────────────────────────── */
  const totalProductCount = CATEGORIES.reduce((s, c) => s + c.items.length, 0);

  /* ═══════════════════════════════════════════════════════════════
     RENDER
  ═════════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{DS + `
        /* ── Category tabs ── */
        .cat-tabs { display:flex; gap:7px; flex-wrap:wrap; margin-bottom:24px; }
        .cat-tab {
          padding:7px 14px; border-radius:10px; font-size:12px; font-weight:600;
          cursor:pointer; border:1px solid var(--border);
          background:var(--surface); color:var(--text2);
          transition:all 0.18s; white-space:nowrap;
        }
        .cat-tab.active  { background:var(--green-dim); color:#4ade80; border-color:rgba(34,197,94,0.2); }
        .cat-tab:hover:not(.active) { border-color:var(--border2); color:var(--text); }

        /* ── Product grid ── */
        .item-grid {
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(200px,1fr));
          gap:14px;
        }
        @media(max-width:640px){
          .item-grid { grid-template-columns:1fr 1fr; gap:10px; }
        }
        @media(max-width:400px){
          .item-grid { grid-template-columns:1fr; }
        }

        /* ── Product card ── */
        .item-card {
          background:var(--surface); border:1px solid var(--border);
          border-radius:16px; padding:16px;
          display:flex; flex-direction:column; gap:8px;
          transition:border-color 0.2s,transform 0.2s,box-shadow 0.18s;
        }
        .item-card:hover {
          border-color:rgba(34,197,94,0.28);
          transform:translateY(-2px);
          box-shadow:0 10px 32px rgba(0,0,0,0.45);
        }
        .item-name  { font-size:13px; font-weight:700; color:#fff; line-height:1.3; }
        .item-brand { font-size:11px; color:var(--text2); }
        .item-price { font-family:'Space Grotesk',sans-serif; font-size:18px; font-weight:800; color:#4ade80; }
        .item-unit  { font-size:10px; color:var(--text2); }

        /* ── Badge ── */
        .badge { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:5px; font-size:11px; font-weight:600; }
        .badge-green  { background:rgba(34,197,94,0.12);  color:#4ade80; border:1px solid rgba(34,197,94,0.2);  }
        .badge-amber  { background:rgba(251,191,36,0.12); color:#fde68a; border:1px solid rgba(251,191,36,0.2); }
        .badge-red    { background:rgba(239,68,68,0.12);  color:#f87171; border:1px solid rgba(239,68,68,0.2);  }

        /* ── Toast ── */
        .toast {
          position:fixed; bottom:28px; right:28px;
          background:rgba(34,197,94,0.14); border:1px solid rgba(34,197,94,0.3);
          color:#4ade80; padding:12px 20px; border-radius:12px;
          font-size:14px; font-weight:600; z-index:9998;
          backdrop-filter:blur(12px); animation:slideUp 0.3s ease;
        }
        @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }

        /* ── Modal ── */
        .modal-overlay {
          position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:9999;
          display:flex; align-items:center; justify-content:center;
          padding:20px; backdrop-filter:blur(6px);
        }
        .modal-box {
          background:#080d12; border:1px solid rgba(255,255,255,0.10);
          border-radius:24px; padding:28px; width:100%; max-width:460px;
          max-height:90vh; overflow-y:auto; animation:fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
        .modal-title { font-family:'Space Grotesk',sans-serif; font-size:20px; font-weight:800; color:#fff; margin-bottom:4px; }
        .modal-sub { font-size:13px; color:var(--text2); margin-bottom:20px; }

        /* Checkout form */
        .checkout-fields { display:flex; flex-direction:column; gap:14px; margin-bottom:20px; }
        .pay-opts { display:flex; gap:10px; flex-wrap:wrap; }
        .pay-opt { flex:1; min-width:100px; padding:11px; border-radius:12px; border:1px solid var(--border); background:var(--surface); cursor:pointer; text-align:center; font-size:12px; font-weight:600; color:var(--text2); transition:all 0.2s; }
        .pay-opt.selected { border-color:rgba(34,197,94,0.3); background:var(--green-dim); color:#4ade80; }

        /* Success */
        .success-wrap { text-align:center; padding:40px 20px; }
        .success-icon { font-size:64px; margin-bottom:16px; animation:pop 0.4s ease; }
        @keyframes pop { from{transform:scale(0.5);opacity:0} to{transform:scale(1);opacity:1} }
        .success-title { font-family:'Space Grotesk',sans-serif; font-size:26px; font-weight:800; color:#4ade80; margin-bottom:8px; }
        .success-sub { font-size:14px; color:var(--text2); margin-bottom:24px; }
        .order-id-badge { display:inline-block; padding:8px 20px; background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); border-radius:100px; font-size:13px; color:#4ade80; font-weight:700; margin-bottom:20px; }

        /* Cart qty */
        .qty-ctrl { display:flex; align-items:center; gap:8px; }
        .qty-btn { width:24px; height:24px; border-radius:6px; border:1px solid var(--border); background:var(--surface); color:#fff; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; transition:background 0.15s; }
        .qty-btn:hover { background:var(--surface2); }

        /* Recommendation bar */
        .rec-bar {
          display:flex; gap:8px; flex-wrap:wrap;
          padding:14px 18px; border-radius:14px;
          background:rgba(34,197,94,0.06); border:1px solid rgba(34,197,94,0.14);
          margin-bottom:20px; align-items:center;
        }

        /* Layout: products + cart side panel */
        .shop-layout { display:grid; grid-template-columns:1fr 290px; gap:24px; align-items:start; }
        @media(max-width:900px) { .shop-layout { grid-template-columns:1fr; } }
      `}</style>

      {toast && <div className="toast">{toast}</div>}
      {quickView && <QuickViewModal item={quickView} onClose={() => setQuickView(null)} onAdd={(item) => { addToCart(item); setToast(`✅ ${item.name} added to cart`); }} />}

      {/* ── Payment error after Razorpay dismissal / failure ─────────────── */}
      {paymentError && !orderSuccess && (
        <div className="modal-overlay" onClick={() => setPaymentError("")}>
          <div className="modal-box" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <div className="modal-title" style={{ color: "#f87171", marginBottom: 8 }}>Payment Not Completed</div>
            <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: 24, lineHeight: 1.6 }}>{paymentError}</div>
            <button className="btn-green" onClick={() => setPaymentError("")}>OK</button>
          </div>
        </div>
      )}

      {/* ── Razorpay popup (opened after DB order created for online payments) */}
      {pendingRzpOrder && (
        <RazorpayCheckout
          orderId={pendingRzpOrder.orderId}
          amount={pendingRzpOrder.snapshot.totalAmount}
          orderDesc={`AgroConnect 360 — ${pendingRzpOrder.snapshot.items.length} farm input(s)`}
          userName={user.name || form.name || ""}
          userEmail={user.email || ""}
          userPhone={form.phone || ""}
          onSuccess={onRzpSuccess}
          onFailure={onRzpFailure}
          preloadedData={pendingRzpOrder.rzpData}
          verifyEndpoint={`${API_URL}/api/inputs/payment/verify`}
          autoOpen={true}
        >
          <span style={{ display: "none" }} />
        </RazorpayCheckout>
      )}


      {/* ══ ORDER SUCCESS ══════════════════════════════════════════ */}
      {orderSuccess && (
        <div className="success-wrap">
          <div className="success-icon">🎉</div>
          <div className="success-title">Order Placed Successfully!</div>
          <div className="success-sub">Your farm inputs are on the way.</div>
          <div className="order-id-badge">Order ID: {orderSuccess.orderId}</div>
          <div className="card" style={{ maxWidth: 420, margin: "0 auto 20px", textAlign: "left" }}>
            <div className="card-title" style={{ marginBottom: 12 }}>📦 Order Summary</div>
            {orderSuccess.items.map(item => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                <span>{item.name} × {item.qty}</span>
                <span style={{ color: "#4ade80", fontWeight: 700 }}>₹{(item.price * item.qty).toLocaleString("en-IN")}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontWeight: 800, fontSize: 16 }}>
              <span>Total (incl. delivery)</span>
              <span style={{ color: "#4ade80" }}>₹{orderSuccess.totalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <div style={{ padding: "12px 20px", background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)", fontSize: 13 }}>
              📍 Delivery to: <strong style={{ color: "#fff" }}>{orderSuccess.delivery.city}</strong>
            </div>
            <div style={{ padding: "12px 20px", background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)", fontSize: 13 }}>
              💳 Payment: <strong style={{ color: "#fff" }}>
                {orderSuccess.payment === "cod" ? "Cash on Delivery" : "Paid Online (Razorpay)"}
              </strong>
            </div>
          </div>
          <button className="btn-green" style={{ marginTop: 28, padding: "14px 32px" }} onClick={() => setOrderSuccess(null)}>
            🛒 Continue Shopping
          </button>
        </div>
      )}

      {/* ══ MAIN SHOP ══════════════════════════════════════════════ */}
      {!orderSuccess && (
        <>
          {/* Page header */}
          <div className="pg-head">
            <div>
              <div className="eyebrow">Farmer Store</div>
              <h1 className="pg-title">🛒 Buy Farm Inputs</h1>
              <p className="pg-sub">
                {totalProductCount} products across {CATEGORIES.length} categories — delivered to your farm.
              </p>
            </div>
            {cart.length > 0 && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: "var(--text2)" }}>🛒 {totalItems} items</div>
                <div style={{ fontWeight: 800, color: "#4ade80", fontSize: 18 }}>₹{totalAmount.toLocaleString("en-IN")}</div>
              </div>
            )}
          </div>

          {/* ── Personalised recommendation bar ── */}
          {farm && farm.previousCrop ? (
            <div className="rec-bar">
              <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 700, marginRight: 4 }}>
                🌾 Recommended for {farm.previousCrop}:
              </span>
              {recommendedCatIds.length > 0 ? (
                recommendedCatIds.map(cid => {
                  const cat = CATEGORIES.find(c => c.id === cid);
                  if (!cat) return null;
                  return (
                    <button
                      key={cid}
                      style={{
                        padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)",
                        color: "#4ade80", transition: "all 0.15s",
                      }}
                      onClick={() => { setActiveCategory(cid); setSearch(""); }}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  );
                })
              ) : (
                <span style={{ fontSize: 12, color: "var(--text2)" }}>
                  Browse categories below to find inputs for your farm.
                </span>
              )}
            </div>
          ) : !farm ? (
            <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", marginBottom: 20, fontSize: 13, color: "var(--text2)" }}>
              💡 <strong style={{ color: "#fff" }}>Complete your Farm Profile</strong> to get personalised input recommendations for your crops.
            </div>
          ) : null}

          {/* ── Search ── */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <input
              className="field-input"
              placeholder="🔍 Search products, brands, categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 420 }}
            />
            {search && <button className="btn-ghost" onClick={() => setSearch("")}>✕ Clear</button>}
          </div>

          {/* ── Category tabs ── */}
          {!search && (
            <div className="cat-tabs">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  className={`cat-tab ${activeCategory === c.id ? "active" : ""}`}
                  onClick={() => setActiveCategory(c.id)}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Category heading (when not searching) ── */}
          {!search && (() => {
            const cat = CATEGORIES.find(c => c.id === activeCategory);
            return (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
                  {cat?.emoji} {cat?.label}
                </div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
                  {cat?.items.length} products
                </div>
              </div>
            );
          })()}

          {/* ── Search heading ── */}
          {search && (
            <div style={{ marginBottom: 16, fontSize: 14, color: "var(--text2)" }}>
              {activeItems.length} result{activeItems.length !== 1 ? "s" : ""} for "<strong style={{ color: "#fff" }}>{search}</strong>"
            </div>
          )}

          {/* ── Products + Cart side panel ── */}
          <div className={cart.length > 0 ? "shop-layout" : ""}>
            {/* Products grid */}
            <div className="item-grid">
              {activeItems.map(item => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onAdd={addToCart}
                  onQuickView={setQuickView}
                />
              ))}
              {activeItems.length === 0 && (
                <div style={{ gridColumn: "1/-1" }} className="card empty-state">
                  <div className="empty-emoji">🔍</div>
                  <div className="empty-title">No results for "{search}"</div>
                  <div className="empty-sub">Try: tomato, fertilizer, sprayer, drip, gloves…</div>
                </div>
              )}
            </div>

            {/* ── Cart side panel ── */}
            {cart.length > 0 && (
              <div className="card" style={{ position: "sticky", top: 24 }}>
                <div className="card-title" style={{ marginBottom: 14 }}>🛒 Cart ({totalItems})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                  {cart.map(c => (
                    <div key={c.id} style={{ padding: "10px 12px", background: "var(--surface)", borderRadius: 10, border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", flex: 1, lineHeight: 1.3 }}>{c.name}</div>
                        <button
                          onClick={() => removeFromCart(c.id)}
                          style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 6, padding: "2px 6px", color: "#f87171", cursor: "pointer", fontSize: 10, marginLeft: 6 }}
                        >✕</button>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div className="qty-ctrl">
                          <button className="qty-btn" onClick={() => updateQty(c.id, -1)}>−</button>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", minWidth: 18, textAlign: "center" }}>{c.qty}</span>
                          <button className="qty-btn" onClick={() => updateQty(c.id, 1)}>+</button>
                        </div>
                        <span style={{ fontWeight: 800, color: "#4ade80", fontSize: 13 }}>₹{(c.qty * c.price).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text2)", marginBottom: 3 }}>
                    <span>Subtotal</span>
                    <span>₹{totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>
                    <span>Delivery</span>
                    <span style={{ color: deliveryFee === 0 ? "#4ade80" : undefined }}>{deliveryFee === 0 ? "FREE" : "₹150"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 15 }}>
                    <span>Total</span>
                    <span style={{ color: "#4ade80" }}>₹{(totalAmount + deliveryFee).toLocaleString("en-IN")}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 6, textAlign: "center" }}>
                      Add ₹{(2000 - totalAmount).toLocaleString("en-IN")} more for free delivery
                    </div>
                  )}
                </div>

                <button
                  className="btn-green"
                  style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: 14, fontWeight: 800 }}
                  onClick={() => setShowCheckout(true)}
                >
                  🚀 Place Order
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══ CHECKOUT MODAL ════════════════════════════════════════ */}
      {showCheckout && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCheckout(false)}>
          <div className="modal-box">
            <div className="modal-title">📦 Confirm Your Order</div>
            <div className="modal-sub">Enter delivery details to place your order.</div>

            {/* Mini summary */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 8 }}>🛒 {totalItems} items</div>
              {cart.map(c => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text2)", marginBottom: 3 }}>
                  <span>{c.name} × {c.qty}</span>
                  <span style={{ color: "#4ade80" }}>₹{(c.price * c.qty).toLocaleString("en-IN")}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid var(--border)", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 14 }}>
                <span>Total (incl. delivery)</span>
                <span style={{ color: "#4ade80" }}>₹{(totalAmount + deliveryFee).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {formError && <div className="alert-error" style={{ marginBottom: 14 }}>⚠️ {formError}</div>}

            <form onSubmit={handlePlaceOrder}>
              <div className="checkout-fields">
                <div>
                  <label className="field-label">Full Name *</label>
                  <input name="name" className="field-input" required value={form.name} onChange={handleFormChange} placeholder="Your name" />
                </div>
                <div>
                  <label className="field-label">Phone Number *</label>
                  <input name="phone" className="field-input" type="tel" required value={form.phone} onChange={handleFormChange} placeholder="9876543210" maxLength={10} />
                </div>
                <div>
                  <label className="field-label">Delivery Address *</label>
                  <input name="address" className="field-input" required value={form.address} onChange={handleFormChange} placeholder="House/Farm address, Village" />
                </div>
                <div>
                  <label className="field-label">City / District *</label>
                  <input name="city" className="field-input" required value={form.city} onChange={handleFormChange} placeholder="e.g. Bangalore, Karnataka" />
                </div>
                <div>
                  <label className="field-label">Payment Method *</label>
                  <div className="pay-opts">
                    {[["cod","💵 Cash on Delivery"],["upi","📱 UPI"],["bank","🏦 Bank Transfer"]].map(([val, label]) => (
                      <div key={val} className={`pay-opt ${form.payment === val ? "selected" : ""}`} onClick={() => setForm(p => ({ ...p, payment: val }))}>
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => setShowCheckout(false)}>← Back</button>
                <button type="submit" className="btn-green" style={{ flex: 2, justifyContent: "center", padding: "13px" }} disabled={placing}>
                  {placing ? "⏳ Placing…" : "✅ Confirm Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
