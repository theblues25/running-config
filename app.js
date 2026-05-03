'use strict';

// ─── State ────────────────────────────────────────────────────
const state = { theme: 'light', lastResult: null };

// ─── Strings ──────────────────────────────────────────────────
const STRINGS = {
    'title.main':          'IP Subnet Calculator',
    'label.input':         'Enter IP Address',
    'btn.calculate':       'Calculate',
    'btn.clear':           'Clear',
    'hint.format':         'Supports: 192.168.1.1/24  ·  192.168.1.1 255.255.255.0  ·  2001:db8::1/48',
    'section.ipv4':        'IPv4 Results',
    'section.ipv6':        'IPv6 Results',
    'section.binary':      'Binary Representation',
    'row.ipAddress':       'IP Address',
    'row.networkAddress':  'Network Address',
    'row.usableRange':     'Usable Host IP Range',
    'row.broadcast':       'Broadcast Address',
    'row.totalHosts':      'Total Number of Hosts',
    'row.usableHosts':     'Number of Usable Hosts',
    'row.subnetMask':      'Subnet Mask',
    'row.wildcardMask':    'Wildcard Mask',
    'row.binaryMask':      'Binary Subnet Mask',
    'row.ipClass':         'IP Class',
    'row.cidr':            'CIDR Notation',
    'row.ipType':          'IP Type',
    'row.short':           'Short',
    'row.binaryId':        'Binary ID',
    'row.integerId':       'Integer ID',
    'row.hexId':           'Hex ID',
    'row.arpa':            'in-addr.arpa',
    'row.ipv4mapped':      'IPv4 Mapped Address',
    'row.6to4':            '6to4 Prefix',
    'row.fullIpAddress':   'Full IP Address',
    'row.totalAddresses':  'Total IP Addresses',
    'row.network':         'Network',
    'row.ipRange':         'IP Range',
    'table.networkAddress':'Network Address',
    'table.usableRange':   'Usable Host Range',
    'table.broadcast':     'Broadcast Address',
    'footer.text':         'IP Subnet Calculator — Pure client-side, no data sent to server',
    'error.invalid':       'Invalid IP address format',
    'error.prefix':        'Prefix length out of range',
    'error.mask':          'Invalid or non-contiguous subnet mask',
    'copied':              'Copied!',
    'type.public':         'Public',
    'type.private':        'Private',
    'type.loopback':       'Loopback',
    'type.linklocal':      'Link-local',
    'type.multicast':      'Multicast',
    'type.reserved':       'Reserved',
    'v6type.globalunicast':'Global Unicast',
    'v6type.ula':          'Unique Local (ULA)',
    'v6type.linklocal':    'Link-local',
    'v6type.loopback':     'Loopback',
    'v6type.unspecified':  'Unspecified',
    'v6type.multicast':    'Multicast',
    'v6type.ipv4mapped':   'IPv4-mapped',
    'v6type.documentation':'Documentation',
    'v6type.teredo':       'Teredo',
    'v6type.sixto4':       '6to4',
    'v6type.reserved':     'Reserved',
};

function t(key) { return STRINGS[key] || key; }

// ─── Theme ────────────────────────────────────────────────────
function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  document.getElementById('theme-icon').textContent = state.theme === 'dark' ? '☀️' : '🌙';
}
function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', state.theme);
  applyTheme();
}

// ─── IPv4 Helpers ─────────────────────────────────────────────
function ipToInt(ip) {
  return ip.split('.').reduce((a, o) => ((a << 8) | (parseInt(o, 10) & 0xFF)) >>> 0, 0);
}
function intToIp(n) {
  return [(n >>> 24) & 0xFF, (n >>> 16) & 0xFF, (n >>> 8) & 0xFF, n & 0xFF].join('.');
}
function maskToCidr(mask) {
  const parts = mask.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return null;
  const bin = parts.map(p => (p >>> 0).toString(2).padStart(8, '0')).join('');
  if (!/^1*0*$/.test(bin)) return null;
  return (bin.match(/1/g) || []).length;
}
function cidrToMask(prefix) {
  return intToIp(prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0);
}
function isValidIPv4(ip) {
  const p = ip.split('.');
  return p.length === 4 && p.every(s => /^\d{1,3}$/.test(s) && +s >= 0 && +s <= 255);
}
function padBin(n, bits) {
  return (n >>> 0).toString(2).padStart(bits, '0');
}

// ─── IPv4 Classification ──────────────────────────────────────
function ipv4Type(ipInt) {
  const a = (ipInt >>> 24) & 0xFF;
  const b = (ipInt >>> 16) & 0xFF;
  if (a === 10) return 'private';
  if (a === 172 && b >= 16 && b <= 31) return 'private';
  if (a === 192 && b === 168) return 'private';
  if (a === 127) return 'loopback';
  if (a === 169 && b === 254) return 'linklocal';
  if (a >= 224 && a <= 239) return 'multicast';
  if (a >= 240) return 'reserved';
  return 'public';
}
function ipv4Class(ipInt) {
  const a = (ipInt >>> 24) & 0xFF;
  if (a < 128) return 'A';
  if (a < 192) return 'B';
  if (a < 224) return 'C';
  if (a < 240) return 'D';
  return 'E';
}

// ─── IPv4 Calculation ─────────────────────────────────────────
function calculateIPv4(ip, prefix) {
  const ipInt     = ipToInt(ip);
  const maskInt   = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0;
  const wildInt   = (~maskInt) >>> 0;
  const netInt    = (ipInt & maskInt) >>> 0;
  const bcastInt  = (netInt | wildInt) >>> 0;

  let firstHost, lastHost, usable, total;
  if (prefix === 32) {
    firstHost = lastHost = ipInt;
    usable = 1; total = 1;
  } else if (prefix === 31) {
    firstHost = netInt; lastHost = bcastInt;
    usable = 2; total = 2;
  } else {
    firstHost = netInt + 1; lastHost = bcastInt - 1;
    usable = bcastInt - netInt - 1;
    total  = bcastInt - netInt + 1;
  }

  const subnetMask = cidrToMask(prefix);
  const wildcardMask = intToIp(wildInt);
  const binaryMask = subnetMask.split('.').map(o => (+o).toString(2).padStart(8,'0')).join('.');

  const ipBin = [
    padBin((ipInt >>> 24) & 0xFF, 8),
    padBin((ipInt >>> 16) & 0xFF, 8),
    padBin((ipInt >>>  8) & 0xFF, 8),
    padBin( ipInt         & 0xFF, 8),
  ];
  const maskBin = [
    padBin((maskInt >>> 24) & 0xFF, 8),
    padBin((maskInt >>> 16) & 0xFF, 8),
    padBin((maskInt >>>  8) & 0xFF, 8),
    padBin( maskInt         & 0xFF, 8),
  ];

  const h1 = ((ipInt >>> 16) & 0xFFFF).toString(16).padStart(4, '0');
  const h2 = ( ipInt         & 0xFFFF).toString(16).padStart(4, '0');

  const octets = ip.split('.');
  const arpa = [...octets].reverse().join('.') + '.in-addr.arpa';

  return {
    type: 'ipv4', ip, prefix,
    network:   intToIp(netInt),
    broadcast: prefix >= 31 ? null : intToIp(bcastInt),
    firstHost: intToIp(firstHost),
    lastHost:  intToIp(lastHost),
    usableRange: `${intToIp(firstHost)} - ${intToIp(lastHost)}`,
    total, usable,
    subnetMask, wildcardMask, binaryMask,
    ipClass:  ipv4Class(ipInt),
    ipType:   ipv4Type(ipInt),
    cidr:     `/${prefix}`,
    short:    `${ip} /${prefix}`,
    binaryId: ipBin.join(''),
    intId:    (ipInt >>> 0).toString(),
    hexId:    '0x' + (ipInt >>> 0).toString(16).padStart(8, '0'),
    arpa,
    ipv4mapped: `::ffff:${h1}.${h2}`,
    sixToFour:  `2002:${h1}.${h2}::/48`,
    ipBin, maskBin,
    networkInt: netInt,
    allNetworks: getAllNetworksIPv4(netInt, prefix),
  };
}

// ─── All /prefix Networks in containing block ─────────────────
function getAllNetworksIPv4(networkInt, prefix) {
  if (prefix < 8) return null;

  let ctx;
  if (prefix >= 24) ctx = 24;
  else if (prefix >= 16) ctx = 16;
  else ctx = 8;

  const ctxMask  = (0xFFFFFFFF << (32 - ctx)) >>> 0;
  const ctxNet   = (networkInt & ctxMask) >>> 0;
  const subSize  = prefix === 32 ? 1 : (1 << (32 - prefix));
  const count    = 1 << (prefix - ctx);

  if (count > 256) return null;

  const subnets = [];
  for (let i = 0; i < count; i++) {
    const ni  = (ctxNet + i * subSize) >>> 0;
    const bi  = (ni + subSize - 1) >>> 0;
    const fi  = prefix >= 31 ? ni : ni + 1;
    const li  = prefix >= 31 ? bi : bi - 1;
    subnets.push({
      network:   intToIp(ni),
      broadcast: intToIp(bi),
      firstHost: intToIp(fi),
      lastHost:  intToIp(li),
      isCurrent: ni === networkInt,
    });
  }

  const cp = intToIp(ctxNet).split('.');
  let wildcard, title;
  if (ctx === 24)      wildcard = `${cp[0]}.${cp[1]}.${cp[2]}.*`;
  else if (ctx === 16) wildcard = `${cp[0]}.${cp[1]}.*.*`;
  else                 wildcard = `${cp[0]}.*.*.*`;

  title = `All ${count} of the Possible /${prefix} Networks for ${wildcard}`;
  return { title, subnets };
}

// ─── IPv6 Classification ─────────────────────────────────────
function ipv6Type(fullIp) {
  const g = fullIp.split(':').map(h => parseInt(h, 16));
  const g0 = g[0];

  if (g.every(v => v === 0)) return 'unspecified';
  if (g.slice(0, 7).every(v => v === 0) && g[7] === 1) return 'loopback';
  if (g.slice(0, 5).every(v => v === 0) && g[5] === 0xFFFF) return 'ipv4mapped';
  if ((g0 >> 8) === 0xFF) return 'multicast';
  if ((g0 & 0xFFC0) === 0xFE80) return 'linklocal';
  if ((g0 & 0xFE00) === 0xFC00) return 'ula';
  if (g0 === 0x2001 && g[1] === 0x0DB8) return 'documentation';
  if (g0 === 0x2001 && g[1] === 0x0000) return 'teredo';
  if (g0 === 0x2002) return 'sixto4';
  if ((g0 & 0xE000) === 0x2000) return 'globalunicast';
  return 'reserved';
}

// ─── IPv4 Render ──────────────────────────────────────────────
function renderIPv4(r) {
  document.getElementById('ipv4-results').classList.remove('hidden');
  document.getElementById('ipv6-results').classList.add('hidden');

  const v4ipEl = document.getElementById('v4-ip-address');
  if (r.ipType === 'public') {
    v4ipEl.innerHTML = `${escHtml(`${r.ip}/${r.prefix}`)} <a href="https://www.whois.com/whois/${encodeURIComponent(r.ip)}" target="_blank" rel="noopener noreferrer" class="whois-link">WHOIS ↗</a>`;
  } else {
    v4ipEl.textContent = `${r.ip}/${r.prefix}`;
  }
  document.getElementById('v4-ip-type').innerHTML =
    `<span class="type-badge type-${r.ipType}">${t('type.' + r.ipType)}</span>`;
  document.getElementById('v4-ip-class').innerHTML =
    `<span class="class-badge">${r.ipClass}</span>`;
  document.getElementById('v4-cidr').textContent = r.cidr;
  setV('v4-network',      r.network);
  setV('v4-broadcast',    r.broadcast ? r.broadcast : '—');
  setV('v4-usable-range', r.usableRange);

  document.getElementById('v4-total-hosts').textContent  = fmtNum(r.total);
  document.getElementById('v4-usable-hosts').textContent = fmtNum(r.usable);

  setV('v4-subnet-mask',   r.subnetMask);
  setV('v4-wildcard-mask', r.wildcardMask);
  document.getElementById('v4-short').textContent = r.short;
  setV('v4-arpa',          r.arpa);
  document.getElementById('v4-ipv4mapped').textContent = r.ipv4mapped;
  document.getElementById('v4-6to4').textContent       = r.sixToFour;

  renderBinaryViz(r.ipBin, r.maskBin, r.prefix);

  const card = document.getElementById('v4-all-networks-card');
  if (r.allNetworks) {
    card.classList.remove('hidden');
    document.getElementById('v4-all-networks-title').textContent = r.allNetworks.title;
    renderNetworksTable(r.allNetworks.subnets);
  } else {
    card.classList.add('hidden');
  }
}

function setV(id, text, copyable = true) {
  const el = document.getElementById(id);
  if (copyable) {
    el.innerHTML = `${escHtml(text)}<svg class="copy-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    el.dataset.copy = text;
  } else {
    el.textContent = text;
  }
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function renderBinaryViz(ipBin, maskBin, prefix) {
  const container = document.getElementById('v4-binary-viz');

  const makeRow = (label, bins) => {
    let pos = 0;
    const octHtml = bins.map(octet => {
      let s = '';
      for (let i = 0; i < 8; i++) {
        const cls = pos++ < prefix ? 'bit-net' : 'bit-host';
        s += `<span class="${cls}">${octet[i]}</span>`;
      }
      return `<span class="binary-octet">${s}</span>`;
    }).join('<span class="binary-dot">.</span>');

    return `<div class="binary-row">
      <span class="binary-row-label">${label}</span>
      <span class="binary-octets">${octHtml}</span>
    </div>`;
  };

  container.innerHTML =
    makeRow('Address:', ipBin) +
    makeRow('Mask:', maskBin) +
    `<div class="binary-legend">
      <span class="legend-item"><span class="legend-dot net"></span> Network bits</span>
      <span class="legend-item"><span class="legend-dot host"></span> Host bits</span>
    </div>`;
}

function renderNetworksTable(subnets) {
  document.getElementById('v4-all-networks-body').innerHTML = subnets.map(s =>
    `<tr class="${s.isCurrent ? 'current-row' : ''}">
      <td>${s.network}</td>
      <td>${s.firstHost} - ${s.lastHost}</td>
      <td>${s.broadcast}</td>
    </tr>`
  ).join('');
}

// ─── IPv6 Helpers ─────────────────────────────────────────────
function expandIPv6(ip) {
  let s = ip;
  if (s.includes('::')) {
    const [left, right] = s.split('::');
    const l = left  ? left.split(':')  : [];
    const r = right ? right.split(':') : [];
    const fill = Array(8 - l.length - r.length).fill('0000');
    s = [...l, ...fill, ...r].map(g => g.padStart(4, '0')).join(':');
  } else {
    s = s.split(':').map(g => g.padStart(4, '0')).join(':');
  }
  return s;
}

function compressIPv6(full) {
  const groups = full.split(':').map(g => parseInt(g, 16).toString(16));
  let bestStart = -1, bestLen = 0, curStart = -1, curLen = 0;
  for (let i = 0; i <= groups.length; i++) {
    if (i < groups.length && groups[i] === '0') {
      if (curStart < 0) { curStart = i; curLen = 0; }
      curLen++;
    } else {
      if (curLen > bestLen) { bestLen = curLen; bestStart = curStart; }
      curStart = -1; curLen = 0;
    }
  }
  if (bestLen >= 2) {
    const l = groups.slice(0, bestStart).join(':');
    const r = groups.slice(bestStart + bestLen).join(':');
    return (l ? l + '::' : '::') + r;
  }
  return groups.join(':');
}

function ipv6ToBigInt(full) {
  return full.split(':').reduce((a, g) => (a << 16n) | BigInt(parseInt(g, 16)), 0n);
}

function bigIntToIPv6Full(n) {
  const g = [];
  for (let i = 0; i < 8; i++) {
    g.unshift((n & 0xFFFFn).toString(16).padStart(4, '0'));
    n >>= 16n;
  }
  return g.join(':');
}

function isValidIPv6(ip) {
  if (ip.length > 45) return false;
  const dbl = (ip.match(/::/g) || []).length;
  if (dbl > 1) return false;
  const colons = (ip.match(/:/g) || []).length;
  if (!dbl && colons !== 7) return false;
  if (dbl && colons > 7) return false;
  return ip.split(/:{1,2}/).filter(Boolean).every(p => /^[0-9a-fA-F]{1,4}$/.test(p));
}

function formatIPv6Network(networkInt, prefix) {
  const full = bigIntToIPv6Full(networkInt);
  const groups = full.split(':');
  const netGroups = Math.floor(prefix / 16);
  const partial   = prefix % 16;

  if (partial !== 0 || netGroups === 8) return compressIPv6(full);

  const netPart = groups.slice(0, netGroups).join(':');
  return (netPart ? netPart + '::' : '::');
}

// ─── IPv6 Calculation ─────────────────────────────────────────
function calculateIPv6(ip, prefix) {
  const full   = expandIPv6(ip);
  const ipInt  = ipv6ToBigInt(full);
  const hBits  = BigInt(128 - prefix);
  const maskInt = prefix === 0 ? 0n : (((1n << BigInt(prefix)) - 1n) << hBits);
  const netInt  = ipInt & maskInt;
  const lastInt = netInt | ((1n << hBits) - 1n);
  const total   = 1n << hBits;

  return {
    type: 'ipv6', ip, prefix,
    fullIp:    full,
    total,
    ipType:    ipv6Type(full),
    network:   formatIPv6Network(netInt, prefix),
    rangeFirst: bigIntToIPv6Full(netInt),
    rangeLast:  bigIntToIPv6Full(lastInt),
  };
}

// ─── IPv6 Hex Viz ─────────────────────────────────────────────
function renderIPv6Hex(r) {
  const container = document.getElementById('v6-hex-viz');
  const { fullIp, rangeFirst, prefix } = r;

  const makeRow = (label, fullAddr) => {
    const groups = fullAddr.split(':');
    let nibblePos = 0;
    const groupsHtml = groups.map(group => {
      let html = '';
      for (const ch of group) {
        const start = nibblePos * 4;
        const end   = start + 4;
        let cls;
        if (end <= prefix)   cls = 'bit-net';
        else if (start >= prefix) cls = 'bit-host';
        else                 cls = 'bit-partial';
        html += `<span class="${cls}">${ch}</span>`;
        nibblePos++;
      }
      return `<span class="hex-group">${html}</span>`;
    }).join('<span class="hex-colon">:</span>');

    return `<div class="binary-row">
      <span class="binary-row-label">${label}</span>
      <span class="hex-groups">${groupsHtml}</span>
    </div>`;
  };

  const hasPartial = prefix % 4 !== 0;
  container.innerHTML =
    makeRow('Address:', fullIp) +
    makeRow('Network:', rangeFirst) +
    `<div class="binary-legend">
      <span class="legend-item"><span class="legend-dot net"></span> Network bits</span>
      <span class="legend-item"><span class="legend-dot host"></span> Host bits</span>
      ${hasPartial ? `<span class="legend-item"><span class="legend-dot partial"></span> Boundary nibble</span>` : ''}
    </div>`;
}

// ─── IPv6 Render ──────────────────────────────────────────────
function renderIPv6(r) {
  document.getElementById('ipv6-results').classList.remove('hidden');
  document.getElementById('ipv4-results').classList.add('hidden');
  document.getElementById('v4-all-networks-card').classList.add('hidden');

  const v6ipEl = document.getElementById('v6-ip-address');
  if (r.ipType === 'globalunicast') {
    v6ipEl.innerHTML = `${escHtml(`${r.ip}/${r.prefix}`)} <a href="https://www.whois.com/whois/${encodeURIComponent(r.ip)}" target="_blank" rel="noopener noreferrer" class="whois-link">WHOIS ↗</a>`;
  } else {
    v6ipEl.textContent = `${r.ip}/${r.prefix}`;
  }
  setV('v6-full-ip',  r.fullIp);
  document.getElementById('v6-total').textContent = fmtBigInt(r.total);
  setV('v6-network', r.network);

  document.getElementById('v6-ip-type').innerHTML =
    `<span class="type-badge v6type-${r.ipType}">${t('v6type.' + r.ipType)}</span>`;

  const rangeEl = document.getElementById('v6-range');
  rangeEl.innerHTML =
    `<span>${escHtml(r.rangeFirst)}</span>` +
    `<span>— ${escHtml(r.rangeLast)}</span>`;

  renderIPv6Hex(r);
}

// ─── Input Parser ─────────────────────────────────────────────
function parseInput(raw) {
  const s = raw.trim();
  if (!s) return { error: 'error.invalid' };

  if (s.includes(':')) {
    let ip = s, prefix = 128;
    if (s.includes('/')) {
      const idx = s.lastIndexOf('/');
      ip = s.slice(0, idx);
      prefix = parseInt(s.slice(idx + 1), 10);
      if (isNaN(prefix) || prefix < 0 || prefix > 128) return { error: 'error.prefix' };
    }
    if (!isValidIPv6(ip)) return { error: 'error.invalid' };
    return { type: 'ipv6', ip, prefix };
  }

  let ip, prefix;
  if (s.includes('/')) {
    const [a, b] = s.split('/');
    ip = a.trim();
    prefix = parseInt(b.trim(), 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) return { error: 'error.prefix' };
  } else if (s.includes(' ')) {
    const parts = s.trim().split(/\s+/);
    ip = parts[0];
    const cidr = maskToCidr(parts[1]);
    if (cidr === null) return { error: 'error.mask' };
    prefix = cidr;
  } else {
    ip = s; prefix = 32;
  }

  if (!isValidIPv4(ip)) return { error: 'error.invalid' };
  return { type: 'ipv4', ip, prefix };
}

// ─── Formatters ───────────────────────────────────────────────
function fmtNum(n) { return n.toLocaleString(); }

function fmtBigInt(n) {
  const s = n.toString();
  let r = '';
  for (let i = s.length - 1, c = 0; i >= 0; i--, c++) {
    if (c > 0 && c % 3 === 0) r = ',' + r;
    r = s[i] + r;
  }
  return r;
}

// ─── Handlers ─────────────────────────────────────────────────
function handleCalculate() {
  const raw = document.getElementById('ip-input').value;
  const parsed = parseInput(raw);
  if (parsed.error) { showError(t(parsed.error)); return; }
  hideError();
  const result = parsed.type === 'ipv4'
    ? calculateIPv4(parsed.ip, parsed.prefix)
    : calculateIPv6(parsed.ip, parsed.prefix);
  state.lastResult = result;
  renderResult(result);
}

function renderResult(r) {
  document.getElementById('result-section').classList.remove('hidden');
  if (r.type === 'ipv4') renderIPv4(r);
  else renderIPv6(r);
}

function handleClear() {
  document.getElementById('ip-input').value = '';
  document.getElementById('result-section').classList.add('hidden');
  document.getElementById('ipv4-results').classList.remove('hidden');
  document.getElementById('ipv6-results').classList.add('hidden');
  document.getElementById('v4-all-networks-card').classList.add('hidden');
  hideError();
  state.lastResult = null;
  document.getElementById('ip-input').focus();
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  el.textContent = msg;
  el.classList.remove('hidden');
}
function hideError() {
  document.getElementById('error-msg').classList.add('hidden');
}

// ─── Copy to Clipboard ────────────────────────────────────────
let tooltipTimer = null;

document.addEventListener('click', async e => {
  const el = e.target.closest('.copyable');
  if (!el) return;
  const text = el.dataset.copy || el.textContent.trim();
  try {
    await navigator.clipboard.writeText(text);
    const tip = document.getElementById('copy-tooltip');
    tip.textContent = t('copied');
    tip.style.left = (e.clientX + 10) + 'px';
    tip.style.top  = (e.clientY - 32) + 'px';
    tip.classList.remove('hidden');
    clearTimeout(tooltipTimer);
    tooltipTimer = setTimeout(() => tip.classList.add('hidden'), 1300);
  } catch (_) {}
});

// ─── Init ─────────────────────────────────────────────────────
function init() {
  state.theme = localStorage.getItem('theme') || 'dark';
  applyTheme();

  document.getElementById('calc-btn').addEventListener('click', handleCalculate);
  document.getElementById('clear-btn').addEventListener('click', handleClear);
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('ip-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleCalculate();
  });

  const params = new URLSearchParams(location.search);
  if (params.get('ip')) {
    document.getElementById('ip-input').value = params.get('ip');
    handleCalculate();
  }
}

// ─── Export to Excel ──────────────────────────────────────────
function exportToExcel() {
  const r = state.lastResult;
  if (!r || typeof XLSX === 'undefined') return;

  const wb = XLSX.utils.book_new();
  const ts = new Date().toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });

  if (r.type === 'ipv4') {
    const rows = [
      ['IP Subnet Calculator — IPv4 Results'],
      ['Generated', ts],
      [],
      ['Field', 'Value'],
      ['IP Address',            `${r.ip}/${r.prefix}`],
      ['IP Type',               t('type.' + r.ipType)],
      ['IP Class',              r.ipClass],
      ['CIDR Notation',         r.cidr],
      ['Network Address',       r.network],
      ['Broadcast Address',     r.broadcast || '—'],
      ['Usable Host IP Range',  r.usableRange],
      ['Total Number of Hosts', r.total],
      ['Number of Usable Hosts',r.usable],
      ['Subnet Mask',           r.subnetMask],
      ['Wildcard Mask',         r.wildcardMask],
      ['Short',                 r.short],
      ['in-addr.arpa',          r.arpa],
      ['IPv4 Mapped Address',   r.ipv4mapped],
      ['6to4 Prefix',           r.sixToFour],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ width: 24 }, { width: 46 }];
    styleSummarySheet(ws, rows.length);
    XLSX.utils.book_append_sheet(wb, ws, 'IPv4 Summary');

    if (r.allNetworks) {
      const netRows = [
        [r.allNetworks.title],
        [],
        ['Network Address', 'Usable Host Range', 'Broadcast Address'],
        ...r.allNetworks.subnets.map(s => [
          s.network,
          `${s.firstHost} - ${s.lastHost}`,
          s.broadcast,
        ]),
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(netRows);
      ws2['!cols'] = [{ width: 20 }, { width: 34 }, { width: 20 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'All Networks');
    }

    XLSX.writeFile(wb, `subnet_${r.ip.replace(/\./g,'-')}_${r.prefix}.xlsx`);

  } else {
    const rows = [
      ['IP Subnet Calculator — IPv6 Results'],
      ['Generated', ts],
      [],
      ['Field', 'Value'],
      ['IP Address',          `${r.ip}/${r.prefix}`],
      ['Full IP Address',     r.fullIp],
      ['Total IP Addresses',  fmtBigInt(r.total)],
      ['Network',             r.network],
      ['IP Type',             t('v6type.' + r.ipType)],
      ['IP Range (First)',    r.rangeFirst],
      ['IP Range (Last)',     r.rangeLast],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ width: 24 }, { width: 50 }];
    styleSummarySheet(ws, rows.length);
    XLSX.utils.book_append_sheet(wb, ws, 'IPv6 Summary');

    const safe = r.ip.replace(/:/g, '-').replace(/\//g, '_');
    XLSX.writeFile(wb, `subnet_${safe}_${r.prefix}.xlsx`);
  }
}

function styleSummarySheet(ws, totalRows) {
  if (!ws['A1']) return;
  // Bold the title row and header row
  ['A1', 'A4', 'B4'].forEach(ref => {
    if (ws[ref]) ws[ref].s = { font: { bold: true } };
  });
}

document.addEventListener('DOMContentLoaded', init);
