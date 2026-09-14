/** Render the convergence chart from the simulation series for byte-for-byte artifact reconciliation. */
export interface ConvergenceSeries {
  points: { n: number; rtp: number; se: number }[];
  theoreticalRTP: number;
}

export function renderConvergenceChart(rtp: ConvergenceSeries): string {
  const pts = rtp.points;
  const W = 900, H = 420, ml = 70, mr = 30, mt = 30, mb = 50;
  const iw = W - ml - mr, ih = H - mt - mb;
  const xs = pts.map(p => Math.log10(p.n));
  const xmin = Math.min(...xs), xmax = Math.max(...xs);
  const ymin = 0.95, ymax = 1.05;
  const X = (n: number) => ml + (Math.log10(n) - xmin) / (xmax - xmin) * iw;
  const Y = (v: number) => mt + (ymax - v) / (ymax - ymin) * ih;
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.n).toFixed(1)},${Y(p.rtp).toFixed(1)}`).join(' ');
  const bandTop = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.n).toFixed(1)},${Y(Math.min(ymax, p.rtp + 5 * p.se)).toFixed(1)}`).join(' ');
  const bandBot = pts.slice().reverse().map((p) => `L${X(p.n).toFixed(1)},${Y(Math.max(ymin, p.rtp - 5 * p.se)).toFixed(1)}`).join(' ');
  const theoY = Y(rtp.theoreticalRTP);
  const xticks = pts.map(p => `<text x="${X(p.n).toFixed(1)}" y="${H - mb + 18}" font-size="11" text-anchor="middle" fill="#666">${p.n >= 1e6 ? p.n / 1e6 + 'M' : p.n >= 1e3 ? p.n / 1e3 + 'k' : p.n}</text>`).join('');
  const yticks = [0.95, 0.97, 0.99, 1.01, 1.03, 1.05].map(v => `<line x1="${ml}" y1="${Y(v).toFixed(1)}" x2="${W - mr}" y2="${Y(v).toFixed(1)}" stroke="#eee"/><text x="${ml - 8}" y="${(Y(v) + 4).toFixed(1)}" font-size="11" text-anchor="end" fill="#666">${(v * 100).toFixed(0)}%</text>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="system-ui,sans-serif">
<rect width="${W}" height="${H}" fill="#fff"/>${yticks}${xticks}
<path d="${bandTop} ${bandBot} Z" fill="#3b82f6" opacity="0.12"/>
<line x1="${ml}" y1="${theoY.toFixed(1)}" x2="${W - mr}" y2="${theoY.toFixed(1)}" stroke="#16a34a" stroke-dasharray="5,4" stroke-width="1.5"/>
<text x="${W - mr}" y="${(theoY - 6).toFixed(1)}" font-size="11" text-anchor="end" fill="#16a34a">theoretical RTP ${(rtp.theoreticalRTP * 100).toFixed(2)}%</text>
<path d="${line}" fill="none" stroke="#1e3a8a" stroke-width="2"/>
<text x="${ml}" y="18" font-size="13" font-weight="600" fill="#111">Dice RTP convergence — under 50 (1.98×), ±5·SE band (SE = σ/√n)</text>
<text x="${(ml + iw / 2).toFixed(0)}" y="${H - 8}" font-size="11" text-anchor="middle" fill="#666">bets (log scale)</text>
</svg>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>Dice RTP convergence</title></head><body style="margin:24px;font-family:system-ui">${svg}</body></html>`;
}
