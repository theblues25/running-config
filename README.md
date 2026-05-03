# IP Subnet Calculator

**🌐 Live Demo:** [ip-subnet-calculator-dc0q.onrender.com](https://ip-subnet-calculator-dc0q.onrender.com/)

เครื่องคำนวณ Subnet สำหรับ IPv4 และ IPv6 แบบ client-side ทำงานได้ทันทีโดยไม่ต้องส่งข้อมูลไปยัง server
A fully client-side IPv4 and IPv6 subnet calculator — instant results, no data sent to any server.

---

## ภาษาไทย

### เกี่ยวกับโปรเจกต์

เครื่องมือคำนวณ Subnet แบบออนไลน์ที่รองรับทั้ง IPv4 และ IPv6 พัฒนาด้วย HTML, CSS และ JavaScript ล้วนๆ ไม่มี backend ไม่มี framework ทำงานได้ทันทีในเบราว์เซอร์

### ฟีเจอร์หลัก

**IPv4**
- คำนวณ Network Address, Broadcast Address, Usable Host Range
- แสดง Subnet Mask, Wildcard Mask, CIDR Notation
- แสดง IP Class (A/B/C/D/E) และ IP Type (Public/Private/Loopback ฯลฯ)
- แสดง Short Notation, in-addr.arpa, IPv4-Mapped Address, 6to4 Prefix
- แสดงตาราง subnet ทั้งหมดใน containing network (/8, /16, /24)
- **Binary Representation** — visualize network/host bits แบบ color-coded
- ลิงก์ WHOIS สำหรับ Public IP

**IPv6**
- คำนวณ Network, Full Address, IP Range, Total Addresses, IP Type
- **Hex Representation** — แสดง nibble-level network/host coloring
- **Address Structure** — แสดงโครงสร้าง Global Routing Prefix / Subnet ID / Interface ID
- **EUI-64 Generator** — สร้าง SLAAC address จาก MAC address (สำหรับ prefix ≤ /64)
- ลิงก์ WHOIS สำหรับ Global Unicast IP

**Other Tools**
- 🔍 **Compare Two IPs** — เปรียบเทียบ 2 IP (IPv4/IPv6): same network, overlap, containment
- ✂️ **Subnet Splitter** — แบ่ง network ออกเป็น subnet ย่อย (IPv4/IPv6, max 1,024 subnets)
- 📊 **Route Summary** — หา aggregate route ที่ครอบคลุม network หลายอัน (IPv4/IPv6)

**ทั่วไป**
- Export ผลลัพธ์เป็น Excel (.xlsx)
- Copy ค่าด้วย single click
- Dark / Light theme
- รองรับ URL parameter: `?ip=192.168.1.1/24`

### รูปแบบ Input ที่รองรับ

```
192.168.1.1/24
192.168.1.1 255.255.255.0
2001:db8::1/48
```

### Tech Stack

- HTML5 / CSS3 / Vanilla JavaScript (ES2020+)
- [SheetJS](https://sheetjs.com/) สำหรับ Excel export
- Google Fonts (Inter, JetBrains Mono)
- Deploy บน [Render](https://render.com) Static Site (ฟรี)

### การ Deploy

โปรเจกต์นี้เป็น static site ไม่ต้องการ build step หรือ dependencies ใดๆ

1. Fork หรือ clone repository นี้
2. สร้าง Static Site บน Render (หรือ GitHub Pages, Netlify, Cloudflare Pages)
3. ตั้ง **Publish Directory** เป็น `.` (root)
4. Deploy ได้เลย

---

## English

### About

A fully client-side IP subnet calculator supporting both IPv4 and IPv6. Built with plain HTML, CSS, and JavaScript — no backend, no framework, instant results directly in the browser.

### Features

**IPv4 Calculator**
- Network Address, Broadcast Address, Usable Host Range
- Subnet Mask, Wildcard Mask, CIDR Notation
- IP Class (A/B/C/D/E) and IP Type (Public/Private/Loopback/Link-local/Multicast/Reserved)
- Short Notation, in-addr.arpa, IPv4-Mapped Address, 6to4 Prefix
- All subnets table within the containing /8, /16, or /24 block
- **Binary Representation** — color-coded network and host bits visualization
- WHOIS link for Public IPs

**IPv6 Calculator**
- Network, Full Address, IP Range, Total Addresses, IP Type
- **Hex Representation** — nibble-level color-coded network/host visualization
- **Address Structure** — Global Routing Prefix / Subnet ID / Interface ID breakdown
- **EUI-64 Generator** — generate SLAAC address from a MAC address (prefix ≤ /64)
- WHOIS link for Global Unicast IPs

**Other Tools**
- 🔍 **Compare Two IPs** — compare any two IPs (IPv4/IPv6): same network, range overlap, containment check
- ✂️ **Subnet Splitter** — split a network into smaller subnets (IPv4/IPv6, up to 1,024 subnets)
- 📊 **Route Summary** — find the smallest aggregate route covering multiple networks (IPv4/IPv6)

**General**
- Export results to Excel (.xlsx)
- One-click copy for any value
- Dark / Light theme toggle
- URL parameter support: `?ip=192.168.1.1/24`
- Pure client-side — no data ever leaves your browser

### Supported Input Formats

```
192.168.1.1/24
192.168.1.1 255.255.255.0
2001:db8::1/48
```

### Tech Stack

- HTML5 / CSS3 / Vanilla JavaScript (ES2020+)
- [SheetJS](https://sheetjs.com/) for Excel export
- Google Fonts (Inter, JetBrains Mono)
- Deployed on [Render](https://render.com) Static Site (free tier)

### Deployment

This is a pure static site — no build step or dependencies required.

1. Fork or clone this repository
2. Create a Static Site on Render (or GitHub Pages, Netlify, Cloudflare Pages)
3. Set **Publish Directory** to `.` (root)
4. Deploy

### Limits

| Tool | Limit |
|------|-------|
| Subnet Splitter | Max 1,024 subnets displayed |
| Route Summary | No limit on inputs |
| Compare | IPv4 and IPv6 only (not mixed) |

---

Created by Thananchai
