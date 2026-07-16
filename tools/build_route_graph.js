// 佳里區離線路網圖產生器：Overpass JSON → route_graph.js
// 圖結構：頂點=路口/端點，邊=頂點間路段（含中間形狀點、長度、單行道、路名、等級）
const fs = require('fs');

const d = JSON.parse(fs.readFileSync('jiali_roads.json', 'utf8'));
const ways = d.elements.filter(e => e.type === 'way' && e.geometry && e.nodes && e.nodes.length >= 2);

function hav(a, b) {
  const R = 6371000, f1 = a[1] * Math.PI / 180, f2 = b[1] * Math.PI / 180;
  const df = f2 - f1, dl = (b[0] - a[0]) * Math.PI / 180;
  const s = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// 節點使用次數（>1 = 路口）
const useCount = new Map();
for (const w of ways) for (const id of w.nodes) useCount.set(id, (useCount.get(id) || 0) + 1);

const vid = new Map();
const V = [];
function vertexFor(id, g) {
  let i = vid.get(id);
  if (i === undefined) {
    i = V.length;
    vid.set(id, i);
    V.push([+g.lon.toFixed(6), +g.lat.toFixed(6)]);
  }
  return i;
}

const nameIdx = new Map();
const names = [];
function nameFor(n) {
  if (!n) return -1;
  let i = nameIdx.get(n);
  if (i === undefined) { i = names.length; nameIdx.set(n, i); names.push(n); }
  return i;
}
const clsIdx = new Map();
const classes = [];
function clsFor(c) {
  let i = clsIdx.get(c);
  if (i === undefined) { i = classes.length; clsIdx.set(c, i); classes.push(c); }
  return i;
}

const E = [];
for (const w of ways) {
  const t = w.tags || {};
  let ow = 0; // 0=雙向 1=順向(a→b) 2=逆向(b→a)
  if (t.oneway === 'yes' || t.oneway === '1' || t.oneway === 'true') ow = 1;
  else if (t.oneway === '-1') ow = 2;
  else if ((t.junction === 'roundabout' || t.highway === 'motorway') && t.oneway !== 'no') ow = 1;
  const nm = nameFor(t.name || '');
  const cl = clsFor(t.highway);

  let segStart = 0;
  for (let i = 1; i < w.nodes.length; i++) {
    const isLast = i === w.nodes.length - 1;
    if (isLast || useCount.get(w.nodes[i]) > 1) {
      const coords = [];
      let len = 0;
      for (let j = segStart; j <= i; j++) {
        const g = w.geometry[j];
        coords.push([+g.lon.toFixed(6), +g.lat.toFixed(6)]);
        if (j > segStart) len += hav(coords[coords.length - 2], coords[coords.length - 1]);
      }
      const a = vertexFor(w.nodes[segStart], w.geometry[segStart]);
      const b = vertexFor(w.nodes[i], w.geometry[i]);
      if (a !== b && len > 0.5) {
        // 中間形狀點（不含端點，端點由 V 提供）
        const mids = coords.slice(1, -1).flat();
        E.push([a, b, Math.round(len), cl, nm, ow, mids]);
      }
      segStart = i;
    }
  }
}

const graph = { v: V, e: E, names, cls: classes };
const js = '/* 佳里區離線路網圖（OSM ' + (d.osm3s ? d.osm3s.timestamp_osm_base : '') + '，bbox 23.12-23.23/120.12-120.24）\n' +
  '   由 tools/build_route_graph.js 產生，資料 © OpenStreetMap contributors (ODbL) */\n' +
  'const ROUTE_GRAPH=' + JSON.stringify(graph) + ';\n';
fs.writeFileSync('route_graph.js', js);
console.log('vertices:', V.length, 'edges:', E.length, 'names:', names.length, 'classes:', classes.join(','));
console.log('file size:', (js.length / 1024).toFixed(0), 'KB');
