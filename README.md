# Kurd Drop

یارییەکی React + TypeScript بە Leaflet map بۆ دۆزینەوەی درۆپ لەسەر نەخشەی هەولێر.

## پێویستییەکان

- [Node.js](https://nodejs.org/) (وەشانی 18 یان زیاتر)
- npm

## دامەزراندن

```bash
npm install
```

## جێبەجێکردن

```bash
npm run dev
```

پاشان لە وێبگەڕەکەتدا بکەرەوە: [http://localhost:5173](http://localhost:5173)

## Build

```bash
npm run build
npm run preview
```

## پاکێجەکان

- **react** / **react-dom** — UI
- **leaflet** — نەخشەی کارلێک
- **vite** — build tool

## پێکهاتەی فایلەکان

```
src/
  App.tsx          — کۆدی سەرەکی یارییەکە
  main.tsx         — entry point
  imports/         — وێنە و SVG icons
public/
  vite.svg
```

## تێبینی

- بۆ GPS لەسەر مۆبایل، HTTPS یان localhost پێویستە.
- Material Icons لە Google Fonts CDN بار دەکرێت.
- فۆنتی NRT لە CDN بار دەکرێت (لە CSS ـی App.tsx).
