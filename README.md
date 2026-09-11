# Farketmez — Kapsamlı Ürün & Teknik Geliştirme Planı Gerçekleştirmesi 🎯

> **"Karar vermek zorunda kalma, Farketmez senin yerine karar versin — ama sana göre."**

Farketmez, günlük hayattaki *"ne yesek"*, *"ne yapsak"*, *"nereye gitsek"* sorularının yol açtığı **karar yorgunluğunu (decision fatigue)** tamamen ortadan kaldıran akıllı karar-asistanı uygulamasıdır.

---

## 🌟 Güncellenmiş Temel Özellikler & Mimari

### 1. 🎯 Tek Net Öneri Modeli (Single Clear Recommendation)
* Kullanıcıyı veya grubu birden fazla alternatifle yormaz; tek bir net ve gerekçelendirilmiş öneri sunar.
* **Düşük Sürtünmeli Red Akışı (Low-Friction Reject Flow):**
  * Kullanıcı öneriyi reddettiğinde tek tıkla 4 sebep etiketinden birini seçer:
    1. *"Daha önce denedim / gittim"* ➔ Cooldown / Çeşitlilik motorunu besler (Kalıcı profile yakın).
    2. *"Bütçeme uygun değil"* ➔ O oturuma özel bütçe filtresi (Bağlamsal).
    3. *"Şu an canım bu tarz istemiyor"* ➔ O günkü kategori bağlamı / DailyContext (Sadece o gün).
    4. *"Uzak / zaman uymuyor"* ➔ Mesafe-süre filtresi (O oturum).
* **Circuit Breaker (Karar Döngüsü Kırıcı):** 2-3 kez üst üste red gelirse sistem geniş/kaba bir yön sorusu sorar (*"Bugün dışarıda hareketli mi 🏃‍♂️, içeride sakin mi ☕?"*) ve sonsuz red döngüsünü engeller.

### 2. ⚖️ Grup Eşleştirme & Adalet (Fairness) Mekanizması
* **Minimum Regret & Max-Min Fairness:** Gruptaki her üyenin geçmiş grup oturumlarındaki tatminiyet skorunu (`GroupFairnessScore`) takip eder.
* Geçmiş oturumlarda tarzına daha az denk gelmiş olan üyenin ağırlığı bu seferki hesaplamada otomatik olarak artırılır.
* **Şeffaf Adalet Rozeti:** *"⚖️ Bu öneri özellikle Selin'in tercihlerine göre ağırlıklandırıldı (son 2 oturumda daha az kendi tarzına denk gelmişti)."*
* **Canlı Socket.io Oylama:** Üyeler *"Kabul 👍"*, *"Farketmez 🤷"* veya *"İtiraz 👎"* oyu vererek tek tıkla ortak mutabakata varır.

### 3. 💑 Çift (Sevgili) Modu & Sürpriz Modu
* **Veri Mahremiyeti ve İzolasyon:** Çift aktiviteleri arkadaş grubu eşleştirmelerine sızmaz, bağımsız bir bağlam olarak korunur.
* **Rutin Kırma Tespiti (Proaktif):** Son 1 ayda 3 kez aynı mutfağa/mekana gidildiyse proaktif uyarı verir (*"Son 1 ayda 3 kez İtalyan'a gittiniz, bu akşam Seramik Atölyesi deneyelim mi?"*).
* **Sürpriz Modu (`SurpriseAffinity`):** Planlayıcı gizli plan hazırlar; alıcıya sadece *"Cuma 19:30'da hazır ol! 🤫"* gibi minimal ipucu gider. Geri bildirimler normal tercihlerden ayrı olan `SurpriseAffinity` modelinde öğrenilir.
* **Karar Dengesi & Manuel Override:** *"💖 Bu Sefer Sen Seç"* veya *"🎯 Ben Seçeyim"* butonları kullanıldığında bu fedakarlık otomatik dengeleme adalet hesabını bozmaz.
* **Özel Gün Havuzu:** Yıldönümü / doğum günlerinde cooldown kuralları gevşetilir, romantik ve özel mekan havuzu devreye girer.
* **Ortak Denenecekler Listesi (Shared Wishlist):** Çiftin birlikte gitmek istediği yerler kaydedilir ve önerilerde önceliklendirilir.

### 4. 🧠 İki Katmanlı Profil & Zımni Öğrenme (Implicit Learning)
* **Kısa Onboarding (5 Çekirdek Eksen):** Keşif Eğilimi, Spontanlık, Sosyallik/Enerji, Bütçe Esnekliği ve Demografi.
* **İki Katmanlı Veri Modeli:**
  1. *Kalıcı Profil (Long-Term):* Kabul/red kararlarından zamanla öğrenilen `preferenceWeights` katsayıları.
  2. *Günlük Bağlam (DailyContext / Sadece Bugün):* O günkü anlık istekler, engellenen kategoriler.

---

## 🚀 Çalıştırma

Proje kök dizininde:
```bash
npm run dev
```

* **Frontend:** [http://localhost:5173](http://localhost:5173)
* **Backend API:** [http://localhost:3001](http://localhost:3001)

### Demo Profilleri:
* **Can:** Yüksek enerji, burger & arcade tutkunu.
* **Zeynep:** Vejetaryen, İtalyan mutfağı & seramik meraklısı.
* **Mert:** Kebap & açık hava sporları seven dışadönük profil.
* **Selin:** Sakin, ev yemekleri & kültür-sanat sever (Adalet motorunda önceliklendirilen üye).
