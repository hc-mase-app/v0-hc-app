# Panduan Mengganti Icon PWA HC App

## Ukuran Icon yang Dibutuhkan

1. **Icon 192x192px** (`public/icon-192.png`)
   - Digunakan untuk: App icon di home screen, notification icon
   - Format: PNG (recommended) atau JPG
   - Background: Transparan (PNG) atau solid color

2. **Icon 512x512px** (`public/icon-512.png`)
   - Digunakan untuk: Splash screen, app store listing
   - Format: PNG (recommended) atau JPG
   - Background: Transparan (PNG) atau solid color

## Cara Mengganti Icon

### Opsi 1: Upload Icon Anda Sendiri

1. Siapkan 2 file icon dengan ukuran yang tepat:
   - `icon-192.png` (192x192 pixels)
   - `icon-512.png` (512x512 pixels)

2. Replace file di folder `public`:
   \`\`\`
   public/icon-192.png
   public/icon-512.png
   \`\`\`

3. Deploy ulang ke Vercel

4. Clear cache browser atau uninstall & reinstall PWA

### Opsi 2: Generate Icon dari Logo

Jika Anda punya logo dalam format vector (SVG) atau high-res PNG:

1. Gunakan tool online untuk resize:
   - https://www.iloveimg.com/resize-image
   - https://www.resizepixel.com/
   - https://squoosh.app/

2. Export dalam 2 ukuran: 192x192 dan 512x512

3. Save sebagai PNG dengan nama:
   - `icon-192.png`
   - `icon-512.png`

4. Upload ke folder `public`

## Tips Design Icon

### Do's ✓
- Gunakan design simple dan jelas
- Pastikan icon terlihat baik dalam ukuran kecil
- Gunakan warna yang kontras
- Pertimbangkan safe area untuk maskable icons
- Test di berbagai background (light & dark)

### Don'ts ✗
- Jangan gunakan text yang terlalu kecil
- Hindari detail yang terlalu rumit
- Jangan gunakan foto dengan resolusi rendah
- Hindari icon yang terlalu mirip dengan app lain

## Safe Area untuk Maskable Icons

Maskable icons memiliki safe area di tengah (80% dari total ukuran):

\`\`\`
512x512 icon:
- Total area: 512x512px
- Safe area: 410x410px (centered)
- Padding: 51px dari setiap sisi
\`\`\`

Pastikan elemen penting icon Anda berada di dalam safe area.

## Setelah Mengganti Icon

1. **Deploy ke Vercel**
   \`\`\`bash
   git add .
   git commit -m "Update PWA icons"
   git push origin main
   \`\`\`

2. **Clear Cache di Android**
   - Buka Chrome Settings
   - Privacy and Security → Clear browsing data
   - Pilih "Cached images and files"
   - Clear data

3. **Reinstall PWA**
   - Uninstall PWA dari home screen
   - Buka website di Chrome
   - Install ulang PWA

4. **Verify**
   - Check icon di home screen
   - Check splash screen saat app dibuka
   - Check icon di app switcher

## Troubleshooting

### Icon tidak berubah setelah deploy?
- Clear browser cache
- Uninstall dan reinstall PWA
- Tunggu beberapa menit untuk CDN propagation

### Icon terlihat terpotong?
- Pastikan menggunakan safe area untuk maskable icons
- Tambahkan padding di sekitar icon

### Icon blur atau pixelated?
- Pastikan ukuran file sesuai (192x192 dan 512x512)
- Gunakan PNG dengan kualitas tinggi
- Jangan upscale dari ukuran kecil

## Contoh Icon yang Baik

Untuk aplikasi HR seperti HC App, pertimbangkan:
- Icon dengan inisial "HC" atau "HCA"
- Symbol yang merepresentasikan HR (people, organization chart)
- Warna corporate: Navy blue (#0f172a) dengan accent color
- Design minimalis dan professional

## Tools Recommended

1. **Figma** - Design icon dari scratch
2. **Canva** - Template icon siap pakai
3. **Squoosh** - Optimize dan resize image
4. **PWA Asset Generator** - Generate semua ukuran icon sekaligus
   - https://www.pwabuilder.com/imageGenerator

## Format File

Saat ini manifest menggunakan PNG:
\`\`\`json
{
  "src": "/icon-192.png",
  "sizes": "192x192",
  "type": "image/png"
}
\`\`\`

Jika Anda ingin menggunakan JPG, ubah:
- File extension: `.png` → `.jpg`
- MIME type: `"image/png"` → `"image/jpeg"`
