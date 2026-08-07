import sharp from "sharp";

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#f3f4f0"/>
  <rect x="58" y="52" width="1084" height="526" rx="8" fill="#ffffff" stroke="#d6d9d2" stroke-width="2"/>
  <rect x="660" y="52" width="482" height="526" rx="8" fill="#181b18"/>
  <rect x="86" y="82" width="42" height="42" rx="5" fill="#171916"/>
  <text x="107" y="112" text-anchor="middle" fill="#ffffff" font-family="Georgia, serif" font-size="28" font-weight="600">R</text>
  <text x="144" y="109" fill="#171916" font-family="Arial, sans-serif" font-size="17" font-weight="700">ROAS BREAK</text>
  <text x="88" y="207" fill="#e95e3f" font-family="Arial, sans-serif" font-size="15" font-weight="700">FREE PROFITABILITY TOOL</text>
  <text x="88" y="271" fill="#171916" font-family="Georgia, serif" font-size="55" font-weight="600">Break-Even ROAS</text>
  <text x="88" y="328" fill="#171916" font-family="Georgia, serif" font-size="55" font-weight="600">Calculator</text>
  <text x="88" y="386" fill="#656963" font-family="Arial, sans-serif" font-size="21">Know the return your ads must clear</text>
  <text x="88" y="416" fill="#656963" font-family="Arial, sans-serif" font-size="21">before they create profit.</text>
  <rect x="88" y="478" width="302" height="7" rx="3" fill="#e95e3f"/>
  <rect x="390" y="478" width="138" height="7" rx="3" fill="#f0c94a"/>
  <rect x="528" y="478" width="92" height="7" rx="3" fill="#187653"/>
  <text x="704" y="122" fill="#aeb4ac" font-family="Arial, sans-serif" font-size="16" font-weight="600">BREAK-EVEN ROAS</text>
  <text x="702" y="274" fill="#ffffff" font-family="Georgia, serif" font-size="112" font-weight="500">1.75x</text>
  <text x="704" y="318" fill="#aeb4ac" font-family="Arial, sans-serif" font-size="18">for a 57% contribution margin</text>
  <line x1="704" y1="390" x2="1096" y2="390" stroke="#3c413b" stroke-width="2"/>
  <text x="704" y="432" fill="#aeb4ac" font-family="Arial, sans-serif" font-size="15">MAXIMUM CPA</text>
  <text x="704" y="481" fill="#ffffff" font-family="Arial, sans-serif" font-size="38" font-weight="700">$45.60</text>
  <circle cx="1074" cy="465" r="13" fill="#66d09d"/>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile("public/og-image.png");
console.log("Generated public/og-image.png");
