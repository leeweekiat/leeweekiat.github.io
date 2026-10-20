/* Original, editable SVG evidence. Call only after a case's participation fee is paid.
   Severity selects artwork; the resulting accessible text describes visible features,
   never the hidden classification or a recommended vote. */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CrowdArt = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var ink = "#244c46", mint = "#a8cec0", teal = "#4b9685";
  var cream = "#fff7e7", orange = "#eda16a", damage = "#88534b";
  var names = {
    laptop: "Laptop", smartphone: "Smartphone", bicycle: "Bicycle", camera: "Camera",
    chair: "Chair", headphones: "Headphones", handbag: "Handbag",
    television: "Television", table: "Table", console: "Gaming console"
  };
  function path(d, fill, extra) {
    return '<path d="' + d + '" fill="' + (fill || "none") + '"' + (extra || "") + '/>';
  }
  function rect(x, y, w, h, fill, r, extra) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
      '" rx="' + (r || 0) + '" fill="' + fill + '"' + (extra || "") + '/>';
  }
  function circle(x, y, r, fill, extra) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '"' + (extra || "") + '/>';
  }
  function ellipse(x, y, rx, ry, fill, extra) {
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '"' + (extra || "") + '/>';
  }
  function group(content, transform, extra) {
    return '<g' + (transform ? ' transform="' + transform + '"' : "") + (extra || "") + '>' + content + '</g>';
  }
  function scuff(d) { return path(d, "none", ' stroke="#b07c65" stroke-width="2.5"'); }
  function crack(d) { return path(d, "none", ' stroke="' + damage + '" stroke-width="3"'); }
  function shine(d) { return path(d, "none", ' stroke="#ecf8ed" stroke-width="5" opacity=".72"'); }
  function dots(points, color, r) {
    return points.map(function (p) { return circle(p[0], p[1], r || 2, color, ' stroke="none"'); }).join("");
  }
  var descriptions = {
    laptop: [
      "A mint laptop with an uninterrupted screen, straight lid and complete keyboard.",
      "A mint laptop with several short scratches on the lid bezel and palm rest.",
      "A mint laptop with a branching screen crack and a small chipped corner.",
      "A mint laptop with a heavily fractured screen, a loose display corner and a broken keyboard section."
    ],
    smartphone: [
      "A coral phone with smooth edges, an uninterrupted glass screen and two rear camera lenses shown in a small inset.",
      "A coral phone with short scuffs near the screen edge and lower casing.",
      "A coral phone with a long branching crack across the glass and a chipped lower corner.",
      "A coral phone with a shattered screen, a separated casing fragment and loose glass pieces."
    ],
    bicycle: [
      "A green bicycle with round wheels, straight frame tubes, a saddle and both pedals.",
      "A green bicycle with small paint scratches on its frame and chain guard.",
      "A green bicycle with a bent front wheel and a split in its lower frame tube.",
      "A green bicycle with a detached front wheel, a snapped front fork and broken frame tubing."
    ],
    camera: [
      "A cream camera with an intact circular lens, viewfinder, strap loops and textured grip.",
      "A cream camera with surface scratches on the grip and top plate.",
      "A cream camera with a cracked lens and a chipped edge of its body.",
      "A cream camera with a fractured lens, a detached lens-ring section and a broken top corner."
    ],
    chair: [
      "An orange upholstered chair with a smooth cushion, complete back and four aligned legs.",
      "An orange upholstered chair with shallow scuffs on the seat and one wooden leg.",
      "An orange upholstered chair with a torn cushion exposing filling and a split back slat.",
      "An orange upholstered chair with a large torn cushion, a broken back panel and a detached front leg."
    ],
    headphones: [
      "Teal headphones with a continuous padded headband, two ear cushions and a connected cable.",
      "Teal headphones with small scratches on one ear cup and the headband.",
      "Teal headphones with a split headband covering and a torn ear cushion.",
      "Teal headphones with a snapped headband, one detached ear cup and loose cable ends."
    ],
    handbag: [
      "A coral handbag with two complete handles, neat stitching and an intact front clasp.",
      "A coral handbag with light surface scuffs near the lower edge.",
      "A coral handbag with an open tear in the front panel and a loose handle attachment.",
      "A coral handbag with a large open seam, a snapped handle and a detached clasp."
    ],
    television: [
      "A wide television with an uninterrupted screen, a complete frame and two aligned stand feet.",
      "A wide television with shallow scratches on the frame and one stand foot.",
      "A wide television with a branching screen crack and a chipped frame corner.",
      "A wide television with extensive shattered glass, a split frame and a broken stand foot."
    ],
    table: [
      "A round wooden table with a smooth top and three complete, aligned legs.",
      "A round wooden table with several short scratches across its wooden top.",
      "A round wooden table with a deep branching split in the top and a chipped rim.",
      "A wooden table with a section broken out of the top, a split leg and another leg detached beside it."
    ],
    console: [
      "A small cream gaming console with a complete case and a controller with both handles and buttons.",
      "A cream gaming console with small scratches on its case and controller.",
      "A cream gaming console with a cracked case and a split controller handle.",
      "A cream gaming console with an opened broken case, loose casing pieces and a detached controller handle."
    ]
  };
  function laptop(s) {
    var a = rect(91, 41, 218, 140, mint, 10) + rect(103, 53, 194, 113, "#345c60", 4) +
      path("M104 138 153 90 194 123 223 94 296 154V165H104Z", "#739c8e", ' stroke="none"') +
      circle(257, 82, 12, "#f6d79b", ' stroke="none"') + shine("m118 67 43-1m-43 10 24-1") +
      circle(200, 47, 1.6, ink, ' stroke="none"') +
      path("M91 181h218l35 29q-5 11-19 11H75q-14 0-19-11Z", "#cfdfce") +
      path("M106 188h188l15 14H91Z", "#91b6a7") + rect(171, 204, 58, 10, "#f0eed9", 3) +
      path("M56 210h288M114 190l-4 9m24-9-3 9m23-9-1 9m22-9v9m22-9v9m22-9 1 9m21-9 2 9m19-9 3 9m-177-4h202", "none", ' stroke-width="1.5"');
    if (s > 0) a += scuff("m274 47 12-2m-22 169 9-3m-198-8 8-3");
    if (s > 1) a += crack("M151 54 164 82 151 106 181 128 173 164M164 82l24 2 9 22m-46 0-31 8m61 14 26-7") +
      path("m296 153 13 5-1 17-12-6Z", "#f8f5e9");
    if (s > 2) a += crack("M273 54 250 95 274 121 247 165M250 95l-42 26 12 27m54-27 22 8m-88-8-17-36") +
      path("m286 67 11-21 20 4-12 27Z", "#b9cfc2") +
      path("m218 190 24-4 16 10-8 13-21-6Z", "#315950") +
      path("m253 224 12-12 15 9-12 9Z", mint);
    return a;
  }
  function smartphone(s) {
    var a = rect(132, 24, 136, 210, orange, 20) + rect(142, 36, 116, 184, s === 3 ? "#334c49" : "#3e6b68", 13) +
      (s < 3 ? path("M143 175q30-57 62-45t53-19v95q0 14-13 14h-89q-13 0-13-14Z", "#80ae9b", ' stroke="none"') +
      circle(226, 83, 17, "#edcb8f", ' stroke="none"') + shine("m152 65 20-10m-20 26 35-21") : "") +
      rect(176, 41, 48, 7, ink, 3, ' stroke="none"') + path("M132 76v22m136-12v29", "none", ' stroke-width="5"') +
      rect(181, 210, 38, 3, "#e0efdd", 2, ' stroke="none"') +
      group(rect(0, 0, 43, 57, "#f2bb90", 10) + circle(14, 15, 7, "#315b56") +
        circle(29, 31, 7, "#315b56") + circle(14, 15, 2.4, "#a8d9ca", ' stroke="none"') +
        circle(29, 31, 2.4, "#a8d9ca", ' stroke="none"'), "translate(289 151) rotate(12)", ' stroke-width="2"');
    if (s > 0) a += scuff("m149 177 8-9m-6 20 7-8m81 47 7-3");
    if (s > 1) a += crack("M172 37 183 77 163 107 197 133 184 168 220 219M183 77l32-10m-52 40-20 8m54 18 35-20m-48 55-37 16") +
      path("m250 219 19-10-1 14q0 11-15 11Z", "#fbf5e8");
    if (s > 2) a += crack("M248 52 213 97 241 137 220 180 250 202M213 97l-16 36 44 4m-21 43-36-12m29-71-30-20") +
      path("m112 182 15 6-6 36-14-4Z", orange) + path("m272 233 13-13 8 17Z", "#b6d8ca") +
      path("m133 228-11 13 17-3Z", "#b6d8ca") + path("m207 109 17 5-7 15Z", "#254b46");
    return s === 3 ? a.replace(/#88534b/g, "#d9dfcc") : a;
  }
  function bicycle(s) {
    function wheel(x, y, broken) {
      var a = ellipse(x, y, broken ? 31 : 42, broken ? 46 : 42, "#fff5de", ' stroke-width="6"') +
        circle(x, y, 5, teal);
      return a + path("M" + (x - 34) + " " + y + "h68m-34-34v68m-24-58 48 48m-48 0 48-48", "none", ' stroke="#89b4a2" stroke-width="2"');
    }
    var a = wheel(97, 180, false);
    a += s === 3 ? group(wheel(302, 191, true), "rotate(22 302 191)") : wheel(302, 180, s === 2);
    a += path("m97 180 54-83 51 83H97l92-62h87", "none", ' stroke="' + teal + '" stroke-width="9"') +
      path(s === 3 ? "m276 118 11 32m13 15 5 16" : "m276 118 26 62", "none", ' stroke="' + teal + '" stroke-width="8"') +
      path("m151 97 11 21 40 62m73-62-15-40 23-8h13", "none", ' stroke-width="6"') +
      path("M137 95h37", "none", ' stroke-width="10"') +
      circle(202, 180, 13, "#f3cc8b") + path("m202 180 13 15h12m-25-15-12-12h-11", "none", ' stroke-width="4"') +
      path("m275 78 12 19m-177 46-6-9m30-31h-23", "none", ' stroke-width="3"') +
      rect(105, 95, 23, 7, orange, 2);
    if (s > 0) a += scuff("m220 116 11 3m-23 0 7 3m-35 48 8-2");
    if (s > 1) a += path("m154 176 10-6 9 12-9 7-11-4Z", cream, ' stroke="none"') +
      crack("m154 175 6 7-7 6m18-13-6 7 7 5");
    if (s > 2) a += path("m245 114 11 5-2 8-13-5Z", cream, ' stroke="none"') +
      path("m281 146 11 2m7 11 10 7", "none", ' stroke="#ef9c64" stroke-width="4"') +
      path("m238 216 24-10 14 8", "none", ' stroke="' + teal + '" stroke-width="7"');
    return a;
  }
  function camera(s) {
    var a = path("M99 87h43l13-22h67l15 22h66q14 0 14 14v101q0 14-14 14H97q-14 0-14-14v-99q0-16 16-16Z", "#e8d5ad") +
      rect(94, 108, 42, 94, teal, 8) + path("m102 117 26 10m-26 2 26 10m-26 2 26 10m-26 2 26 10m-26 2 26 10m-26 2 26 10", "none", ' stroke="#8fbeac" stroke-width="2"') +
      circle(217, 151, 57, "#668d7e") + circle(217, 151, 45, "#345954") +
      circle(217, 151, 32, "#8cb8ae") + circle(217, 151, 20, "#3a6665") +
      shine("m198 135 11-10m-17 24 6-13") +
      rect(165, 74, 42, 13, "#8db8ac", 3) + rect(275, 99, 26, 13, "#faf0d7", 3) +
      circle(292, 130, 5, orange) + rect(108, 78, 22, 9, ink, 3) +
      path("M83 109H70v25h13m234-25h13v25h-13", "none", ' stroke-width="4"');
    if (s > 0) a += scuff("m110 190 15-9m-12 17 11-6m115-105 13-2");
    if (s > 1) a += crack("M199 124 216 143 203 161 226 182m-10-39 24-5m-37 23-15 5") +
      path("m302 204 15-12v10q0 14-14 14h-9Z", cream);
    if (s > 2) a += crack("M240 127 216 143 229 157 219 177m10-20 23 6") +
      path("m235 71 9 21 34-2-9-14Z", cream) +
      path("M279 211q-16 20-40 22l-3-11q20-2 32-19Z", "#668d7e") +
      path("m315 223 11-13 12 18Z", "#a5c9ba");
    return a;
  }
  function chair(s) {
    var a = path("m132 158-12 73h16l18-73m96-1 17 74h14l-11-74", "#b88c66") +
      path(s === 3 ? "m127 179-4 24m-5 14-3 18" : "m141 182-5 55h13l13-55", "#c59b76") +
      path("m238 183 8 54h14l-8-54", "#c59b76") +
      rect(124, 40, 152, 114, "#c58f62", 17) + rect(135, 51, 130, 90, orange, 13) +
      path("M124 130 109 169q-7 18 13 21h156q20-3 13-21l-15-39Z", "#d99967") +
      path("M126 140h148l9 25q2 9-8 10H124q-10-1-7-10Z", "#f1bc7d") +
      path("M150 64v62m25-62v62m25-62v62m25-62v62m25-62v62", "none", ' stroke="#d7955d" stroke-width="2"') +
      path("M113 174q91 11 176 0", "none", ' stroke-width="2"');
    if (s > 0) a += scuff("m159 154 15-4m-10 10 12-4m75 63 2 9");
    if (s > 1) a += path("m201 145 11 5 8-6 10 12-8 12-10-3-10 3-7-10Z", "#f7efce") +
      crack("m203 143-8 15 7 10m27-24 5 16-12 10M173 52l8 27-10 18 6 29");
    if (s > 2) a += path("m217 49-5 26 14-4-5 23 24-17 7-28Z", cream) +
      path("m145 155 15-8 25 8 6 14-20-4-12 7-11-10Z", "#f7efce") +
      group(path("M0 0h13l7 42H7Z", "#c59b76"), "translate(99 209) rotate(64)");
    return a;
  }
  function headphones(s) {
    var a = path("M112 153v-30q0-84 88-84t88 84v30h-21v-30q0-63-67-63t-67 63v30Z", mint) +
      path("M132 99q12-42 68-42t68 42", "none", ' stroke="#437b6b" stroke-width="9"') +
      rect(105, 131, 48, 83, teal, 18) + rect(139, 143, 19, 61, "#f1d8ae", 8) +
      rect(247, 131, 48, 83, teal, 18) + rect(242, 143, 19, 61, "#f1d8ae", 8) +
      path("M117 148v45m164-45v45", "none", ' stroke="#98c9b7" stroke-width="4"') +
      path("M127 214q0 21 34 21h58q29 0 29-17", "none", ' stroke-width="3"') +
      rect(242, 212, 12, 13, orange, 3);
    if (s > 0) a += scuff("m112 164 14-7m-10 14 9-5m117-118 9 5");
    if (s > 1) a += crack("M192 39l-5 10 13 6-5 7") +
      path("m244 166 10-7 6 10-9 6 8 8-7 9-10-8Z", cream) +
      path("m247 168 6 1m-5 10 5 2", "none", ' stroke="#c79272" stroke-width="2"');
    if (s > 2) {
      a = path("M112 153v-30q0-81 76-84l-3 21q-52 5-52 63v30Z", mint) +
        path("M209 39q79 5 79 84v15h-21v-15q0-56-57-62l7-11Z", mint) +
        rect(105, 131, 48, 83, teal, 18) + rect(139, 143, 19, 61, "#f1d8ae", 8) +
        group(rect(0, 0, 48, 83, teal, 18) + rect(-5, 12, 19, 61, "#f1d8ae", 8) +
          path("m12 18 18-6m-15 20 17-6", "none", ' stroke="#97c1ac" stroke-width="3"'), "translate(272 173) rotate(57)") +
        path("M127 214q0 20 34 20h41m18 0h24q10 0 11-7m20-86 1 17m8-17 6 18", "none", ' stroke-width="3"') +
        path("m184 39 4 10-7 8m29-18 7 12-7 10", "none", ' stroke="' + damage + '"');
    }
    return a;
  }
  function handbag(s) {
    var a = path(s === 3 ? "M149 112V81q0-37 34-40m20 1q48-1 48 39v31" : "M149 112V81q0-41 51-41t51 41v31", "none", ' stroke="#a67455" stroke-width="13"') +
      path(s === 3 ? "M168 111V81q0-20 16-23m23 1q25 1 25 23v29" : "M168 111V81q0-22 32-22t32 22v30", "none", ' stroke="#e6b684" stroke-width="10"') +
      path("M113 102q88-13 174 0l16 107q1 15-15 15H112q-16 0-15-15Z", "#e4a080") +
      path("M113 102q87 52 174 0l-4 51q-82 35-166 0Z", "#edb28c") +
      path("M109 122 104 205q0 11 11 11h171q10 0 10-11l-6-83", "none", ' stroke="#fff0d6" stroke-width="2" stroke-dasharray="3 6"') +
      (s < 3 ? rect(188, 139, 24, 25, "#f6d791", 5) + circle(200, 150, 3, ink, ' stroke="none"') :
        path("M192 145h16v14h-16Z", "#9c735a") + path("m194 148 5 5m7-5-5 5", "none", ' stroke="#f7e5c1" stroke-width="2"')) +
      rect(141, 96, 16, 29, "#a67455", 4) + rect(243, 96, 16, 29, "#a67455", 4);
    if (s > 0) a += scuff("m133 196 19-8m-9 14 18-8m-27 6 8-3");
    if (s > 1) a += path("m221 172 9-7 7 14-3 8 8 11-18 2 7-15Z", "#805d4d") +
      path("m222 171-7 7 10 7-8 11m20-31 7 13-6 10", "none", ' stroke="#ffdbaf" stroke-width="2"') +
      path("m246 117 5 5 9-7", "none", ' stroke="#f7e3b8" stroke-width="3"');
    if (s > 2) a += path("m121 148 17 13-9 15 20 13-15 23-15-3-2-24Z", "#805d4d") +
      path("m123 150 3 22 8 10-10 15", "none", ' stroke="#f5d8a4" stroke-width="3"') +
      rect(182, 233, 24, 16, "#f6d791", 4, ' transform="rotate(-12 194 241)"') +
      path("m182 42 9 8m10-8-4 11", "none", ' stroke="#f5dab3" stroke-width="3"');
    return a;
  }
  function television(s) {
    var a = path("m119 190-21 36h24l18-36m121 0 18 36h24l-21-36", "#527c70") +
      rect(61, 39, 278, 157, "#456d61", 11) + rect(72, 50, 256, 131, s === 3 ? "#334c49" : "#84b5ac", 5) +
      (s < 3 ? path("M73 149 130 95 184 133 222 94 327 162v19H73Z", "#558f81", ' stroke="none"') +
      circle(281, 80, 16, "#f4d191", ' stroke="none"') + shine("m87 65 66-1m-66 12 33-1") : "") +
      circle(200, 189, 2, "#f3d495", ' stroke="none"');
    if (s > 0) a += scuff("m306 44 17 1m-12 4 10 1m-197 174 9-1");
    if (s > 1) a += crack("M173 51 190 88 168 112 202 130 184 180M190 88l41 4 9-24m-72 44-37 7m71 11 22-5") +
      path("m61 175 13 4 4 18H65Z", cream);
    if (s > 2) a += crack("M297 51 265 98 284 121 257 180M265 98l-34-6-29 38m82-9 43 13m-70 46-39-27m-16-17-27 12") +
      path("m277 201 14 8-3 10-14-7Z", cream, ' stroke="none"') +
      path("m303 223 18 7 12-3-14-9Z", "#527c70") +
      path("m320 42 19-7 11 31-15 4Z", "#456d61") +
      path("m237 112 15 4-7 18Z", "#274d48");
    return s === 3 ? a.replace(/#88534b/g, "#d9dfcc") : a;
  }
  function table(s) {
    var a = path("m177 135 10 86h15l3-86m-75-2-30 101h17l43-101m96 0 26 101h17l-15-101", "#bd9169") +
      ellipse(202, 112, 126, 45, "#cfa47a") +
      ellipse(202, 101, 126, 44, "#e8c299") +
      path("M100 91q103-37 204 4m-193 15q96 26 183-4m-146-29q67-16 114 5", "none", ' stroke="#ce9b6a" stroke-width="2"') +
      ellipse(200, 102, 28, 8, "#e8c299", ' stroke="#ce9b6a" stroke-width="1.5"');
    if (s > 0) a += scuff("m147 95 29 11m-17-16 31 12m71 15 13-4");
    if (s > 1) a += crack("M221 59 202 85 219 99 194 120 186 145M202 85l-28-1m45 15 31 4") +
      path("m285 129 17-10 10 5-12 10-9 1Z", cream);
    if (s > 2) a += path("m245 61-12 20 23 4-14 21 34 6 9 22 21-14q24-27-12-45Z", cream, ' stroke="#244c46" stroke-width="2"') +
      path("m125 184 13 7-8 13-13-5Z", cream, ' stroke="none"') +
      crack("m189 162 6 10-4 10 8 9") +
      group(path("M0 0h16l14 62H15Z", "#bd9169"), "translate(294 189) rotate(65)") +
      path("m309 149 23 6-4 12-24-6Z", "#e8c299");
    return a;
  }
  function consoleArt(s) {
    var a = path("M90 64h196l25 26v88H90Z", "#e9ddbc") +
      path("M90 64v114H72V87Z", mint) +
      path("M90 64h196l25 26H90Z", "#fff0cd") +
      rect(105, 101, 159, 8, ink, 3) + circle(286, 111, 5, teal) +
      path("M110 143h16m8 0h16m8 0h16m8 0h16m8 0h16", "none", ' stroke="#7f9b83" stroke-width="3"') +
      path("M126 187q2-25 26-25h96q25 0 30 25l12 41q1 15-13 16-10 0-26-23H151q-16 23-27 23-14-1-11-16Z", teal) +
      path("M146 180h11v11h11v11h-11v11h-11v-11h-11v-11h11Z", "#c5dcc6", ' stroke-width="2"') +
      circle(245, 183, 5, "#efd59d") + circle(259, 197, 5, "#efa16e") +
      circle(232, 197, 5, "#b8d1c0") + circle(245, 211, 5, "#f3e4c2") +
      circle(184, 207, 8, "#2f6055") + circle(215, 207, 8, "#2f6055") +
      rect(191, 182, 17, 5, "#e5d6b1", 2);
    if (s > 0) a += scuff("m114 119 21-5m-15 12 19-5m-13 104 10-4");
    if (s > 1) a += crack("M223 90 210 115 226 130 211 150 217 177M226 130l33 3m-123 78 7 12-13 11");
    if (s > 2) a += path("m264 63-9 22 15 12-14 18 25 14 30-7V90l-25-26Z", "#4d6e5b") +
      path("m267 91 12 4m-13 10 16 5m-7 7 20-2", "none", ' stroke="#d0aa69" stroke-width="3"') +
      path("m275 64 24-6 21 20-10 15-19-13Z", "#fff0cd") +
      path("m117 221 11 12 12-7 10 14-20 7-18-7Z", cream, ' stroke="none"') +
      path("m99 225 16 6-8 19-18-7q-6-6 10-18Z", teal);
    return a;
  }
  var artists = {
    laptop: laptop, smartphone: smartphone, bicycle: bicycle, camera: camera,
    chair: chair, headphones: headphones, handbag: handbag, television: television,
    table: table, console: consoleArt
  };
  function product(category, severity) {
    var key = String(category || "").toLowerCase().trim().replace(/[\s_-]+/g, "");
    if (key === "gamingconsole") key = "console";
    if (!Object.prototype.hasOwnProperty.call(artists, key)) throw new RangeError("Unknown product category.");
    if (!Number.isInteger(severity) || severity < 0 || severity > 3) throw new RangeError("Expected an evidence variant from 0 to 3.");
    var description = descriptions[key][severity];
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" role="img" aria-label="' + description + '" focusable="false">' +
      '<title>' + names[key] + ' evidence</title><desc>' + description + '</desc>' +
      rect(0, 0, 400, 260, "#f6f4e9", 18, ' stroke="none"') +
      circle(204, 125, 110, "#e9eedb", ' stroke="none"') +
      ellipse(202, 236, 140, 9, "#234b4210", ' stroke="none"') +
      dots([[51, 49], [353, 80], [43, 190], [352, 197]], "#d8dcbf", 3) +
      group(artists[key](severity), "", ' stroke="' + ink + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"') +
      '</svg>';
  }
  return Object.freeze({ product: product, categories: Object.freeze(Object.keys(names)) });
}));
