import React from 'react';
import { EventOption, SnoopyOutfit, ModelGender } from '../types';
import { RotateCcw } from 'lucide-react';

interface HumanModel2DProps {
  outfit: SnoopyOutfit;
  currentEvent: EventOption;
  gender?: ModelGender;
  onResetOutfit: () => void;
  onRemoveItem: (category: keyof SnoopyOutfit) => void;
}

export const HumanModel2D: React.FC<HumanModel2DProps> = ({
  outfit,
  currentEvent,
  gender = 'nam',
  onResetOutfit,
  onRemoveItem,
}) => {
  // Background visuals tailored to selected event
  const renderEventBackground = () => {
    switch (currentEvent.id) {
      case 'cafe_street':
        return (
          <div className="absolute inset-0 pointer-events-none opacity-25">
            <div className="absolute inset-x-0 bottom-0 h-28 bg-[#8c7355]/20 border-t border-[#8c7355]/30" />
            <div className="absolute top-10 right-8 w-20 h-28 border border-[#7d6850]/40 rounded-t-full" />
            <div className="absolute top-14 right-12 w-12 h-20 border border-[#7d6850]/30" />
            <div className="absolute bottom-8 left-8 w-16 h-12 border-t-2 border-stone-500/40 rounded-t-sm" />
            <div className="absolute bottom-4 left-14 w-4 h-8 bg-stone-500/30" />
          </div>
        );
      case 'birthday_party':
        return (
          <div className="absolute inset-0 pointer-events-none opacity-25">
            <div className="absolute top-6 left-8 w-10 h-14 rounded-full border border-stone-500/40" />
            <div className="absolute top-10 right-10 w-8 h-12 rounded-full border border-stone-500/40" />
            <div className="absolute top-16 left-1/3 w-6 h-6 rotate-45 border border-stone-400/40" />
            <div className="absolute top-24 right-1/4 w-4 h-4 rounded-full bg-stone-400/30" />
          </div>
        );
      case 'office_smart':
        return (
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute inset-0 [background:linear-gradient(to_right,#8c7a6b_1px,transparent_1px),linear-gradient(to_bottom,#8c7a6b_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className="absolute top-10 right-6 w-24 h-48 border border-stone-600/40" />
          </div>
        );
      case 'picnic_camping':
        return (
          <div className="absolute inset-0 pointer-events-none opacity-25">
            <div className="absolute -bottom-8 inset-x-0 h-32 bg-[#7a8565]/20 rounded-t-[120px]" />
            <div className="absolute top-14 right-8 w-0 h-0 border-l-[24px] border-l-transparent border-r-[24px] border-r-transparent border-b-[40px] border-b-stone-600/30" />
          </div>
        );
      case 'gala_evening':
        return (
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-stone-800/20 to-transparent" />
            <div className="absolute inset-0 [background:radial-gradient(#c2a265_1px,transparent_1px)] [background-size:20px_20px]" />
          </div>
        );
      case 'romantic_date':
        return (
          <div className="absolute inset-0 pointer-events-none opacity-25">
            <div className="absolute inset-0 [background:radial-gradient(#b87d75_1px,transparent_1px)] [background-size:22px_22px]" />
            <div className="absolute top-12 left-10 w-16 h-16 rounded-full border border-stone-400/30" />
          </div>
        );
      default:
        return null;
    }
  };

  const isMale = gender === 'nam';

  return (
    <div
      className="relative flex-1 flex flex-col items-center justify-between w-full h-full overflow-hidden select-none"
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      {/* Dynamic background based on event */}
      <div className="absolute inset-0 bg-[#f4ede1]/70 transition-colors duration-500" />
      {renderEventBackground()}

      {/* Realistic model stage shadow with ambient lighting */}
      <div className="absolute bottom-12 w-48 h-7 bg-stone-900/15 rounded-[100%] blur-[4px] pointer-events-none" />
      <div className="absolute bottom-13 w-28 h-3.5 bg-stone-900/25 rounded-[100%] blur-[2px] pointer-events-none" />

      {/* 2D Human Mannequin Graphic (Male or Female) */}
      <div className="relative z-10 w-full flex-1 flex items-center justify-center py-1">
        <svg
          viewBox="0 0 240 440"
          className="h-full max-h-[350px] w-auto drop-shadow-[0_8px_16px_rgba(0,0,0,0.18)] transition-all duration-300"
        >
          <defs>
            <linearGradient id="skinGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={isMale ? '#f2ddd0' : '#f5e2d7'} />
              <stop offset="100%" stopColor={isMale ? '#e4c7b6' : '#ebd1c4'} />
            </linearGradient>
            <linearGradient id="hairGradMale" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3d2b24" />
              <stop offset="100%" stopColor="#1f1510" />
            </linearGradient>
            <linearGradient id="hairGradFemale" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4a352a" />
              <stop offset="100%" stopColor="#281a14" />
            </linearGradient>
            <linearGradient id="baseWearGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbf9f5" />
              <stop offset="100%" stopColor="#ede6db" />
            </linearGradient>
          </defs>

          {/* ================= BASE HUMAN FIGURE ================= */}
          <g id="human-base">
            {isMale ? (
              // ========== MALE MODEL BODY ==========
              <>
                {/* Legs (Male - Straighter, athletic build) */}
                <path
                  d="M100 230 L96 360 L90 390 L107 390 L113 360 L115 240 Z"
                  fill="url(#skinGrad)"
                  stroke="#8c7a6b"
                  strokeWidth="1.2"
                />
                <path
                  d="M140 230 L144 360 L150 390 L133 390 L127 360 L125 240 Z"
                  fill="url(#skinGrad)"
                  stroke="#8c7a6b"
                  strokeWidth="1.2"
                />

                {/* Torso & Hips (Male - Broad shoulders V-taper) */}
                <path
                  d="M84 116 C84 145 92 185 92 235 C110 240 130 240 148 235 C148 185 156 145 156 116 C144 110 96 110 84 116 Z"
                  fill="url(#skinGrad)"
                  stroke="#8c7a6b"
                  strokeWidth="1.2"
                />

                {/* Basic Undergarments (Male - Sleek neutral shorts/boxer) */}
                <path
                  d="M91 200 C110 205 130 205 149 200 L146 235 C132 242 108 242 94 235 Z"
                  fill="#3a3734"
                  stroke="#262422"
                  strokeWidth="1"
                />
                {/* Athletic Tank Top */}
                <path
                  d="M92 118 C104 126 136 126 148 118 L147 165 C136 170 104 170 93 165 Z"
                  fill="url(#baseWearGrad)"
                  stroke="#d5c8b8"
                  strokeWidth="1"
                />

                {/* Left Arm (Male - Athletic) */}
                <path
                  d="M84 116 L70 195 L66 260 L75 262 L82 200 L90 132 Z"
                  fill="url(#skinGrad)"
                  stroke="#8c7a6b"
                  strokeWidth="1.2"
                />
                {/* Right Arm (Male - Athletic) */}
                <path
                  d="M156 116 L170 195 L174 260 L165 262 L158 200 L150 132 Z"
                  fill="url(#skinGrad)"
                  stroke="#8c7a6b"
                  strokeWidth="1.2"
                />

                {/* Neck (Male - Sturdy) */}
                <path
                  d="M110 85 L110 116 C115 118 125 118 130 116 L130 85 Z"
                  fill="url(#skinGrad)"
                  stroke="#8c7a6b"
                  strokeWidth="1.2"
                />

                {/* Head Face (Male - Defined Jawline) */}
                <polygon
                  points="106,62 120,44 134,62 133,78 126,88 114,88 107,78"
                  fill="url(#skinGrad)"
                  stroke="#8c7a6b"
                  strokeWidth="1.2"
                />

                {/* Male Eyes & Features */}
                <ellipse cx="114" cy="65" rx="1.8" ry="1" fill="#3a332d" />
                <ellipse cx="126" cy="65" rx="1.8" ry="1" fill="#3a332d" />
                {/* Stronger Eyebrows */}
                <path d="M109 61 L118 62" stroke="#2d251f" strokeWidth="1.3" strokeLinecap="round" />
                <path d="M122 62 L131 61" stroke="#2d251f" strokeWidth="1.3" strokeLinecap="round" />
                {/* Nose */}
                <path d="M120 65 L119 72 L122 72" stroke="#b39786" strokeWidth="1" fill="none" />
                {/* Lips */}
                <path d="M116 78 L124 78" stroke="#a66e66" strokeWidth="1.3" strokeLinecap="round" />

                {/* Male Stylish Haircut (Textured layered modern side-part) */}
                <path
                  d="M104 64 C100 46 112 36 122 36 C134 36 138 46 136 62 C134 50 130 42 122 42 C114 42 108 50 104 64 Z"
                  fill="url(#hairGradMale)"
                />
                <path
                  d="M104 60 C101 64 104 72 106 74 C106 68 107 64 109 60 Z"
                  fill="url(#hairGradMale)"
                />
                <path
                  d="M136 60 C139 64 136 72 134 74 C134 68 133 64 131 60 Z"
                  fill="url(#hairGradMale)"
                />
              </>
            ) : (
              // ========== FEMALE MODEL BODY ==========
              <>
                {/* Legs (Female - Slender, graceful) */}
                <path
                  d="M102 230 L98 360 L92 390 L106 390 L112 360 L114 240 Z"
                  fill="url(#skinGrad)"
                  stroke="#8c7a6b"
                  strokeWidth="1.2"
                />
                <path
                  d="M138 230 L142 360 L148 390 L134 390 L128 360 L126 240 Z"
                  fill="url(#skinGrad)"
                  stroke="#8c7a6b"
                  strokeWidth="1.2"
                />

                {/* Torso & Hips (Female - Elegant hourglass curves) */}
                <path
                  d="M90 120 C90 148 97 165 94 185 C91 200 90 215 92 235 C110 242 130 242 148 235 C150 215 149 200 146 185 C143 165 150 148 150 120 C140 114 100 114 90 120 Z"
                  fill="url(#skinGrad)"
                  stroke="#8c7a6b"
                  strokeWidth="1.2"
                />

                {/* Basic Undergarments (Female - Elegant Camisole & Shorts) */}
                <path
                  d="M93 125 C102 140 138 140 147 125 L145 170 C135 175 105 175 95 170 Z"
                  fill="url(#baseWearGrad)"
                  stroke="#d5c8b8"
                  strokeWidth="1"
                />
                <path
                  d="M94 205 C110 210 130 210 146 205 L144 235 C132 245 108 245 96 235 Z"
                  fill="url(#baseWearGrad)"
                  stroke="#d5c8b8"
                  strokeWidth="1"
                />

                {/* Left Arm (Female) */}
                <path
                  d="M90 120 L76 195 L72 260 L80 262 L86 200 L95 135 Z"
                  fill="url(#skinGrad)"
                  stroke="#8c7a6b"
                  strokeWidth="1.2"
                />
                {/* Right Arm (Female) */}
                <path
                  d="M150 120 L164 195 L168 260 L160 262 L154 200 L145 135 Z"
                  fill="url(#skinGrad)"
                  stroke="#8c7a6b"
                  strokeWidth="1.2"
                />

                {/* Neck (Female - Graceful & slender) */}
                <path
                  d="M113 85 L113 118 C117 120 123 120 127 118 L127 85 Z"
                  fill="url(#skinGrad)"
                  stroke="#8c7a6b"
                  strokeWidth="1.2"
                />

                {/* Head Face Oval (Female) */}
                <ellipse
                  cx="120"
                  cy="68"
                  rx="17.5"
                  ry="23"
                  fill="url(#skinGrad)"
                  stroke="#8c7a6b"
                  strokeWidth="1.2"
                />

                {/* Female Facial features */}
                <ellipse cx="113" cy="66" rx="1.8" ry="1.1" fill="#3d3229" />
                <ellipse cx="127" cy="66" rx="1.8" ry="1.1" fill="#3d3229" />
                <path d="M110 63 Q114 61 117 63" stroke="#4a3e36" strokeWidth="0.9" fill="none" />
                <path d="M123 63 Q126 61 130 63" stroke="#4a3e36" strokeWidth="0.9" fill="none" />
                <path d="M120 67 L119 72 L122 72" stroke="#bda393" strokeWidth="0.8" fill="none" />
                <path d="M116 77 Q120 80 124 77" stroke="#b96a60" strokeWidth="1.3" fill="none" />

                {/* Soft feminine blush */}
                <circle cx="110" cy="71" r="2.5" fill="#f09b90" opacity="0.35" />
                <circle cx="130" cy="71" r="2.5" fill="#f09b90" opacity="0.35" />

                {/* Hair (Female - Elegant wavy side locks & stylish bob) */}
                <path
                  d="M102 68 C100 46 110 38 120 38 C130 38 140 46 138 68 C136 58 134 48 120 48 C106 48 104 58 102 68 Z"
                  fill="url(#hairGradFemale)"
                />
                <path
                  d="M101 62 C96 70 98 88 103 92 C103 82 105 72 108 66 Z"
                  fill="url(#hairGradFemale)"
                />
                <path
                  d="M139 62 C144 70 142 88 137 92 C137 82 135 72 132 66 Z"
                  fill="url(#hairGradFemale)"
                />
              </>
            )}
          </g>

          {/* ================= CLOTHING OVERLAYS ================= */}

          {/* 1. QUẦN / CHÂN VÁY (BOTTOMS) */}
          {outfit.quan && (
            <g id="model-quan" className="transition-all duration-200">
              {outfit.quan.id === 'quan_001' ? (
                // Wide-leg pleated trousers (beige mock)
                <g>
                  <path
                    d={
                      isMale
                        ? "M90 195 L150 195 L152 375 L125 375 L120 235 L115 375 L88 375 Z"
                        : "M93 195 L147 195 L150 375 L125 375 L120 235 L115 375 L90 375 Z"
                    }
                    fill="#d7c5ad"
                    stroke="#8c775d"
                    strokeWidth="1.5"
                  />
                  {/* Creases */}
                  <line x1="106" y1="210" x2="104" y2="370" stroke="#af9a80" strokeWidth="1" />
                  <line x1="134" y1="210" x2="136" y2="370" stroke="#af9a80" strokeWidth="1" />
                  {/* Belt */}
                  <rect x={isMale ? "90" : "93"} y="193" width={isMale ? "60" : "54"} height="6" fill="#6d4c38" rx="1" />
                  <rect x="117" y="192" width="7" height="8" fill="#d99b38" rx="1" />
                </g>
              ) : outfit.quan.id === 'quan_004' ? (
                // Tuxedo Trousers
                <g>
                  <path
                    d={
                      isMale
                        ? "M90 195 L150 195 L150 375 L126 375 L120 235 L114 375 L90 375 Z"
                        : "M93 195 L147 195 L148 375 L126 375 L120 235 L114 375 L92 375 Z"
                    }
                    fill="#2a2928"
                    stroke="#171615"
                    strokeWidth="1.5"
                  />
                  <line x1="94" y1="198" x2="93" y2="372" stroke="#686663" strokeWidth="1.5" />
                  <line x1="146" y1="198" x2="147" y2="372" stroke="#686663" strokeWidth="1.5" />
                  <rect x={isMale ? "90" : "93"} y="193" width={isMale ? "60" : "54"} height="6" fill="#1c1b1a" />
                </g>
              ) : outfit.quan.id === 'quan_005' ? (
                // Pleated Tennis Skirt (or Shorts on male)
                <g>
                  <path
                    d={
                      isMale
                        ? "M90 195 L150 195 L154 285 L124 285 L120 230 L116 285 L86 285 Z"
                        : "M93 195 L147 195 L156 270 L84 270 Z"
                    }
                    fill="#dfa6a6"
                    stroke="#b37171"
                    strokeWidth="1.5"
                  />
                  {!isMale && (
                    <>
                      <line x1="102" y1="200" x2="98" y2="268" stroke="#be8383" strokeWidth="1" />
                      <line x1="120" y1="200" x2="120" y2="268" stroke="#be8383" strokeWidth="1" />
                      <line x1="138" y1="200" x2="142" y2="268" stroke="#be8383" strokeWidth="1" />
                    </>
                  )}
                  <rect x={isMale ? "90" : "93"} y="193" width={isMale ? "60" : "54"} height="5" fill="#cf8f8f" />
                </g>
              ) : (
                // Generic trousers
                <g>
                  <path
                    d={
                      isMale
                        ? "M90 195 L150 195 L150 375 L126 375 L120 235 L114 375 L90 375 Z"
                        : "M93 195 L147 195 L148 375 L126 375 L120 235 L114 375 L92 375 Z"
                    }
                    fill={outfit.quan.accentColor || '#7d8a94'}
                    stroke="#434e56"
                    strokeWidth="1.5"
                  />
                  <rect x={isMale ? "90" : "93"} y="193" width={isMale ? "60" : "54"} height="6" fill="#394248" />
                </g>
              )}
            </g>
          )}

          {/* 2. ÁO (TOPS) */}
          {outfit.ao && (
            <g id="model-ao" className="transition-all duration-200">
              {outfit.ao.id === 'ao_001' ? (
                // Striped French Knit Sweater (ao_mock_001)
                <g>
                  {/* Sweater Torso */}
                  <path
                    d={
                      isMale
                        ? "M84 114 L156 114 L155 208 L85 208 Z"
                        : "M90 118 L150 118 L152 205 L88 205 Z"
                    }
                    fill="#f6eedf"
                    stroke="#a68c70"
                    strokeWidth="1.5"
                  />
                  {/* Sleeves */}
                  <path
                    d={isMale ? "M84 114 L68 190 L80 194 L93 138 Z" : "M90 118 L73 190 L85 194 L97 140 Z"}
                    fill="#f6eedf"
                    stroke="#a68c70"
                    strokeWidth="1.2"
                  />
                  <path
                    d={isMale ? "M156 114 L172 190 L160 194 L147 138 Z" : "M150 118 L167 190 L155 194 L143 140 Z"}
                    fill="#f6eedf"
                    stroke="#a68c70"
                    strokeWidth="1.2"
                  />
                  {/* Stripes */}
                  <line x1={isMale ? "85" : "90"} y1="138" x2={isMale ? "155" : "150"} y2="138" stroke="#3d5a73" strokeWidth="2.5" />
                  <line x1={isMale ? "85" : "89"} y1="156" x2={isMale ? "155" : "151"} y2="156" stroke="#946543" strokeWidth="2.5" />
                  <line x1={isMale ? "85" : "88"} y1="174" x2={isMale ? "155" : "152"} y2="174" stroke="#3d5a73" strokeWidth="2.5" />
                  <line x1={isMale ? "85" : "88"} y1="192" x2={isMale ? "155" : "152"} y2="192" stroke="#946543" strokeWidth="2.5" />
                  {/* Collar */}
                  <path d={isMale ? "M104 114 Q120 124 136 114" : "M106 118 Q120 126 134 118"} stroke="#a68c70" strokeWidth="3" fill="none" />
                </g>
              ) : outfit.ao.id === 'ao_004' ? (
                // Tailored Gala Blazer
                <g>
                  <path
                    d={
                      isMale
                        ? "M82 112 L158 112 L157 215 L83 215 Z"
                        : "M88 116 L152 116 L155 212 L85 212 Z"
                    }
                    fill="#2c2b29"
                    stroke="#141413"
                    strokeWidth="1.5"
                  />
                  {/* Lapels */}
                  <path d={isMale ? "M84 112 L112 165 L104 165 L90 125 Z" : "M90 116 L112 165 L104 165 L94 125 Z"} fill="#3d3b38" />
                  <path d={isMale ? "M156 112 L128 165 L136 165 L150 125 Z" : "M150 116 L128 165 L136 165 L146 125 Z"} fill="#3d3b38" />
                  {/* White inner shirt V */}
                  <polygon points={isMale ? "110,112 130,112 120,150" : "112,116 128,116 120,150"} fill="#f8f7f4" />
                  {/* Golden buttons */}
                  <circle cx="120" cy="165" r="1.5" fill="#cca44c" />
                  <circle cx="120" cy="180" r="1.5" fill="#cca44c" />
                  {/* Sleeves */}
                  <path d={isMale ? "M82 112 L66 195 L78 198 L92 138 Z" : "M88 116 L71 195 L84 198 L96 140 Z"} fill="#2c2b29" stroke="#141413" strokeWidth="1.2" />
                  <path d={isMale ? "M158 112 L174 195 L162 198 L148 138 Z" : "M152 116 L169 195 L156 198 L144 140 Z"} fill="#2c2b29" stroke="#141413" strokeWidth="1.2" />
                </g>
              ) : outfit.ao.id === 'ao_002' ? (
                // Silk V-neck Blouse
                <g>
                  <path
                    d={
                      isMale
                        ? "M84 114 L156 114 L154 205 L86 205 Z"
                        : "M90 118 L150 118 L149 200 L91 200 Z"
                    }
                    fill="#faf6ef"
                    stroke="#cfc3b2"
                    strokeWidth="1.5"
                  />
                  <polygon points={isMale ? "112,114 128,114 120,145" : "114,118 126,118 120,145"} fill="#e8cfc2" />
                  {/* Sleeves */}
                  <path d={isMale ? "M84 114 L68 190 L80 194 L93 138 Z" : "M90 118 L73 190 L85 194 L97 140 Z"} fill="#faf6ef" stroke="#cfc3b2" strokeWidth="1.2" />
                  <path d={isMale ? "M156 114 L172 190 L160 194 L147 138 Z" : "M150 118 L167 190 L155 194 L143 140 Z"} fill="#faf6ef" stroke="#cfc3b2" strokeWidth="1.2" />
                </g>
              ) : (
                // Generic stylish top
                <g>
                  <path
                    d={
                      isMale
                        ? "M84 114 L156 114 L155 205 L85 205 Z"
                        : "M90 118 L150 118 L151 202 L89 202 Z"
                    }
                    fill={outfit.ao.accentColor || '#617467'}
                    stroke="#38433c"
                    strokeWidth="1.5"
                  />
                  <path d={isMale ? "M84 114 L68 190 L80 194 L93 138 Z" : "M90 118 L73 190 L85 194 L97 140 Z"} fill={outfit.ao.accentColor || '#617467'} stroke="#38433c" strokeWidth="1.2" />
                  <path d={isMale ? "M156 114 L172 190 L160 194 L147 138 Z" : "M150 118 L167 190 L155 194 L143 140 Z"} fill={outfit.ao.accentColor || '#617467'} stroke="#38433c" strokeWidth="1.2" />
                </g>
              )}
            </g>
          )}

          {/* 3. GIÀY / DÉP (SHOES) */}
          {outfit.giay && (
            <g id="model-giay" className="transition-all duration-200">
              {outfit.giay.id === 'giay_001' ? (
                // Oxford Leather Shoes (Rich Brown)
                <g>
                  <path d="M86 388 C86 376 98 376 108 388 L108 396 L86 396 Z" fill="#6d472b" stroke="#4a2e18" strokeWidth="1.2" />
                  <path d="M132 388 C132 376 142 376 154 388 L154 396 L132 396 Z" fill="#6d472b" stroke="#4a2e18" strokeWidth="1.2" />
                  <rect x="85" y="395" width="24" height="3" fill="#2d1c0f" />
                  <rect x="131" y="395" width="24" height="3" fill="#2d1c0f" />
                </g>
              ) : outfit.giay.id === 'giay_003' ? (
                // Sneakers
                <g>
                  <path d="M86 386 C86 376 98 376 109 386 L109 396 L86 396 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
                  <path d="M131 386 C131 376 142 376 154 386 L154 396 L131 396 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
                  <line x1="88" y1="390" x2="106" y2="390" stroke="#0ea5e9" strokeWidth="2" />
                  <line x1="134" y1="390" x2="152" y2="390" stroke="#0ea5e9" strokeWidth="2" />
                  <rect x="85" y="394" width="25" height="4" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" rx="1" />
                  <rect x="130" y="394" width="25" height="4" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" rx="1" />
                </g>
              ) : (
                // Generic shoes
                <g>
                  <path d="M86 388 C86 376 98 376 108 388 L108 396 L86 396 Z" fill={outfit.giay.accentColor || '#1f2937'} stroke="#111827" strokeWidth="1.2" />
                  <path d="M132 388 C132 376 142 376 154 388 L154 396 L132 396 Z" fill={outfit.giay.accentColor || '#1f2937'} stroke="#111827" strokeWidth="1.2" />
                  <rect x="85" y="395" width="24" height="3" fill="#000000" />
                  <rect x="131" y="395" width="24" height="3" fill="#000000" />
                </g>
              )}
            </g>
          )}

          {/* 4. PHỤ KIỆN (ACCESSORIES) */}
          {outfit.phukien && (
            <g id="model-phukien" className="transition-all duration-200">
              {outfit.phukien.id === 'phukien_001' ? (
                // Beret Hat
                <g>
                  <ellipse cx="120" cy="40" rx="26" ry="10" fill="#753030" stroke="#4f1d1d" strokeWidth="1.2" />
                  <circle cx="120" cy="30" r="2.5" fill="#4f1d1d" />
                </g>
              ) : outfit.phukien.id === 'phukien_002' ? (
                // Vintage Round Sunglasses
                <g>
                  <circle cx="113" cy="66" r="5.5" fill="#18181b" stroke="#cca44c" strokeWidth="1.2" />
                  <circle cx="127" cy="66" r="5.5" fill="#18181b" stroke="#cca44c" strokeWidth="1.2" />
                  <line x1="118.5" y1="66" x2="121.5" y2="66" stroke="#cca44c" strokeWidth="1.5" />
                  {/* Glare reflection */}
                  <line x1="111" y1="63" x2="114" y2="67" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
                  <line x1="125" y1="63" x2="128" y2="67" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
                </g>
              ) : outfit.phukien.id === 'phukien_004' ? (
                // Bow tie
                <g>
                  <polygon points="113,114 120,119 113,124" fill="#18181b" />
                  <polygon points="127,114 120,119 127,124" fill="#18181b" />
                  <circle cx="120" cy="119" r="2.5" fill="#cca44c" />
                </g>
              ) : (
                // Scarf / generic
                <g>
                  <path d="M108 116 Q120 126 132 116 L130 145 L124 140 L118 145 Z" fill={outfit.phukien.accentColor || '#c2410c'} />
                </g>
              )}
            </g>
          )}
        </svg>
      </div>

      {/* Floating active outfit tags bar */}
      <div className="relative z-10 w-full px-2 py-1 bg-[#FFFDF5]/90 border-t border-[#8B5A2B]/20 text-[11px] flex items-center justify-between">
        <span className="text-[#8B5A2B] font-bold">
          {isMale ? 'Model Nam' : 'Model Nữ'}:
        </span>
        <div className="flex gap-1 overflow-x-auto text-[10px]">
          {outfit.ao && (
            <button
              onClick={() => onRemoveItem('ao')}
              className="px-1.5 py-0.5 rounded bg-[#f4ede1] hover:bg-[#ebdcc8] border border-[#8B5A2B]/30 text-[#4a2e16] truncate max-w-[75px] cursor-pointer"
              title={`Tháo ${outfit.ao.name}`}
            >
              Áo ×
            </button>
          )}
          {outfit.quan && (
            <button
              onClick={() => onRemoveItem('quan')}
              className="px-1.5 py-0.5 rounded bg-[#f4ede1] hover:bg-[#ebdcc8] border border-[#8B5A2B]/30 text-[#4a2e16] truncate max-w-[75px] cursor-pointer"
              title={`Tháo ${outfit.quan.name}`}
            >
              Quần ×
            </button>
          )}
          {outfit.giay && (
            <button
              onClick={() => onRemoveItem('giay')}
              className="px-1.5 py-0.5 rounded bg-[#f4ede1] hover:bg-[#ebdcc8] border border-[#8B5A2B]/30 text-[#4a2e16] truncate max-w-[75px] cursor-pointer"
              title={`Tháo ${outfit.giay.name}`}
            >
              Giày ×
            </button>
          )}
          {outfit.phukien && (
            <button
              onClick={() => onRemoveItem('phukien')}
              className="px-1.5 py-0.5 rounded bg-[#f4ede1] hover:bg-[#ebdcc8] border border-[#8B5A2B]/30 text-[#4a2e16] truncate max-w-[75px] cursor-pointer"
              title={`Tháo ${outfit.phukien.name}`}
            >
              Phụ kiện ×
            </button>
          )}
          {!outfit.ao && !outfit.quan && !outfit.giay && !outfit.phukien && (
            <span className="text-stone-400 italic">Chưa mặc món nào</span>
          )}
        </div>
      </div>

      {/* Prominent, Noticeable "Làm mới" (Reset) Button at the bottom */}
      <div className="relative z-10 w-full p-2.5 bg-[#FFFDF5] border-t-2 border-[#8B5A2B]/25 shadow-[0_-4px_12px_rgba(80,45,15,0.05)]">
        <button
          onClick={onResetOutfit}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold tracking-wider uppercase text-white bg-gradient-to-b from-[#9b6532] to-[#7f4f24] hover:from-[#8B5A2B] hover:to-[#6f4520] active:scale-[0.98] shadow-[0_4px_12px_rgba(127,79,36,0.35)] hover:shadow-[0_6px_16px_rgba(127,79,36,0.45)] transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#6f4520]"
        >
          <RotateCcw className="w-4 h-4 drop-shadow-xs" />
          <span className="drop-shadow-xs">Làm mới toàn bộ trang phục</span>
        </button>
      </div>
    </div>
  );
};
