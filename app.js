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
  renderIPv6Breakdown(r);

  const eui64Wrap = document.getElementById('v6-eui64-wrap');
  if (r.prefix <= 64) {
    eui64Wrap.classList.remove('hidden');
  } else {
    eui64Wrap.classList.add('hidden');
    document.getElementById('eui64-result').classList.add('hidden');
  }
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

  document.querySelectorAll('.card-header.collapsible').forEach(header => {
    const toolId = header.dataset.tool;
    const body = document.getElementById(`tool-body-${toolId}`);
    header.addEventListener('click', () => {
      const isOpen = body.classList.contains('open');
      body.classList.toggle('open', !isOpen);
      header.classList.toggle('expanded', !isOpen);
    });
  });

  document.getElementById('eui64-btn').addEventListener('click', handleEUI64);
  document.getElementById('mac-input').addEventListener('keydown', e => { if (e.key === 'Enter') handleEUI64(); });

  document.getElementById('cmp-btn').addEventListener('click', handleCompare);
  document.getElementById('cmp-ip1').addEventListener('keydown', e => { if (e.key === 'Enter') handleCompare(); });
  document.getElementById('cmp-ip2').addEventListener('keydown', e => { if (e.key === 'Enter') handleCompare(); });

  document.getElementById('split-btn').addEventListener('click', handleSplit);
  document.getElementById('split-network').addEventListener('keydown', e => { if (e.key === 'Enter') handleSplit(); });

  document.getElementById('summary-btn').addEventListener('click', handleSummary);

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

// ─── IPv6 Address Breakdown ───────────────────────────────────
function renderIPv6Breakdown(r) {
  const container = document.getElementById('v6-breakdown-viz');
  const { fullIp, prefix } = r;
  const groups = fullIp.split(':');

  let sections;
  if (prefix === 64) {
    sections = [
      { grps: groups.slice(0, 4), cls: 'bdk-net',    name: 'Network Prefix',           bits: '64 bits' },
      { grps: groups.slice(4),    cls: 'bdk-host',   name: 'Interface ID',             bits: '64 bits' },
    ];
  } else if (prefix === 48) {
    sections = [
      { grps: groups.slice(0, 3), cls: 'bdk-net',    name: 'Global Routing Prefix',    bits: '48 bits' },
      { grps: groups.slice(3, 4), cls: 'bdk-subnet', name: 'Subnet ID',                bits: '16 bits' },
      { grps: groups.slice(4),    cls: 'bdk-host',   name: 'Interface ID',             bits: '64 bits' },
    ];
  } else if (prefix < 64 && prefix % 16 === 0) {
    const n = prefix / 16;
    sections = [
      { grps: groups.slice(0, n), cls: 'bdk-net',    name: 'Global Routing Prefix',    bits: `${prefix} bits` },
      { grps: groups.slice(n, 4), cls: 'bdk-subnet', name: 'Subnet Range',             bits: `${64 - prefix} bits` },
      { grps: groups.slice(4),    cls: 'bdk-host',   name: 'Interface ID',             bits: '64 bits' },
    ];
  } else if (prefix > 64 && prefix % 16 === 0) {
    const n = prefix / 16;
    sections = [
      { grps: groups.slice(0, n), cls: 'bdk-net',    name: 'Network',                  bits: `${prefix} bits` },
      { grps: groups.slice(n),    cls: 'bdk-host',   name: 'Host',                     bits: `${128 - prefix} bits` },
    ];
  } else {
    const n = Math.floor(prefix / 16);
    const hostLabel = prefix <= 64 ? 'Interface ID' : 'Host';
    sections = [];
    if (n > 0) sections.push({ grps: groups.slice(0, n), cls: 'bdk-net', name: 'Network', bits: `${prefix} bits` });
    sections.push({ grps: [groups[n]], cls: 'bdk-boundary', name: '(boundary)', bits: `${prefix % 16}+${16 - prefix % 16} bits` });
    if (n + 1 < 8) sections.push({ grps: groups.slice(n + 1), cls: 'bdk-host', name: hostLabel, bits: `${128 - prefix} bits` });
  }

  const html = sections.filter(s => s.grps.length).map(sec => {
    const val = sec.grps.join('<span class="bdk-colon">:</span>');
    return `<div class="v6-bdk-sec ${sec.cls}">
      <div class="v6-bdk-val">${val}</div>
      <div class="v6-bdk-name">${sec.name}</div>
      <div class="v6-bdk-bits">${sec.bits}</div>
    </div>`;
  }).join('<span class="v6-bdk-sep">:</span>');

  container.innerHTML = `<div class="v6-bdk">${html}</div>`;
}

// ─── EUI-64 Generator ─────────────────────────────────────────
function handleEUI64() {
  const mac = document.getElementById('mac-input').value.trim();
  const resultEl = document.getElementById('eui64-result');
  if (!mac) return;

  const cleaned = mac.replace(/[:\-.\s]/g, '');
  if (!/^[0-9a-fA-F]{12}$/.test(cleaned)) {
    resultEl.className = '';
    resultEl.innerHTML = `<span class="eui64-error">Invalid MAC. Use format: AA:BB:CC:DD:EE:FF</span>`;
    resultEl.classList.remove('hidden');
    return;
  }

  const b = [];
  for (let i = 0; i < 12; i += 2) b.push(parseInt(cleaned.slice(i, i + 2), 16));
  b[0] ^= 0x02;
  const eui = [b[0], b[1], b[2], 0xFF, 0xFE, b[3], b[4], b[5]];
  const ifIdGroups = [
    ((eui[0] << 8) | eui[1]).toString(16).padStart(4, '0'),
    ((eui[2] << 8) | eui[3]).toString(16).padStart(4, '0'),
    ((eui[4] << 8) | eui[5]).toString(16).padStart(4, '0'),
    ((eui[6] << 8) | eui[7]).toString(16).padStart(4, '0'),
  ];

  const r = state.lastResult;
  const netGroups = r.rangeFirst.split(':').slice(0, 4);
  const fullGroups = [...netGroups, ...ifIdGroups];
  const fullAddr = fullGroups.map(g => g.padStart(4, '0')).join(':');
  const compressed = compressIPv6(fullAddr);
  const ifId = ifIdGroups.join(':');

  const copyBtn = (text, label) =>
    `<span class="eui64-value mono copyable" data-copy="${text}">${escHtml(text)}<svg class="copy-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>`;

  resultEl.className = 'eui64-result';
  resultEl.innerHTML = `
    <div class="eui64-row-result"><span class="eui64-label">Interface ID</span>${copyBtn(ifId)}</div>
    <div class="eui64-row-result"><span class="eui64-label">Full IPv6 Address</span>${copyBtn(compressed)}</div>`;
  resultEl.classList.remove('hidden');
}

// ─── Compare Two IPs ──────────────────────────────────────────
function handleCompare() {
  const raw1 = document.getElementById('cmp-ip1').value.trim();
  const raw2 = document.getElementById('cmp-ip2').value.trim();
  const resultEl = document.getElementById('cmp-result');
  if (!raw1 || !raw2) return;

  const p1 = parseInput(raw1);
  const p2 = parseInput(raw2);

  if (p1.error || p2.error) {
    resultEl.innerHTML = `<div class="cmp-error">Invalid IP address format</div>`;
    resultEl.classList.remove('hidden'); return;
  }
  if (p1.type !== p2.type) {
    resultEl.innerHTML = `<div class="cmp-error">Cannot compare IPv4 with IPv6</div>`;
    resultEl.classList.remove('hidden'); return;
  }

  const vbadge = (ok, yes, no) => {
    const cls = ok ? 'verdict-yes' : 'verdict-no';
    return `<span class="verdict-badge ${cls}"><span class="verdict-icon">${ok ? '✓' : '✗'}</span>${ok ? yes : no}</span>`;
  };

  let html = '';
  if (p1.type === 'ipv4') {
    const r1 = calculateIPv4(p1.ip, p1.prefix);
    const r2 = calculateIPv4(p2.ip, p2.prefix);
    const n1 = ipToInt(r1.network), b1 = r1.broadcast ? ipToInt(r1.broadcast) : ipToInt(r1.network);
    const n2 = ipToInt(r2.network), b2 = r2.broadcast ? ipToInt(r2.broadcast) : ipToInt(r2.network);
    const i1 = ipToInt(r1.ip),      i2 = ipToInt(r2.ip);
    const sameNet = r1.network === r2.network && r1.prefix === r2.prefix;
    const overlap = n1 <= b2 && n2 <= b1 && !sameNet;
    html = `
      <div class="cmp-grid">
        <div class="cmp-col">
          <div class="cmp-addr">${r1.ip}/${r1.prefix}</div>
          <div class="cmp-net">Network: ${r1.network}/${r1.prefix}</div>
          <div class="cmp-range">${intToIp(n1)} – ${r1.broadcast || r1.ip}</div>
        </div>
        <div class="cmp-col">
          <div class="cmp-addr">${r2.ip}/${r2.prefix}</div>
          <div class="cmp-net">Network: ${r2.network}/${r2.prefix}</div>
          <div class="cmp-range">${intToIp(n2)} – ${r2.broadcast || r2.ip}</div>
        </div>
      </div>
      <div class="cmp-verdicts">
        ${vbadge(sameNet,        'Same Network',                                      'Different Networks')}
        ${vbadge(!overlap,       'No Overlap',                                        'Overlapping Ranges')}
        ${vbadge(i1 >= n2 && i1 <= b2, `${r1.ip} is inside ${r2.network}/${r2.prefix}`, `${r1.ip} is outside ${r2.network}/${r2.prefix}`)}
        ${vbadge(i2 >= n1 && i2 <= b1, `${r2.ip} is inside ${r1.network}/${r1.prefix}`, `${r2.ip} is outside ${r1.network}/${r1.prefix}`)}
      </div>`;
  } else {
    const r1 = calculateIPv6(p1.ip, p1.prefix);
    const r2 = calculateIPv6(p2.ip, p2.prefix);
    const i1 = ipv6ToBigInt(r1.fullIp),  i2 = ipv6ToBigInt(r2.fullIp);
    const n1 = ipv6ToBigInt(r1.rangeFirst), l1 = ipv6ToBigInt(r1.rangeLast);
    const n2 = ipv6ToBigInt(r2.rangeFirst), l2 = ipv6ToBigInt(r2.rangeLast);
    const sameNet = r1.network === r2.network && r1.prefix === r2.prefix;
    const overlap = n1 <= l2 && n2 <= l1 && !sameNet;
    html = `
      <div class="cmp-grid">
        <div class="cmp-col">
          <div class="cmp-addr">${r1.ip}/${r1.prefix}</div>
          <div class="cmp-net">Network: ${r1.network}/${r1.prefix}</div>
        </div>
        <div class="cmp-col">
          <div class="cmp-addr">${r2.ip}/${r2.prefix}</div>
          <div class="cmp-net">Network: ${r2.network}/${r2.prefix}</div>
        </div>
      </div>
      <div class="cmp-verdicts">
        ${vbadge(sameNet,      'Same Network',                                      'Different Networks')}
        ${vbadge(overlap,      'Overlapping Ranges',                                'No Overlap')}
        ${vbadge(i1 >= n2 && i1 <= l2, `${r1.ip} is inside ${r2.network}/${r2.prefix}`, `${r1.ip} is outside ${r2.network}/${r2.prefix}`)}
        ${vbadge(i2 >= n1 && i2 <= l1, `${r2.ip} is inside ${r1.network}/${r1.prefix}`, `${r2.ip} is outside ${r1.network}/${r1.prefix}`)}
      </div>`;
  }
  resultEl.innerHTML = html;
  resultEl.classList.remove('hidden');
}

// ─── Subnet Splitter ──────────────────────────────────────────
function handleSplit() {
  const raw = document.getElementById('split-network').value.trim();
  const newPrefix = parseInt(document.getElementById('split-prefix').value, 10);
  const resultEl = document.getElementById('split-result');
  if (!raw) return;

  const parsed = parseInput(raw);
  if (parsed.error) {
    resultEl.innerHTML = `<div class="cmp-error">Enter a valid network (e.g. 192.168.1.0/24 or 2001:db8::/32)</div>`;
    resultEl.classList.remove('hidden'); return;
  }

  const maxPrefix = parsed.type === 'ipv4' ? 32 : 128;
  if (isNaN(newPrefix) || newPrefix <= parsed.prefix || newPrefix > maxPrefix) {
    resultEl.innerHTML = `<div class="cmp-error">New prefix must be larger than /${parsed.prefix} and ≤ /${maxPrefix}</div>`;
    resultEl.classList.remove('hidden'); return;
  }

  const diff = newPrefix - parsed.prefix;
  const countBig = 1n << BigInt(diff);

  if (parsed.type === 'ipv4') {
    if (countBig > 1000n) {
      resultEl.innerHTML = `<div class="cmp-error">Would produce ${countBig.toLocaleString()} subnets (2<sup>${diff}</sup>). Maximum is 1,000 — use a prefix closer to /${parsed.prefix}.</div>`;
      resultEl.classList.remove('hidden'); return;
    }
    const count = Number(countBig);
    const r = calculateIPv4(parsed.ip, parsed.prefix);
    const netInt = ipToInt(r.network);
    const subSize = 1 << (32 - newPrefix);
    const usable = newPrefix >= 31 ? subSize : subSize - 2;
    const rows = [];
    for (let i = 0; i < count; i++) {
      const ni = (netInt + i * subSize) >>> 0;
      const bi = (ni + subSize - 1) >>> 0;
      const fi = newPrefix >= 31 ? ni : ni + 1;
      const li = newPrefix >= 31 ? bi : bi - 1;
      rows.push(`<tr>
        <td>${i + 1}</td><td>${intToIp(ni)}/${newPrefix}</td>
        <td>${intToIp(fi)} – ${intToIp(li)}</td>
        <td>${intToIp(bi)}</td><td>${usable.toLocaleString()}</td>
      </tr>`);
    }
    resultEl.innerHTML = `
      <div class="split-summary">
        Splitting <strong>${r.network}/${r.prefix}</strong> into
        <strong>${count.toLocaleString()} × /${newPrefix}</strong> subnets —
        ${usable.toLocaleString()} usable hosts each
      </div>
      <div class="table-wrapper" style="max-height:400px">
        <table class="networks-table">
          <thead><tr><th>#</th><th>Network</th><th>Usable Range</th><th>Broadcast</th><th>Hosts</th></tr></thead>
          <tbody>${rows.join('')}</tbody>
        </table>
      </div>`;
  } else {
    const LIMIT = 1000;
    const truncated = countBig > BigInt(LIMIT);
    const displayCount = truncated ? LIMIT : Number(countBig);
    const r = calculateIPv6(parsed.ip, parsed.prefix);
    const netInt = ipv6ToBigInt(r.rangeFirst);
    const subSize = 1n << BigInt(128 - newPrefix);
    const rows = [];
    for (let i = 0; i < displayCount; i++) {
      const ni = netInt + BigInt(i) * subSize;
      const li = ni + subSize - 1n;
      rows.push(`<tr>
        <td>${i + 1}</td>
        <td>${compressIPv6(bigIntToIPv6Full(ni))}/${newPrefix}</td>
        <td>${compressIPv6(bigIntToIPv6Full(ni))} – ${compressIPv6(bigIntToIPv6Full(li))}</td>
        <td>${fmtBigInt(subSize)}</td>
      </tr>`);
    }
    const truncNote = truncated
      ? ` <span style="color:var(--text-sec);font-weight:400">— showing first ${LIMIT.toLocaleString()} of ${countBig.toLocaleString()} total</span>`
      : '';
    resultEl.innerHTML = `
      <div class="split-summary">
        Splitting <strong>${compressIPv6(r.rangeFirst)}/${r.prefix}</strong> into
        <strong>${countBig.toLocaleString()} × /${newPrefix}</strong> subnets${truncNote} —
        2<sup>${128 - newPrefix}</sup> addresses each
      </div>
      <div class="table-wrapper" style="max-height:400px">
        <table class="networks-table">
          <thead><tr><th>#</th><th>Network</th><th>Range (First – Last)</th><th>Addresses</th></tr></thead>
          <tbody>${rows.join('')}</tbody>
        </table>
      </div>`;
  }
  resultEl.classList.remove('hidden');
}

// ─── Route Summary ────────────────────────────────────────────
function handleSummary() {
  const raw = document.getElementById('summary-input').value.trim();
  const resultEl = document.getElementById('summary-result');
  if (!raw) return;

  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const parsed = lines.map(l => parseInput(l));

  if (parsed.some(p => p.error)) {
    resultEl.innerHTML = `<div class="cmp-error">Invalid format. Use CIDR notation (e.g. 192.168.1.0/24 or 2001:db8::/48)</div>`;
    resultEl.classList.remove('hidden'); return;
  }
  const types = [...new Set(parsed.map(p => p.type))];
  if (types.length > 1) {
    resultEl.innerHTML = `<div class="cmp-error">Mix of IPv4 and IPv6 detected — enter one type at a time</div>`;
    resultEl.classList.remove('hidden'); return;
  }

  if (types[0] === 'ipv4') {
    const networks = parsed.map(p => {
      const r = calculateIPv4(p.ip, p.prefix);
      const ni = ipToInt(r.network);
      const bi = r.broadcast ? ipToInt(r.broadcast) : ni;
      return { ni, bi, prefix: p.prefix, network: r.network, broadcast: r.broadcast, usableRange: r.usableRange };
    });
    const minNet   = networks.reduce((a, n) => Math.min(a, n.ni),  Infinity);
    const maxBcast = networks.reduce((a, n) => Math.max(a, n.bi), -Infinity);
    let aggPrefix = 32;
    while (aggPrefix > 0) {
      const mask = (0xFFFFFFFF << (32 - aggPrefix)) >>> 0;
      const aggNet   = (minNet & mask) >>> 0;
      const aggBcast = (aggNet | ((~mask) >>> 0)) >>> 0;
      if (aggNet <= minNet && aggBcast >= maxBcast) break;
      aggPrefix--;
    }
    const mask    = aggPrefix === 0 ? 0 : (0xFFFFFFFF << (32 - aggPrefix)) >>> 0;
    const aggNet  = (minNet & mask) >>> 0;
    const aggBcast = (aggNet | ((~mask) >>> 0)) >>> 0;
    const sorted = [...networks].sort((a, b) => a.ni - b.ni);
    const rows = sorted.map(n => `<tr>
      <td>${n.network}/${n.prefix}</td>
      <td>${n.usableRange}</td>
      <td>${n.broadcast || '—'}</td>
    </tr>`).join('');
    resultEl.innerHTML = `
      <div class="summary-box">
        <div class="summary-agg"><span class="summary-label">Aggregate Route</span><span class="summary-value mono">${intToIp(aggNet)}/${aggPrefix}</span></div>
        <div class="summary-agg"><span class="summary-label">Subnet Mask</span><span class="summary-value mono">${cidrToMask(aggPrefix)}</span></div>
        <div class="summary-agg"><span class="summary-label">Coverage</span><span class="summary-value">${intToIp(aggNet)} – ${intToIp(aggBcast)} &nbsp;(${fmtNum(aggBcast - aggNet + 1)} addresses)</span></div>
        <div class="summary-agg"><span class="summary-label">Inputs</span><span class="summary-value">${sorted.length} networks summarized</span></div>
      </div>
      <div class="table-wrapper" style="max-height:300px">
        <table class="networks-table">
          <thead><tr><th>Input Network</th><th>Usable Range</th><th>Broadcast</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  } else {
    const networks = parsed.map(p => {
      const r = calculateIPv6(p.ip, p.prefix);
      const ni = ipv6ToBigInt(r.rangeFirst);
      const li = ipv6ToBigInt(r.rangeLast);
      return { ni, li, prefix: p.prefix, network: compressIPv6(r.rangeFirst), last: compressIPv6(r.rangeLast) };
    });
    const minNet  = networks.reduce((a, n) => a < n.ni ? a : n.ni, networks[0].ni);
    const maxLast = networks.reduce((a, n) => a > n.li ? a : n.li, networks[0].li);
    let aggPrefix = 128;
    while (aggPrefix > 0) {
      const b = BigInt(128 - aggPrefix);
      const mask = aggPrefix === 0 ? 0n : (((1n << BigInt(aggPrefix)) - 1n) << b);
      const aggNet  = minNet & mask;
      const aggLast = aggNet | ((1n << b) - 1n);
      if (aggNet <= minNet && aggLast >= maxLast) break;
      aggPrefix--;
    }
    const b2 = BigInt(128 - aggPrefix);
    const mask2 = aggPrefix === 0 ? 0n : (((1n << BigInt(aggPrefix)) - 1n) << b2);
    const aggNetInt  = minNet & mask2;
    const aggLastInt = aggNetInt | ((1n << b2) - 1n);
    const aggNetStr  = compressIPv6(bigIntToIPv6Full(aggNetInt));
    const aggLastStr = compressIPv6(bigIntToIPv6Full(aggLastInt));
    const sorted = [...networks].sort((a, b) => a.ni < b.ni ? -1 : 1);
    const rows = sorted.map(n => `<tr>
      <td>${n.network}/${n.prefix}</td>
      <td>${n.network} – ${n.last}</td>
    </tr>`).join('');
    resultEl.innerHTML = `
      <div class="summary-box">
        <div class="summary-agg"><span class="summary-label">Aggregate Route</span><span class="summary-value mono">${aggNetStr}/${aggPrefix}</span></div>
        <div class="summary-agg"><span class="summary-label">Coverage</span><span class="summary-value">${aggNetStr} – ${aggLastStr}</span></div>
        <div class="summary-agg"><span class="summary-label">Inputs</span><span class="summary-value">${sorted.length} networks summarized</span></div>
      </div>
      <div class="table-wrapper" style="max-height:300px">
        <table class="networks-table">
          <thead><tr><th>Input Network</th><th>Range (First – Last)</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }
  resultEl.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', init);
