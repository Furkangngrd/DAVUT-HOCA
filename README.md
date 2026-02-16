# 🦁 GS Notlarım - Kişisel Not Uygulaması

Galatasaray renk temasıyla (kırmızı-sarı) tasarlanmış, **Firebase Firestore** destekli, **sürükle-bırak** özellikli modern kişisel not yönetim uygulaması.

---

## 🚀 Özellikler

| Özellik | Açıklama |
|---------|----------|
| 📝 **Not Oluşturma** | Başlık, içerik, renk ve öncelik seçerek not oluşturma |
| 📁 **Klasör Yapısı** | Notları klasörlere ayırıp organize etme |
| ✋ **Sürükle & Bırak** | Notları sürükleyerek klasörlere taşıma ve yeniden sıralama |
| 🔄 **Eş Zamanlı Çalışma** | İki sekmede açıldığında değişiklikler anında yansır |
| 🔍 **Arama** | Başlık ve içeriğe göre anlık arama |
| 🌙 **Koyu / Açık Tema** | Tema geçişi desteği |
| 🔥 **Firebase Desteği** | Firestore ile bulutta gerçek zamanlı senkronizasyon |
| 💾 **Çevrimdışı Çalışma** | Firebase olmadan localStorage ile çalışır |

---

## 🛠️ Kullanılan Teknolojiler

- **HTML5** — Sayfa yapısı
- **CSS3** — Galatasaray temalı tasarım, animasyonlar, responsive tasarım
- **JavaScript (Vanilla)** — Uygulama mantığı, sürükle-bırak, eş zamanlı senkronizasyon
- **Firebase Firestore (Opsiyonel)** — Bulut tabanlı gerçek zamanlı veritabanı

---

## 📂 Proje Yapısı

```
├── index.html      # Ana sayfa
├── style.css       # Galatasaray temalı tasarım
├── app.js          # Uygulama mantığı
└── .gitignore      # Git ayarları
```

---

## ⚡ Kurulum ve Çalıştırma

1. Projeyi klonlayın:
   ```bash
   git clone https://github.com/Furkangngrd/DAVUT-HOCA.git
   ```
2. `index.html` dosyasını tarayıcıda açın.
3. Hepsi bu kadar! 🎉

---

## 🔥 Firebase Yapılandırması (Opsiyonel)

Gerçek zamanlı bulut senkronizasyonu için `app.js` dosyasındaki `firebaseConfig` nesnesini doldurun:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

---

## ⌨️ Klavye Kısayolları

| Kısayol | İşlev |
|---------|-------|
| `Ctrl + N` | Yeni not oluştur |
| `Esc` | Modalı kapat |

---

## 📝 Proje Tanımı

Bu proje, kullanıcı dostu ve görsel açıdan zengin bir arayüzle kişisel notları yönetmeyi sağlayan, Firebase altyapısıyla gerçek zamanlı veri senkronizasyonu sunan, sürükle-bırak destekli modern bir web uygulamasıdır.

---

**Yapımcı:** Furkan Güngördü
