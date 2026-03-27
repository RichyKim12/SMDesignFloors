import { useState, useRef, useCallback } from "react";

const FLOORING_OPTIONS = [
  { id: "oak_hardwood", name: "Oak Hardwood", category: "Hardwood", color: "#C8A96E", pattern: "wood", description: "Classic warm oak planks", emoji: "🪵" },
  { id: "dark_walnut", name: "Dark Walnut", category: "Hardwood", color: "#5C3A1E", pattern: "wood", description: "Rich espresso tones", emoji: "🪵" },
  { id: "white_oak", name: "White Oak", category: "Hardwood", color: "#E8D5B7", pattern: "wood", description: "Light Scandinavian style", emoji: "🪵" },
  { id: "marble_white", name: "Carrara Marble", category: "Tile", color: "#F5F0EB", pattern: "tile", description: "Elegant white marble", emoji: "⬜" },
  { id: "slate_gray", name: "Slate Gray", category: "Tile", color: "#708090", pattern: "tile", description: "Modern cool tones", emoji: "🔲" },
  { id: "terracotta", name: "Terracotta", category: "Tile", color: "#C1622A", pattern: "tile", description: "Warm Mediterranean style", emoji: "🟫" },
  { id: "carpet_beige", name: "Beige Carpet", category: "Carpet", color: "#D4C5A9", pattern: "carpet", description: "Soft neutral carpet", emoji: "🟨" },
  { id: "carpet_gray", name: "Charcoal Carpet", category: "Carpet", color: "#595959", pattern: "carpet", description: "Contemporary dark carpet", emoji: "⬛" },
  { id: "vinyl_plank", name: "Luxury Vinyl Plank", category: "Vinyl", color: "#A0785A", pattern: "wood", description: "Durable wood-look vinyl", emoji: "📦" },
  { id: "concrete", name: "Polished Concrete", category: "Concrete", color: "#9E9E9E", pattern: "solid", description: "Industrial modern look", emoji: "🔳" },
];

function adjustColor(hex, amount) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xFF) + amount));
  return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
}

function PatternSwatch({ flooring, selected, onClick }) {
  const { color, pattern } = flooring;
  const getPatternStyle = () => {
    if (pattern === "wood") return {
      background: `repeating-linear-gradient(90deg,${color} 0px,${color} 2px,${adjustColor(color,-15)} 2px,${adjustColor(color,-15)} 60px,${color} 60px,${color} 62px,${adjustColor(color,10)} 62px,${adjustColor(color,10)} 120px)`,
      backgroundSize: "120px 100%"
    };
    if (pattern === "tile") return {
      backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.3) 1px,transparent 1px)`,
      backgroundSize: "20px 20px", backgroundColor: color
    };
    if (pattern === "carpet") return {
      background: color,
      backgroundImage: `radial-gradient(circle,${adjustColor(color,-20)} 1px,transparent 1px)`,
      backgroundSize: "4px 4px"
    };
    return { backgroundColor: color };
  };
  return (
    <button onClick={onClick} style={{ border: selected ? "3px solid #2563EB" : "2px solid #E5E7EB", borderRadius: "12px", padding: "8px", cursor: "pointer", background: "white", transition: "all 0.2s", boxShadow: selected ? "0 0 0 3px rgba(37,99,235,0.2)" : "0 1px 3px rgba(0,0,0,0.1)", transform: selected ? "scale(1.02)" : "scale(1)", width: "100%", textAlign: "left" }}>
      <div style={{ ...getPatternStyle(), height: "40px", borderRadius: "6px", marginBottom: "6px" }} />
      <div style={{ fontSize: "12px", fontWeight: 600, color: "#111827" }}>{flooring.name}</div>
      <div style={{ fontSize: "10px", color: "#6B7280" }}>{flooring.category}</div>
    </button>
  );
}

function drawWoodPattern(ctx, x, y, w, h, baseColor) {
  const plankH = Math.max(8, h / 12);
  const numPlanks = Math.ceil(h / plankH);
  for (let i = 0; i < numPlanks; i++) {
    const py = y + i * plankH;
    const ph = Math.min(plankH - 1, h - i * plankH);
    if (ph <= 0) break;
    const c = parseInt(baseColor.replace("#",""),16);
    const adj = i % 2 === 0 ? 0 : -10;
    const r = Math.min(255,Math.max(0,(c>>16)+adj)), g = Math.min(255,Math.max(0,((c>>8)&0xFF)+adj)), b = Math.min(255,Math.max(0,(c&0xFF)+adj));
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x, py, w, ph);
    ctx.strokeStyle = "rgba(0,0,0,0.12)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x+w, py); ctx.stroke();
  }
}

function drawTilePattern(ctx, x, y, w, h, baseColor) {
  const tileSize = Math.max(20, Math.min(w,h)/8);
  for (let tx = x; tx < x+w; tx += tileSize) {
    for (let ty = y; ty < y+h; ty += tileSize) {
      const tw = Math.min(tileSize-2, x+w-tx), th = Math.min(tileSize-2, y+h-ty);
      if (tw <= 0 || th <= 0) break;
      const c = parseInt(baseColor.replace("#",""),16);
      const v = ((Math.floor((tx-x)/tileSize)+(Math.floor((ty-y)/tileSize)))%2===0)?5:-5;
      ctx.fillStyle = `rgb(${Math.min(255,Math.max(0,(c>>16)+v))},${Math.min(255,Math.max(0,((c>>8)&0xFF)+v))},${Math.min(255,Math.max(0,(c&0xFF)+v))})`;
      ctx.fillRect(tx+1, ty+1, tw, th);
    }
  }
  const c = parseInt(baseColor.replace("#",""),16);
  ctx.strokeStyle = `rgb(${Math.max(0,(c>>16)-30)},${Math.max(0,((c>>8)&0xFF)-30)},${Math.max(0,(c&0xFF)-30)})`;
  ctx.lineWidth = 2;
  for (let tx = x; tx <= x+w; tx += tileSize) { ctx.beginPath(); ctx.moveTo(tx,y); ctx.lineTo(tx,y+h); ctx.stroke(); }
  for (let ty = y; ty <= y+h; ty += tileSize) { ctx.beginPath(); ctx.moveTo(x,ty); ctx.lineTo(x+w,ty); ctx.stroke(); }
}

function drawCarpetPattern(ctx, x, y, w, h, baseColor) {
  ctx.fillStyle = baseColor; ctx.fillRect(x, y, w, h);
  const c = parseInt(baseColor.replace("#",""),16);
  for (let px = x; px < x+w; px += 3) {
    for (let py = y; py < y+h; py += 3) {
      if (Math.random() > 0.5) {
        const v = (Math.random()-0.5)*30;
        ctx.fillStyle = `rgb(${Math.min(255,Math.max(0,(c>>16)+v))},${Math.min(255,Math.max(0,((c>>8)&0xFF)+v))},${Math.min(255,Math.max(0,(c&0xFF)+v))})`;
        ctx.fillRect(px, py, 2, 2);
      }
    }
  }
}

// Demo room SVG rendered to canvas
function createDemoRoomCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 600; canvas.height = 420;
  const ctx = canvas.getContext("2d");

  // Sky/wall gradient
  const wallGrad = ctx.createLinearGradient(0,0,0,280);
  wallGrad.addColorStop(0,"#E8DDD0"); wallGrad.addColorStop(1,"#D5C8B8");
  ctx.fillStyle = wallGrad; ctx.fillRect(0,0,600,420);

  // Back wall
  ctx.fillStyle = "#CFC3B3"; ctx.fillRect(80,60,440,220);

  // Window
  ctx.fillStyle = "#B8D4E8";
  ctx.fillRect(220,80,160,130);
  ctx.strokeStyle = "#8B7355"; ctx.lineWidth = 6;
  ctx.strokeRect(220,80,160,130);
  ctx.strokeStyle = "#8B7355"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(300,80); ctx.lineTo(300,210); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(220,145); ctx.lineTo(380,145); ctx.stroke();
  // Window light
  ctx.fillStyle = "rgba(255,255,220,0.3)"; ctx.fillRect(222,82,156,126);

  // Baseboard
  ctx.fillStyle = "#B8A898"; ctx.fillRect(80,260,440,12);

  // Left wall
  const leftGrad = ctx.createLinearGradient(0,0,80,0);
  leftGrad.addColorStop(0,"#B8ADA0"); leftGrad.addColorStop(1,"#CFC3B3");
  ctx.fillStyle = leftGrad; ctx.beginPath();
  ctx.moveTo(0,0); ctx.lineTo(80,60); ctx.lineTo(80,272); ctx.lineTo(0,420); ctx.closePath(); ctx.fill();

  // Right wall
  const rightGrad = ctx.createLinearGradient(520,0,600,0);
  rightGrad.addColorStop(0,"#CFC3B3"); rightGrad.addColorStop(1,"#B8ADA0");
  ctx.fillStyle = rightGrad; ctx.beginPath();
  ctx.moveTo(600,0); ctx.lineTo(520,60); ctx.lineTo(520,272); ctx.lineTo(600,420); ctx.closePath(); ctx.fill();

  // Floor (perspective trapezoid)
  const floorGrad = ctx.createLinearGradient(0,272,0,420);
  floorGrad.addColorStop(0,"#C4A882"); floorGrad.addColorStop(1,"#A08060");
  ctx.fillStyle = floorGrad; ctx.beginPath();
  ctx.moveTo(0,420); ctx.lineTo(600,420); ctx.lineTo(520,272); ctx.lineTo(80,272); ctx.closePath(); ctx.fill();

  // Floor wood lines
  ctx.strokeStyle = "rgba(0,0,0,0.08)"; ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const t = i/7; const y2 = 272 + t*148;
    const x1 = 80 + t*(0-80); const x2 = 520 + t*(600-520);
    ctx.beginPath(); ctx.moveTo(x1,y2); ctx.lineTo(x2,y2); ctx.stroke();
  }

  // Sofa
  ctx.fillStyle = "#7A6B8A";
  ctx.fillRect(160, 200, 280, 80);
  ctx.fillStyle = "#6A5B7A"; ctx.fillRect(160,200,280,20);
  ctx.fillStyle = "#8A7B9A"; ctx.fillRect(160,200,30,80); ctx.fillRect(410,200,30,80);
  ctx.fillStyle = "#9A8BAA";
  ctx.beginPath(); ctx.ellipse(220,210,25,12,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(300,210,25,12,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(380,210,25,12,0,0,Math.PI*2); ctx.fill();

  // Coffee table
  ctx.fillStyle = "#8B6914"; ctx.fillRect(230,260,140,18);
  ctx.fillStyle = "#6B5010"; ctx.fillRect(240,275,8,12); ctx.fillRect(358,275,8,12);

  // Rug
  ctx.fillStyle = "rgba(180,120,80,0.3)"; ctx.beginPath();
  ctx.ellipse(300,310,150,40,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = "rgba(140,80,40,0.4)"; ctx.lineWidth = 2; ctx.stroke();

  // Plant
  ctx.fillStyle = "#5C7A3C";
  ctx.beginPath(); ctx.arc(500,195,25,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(488,208,18,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(512,208,18,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = "#8B6914"; ctx.fillRect(493,215,14,20);
  ctx.fillStyle = "#7A5810"; ctx.fillRect(488,232,24,8);

  // Lamp
  ctx.fillStyle = "#D4AA50";
  ctx.beginPath(); ctx.moveTo(100,140); ctx.lineTo(130,140); ctx.lineTo(125,200); ctx.lineTo(105,200); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#B89040"; ctx.fillRect(100,200,30,5);
  ctx.fillStyle = "#8B7355"; ctx.fillRect(112,205,6,50);
  // Glow
  const glowGrad = ctx.createRadialGradient(115,150,5,115,150,60);
  glowGrad.addColorStop(0,"rgba(255,230,150,0.3)"); glowGrad.addColorStop(1,"rgba(255,230,150,0)");
  ctx.fillStyle = glowGrad; ctx.fillRect(55,100,120,120);

  // Ceiling
  ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.fillRect(0,0,600,10);

  return canvas;
}

export default function FlooringVisualizer() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedImageBase64, setUploadedImageBase64] = useState(null);
  const [selectedFlooring, setSelectedFlooring] = useState(FLOORING_OPTIONS[0]);
  const [resultImage, setResultImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [dragOver, setDragOver] = useState(false);
  const [useDemoRoom, setUseDemoRoom] = useState(false);
  const [demoCanvas, setDemoCanvas] = useState(null);
  const fileInputRef = useRef(null);

  const categories = ["All", ...new Set(FLOORING_OPTIONS.map(f => f.category))];
  const filteredFloorings = activeCategory === "All" ? FLOORING_OPTIONS : FLOORING_OPTIONS.filter(f => f.category === activeCategory);

  const loadDemoRoom = useCallback(() => {
    const canvas = createDemoRoomCanvas();
    setDemoCanvas(canvas);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    setUploadedImage(dataUrl);
    setUploadedImageBase64(dataUrl.split(",")[1]);
    setResultImage(null); setError(null); setUseDemoRoom(true);
  }, []);

  const handleImageUpload = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target.result);
      setUploadedImageBase64(e.target.result.split(",")[1]);
      setResultImage(null); setError(null); setUseDemoRoom(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    handleImageUpload(e.dataTransfer.files[0]);
  }, [handleImageUpload]);

  const applyFloorToDemo = useCallback(() => {
    const canvas = createDemoRoomCanvas();
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;

    // Floor trapezoid coords (perspective)
    // Points: bottom-left(0,420), bottom-right(600,420), top-right(520,272), top-left(80,272)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, h); ctx.lineTo(w, h); ctx.lineTo(520, 272); ctx.lineTo(80, 272);
    ctx.closePath();
    ctx.clip();

    ctx.globalAlpha = 0.82;
    ctx.globalCompositeOperation = "source-over";

    const f = selectedFlooring;
    if (f.pattern === "wood") {
      drawWoodPattern(ctx, 0, 272, w, h-272, f.color);
    } else if (f.pattern === "tile") {
      drawTilePattern(ctx, 0, 272, w, h-272, f.color);
    } else if (f.pattern === "carpet") {
      drawCarpetPattern(ctx, 0, 272, w, h-272, f.color);
    } else {
      ctx.fillStyle = f.color; ctx.fillRect(0, 272, w, h-272);
    }

    // Perspective shading gradient
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 0.25;
    const shadeGrad = ctx.createLinearGradient(0,272,0,h);
    shadeGrad.addColorStop(0,"rgba(0,0,0,0.4)"); shadeGrad.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle = shadeGrad; ctx.fillRect(0, 272, w, h-272);

    ctx.restore();

    // Redraw rug on top
    ctx.globalAlpha = 0.4; ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(180,120,80,0.35)";
    ctx.beginPath(); ctx.ellipse(300,310,150,40,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = "rgba(140,80,40,0.4)"; ctx.lineWidth = 2; ctx.globalAlpha = 0.5; ctx.stroke();
    ctx.globalAlpha = 1;

    setResultImage(canvas.toDataURL("image/jpeg", 0.92));
  }, [selectedFlooring]);

  const handleVisualize = async () => {
    if (!uploadedImage) return;
    if (useDemoRoom) { setIsProcessing(true); setTimeout(() => { applyFloorToDemo(); setIsProcessing(false); }, 800); return; }

    setIsProcessing(true); setError(null); setResultImage(null);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: uploadedImageBase64 } },
              { type: "text", text: `Analyze this room image. Identify the floor region. Respond ONLY with raw JSON (no markdown):
{"floorCoordinates":[{"x":0.0,"y":0.5,"width":1.0,"height":0.5}],"roomType":"living room","perspective":"angled","success":true}
x,y,width,height are 0-1 fractions of image dimensions. y=0 is top. Floor usually occupies bottom 30-60% of image. Be precise.` }
            ]
          }]
        })
      });
      const data = await response.json();
      const text = data.content?.map(i => i.text||"").join("") || "";
      let analysis;
      try { analysis = JSON.parse(text.replace(/```json|```/g,"").trim()); }
      catch { analysis = { floorCoordinates:[{x:0,y:0.5,width:1,height:0.5}], success:true }; }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const coords = analysis.floorCoordinates || [{x:0,y:0.5,width:1,height:0.5}];
        coords.forEach(coord => {
          const fx=coord.x*img.width, fy=coord.y*img.height, fw=coord.width*img.width, fh=coord.height*img.height;
          ctx.save(); ctx.beginPath();
          ctx.moveTo(fx,fy); ctx.lineTo(fx+fw,fy); ctx.lineTo(fx+fw,fy+fh); ctx.lineTo(fx,fy+fh); ctx.closePath(); ctx.clip();
          ctx.globalAlpha = 0.78; ctx.globalCompositeOperation = "multiply";
          const f = selectedFlooring;
          if (f.pattern==="wood") drawWoodPattern(ctx,fx,fy,fw,fh,f.color);
          else if (f.pattern==="tile") drawTilePattern(ctx,fx,fy,fw,fh,f.color);
          else if (f.pattern==="carpet") drawCarpetPattern(ctx,fx,fy,fw,fh,f.color);
          else { ctx.fillStyle=f.color; ctx.fillRect(fx,fy,fw,fh); }
          ctx.globalCompositeOperation="overlay"; ctx.globalAlpha=0.2;
          ctx.fillStyle=f.color; ctx.fillRect(fx,fy,fw,fh);
          ctx.restore();
        });
        setResultImage(canvas.toDataURL("image/jpeg",0.92)); setIsProcessing(false);
      };
      img.onerror = () => { setError("Image processing failed."); setIsProcessing(false); };
      img.src = uploadedImage;
    } catch(err) { setError("Something went wrong. Please try again."); setIsProcessing(false); }
  };

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", minHeight:"100vh", background:"#F1F5F9", color:"#111827", display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#1E293B,#334155)", color:"white", padding:"16px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ fontSize:"26px" }}>🏠</span>
          <div>
            <div style={{ fontSize:"20px", fontWeight:700, letterSpacing:"-0.5px" }}>FloorViz AI</div>
            <div style={{ fontSize:"11px", opacity:0.6 }}>Powered by Claude Vision · See your floor before you buy</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:"16px" }}>
          {["🤖 AI Detection","🎨 10+ Options","⚡ Instant Preview","💾 Download"].map(t=>(
            <div key={t} style={{ fontSize:"11px", background:"rgba(255,255,255,0.1)", padding:"5px 10px", borderRadius:"20px", color:"rgba(255,255,255,0.85)" }}>{t}</div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        {/* Sidebar */}
        <div style={{ width:"280px", background:"white", borderRight:"1px solid #E5E7EB", padding:"18px", overflowY:"auto", flexShrink:0 }}>
          <div style={{ fontSize:"11px", fontWeight:700, color:"#6B7280", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"12px" }}>Select Flooring</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"5px", marginBottom:"14px" }}>
            {categories.map(cat=>(
              <button key={cat} onClick={()=>setActiveCategory(cat)} style={{ padding:"3px 9px", borderRadius:"20px", border:"1px solid", borderColor:activeCategory===cat?"#2563EB":"#D1D5DB", background:activeCategory===cat?"#2563EB":"white", color:activeCategory===cat?"white":"#374151", fontSize:"10px", fontWeight:500, cursor:"pointer" }}>{cat}</button>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"7px", marginBottom:"18px" }}>
            {filteredFloorings.map(f=>(
              <PatternSwatch key={f.id} flooring={f} selected={selectedFlooring.id===f.id} onClick={()=>{setSelectedFlooring(f);setResultImage(null);}} />
            ))}
          </div>
          <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:"10px", padding:"10px", marginBottom:"16px" }}>
            <div style={{ fontSize:"12px", fontWeight:600, color:"#1D4ED8" }}>{selectedFlooring.emoji} {selectedFlooring.name}</div>
            <div style={{ fontSize:"10px", color:"#3B82F6", marginTop:"2px" }}>{selectedFlooring.description}</div>
          </div>
          <button onClick={handleVisualize} disabled={!uploadedImage||isProcessing} style={{ width:"100%", padding:"11px", background:uploadedImage&&!isProcessing?"linear-gradient(135deg,#2563EB,#1D4ED8)":"#9CA3AF", color:"white", border:"none", borderRadius:"10px", fontSize:"13px", fontWeight:600, cursor:uploadedImage&&!isProcessing?"pointer":"not-allowed", boxShadow:uploadedImage&&!isProcessing?"0 4px 12px rgba(37,99,235,0.35)":"none", transition:"all 0.2s" }}>
            {isProcessing?"🔄 Processing…":"✨ Visualize Flooring"}
          </button>
          {!uploadedImage&&<p style={{ fontSize:"10px", color:"#9CA3AF", textAlign:"center", margin:"8px 0 0" }}>Upload a photo or try the demo room</p>}
          {error&&<div style={{ marginTop:"10px", padding:"8px 10px", background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:"8px", fontSize:"11px", color:"#DC2626" }}>⚠️ {error}</div>}
          <div style={{ marginTop:"16px", padding:"10px", background:"#F9FAFB", borderRadius:"8px", fontSize:"10px", color:"#6B7280", lineHeight:"1.7" }}>
            <strong style={{ color:"#374151" }}>💡 Best results:</strong><br/>
            • Well-lit room photos<br/>• Floor clearly visible<br/>• Slight angle works great<br/>• Avoid fisheye lenses
          </div>
        </div>

        {/* Main */}
        <div style={{ flex:1, padding:"24px", overflowY:"auto" }}>
          {!uploadedImage ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"16px", paddingTop:"20px" }}>
              <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={handleDrop} onClick={()=>fileInputRef.current?.click()} style={{ width:"100%", maxWidth:"560px", border:`2px dashed ${dragOver?"#2563EB":"#D1D5DB"}`, borderRadius:"16px", padding:"50px 40px", textAlign:"center", cursor:"pointer", background:dragOver?"#EFF6FF":"#FAFAFA", transition:"all 0.2s" }}>
                <div style={{ fontSize:"44px", marginBottom:"12px" }}>📸</div>
                <h3 style={{ margin:"0 0 6px", fontSize:"16px", fontWeight:600, color:"#374151" }}>Upload Your Room Photo</h3>
                <p style={{ margin:"0 0 16px", color:"#9CA3AF", fontSize:"13px" }}>Drag & drop or click · JPG, PNG, WebP</p>
                <div style={{ display:"inline-block", padding:"9px 22px", background:"#2563EB", color:"white", borderRadius:"8px", fontSize:"13px", fontWeight:600 }}>Choose Photo</div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>handleImageUpload(e.target.files[0])} />
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"12px", color:"#9CA3AF", fontSize:"13px" }}>
                <div style={{ height:"1px", width:"80px", background:"#E5E7EB" }}/> or <div style={{ height:"1px", width:"80px", background:"#E5E7EB" }}/>
              </div>
              <button onClick={loadDemoRoom} style={{ padding:"12px 28px", background:"white", border:"2px solid #E5E7EB", borderRadius:"12px", fontSize:"13px", fontWeight:600, color:"#374151", cursor:"pointer", display:"flex", alignItems:"center", gap:"8px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", transition:"all 0.2s" }}>
                <span style={{ fontSize:"20px" }}>🛋️</span> Try with Demo Room
              </button>
              <p style={{ fontSize:"11px", color:"#9CA3AF", margin:0 }}>Instantly preview flooring on a sample living room</p>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
                  <div style={{ fontSize:"13px", fontWeight:600, color:"#374151" }}>📷 {useDemoRoom?"Demo Room":"Original Photo"}</div>
                  <button onClick={()=>{setUploadedImage(null);setUploadedImageBase64(null);setResultImage(null);setUseDemoRoom(false);}} style={{ background:"#F3F4F6", border:"none", borderRadius:"6px", padding:"4px 10px", fontSize:"11px", cursor:"pointer", color:"#374151" }}>Change</button>
                </div>
                <img src={uploadedImage} alt="Room" style={{ width:"100%", borderRadius:"12px", border:"1px solid #E5E7EB", display:"block" }} />
                {useDemoRoom && <p style={{ fontSize:"10px", color:"#9CA3AF", textAlign:"center", margin:"6px 0 0" }}>AI-generated sample room · Upload your own photo for real results</p>}
              </div>
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
                  <div style={{ fontSize:"13px", fontWeight:600, color:"#374151" }}>{selectedFlooring.emoji} With {selectedFlooring.name}</div>
                  {resultImage && <a href={resultImage} download="floor-preview.jpg" style={{ background:"#059669", borderRadius:"6px", padding:"4px 10px", fontSize:"11px", color:"white", textDecoration:"none", fontWeight:600 }}>⬇ Save</a>}
                </div>
                {isProcessing ? (
                  <div style={{ minHeight:"300px", borderRadius:"12px", background:"#F3F4F6", border:"1px solid #E5E7EB", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"10px" }}>
                    <div style={{ fontSize:"32px", animation:"spin 1.5s linear infinite" }}>🔄</div>
                    <div style={{ color:"#6B7280", fontSize:"13px" }}>Applying {selectedFlooring.name}…</div>
                    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                  </div>
                ) : resultImage ? (
                  <img src={resultImage} alt="Preview" style={{ width:"100%", borderRadius:"12px", border:"1px solid #E5E7EB", display:"block" }} />
                ) : (
                  <div style={{ minHeight:"300px", borderRadius:"12px", background:"#F0F9FF", border:"2px dashed #93C5FD", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"8px" }}>
                    <div style={{ fontSize:"28px" }}>{selectedFlooring.emoji}</div>
                    <div style={{ color:"#3B82F6", fontSize:"13px", fontWeight:500 }}>Ready to preview</div>
                    <div style={{ color:"#93C5FD", fontSize:"11px" }}>Click "Visualize Flooring" in the sidebar</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}