(() => {
  "use strict";
  const tau = 2 * Math.PI;
  const width = 440;
  const baseHeight = 550;
  const maxLabelWidth = 97;
  const maxCharacters = 24;
  const maxEvents = 60;
  const minCaptionSize = 8;
  const maxCaptionSize = 16;
  const maxAuthorLength = 44;
  const formatHeights = {square: 1080, post: 1350, story: 1920};
  const channel = "@datavizcomics";
  const defaultYear = 2026;
  const ru = window.BloomLocales.get("ru");
  const exampleName = ru.exampleName;
  const labelFont = size => "600 " + size + "px Manrope, system-ui, sans-serif";
  const segmenter = typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("ru", {granularity: "grapheme"}) : null;
  const {months, paletteNames, themes} = ru;
  const palettes = {
    cobalt: {
      ground: "#192671", edge: "#10194a", shade: "#283d94", text: "#fff0cf", stem: "#e1cf79",
      leaf: ["#a6c7ff", "#748ee5", "#e1e69b", "#fce29d"], detail: "#feeeb7",
      petal: ["#ff9c63", "#aec8ff", "#f9db6d", "#ff7169", "#ee9fcc", "#78dfd9"],
      style: "engraved", foliage: 40, weight: 1.4, length: 1.0, dark: true
    },
    herbarium: {
      ground: "#f1f2ed", edge: "#314952", shade: "#ffffff", text: "#283e49", stem: "#607882",
      leaf: ["#708b95", "#9cb1b9", "#536e79", "#adb8af"], detail: "#bed0d4",
      petal: ["#5f8192", "#96b5be", "#698897", "#466879", "#8ea1a8", "#749ba5"],
      style: "wash", foliage: 64, weight: 1.15, length: 1.22, beads: 2
    },
    "blue-poppy": {
      ground: "#faf5e9", edge: "#3e5e6c", shade: "#fffcf5", text: "#284958", stem: "#a28c58",
      leaf: ["#8b9f97", "#a3b9ba", "#87a1aa", "#c0b89e"], detail: "#e8cc88",
      petal: ["#779aa7", "#91b4bd", "#869bab", "#5f90a5", "#849cad", "#a0b7b7"],
      style: "wash", foliage: 27, weight: .91, length: 1.35, breadth: 1.35
    },
    lagoon: {
      ground: "#f8faf5", edge: "#284758", shade: "#fffefa", text: "#184754", stem: "#27656d",
      leaf: ["#379e9e", "#6a9c6f", "#646084", "#9ec4a0"], detail: "#e5a245",
      petal: ["#e1744e", "#428f9e", "#735a8b", "#dc643c", "#d3847d", "#2b8c8e"],
      style: "wash", foliage: 42, weight: 1.4, length: 1.04, clouds: 1
    },
    meadow: {
      ground: "#faf8f2", edge: "#5d6376", shade: "#fffefa", text: "#354a50", stem: "#85938a",
      leaf: ["#718d7e", "#a1af90", "#779399", "#a59aab"], detail: "#dfc479",
      petal: ["#cf8d9c", "#7478aa", "#a1b1bf", "#be7196", "#a16a9e", "#7c9aab"],
      style: "wash", foliage: 25, weight: .7, length: .79, beads: 3, airy: true
    },
    rose: {
      ground: "#fff8f3", edge: "#864854", shade: "#fffdfa", text: "#73394b", stem: "#ad8b61",
      leaf: ["#a46d73", "#b8988b", "#d3a79d", "#af9d84"], detail: "#e9bd9e",
      petal: ["#d88a97", "#c78a9e", "#db9e91", "#d7848e", "#b97987", "#d6a08f"],
      style: "wash", foliage: 23, weight: 1.05, length: .94, airy: true, breadth: 1.28
    },
    porcelain: {
      ground: "#fcf8ed", edge: "#122c60", shade: "#ffffff", text: "#17376d", stem: "#17427e",
      leaf: ["#1e4b88", "#3866a1", "#153d78", "#31558d"], detail: "#f5e8c8",
      petal: ["#204880", "#406fac", "#335784", "#17427d", "#2b5996", "#527fae"],
      style: "graphic", foliage: 46, weight: 2.25, length: 1.13, scroll: 1
    },
    raspberry: {
      ground: "#fbf7eb", edge: "#40533d", shade: "#fffef8", text: "#275952", stem: "#6b783f",
      leaf: ["#737e43", "#8e9c5a", "#4d6b46", "#a1a765"], detail: "#e2b447",
      petal: ["#bc2d68", "#27837b", "#d34775", "#147e83", "#af396d", "#48a697"],
      style: "engraved", foliage: 40, weight: 1.62, length: 1.06, scroll: 1
    },
    saffron: {
      ground: "#f4edd3", edge: "#252b25", shade: "#fff9e7", text: "#293c2c", stem: "#30382d",
      leaf: ["#16515e", "#57663d", "#7b8050", "#2b4644"], detail: "#edb548",
      petal: ["#ba382c", "#d5882e", "#dc5134", "#ae2e27", "#d96c48", "#315a68"],
      style: "graphic", foliage: 39, weight: 2.25, length: 1.0, breadth: 1.17
    },
    scrollwork: {
      ground: "#f5eed8", edge: "#176064", shade: "#fff8e9", text: "#204e52", stem: "#13767c",
      leaf: ["#137b80", "#407948", "#538557", "#2b9090"], detail: "#ffd578",
      petal: ["#e3802c", "#3d91a8", "#cdb05f", "#65aebd", "#cb7544", "#258a9c"],
      style: "graphic", foliage: 28, weight: 3.15, length: 1.1, scroll: 2
    }
  };

  function seededRandom(value) {
    let state = value >>> 0;
    return () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function range(random, min, max) {
    return min + (max - min) * random();
  }

  function line(ctx, color, size = 1, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function paint(ctx, color, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function dot(ctx, x, y, radius, color, alpha = 1) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, tau);
    paint(ctx, color, alpha);
  }

  function leaf(ctx, x, y, angle, length, breadth, fill, vein, curl) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(length * .18, -breadth, length * .65, -breadth, length, curl);
    ctx.bezierCurveTo(length * .62, breadth * .83, length * .28, breadth * .74, 0, 0);
    paint(ctx, fill, .86);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(length * .62, curl * -.25, length * .92, curl * .8);
    line(ctx, vein, .53, .73);
    for (let i = 1; i <= 3; i++) {
      const pos = length * (.22 + i * .13);
      ctx.beginPath();
      ctx.moveTo(pos, curl * .15);
      ctx.lineTo(pos + length * .13, -breadth * .54 + curl * .23);
      ctx.moveTo(pos + length * .03, curl * .15);
      ctx.lineTo(pos + length * .15, breadth * .38 + curl * .16);
      line(ctx, vein, .36, .52);
    }
    ctx.restore();
  }

  function petal(ctx, radius, breadth, crown, curl) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(radius * .25, -breadth * .45, radius * crown, -breadth, radius, curl);
    ctx.bezierCurveTo(radius * crown, breadth * .96, radius * .27, breadth * .52, 0, 0);
  }

  function flower(ctx, x, y, size, color, palette, kind, random) {
    const motifs = [
      {count: [5, 7], breadth: .38, crown: .68, halo: false},
      {count: [8, 11], breadth: .24, crown: 1.07, halo: true},
      {count: [4, 6], breadth: .47, crown: 1.11, halo: false},
      {count: [6, 8], breadth: .62, crown: 1.10, halo: true},
      {count: [4, 5], breadth: .37, crown: 1.03, halo: false},
      {count: [3, 4], breadth: .53, crown: .73, halo: true}
    ];
    const motif = motifs[kind];
    const count = motif.count[0] + Math.floor(random() * (motif.count[1] - motif.count[0] + 1));
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(range(random, 0, tau));
    for (let i = 0; i < count; i++) {
      const radius = size * range(random, .86, 1.07);
      const breadth = radius * motif.breadth * range(random, .82, 1.11) * (palette.breadth || 1);
      const curl = radius * range(random, -.18, .18);
      ctx.rotate(tau / count);
      petal(ctx, radius, breadth, motif.crown, curl);
      if (palette.style === "wash") {
        const wash = ctx.createLinearGradient(0, 0, radius, 0);
        wash.addColorStop(0, color);
        wash.addColorStop(.64, color + "a0");
        wash.addColorStop(1, color + "38");
        paint(ctx, wash, i % 2 ? .95 : .79);
      } else {
        paint(ctx, color, i % 2 ? .98 : .84);
      }
      if (size < 10) continue;
      line(ctx, palette.edge, .72, palette.style === "wash" ? .21 : .71);
      const veinCount = palette.style === "graphic" ? 1 : 2;
      for (let j = -veinCount; j <= veinCount; j++) {
        ctx.beginPath();
        ctx.moveTo(radius * .20, j * breadth * .035);
        ctx.quadraticCurveTo(radius * .48, j * breadth * .20, radius * (.78 - Math.abs(j) * .05),
          curl * .56 + j * breadth * .18);
        line(ctx, j === 0 ? palette.detail : palette.edge, j === 0 ? .78 : .44, j === 0 ? .62 : .24);
      }
    }

    if (motif.halo && size >= 6) {
      for (let i = 0; i < count + 2; i++) {
        ctx.rotate(tau / (count + 2));
        petal(ctx, size * .53, size * .11, .96, .8);
        paint(ctx, palette.detail, kind === 3 ? .77 : .58);
        if (size >= 12) line(ctx, palette.edge, .5, .44);
      }
    }
    dot(ctx, 0, 0, size * .19, palette.edge);
    dot(ctx, 0, 0, size * .11, palette.detail);
    const stamenCount = size >= 11 ? 8 : 3;
    for (let i = 0; i < stamenCount; i++) {
      const angle = i * tau / stamenCount;
      dot(ctx, Math.cos(angle) * size * .145, Math.sin(angle) * size * .145,
        Math.max(.46, size * .022), color);
    }
    ctx.restore();
  }

  function drawMoment(ctx, x, y, radius, kind, palette, patternSeed, identity = kind) {
    const random = seededRandom(patternSeed + (identity + 1) * 751);
    const color = palette.petal[kind];
    const cluster = kind === 2
      ? [[-.51, -.17, .51], [.31, -.49, .45], [.30, .48, .49]]
      : [[-.48, .08, .53], [.43, -.18, .54]];
    if (kind === 2 || kind === 4) {
      for (const [dx, dy, scale] of cluster) {
        ctx.beginPath();
        ctx.moveTo(x, y + radius * .62);
        ctx.quadraticCurveTo(x + radius * dx * .6, y, x + dx * radius, y + dy * radius);
        line(ctx, palette.stem, Math.max(.58, radius * .045));
        flower(ctx, x + dx * radius, y + dy * radius, radius * scale, color, palette, kind, random);
      }
    } else {
      flower(ctx, x, y, radius, color, palette, kind, random);
    }
  }

  function trace(ctx, points, color, weight, alpha) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(...points[i]);
    line(ctx, color, weight, alpha);
  }

  function beads(ctx, x, y, angle, size, palette, random) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(size * .63, -size * .32, size, -size * .09);
    line(ctx, palette.stem, .74, .85);
    for (let i = 0; i < 5; i++) {
      const px = size * (.36 + .14 * i);
      const py = (i % 2 ? -1 : 1) * range(random, size * .07, size * .19) - size * .15;
      ctx.beginPath();
      ctx.moveTo(px * .74, -size * .16);
      ctx.quadraticCurveTo(px * .9, py, px, py);
      line(ctx, palette.stem, .60, .72);
      dot(ctx, px, py, range(random, 1.1, 2.05), palette.detail, .86);
    }
    ctx.restore();
  }

  function tendril(ctx, x, y, angle, size, palette) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(size * .43, -size * .10, size * .55, -size * .50, size, -size * .43);
    ctx.bezierCurveTo(size * 1.47, -size * .40, size * 1.33, size * .10, size * 1.03, size * .03);
    ctx.quadraticCurveTo(size * .83, -size * .01, size * .93, -size * .20);
    line(ctx, palette.stem, palette.scroll ? palette.weight * .63 : .85, .79);
    ctx.restore();
  }

  function vine(ctx, point, steps, palette, random, dense = false, quiet = false) {
    trace(ctx, Array.from({length: 140}, (_, i) => point(i / 139)),
      palette.stem, palette.weight * (quiet ? .67 : 1), quiet ? .54 : .83);
    const position = i => (i + .35) / steps;
    for (let i = 0; i < steps; i++) {
      const t = position(i);
      const [x, y] = point(t);
      const [nextX, nextY] = point(Math.min(t + .008, 1));
      const direction = Math.atan2(nextY - y, nextX - x);
      const side = i % 2 ? 1 : -1;
      const angle = direction + side * range(random, .60, 1.82);
      const size = range(random, 12, 29) * palette.length * (dense ? .68 : 1);
      leaf(ctx, x, y, angle, size, size * range(random, .15, .33),
        palette.leaf[Math.floor(random() * palette.leaf.length)], palette.edge, range(random, -6, 5));
      if (i % (palette.beads ? 2 : 4) === 0) {
        const opposite = direction - side * range(random, .81, 1.32);
        beads(ctx, x, y, opposite, range(random, 12, 23), palette, random);
      }
      if (i % (palette.scroll ? 4 : 10) === 1) {
        tendril(ctx, x, y, direction + side * .49, range(random, 13, 22) * (palette.scroll ? 1.32 : 1), palette);
      }
    }
  }

  function branch(ctx, x, y, tx, ty, palette, random) {
    const dx = tx - x;
    const dy = ty - y;
    const direction = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + dx * .05 - dy * .44, y + dy * .05 + dx * .44,
      tx - dx * .31 + dy * .28, ty - dy * .31 - dx * .28, tx, ty);
    line(ctx, palette.stem, 1.35, .88);
    leaf(ctx, x + dx * .35 - dy * .10, y + dy * .35 + dx * .1,
      direction + .82, range(random, 12, 21), 5.7, palette.leaf[0], palette.edge, -3);
  }

  function text(ctx, content, x, y, font, color, align = "left") {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(content, x, y);
  }

  function tracked(ctx, content, x, y, size, color, gap, align = "left") {
    ctx.font = "700 " + size + "px Manrope, sans-serif";
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    const glyphs = Array.from(content);
    const lengths = glyphs.map(glyph => ctx.measureText(glyph).width + gap);
    const total = lengths.reduce((sum, length) => sum + length, -gap);
    let start = align === "center" ? x - total / 2 : x;
    glyphs.forEach((glyph, i) => {
      ctx.fillText(glyph, start, y);
      start += lengths[i];
    });
  }

  function rule(ctx, x1, x2, y, color, alpha = .65) {
    trace(ctx, [[x1, y], [x2, y]], color, .75, alpha);
  }

  function sampleEvents(count = 15, language = "ru") {
    const examples = window.BloomLocales.get(language).examples;
    return Array.from({length: count}, (_, id) => {
      const example = examples[id % examples.length];
      const theme = id % themes.length;
      const month = id < 4 ? id * 3 : (id - 4) % 12;
      return {id, theme, month, label: example};
    }).sort((a, b) => a.month - b.month || a.id - b.id);
  }

  function planWreath(events, patternSeed, flowerSize) {
    const random = seededRandom(patternSeed * 3 + 21);
    const phase = range(random, 0, tau);
    const start = -.87 + range(random, -.22, .21);
    const span = range(random, 5.56, 5.74);
    const radius = range(random, 143, 153);
    const circle = (angle, offset = 0) => {
      const wave = 4.1 * Math.sin(3 * angle + phase) + 3.3 * Math.sin(5 * angle - phase);
      const t = (angle - start) / span;
      const r = radius + offset + wave + 19 * (t - .5);
      return [220 + r * Math.cos(angle), 274 + r * Math.sin(angle)];
    };
    const step = span / events.length;
    const size = Math.min(27, 65 / Math.sqrt(events.length)) * flowerSize / 100;
    const spread = events.length >= 16 ? 17 : events.length >= 9 ? Math.max(3, Math.min(17, (flowerSize - 85) * .19)) : 2;
    const points = events.map((event, i) => {
      const angle = start + (i + .50 + range(random, -.11, .11)) * step;
      const row = i % 2 ? -spread : spread;
      const [x, y] = circle(angle, row + range(random, -3, 3));
      const [branchX, branchY] = circle(angle - Math.min(step * .35, .095));
      return {...event, x, y, branchX, branchY, size: size * range(random, .87, 1.05)};
    });

    for (const point of points) {
      let nearest = Infinity;
      for (const other of points) {
        if (point.id === other.id) continue;
        nearest = Math.min(nearest, Math.hypot(point.x - other.x, point.y - other.y));
      }
      const frameClearance = Math.min(point.x - 16, 424 - point.x, point.y - 16, 534 - point.y);
      point.size = Math.min(point.size, nearest * .40, frameClearance / 1.24);
    }
    return {points, circle, start, span, seed: patternSeed};
  }

  function surface(ctx, height, palette) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, palette.shade);
    gradient.addColorStop(.74, palette.ground);
    gradient.addColorStop(1, palette.dark ? palette.edge : palette.ground);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    const random = seededRandom(8162);
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = i % 2 ? palette.edge : palette.shade;
      ctx.globalAlpha = range(random, .030, palette.dark ? .087 : .055);
      ctx.fillRect(random() * width, random() * height, range(random, .42, 1.16), range(random, .46, 1.10));
    }
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.rect(13, 13, width - 26, height - 26);
    line(ctx, palette.stem, .58, .61);
    for (const [x, y] of [[13, 13], [width - 13, 13], [width - 13, height - 13], [13, height - 13]]) {
      dot(ctx, x, y, 1.55, palette.dark ? palette.detail : palette.edge, .8);
    }
  }

  function mix(color, ground, amount) {
    const channels = [1, 3, 5].map(i => {
      const ink = parseInt(color.slice(i, i + 2), 16);
      const paper = parseInt(ground.slice(i, i + 2), 16);
      return Math.round(ink + (paper - ink) * amount).toString(16).padStart(2, "0");
    });
    return "#" + channels.join("");
  }

  function quietPalette(palette) {
    const dim = color => mix(color, palette.ground, .53);
    return {...palette, edge: dim(palette.edge), stem: dim(palette.stem), detail: dim(palette.detail),
      leaf: palette.leaf.map(dim), petal: palette.petal.map(dim)};
  }

  function washes(ctx, layout, palette, random) {
    const start = layout.start;
    for (let i = 0; i < 34; i++) {
      const offset = range(random, -23, 21);
      const progress = (i + .5) / 34;
      const [x, y] = layout.circle(start + progress * layout.span, offset);
      const radius = range(random, 18, 39);
      const color = progress < .53 ? palette.petal[5] : palette.petal[0];
      const gradient = ctx.createRadialGradient(x, y, 1, x, y, radius);
      gradient.addColorStop(0, color + "45");
      gradient.addColorStop(.57, color + "29");
      gradient.addColorStop(1, color + "00");
      dot(ctx, x, y, radius, gradient);
    }
  }

  function drawWreath(ctx, layout, palette, activeIds) {
    const random = seededRandom(layout.seed * 3 + 77);
    const {circle, start, span, points} = layout;
    const dense = points.length > 23;
    const base = activeIds ? quietPalette(palette) : palette;
    if (palette.clouds) washes(ctx, layout, base, seededRandom(layout.seed * 3 + 109));

    vine(ctx, t => circle(start + t * span), base.foliage * (dense ? .73 : 1), base, random, dense);
    const fromSecondary = start + range(random, .35, .68);
    const spanSecondary = palette.airy ? 1.63 : range(random, 2.45, 3.25);
    vine(ctx, t => circle(fromSecondary + t * spanSecondary, 10 * Math.sin(t * Math.PI) - 6),
      base.foliage * (dense ? .36 : .54), base, random, dense, true);
    if (palette.scroll && !dense) {
      const curls = palette.scroll === 2 ? [.21, .42, .63, .84] : [.29, .72];
      for (const progress of curls) {
        const angle = start + span * progress;
        tendril(ctx, ...circle(angle), angle + Math.PI, range(random, 20, 33), base);
      }
    }
    const [rootX, rootY] = circle(start);
    const [baseX, baseY] = circle(start - .18, -10);
    ctx.beginPath();
    ctx.moveTo(baseX - 5, baseY);
    ctx.quadraticCurveTo(baseX + 5, (rootY + baseY) / 2, rootX, rootY);
    line(ctx, base.stem, base.weight * .83, .78);
    const end = start + span;
    const [tipX, tipY] = circle(end);
    const [budX, budY] = circle(end + .12, -7);
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.quadraticCurveTo(tipX + 5, budY, budX, budY);
    line(ctx, base.stem, .75, .82);
    leaf(ctx, budX, budY, Math.atan2(budY - tipY, budX - tipX), 8, 2.4, base.leaf[0], base.edge, -2);

    for (const point of points) {
      const offset = Math.hypot(point.x - point.branchX, point.y - point.branchY);
      if (!dense && offset > 6) {
        branch(ctx, point.branchX, point.branchY, point.x, point.y, base, random);
      } else if (offset > 7) {
        ctx.beginPath();
        ctx.moveTo(point.branchX, point.branchY);
        ctx.quadraticCurveTo(point.branchX, point.y, point.x, point.y);
        line(ctx, base.stem, .63, .53);
      }
    }

    for (const point of points) {
      const ink = activeIds && !activeIds.has(point.id) ? base : palette;
      drawMoment(ctx, point.x, point.y, point.size, point.theme, ink, layout.seed, point.id);
    }
  }

  function splitGraphemes(value) {
    if (!segmenter) return Array.from(value);
    return Array.from(segmenter.segment(value), item => item.segment);
  }

  function cleanLabel(value) {
    return value.trim().replace(/\s+/g, " ");
  }

  function fitLabel(ctx, value, size, limit = maxLabelWidth) {
    ctx.font = labelFont(size);
    if (!value) return [];
    if (ctx.measureText(value).width <= limit) return [value];

    const glyphs = splitGraphemes(value);
    const options = [];
    for (let i = 1; i < glyphs.length; i++) {
      const wordBoundary = glyphs[i] === " " || glyphs[i - 1] === "-";
      if (!wordBoundary) continue;
      const left = glyphs.slice(0, i).join("").trimEnd();
      const right = glyphs.slice(i).join("").trimStart();
      const a = ctx.measureText(left).width;
      const b = ctx.measureText(right).width;
      if (a <= limit && b <= limit) {
        options.push({lines: [left, right], rank: Math.abs(a - b)});
      }
    }
    options.sort((a, b) => a.rank - b.rank);
    return options[0]?.lines || null;
  }

  function revealGeometry(format) {
    const height = format === "square" ? 440 : format === "story" ? 615 : baseHeight;
    const footer = height - 25;
    const divider = footer - 66;
    return {
      height, footer, divider,
      center: (66 + divider) / 2 - (format === "square" ? 23 : 0),
      scale: format === "square" ? .67 : .71
    };
  }

  function distanceToRect(x, y, rect) {
    const dx = Math.max(rect.x - x, 0, x - rect.x - rect.width);
    const dy = Math.max(rect.y - y, 0, y - rect.y - rect.height);
    return Math.hypot(dx, dy);
  }

  function overlaps(a, b, gap) {
    return a.x < b.x + b.width + gap && a.x + a.width + gap > b.x &&
      a.y < b.y + b.height + gap && a.y + a.height + gap > b.y;
  }

  function measureCaption(ctx, point, size, locale, limit = maxLabelWidth) {
    const preferred = fitLabel(ctx, point.label, size, limit);
    if (!preferred && limit !== maxLabelWidth) return null;
    const fontSize = preferred ? size : minCaptionSize;
    const lines = preferred || fitLabel(ctx, point.label, fontSize) || [point.label];
    const month = locale.months[point.month];
    const monthSize = Math.max(7, Math.min(10, fontSize - 2));
    ctx.font = labelFont(monthSize);
    const monthWidth = ctx.measureText(month).width;
    ctx.font = labelFont(fontSize);
    const lineHeight = fontSize + 1;
    const lineWidth = Math.max(0, ...lines.map(value => ctx.measureText(value).width));
    return {lines, month, monthSize, fontSize, lineHeight,
      width: Math.ceil(Math.max(monthWidth, Math.min(maxLabelWidth, lineWidth))),
      height: Math.ceil(monthSize + 1 + lines.length * lineHeight)};
  }

  function captionCandidates(point, caption, flowers, geometry) {
    const outer = Math.atan2(point.y - geometry.center, point.x - 220);
    const options = [];
    for (let i = 0; i < 16; i++) {
      const angle = outer + i * Math.PI / 8;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      for (const gap of [4, 7, 11, 16, 23, 32, 43]) {
        const edge = Math.min(caption.width / (2 * Math.abs(dx)), caption.height / (2 * Math.abs(dy)));
        const distance = point.radius + edge + gap;
        const x = Math.round(Math.min(420 - caption.width, Math.max(20, point.x + dx * distance - caption.width / 2)));
        const y = Math.round(Math.min(geometry.divider - 10 - caption.height, Math.max(62, point.y + dy * distance - caption.height / 2)));
        const rect = {...caption, x, y};
        const own = distanceToRect(point.x, point.y, rect);
        if (own < point.radius + 3) continue;

        let closest = Infinity;
        let clear = true;
        for (const other of flowers) {
          if (other === point) continue;
          const distance = distanceToRect(other.x, other.y, rect);
          if (distance < other.radius + 2) {
            clear = false;
            break;
          }
          closest = Math.min(closest, distance - other.radius);
        }
        if (!clear) continue;
        const clearance = own - point.radius;
        const outward = Math.cos(angle - outer);
        const score = clearance + (1 - outward) * 2.2 + Math.max(0, clearance - closest + 2) * 1.7;
        const align = Math.abs(dx) < .34 ? "center" : dx < 0 ? "right" : "left";
        options.push({...rect, align, score, point: point.event});
      }
    }
    return options.sort((a, b) => a.score - b.score);
  }

  function makePages(ctx, layout, settings) {
    const locale = window.BloomLocales.get(settings.language);
    const geometry = revealGeometry(settings.format);
    const flowers = layout.points.map(event => ({
      event,
      x: 220 + (event.x - 220) * geometry.scale,
      y: geometry.center + (event.y - 274) * geometry.scale,
      radius: event.size * geometry.scale * 1.21
    }));
    let pending = flowers.map(point => {
      const caption = measureCaption(ctx, point.event, settings.captionSize, locale);
      const alternatives = [caption];
      for (const limit of [79, 65]) {
        const narrow = measureCaption(ctx, point.event, settings.captionSize, locale, limit);
        if (narrow && narrow.width < alternatives.at(-1).width) alternatives.push(narrow);
      }
      return {point, caption, alternatives, candidates: []};
    });
    const pages = [];
    const random = seededRandom(layout.seed ^ 0xb1a29c4d);
    while (pending.length) {
      const activeFlowers = pending.map(item => item.point);
      for (const item of pending) {
        const unique = new Map();
        for (const alternative of item.alternatives) {
          for (const option of captionCandidates(item.point, alternative, activeFlowers, geometry)) {
            const key = [option.x, option.y, option.width, option.height].join(",");
            if (!unique.has(key)) unique.set(key, option);
          }
        }
        item.candidates = Array.from(unique.values()).sort((a, b) => a.score - b.score);
      }
      const byScarcity = pending.slice().sort((a, b) => a.candidates.length - b.candidates.length);
      const byWidth = pending.slice().sort((a, b) => b.caption.width - a.caption.width);
      const orders = [byScarcity, byWidth, pending, pending.slice().reverse()];
      if (pending.length <= 18) {
        for (let i = 0; i < 15; i++) {
          const shuffled = pending.map(item => ({
            item, priority: item.candidates.length * .23 + random() * 34
          })).sort((a, b) => a.priority - b.priority).map(entry => entry.item);
          orders.push(shuffled);
        }
      }
      let best = [];
      let bestScore = Infinity;
      for (const order of orders) {
        const labels = [];
        let score = 0;
        for (const item of order) {
          const placement = item.candidates.find(option => labels.every(label => !overlaps(label, option, 3)));
          if (!placement) continue;
          labels.push(placement);
          score += placement.score;
        }
        if (labels.length > best.length || (labels.length === best.length && score < bestScore)) {
          best = labels;
          bestScore = score;
        }
      }
      if (!best.length) {
        const item = pending[0];
        const isolated = captionCandidates(item.point, item.caption, [item.point], geometry);
        // The square layout still has room for a single caption on an overflow page.
        best = [isolated[0]];
      }
      const ids = new Set(best.map(label => label.point.id));
      pages.push(best);
      pending = pending.filter(item => !ids.has(item.point.event.id));
    }
    return pages;
  }

  function drawLabel(ctx, label, palette) {
    const x = label.align === "center" ? label.x + label.width / 2 :
      label.align === "right" ? label.x + label.width : label.x;
    const ink = mix(palette.text, palette.ground, .24);
    ctx.save();
    ctx.textAlign = label.align;
    ctx.strokeStyle = palette.ground;
    ctx.lineWidth = 2.3;
    ctx.font = labelFont(label.monthSize);
    const monthY = label.y + label.monthSize - 2;
    ctx.strokeText(label.month, x, monthY);
    ctx.fillStyle = ink;
    ctx.fillText(label.month, x, monthY);
    ctx.font = labelFont(label.fontSize);
    ctx.fillStyle = palette.text;
    label.lines.forEach((value, i) => {
      const y = monthY + 1 + (i + 1) * label.lineHeight;
      ctx.strokeText(value, x, y, maxLabelWidth);
      ctx.fillText(value, x, y, maxLabelWidth);
    });
    ctx.restore();
  }

  function drawLegend(ctx, used, palette, patternSeed, geometry, locale) {
    if (!used.length) return;
    rule(ctx, 26, 414, geometry.divider, palette.stem, .42);
    const columns = 3;
    const columnWidth = 390 / columns;
    used.forEach((kind, i) => {
      const x = 24 + (i % columns) * columnWidth;
      const y = geometry.divider + (used.length > columns ? 19 + 23 * Math.floor(i / columns) : 27);
      drawMoment(ctx, x + 10, y - 4, 7.3, kind, palette, patternSeed);
      text(ctx, locale.themes[kind], x + 23, y, "600 14px Manrope, sans-serif", palette.text);
    });
  }

  function drawCover(ctx, layout, palette, height, year, locale) {
    ctx.save();
    if (height === 440) {
      ctx.translate(220, 231);
      ctx.scale(.84, .84);
      ctx.translate(-220, -274);
    } else {
      ctx.translate(0, (height - baseHeight) / 2);
    }
    drawWreath(ctx, layout, palette);
    tracked(ctx, locale.coverTitle, 220, 246, 12, palette.text, 2.9, "center");
    const nearby = layout.points.filter(point => point.y + point.size * 1.24 >= 250
      && point.y - point.size * 1.24 <= 325);
    const safeHalfWidth = Math.min(119, ...nearby.map(point => Math.abs(point.x - 220) - point.size * 1.24 - 12));
    const displayFont = '"Cormorant Garamond", Georgia, serif';
    ctx.font = '600 100px ' + displayFont;
    const size = 100 * Math.min(1, safeHalfWidth * 2 / ctx.measureText(year).width);
    text(ctx, year, 220, 323, '600 ' + size + 'px ' + displayFont, palette.text, "center");
    rule(ctx, 201, 239, 348, palette.stem);
    dot(ctx, 220, 348, 1.8, palette.dark ? palette.detail : palette.stem);
    ctx.restore();
  }

  function drawReveal(ctx, layout, labels, palette, page, pageCount, geometry, locale) {
    const selected = new Set(labels.map(label => label.point.id));
    text(ctx, locale.revealTitle, 25, 53, '500 32px "Cormorant Garamond", Georgia, serif', palette.text);
    if (pageCount > 1) {
      text(ctx, (page + 1) + " / " + pageCount, 414, 46, "600 13px Manrope, sans-serif", palette.text, "right");
    }

    ctx.save();
    ctx.translate(220, geometry.center);
    ctx.scale(geometry.scale, geometry.scale);
    ctx.translate(-220, -274);
    drawWreath(ctx, layout, palette, selected);
    ctx.restore();
    for (const label of labels) drawLabel(ctx, label, palette);

    if (page === 0) {
      const used = Array.from(new Set(layout.points.map(point => point.theme))).sort((a, b) => a - b);
      drawLegend(ctx, used, palette, layout.seed, geometry, locale);
    }
    return labels.map(({point}) => locale.months[point.month] + ", " + locale.themes[point.theme] + " — " + point.label).join(". ");
  }

  function prepare(events, settings, measure) {
    if (!events.length) return null;
    const ordered = events.slice().sort((a, b) => a.month - b.month || a.id - b.id);
    const layout = planWreath(ordered, settings.seed, settings.flowerSize);
    return {layout, pages: measure ? makePages(measure, layout, settings) : []};
  }

  function credits(ctx, palette, settings, geometry) {
    const author = settings.author;
    if (settings.side === "cover" && author) {
      const fontFamily = ' "Cormorant Garamond", Georgia, serif';
      const standardSize = (/\s/.test(author) ? 20 : 24) * settings.authorSize / 100;
      ctx.font = '600 ' + standardSize + 'px' + fontFamily;
      const size = Math.min(standardSize, standardSize * 366 / ctx.measureText(author).width);
      text(ctx, author, width / 2, 51, '600 ' + size + 'px' + fontFamily, palette.text, "center");
    }
    text(ctx, channel, 414, geometry.footer, "600 10px Manrope, sans-serif", palette.text, "right");
  }

  function drawCard(canvas, design, settings) {
    const locale = window.BloomLocales.get(settings.language);
    canvas.height = formatHeights[settings.format] || formatHeights.post;
    const ctx = canvas.getContext("2d");
    const ratio = canvas.width / width;
    const height = canvas.height / ratio;
    const geometry = revealGeometry(settings.format);
    const palette = palettes[settings.palette] || palettes.lagoon;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.scale(ratio, ratio);
    surface(ctx, height, palette);
    ctx.translate(0, (height - geometry.height) / 2);
    if (settings.side === "reveal") {
      const page = Math.max(0, Math.min(settings.page, design.pages.length - 1));
      const description = drawReveal(ctx, design.layout, design.pages[page], palette, page, design.pages.length, geometry, locale);
      const pageLabel = settings.language === "en" ? "Page " : "Страница ";
      canvas.setAttribute("aria-label", locale.revealTitle + ". " + pageLabel + (page + 1) + " / " + design.pages.length + ". " + description);
    } else {
      const year = String(parseYear(settings.year) ?? defaultYear);
      drawCover(ctx, design.layout, palette, geometry.height, year, locale);
      const countLabel = settings.language === "en" ? "Moments: " : "Событий: ";
      canvas.setAttribute("aria-label", locale.title + ". " + year + ". " + countLabel + design.layout.points.length + ".");
    }
    credits(ctx, palette, settings, geometry);
  }

  function validateCaption(ctx, value, language = "ru") {
    const locale = window.BloomLocales.get(language);
    const label = cleanLabel(value);
    const length = splitGraphemes(label).length;
    const error = length > maxCharacters ? locale.captionTooLong :
      fitLabel(ctx, label, maxCaptionSize) === null ? locale.captionTooWide : "";
    return {label, length, error};
  }

  function cleanAuthor(value) {
    return splitGraphemes(cleanLabel(value)).slice(0, maxAuthorLength).join("");
  }

  function parseYear(value) {
    const year = String(value ?? "").trim();
    return /^[1-9][0-9]{3}$/.test(year) ? Number(year) : null;
  }

  window.YearInBloom = Object.freeze({
    months, themes, paletteNames, sampleEvents, exampleName, maxAuthorLength, maxEvents,
    minCaptionSize, maxCaptionSize, defaultYear, parseYear, prepare, drawCard, validateCaption, cleanAuthor
  });
})();
