# running config

**🌐 Live:** [theblues25.github.io/running-config](https://theblues25.github.io/running-config/)

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)

บล็อกเก็บเรื่อง network และ telecom ที่อธิบายง่าย ๆ ด้วย animation — เว็บ static ล้วน ๆ ไม่มี backend
A personal blog explaining networking and telecom concepts with interactive animations — fully static, no backend.

---

## ภาษาไทย

### เกี่ยวกับโปรเจกต์

บล็อกที่เขียนไว้อ่านเองเป็นหลัก อธิบายแนวคิดเครือข่ายและโทรคมนาคมตั้งแต่พื้นฐาน (SyncE, PTP, MPLS, BGP, QoS, 5G ฯลฯ) ด้วยแอนิเมชันที่ทำให้กลไกที่มองไม่เห็นกลายเป็นภาพจริง เนื้อหาเป็นภาษาไทย เน้นเข้าใจง่าย ไม่ต้องมีพื้นฐานมาก่อน

### โครงสร้างโปรเจกต์

```
running-config/
  index.html          — หน้าแรก: รายการโพสต์ทั้งหมด
  style.css            — ดีไซน์ระบบกลางของทั้งเว็บ (ใช้ร่วมกันทุกหน้า)
  posts/
    syncE-and-ptp.html — โพสต์แรก: SyncE และ PTP profile
```

### เขียนโพสต์ใหม่

1. คัดลอก `posts/syncE-and-ptp.html` เป็น template ตั้งชื่อไฟล์ใหม่
2. แก้เนื้อหาในไฟล์ ใช้ class เดิมจาก `style.css` (`.stage` สำหรับกรอบ canvas, `.callout` สำหรับกล่องเน้นข้อความ, `.trio`/`.points`/`.table-wrap` ฯลฯ)
3. เพิ่ม `<li><a class="post-card" href="posts/ไฟล์ใหม่.html">...</a></li>` ใน `index.html`

### Tech Stack

- HTML5 / CSS3 / Vanilla JavaScript (ES2020+) — ไม่มี build step, ไม่มี framework
- Canvas 2D + inline SVG สำหรับแอนิเมชัน
- Google Fonts (Chakra Petch, Sarabun, JetBrains Mono)
- Deploy บน [GitHub Pages](https://pages.github.com/) (ฟรี)

### การ Deploy

โปรเจกต์นี้เป็น static site ไม่ต้องการ build step หรือ dependencies ใดๆ

1. Fork หรือ clone repository นี้
2. เปิด GitHub Pages ใน repo settings โดยตั้ง source เป็น branch `main`, path `/`
3. Deploy ได้เลย

---

## English

### About

A personal blog explaining networking and telecom concepts — SyncE, PTP, MPLS, BGP, QoS, 5G, and more — through interactive canvas/SVG animations that make invisible mechanisms visible. Written primarily as a personal reference, in Thai, aimed at complete beginners.

### Project Structure

```
running-config/
  index.html          — home page: post listing
  style.css            — shared design system used across every page
  posts/
    syncE-and-ptp.html — first post: SyncE and PTP profiles
```

### Writing a New Post

1. Copy `posts/syncE-and-ptp.html` as a template and rename it
2. Edit the content, reusing the shared classes from `style.css` (`.stage` for canvas frames, `.callout` for highlighted boxes, `.trio`/`.points`/`.table-wrap`, etc.)
3. Add a `<li><a class="post-card" href="posts/new-file.html">...</a></li>` entry to `index.html`

### Tech Stack

- HTML5 / CSS3 / Vanilla JavaScript (ES2020+) — no build step, no framework
- Canvas 2D + inline SVG for animations
- Google Fonts (Chakra Petch, Sarabun, JetBrains Mono)
- Deployed on [GitHub Pages](https://pages.github.com/) (free)

### Deployment

This is a pure static site — no build step or dependencies required.

1. Fork or clone this repository
2. Enable GitHub Pages in repo settings, source = `main` branch, path `/`
3. Deploy

---

## License

[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) — Free to use and fork with credit. Commercial use prohibited.

Created by Thananchai Panyaravahirun
