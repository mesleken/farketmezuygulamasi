# Farketmez — Kapsamlı Ürün & Teknik Geliştirme Planı

## 1. Ürünün Amacı ve Değer Önerisi

**Problem:** İnsanlar günlük hayatta sürekli "ne yesek", "ne yapsak", "nereye gitsek" sorularıyla karşı karşıya kalıyor ve çoğu zaman "farketmez" diyerek kararı başkasına bırakıyor. Bu hem karar yorgunluğu (decision fatigue) yaratıyor hem de gruplarda zaman kaybına ve tartışmaya yol açıyor.

**Çözüm:** Farketmez, kullanıcının geçmiş tercihlerini, alışkanlıklarını ve karakterini öğrenen; tek başına veya bir grup içinde olduğunda o an için en uygun öneriyi (yemek, aktivite, mekân) otomatik olarak sunan bir karar-asistanı uygulamasıdır. Kullanıcı adına "seçim yapar", tekrar eden önerilerden kaçınır ve grup içindeki herkesin profiliyle uyumlu ortak bir öneri üretir.

**Değer Önerisi (tek cümle):** "Karar vermek zorunda kalma, Farketmez senin yerine karar versin — ama sana göre."

## 2. Hedef Kitle

- Arkadaş grupları / öğrenci toplulukları (sık sık "bu akşam ne yapsak" konuşması yapan gruplar)
- Uzun süreli çiftler (rutine giren, "yine mi burası" diyen çiftler)
- Bireysel kullanıcılar (kendi kararsızlığını çözmek isteyenler)
- İkincil kitle: yerel işletmeler (restoran, halısaha, kafe, aktivite mekânları) — uzun vadede reklam/öne çıkarma geliri için

## 3. Temel Özellikler (Feature Set)

### 3.1 Kullanıcı Profili
- Demografik bilgiler (yaş, konum, bütçe aralığı)
- Karakter/kişilik anketi (onboarding sırasında): enerji seviyesi (sakin/hareketli), sosyallik, macera eğilimi, yemek tercihleri (mutfak türleri, alerjiler, vegan/vejetaryen vb.), aktivite tercihleri (spor, kültür-sanat, ev aktiviteleri, gece hayatı)
- Zımni (implicit) öğrenme: kullanıcının geçmişte kabul ettiği/reddettiği önerilerden çıkarılan tercih ağırlıkları
- Zamana göre tercihler (hafta içi vs hafta sonu, öğle vs akşam)

### 3.2 Aktivite Geçmişi (Activity Log)
- Her kullanıcı için günlük aktivite kaydı: ne yenildi, nereye gidildi, ne yapıldı, kiminle
- Kayıt kaynakları: uygulama içi manuel onay/checkin, öneri kabul edildiğinde otomatik kayıt, isteğe bağlı entegrasyonlar (takvim, konum geçmişi)
- "Soğuma süresi" (cooldown) mantığı: aynı kategori/mekân belirli bir süre boyunca tekrar önerilmez (örn. burger → 3 gün, halısaha → 2 gün; kategoriye göre ayarlanabilir varsayılan süreler + kullanıcı override)

### 3.3 Grup Eşleştirme (Group Matching)
- Kullanıcılar bir "oturum" (session) başlatıp arkadaşlarını davet eder (grup kurma)
- Her katılımcının profil verisi + güncel bağlam (konum, saat, bütçe, o anki ruh hali — opsiyonel hızlı soru) toplanır
- Eşleştirme motoru, grubun ortak paydasını bulacak şekilde skor hesaplar ve tek bir öneri (veya 2-3 alternatif) sunar
- Herkesin geçmişinde yakın zamanda tekrar etmemiş olan seçenekler önceliklendirilir
- Anlaşmazlık durumunda "oylama" veya "en az itiraz" (minimum regret) modeli devreye girer

### 3.4 Lokasyon Bazlı Öneri
- Kullanıcının/grubun anlık konumuna göre yakın mekân/aktivite havuzundan filtreleme
- Harita/mekân verisi için üçüncü parti API (Google Places, Foursquare vb.) entegrasyonu
- Mesafe, ulaşım süresi, açık/kapalı olma durumu gibi filtreler

### 3.5 Çift (Sevgili) Modu
- Ayrı, daha "kişisel" bir arayüz teması
- İki kişilik özel geçmiş (örn. "ilk buluşma yeri", özel günler, yıldönümü hatırlatmaları)
- Rutine girmeyi önleme odaklı öneriler (örn. "son 1 ayda 3 kez aynı restorana gittiniz, farklı bir şey deneyelim mi?")
- Sürpriz/romantik aktivite önerileri, bütçe ve mahremiyet tercihine göre filtreleme

### 3.6 Bildirimler ve Etkileşim
- Push bildirim: "Bu akşam ne yapsak?" sorusuna proaktif öneri
- Gruba katılım daveti bildirimleri
- Geri bildirim döngüsü: öneri sonrası "beğendin mi?" (beğenme/beğenmeme öğrenme sinyali olarak kullanılır)

## 4. Kullanıcı Akışları (Core User Flows)

1. **Onboarding:** Kayıt → kişilik/tercih anketi → konum izni → ilk profil oluşumu
2. **Bireysel öneri:** Ana ekranda "Bugün ne yapsam?" butonu → bağlam soruları (opsiyonel) → tekil öneri
3. **Grup oturumu:** Oturum başlat → arkadaş davet et (link/QR/uygulama içi arama) → herkes katılınca eşleştirme çalışır → ortak öneri gösterilir → oylama/onay → aktivite geçmişine otomatik kayıt
4. **Çift modu:** Partnerle eşleşme (karşılıklı onay) → çift profiline geçiş → özel öneri akışı

## 5. Öneri Motoru — Mantık Detayı

Öneri motoru üç katmandan oluşur:

1. **Aday Havuzu Oluşturma (Candidate Generation):** Konum + kategori filtreleriyle geniş bir aday listesi çıkarılır (örn. yakındaki 50 restoran/aktivite).
2. **Skorlama (Scoring):** Her aday için, gruptaki her kullanıcının profil ağırlıkları ile bir uyum skoru hesaplanır; bireysel skorlar bir araya getirilerek (örn. ağırlıklı ortalama veya minimum-tatminsizlik modeli) grup skoru elde edilir.
3. **Filtreleme ve Çeşitlilik (Cooldown & Diversity):** Yakın zamanda tekrar edilen kategoriler/mekânlar elenir veya skoru düşürülür; kalan adaylar sıralanarak en iyi 1-3 öneri sunulur.

**Öğrenme mekanizması:** Başlangıçta kural/ağırlık tabanlı basit bir sistem (rule-based scoring) ile başlanması, MVP için yeterli ve açıklanabilir olacaktır. Kullanıcı sayısı ve veri arttıkça, tercih ağırlıklarını otomatik güncelleyen hafif bir öğrenme modeli (örn. collaborative filtering veya basit bir bandit/öneri algoritması) eklenebilir. Baştan karmaşık bir ML sistemine yatırım yapmak yerine, veri biriktikçe kademeli geçiş önerilir.

## 6. Sistem Mimarisi

```
┌─────────────────────────────┐
│   Mobil Uygulama (Client)   │
│  iOS / Android (tek kod tabanı) │
└───────────────┬─────────────┘
                │ REST/GraphQL (HTTPS)
┌───────────────▼─────────────┐
│         API Gateway         │
└───────────────┬─────────────┘
                │
   ┌────────────┼─────────────────────┬───────────────────┐
   │            │                     │                   │
┌──▼───┐   ┌────▼─────┐        ┌──────▼──────┐      ┌─────▼──────┐
│ Auth │   │ Profil &  │        │ Öneri Motoru │      │ Grup/Eşleştirme│
│Servisi│   │ Aktivite  │        │ (Recommendation)│  │ Servisi     │
└──────┘   │ Servisi   │        └──────┬──────┘      └─────┬──────┘
           └────┬─────┘               │                    │
                │                     │                    │
        ┌───────▼─────────────────────▼────────────────────▼───────┐
        │                     Veritabanı Katmanı                    │
        │  PostgreSQL (ilişkisel veri) + Redis (cache/oturum)        │
        └──────────────────────────┬──────────────────────────────┘
                                   │
                    ┌──────────────▼───────────────┐
                    │  Üçüncü Parti Entegrasyonlar   │
                    │  Google Places / Maps API,     │
                    │  Push Notification (FCM/APNs)  │
                    └────────────────────────────────┘
```

Mimari, başlangıçta **modüler monolit** (tek deployment birimi ama net iç modül sınırları) olarak kurulmalıdır. Kullanıcı sayısı büyüdükçe (özellikle Öneri Motoru ve Grup/Eşleştirme servisleri yoğun hesaplama gerektirirse) bu modüller bağımsız servislere (mikroservis) ayrılabilir. MVP aşamasında mikroservis mimarisine baştan gitmek gereksiz karmaşıklık ve operasyonel yük getirir.

## 7. Teknoloji Yığını (Tech Stack) Önerisi

| Katman | Öneri | Gerekçe |
|---|---|---|
| Mobil İstemci | React Native (veya Flutter) | Tek kod tabanıyla hem iOS hem Android; hızlı MVP geliştirme |
| Backend | Node.js (NestJS) veya Python (FastAPI) | Hızlı geliştirme, güçlü ekosistem, REST/GraphQL desteği |
| Veritabanı | PostgreSQL | İlişkisel veri (kullanıcı, grup, aktivite geçmişi) için uygun, JSONB ile esnek profil verisi de saklanabilir |
| Cache / Oturum | Redis | Grup oturumları, gerçek zamanlı eşleştirme durumu, hız |
| Konum/Mekân Verisi | Google Places API / Foursquare Places API | Hazır, güvenilir mekân veritabanı |
| Bildirimler | Firebase Cloud Messaging (FCM) + APNs | Çapraz platform push bildirim |
| Kimlik Doğrulama | Firebase Auth veya Auth0 | Hazır, güvenli, sosyal medya girişi desteği |
| Barındırma | AWS / GCP (konteynerize, örn. ECS/Cloud Run) | Ölçeklenebilir, yönetilebilir |
| Analitik | Amplitude / Mixpanel | Kullanıcı davranışı ve öneri kabul oranlarını izlemek için |

## 8. Veri Modeli (Basitleştirilmiş Şema)

- **User**: id, isim, yaş, konum, bütçe_aralığı, kişilik_vektörü (JSON), oluşturulma_tarihi
- **ActivityLog**: id, user_id, kategori, mekân/aktivite_adı, konum, tarih, grup_id (nullable), beğenildi_mi (boolean/rating)
- **Group (Session)**: id, oluşturan_user_id, üye_listesi, durum (aktif/tamamlandı), oluşturulma_tarihi
- **CoupleProfile**: id, user_id_1, user_id_2, ortak_geçmiş, özel_tarihler
- **Venue/ActivityCandidate**: id, dış_api_referans_id, kategori, konum, ortalama_bütçe, özellikler
- **PreferenceWeight**: user_id, kategori, ağırlık (öğrenilen tercih skoru)

## 9. Yol Haritası / MVP Kapsamı

**Faz 1 — MVP (Bireysel + Basit Grup)**
- Kullanıcı kaydı, onboarding anketi, temel profil
- Bireysel öneri (konum + kategori bazlı, basit kural tabanlı skor)
- Manuel aktivite kaydı ve cooldown mantığı
- Basit grup oturumu (2-6 kişi, ortak öneri)

**Faz 2 — Öğrenme ve Çift Modu**
- Geri bildirim döngüsüyle tercih ağırlıklarının otomatik güncellenmesi
- Çift modu arayüzü ve özel akışlar
- Push bildirimler, hatırlatmalar

**Faz 3 — Ölçekleme ve Zenginleştirme**
- Gelişmiş eşleştirme algoritması (daha fazla değişken: hava durumu, bütçe, ruh hali)
- Yerel işletme paneli / sponsorlu öneriler (gelir modeli)
- Sosyal özellikler (arkadaş önerileri, ortak geçmiş istatistikleri, "yıl sonu özeti" gibi)

## 10. Riskler ve Dikkat Edilmesi Gerekenler

- **Soğuk başlangıç (cold start):** Yeni kullanıcı için yeterli veri olmadan iyi öneri yapmak zor — onboarding anketinin kalitesi kritik.
- **Mekân verisi kalitesi/maliyeti:** Google Places gibi API'ler yüksek kullanımda maliyetli olabilir; kota ve fiyatlandırma erken planlanmalı.
- **Grup içi anlaşmazlık:** Herkesi memnun eden tek öneri her zaman mümkün olmayabilir; "en az itiraz" ve alternatif sunma mekanizması önemli.
- **Gizlilik:** Konum ve kişisel alışkanlık verisi hassas olduğundan KVKK/GDPR uyumluluğu ve açık rıza akışları baştan tasarlanmalı.
- **Kullanıcı bağlılığı:** Öneri kalitesi düşükse kullanıcılar hızlıca uygulamayı terk edebilir; ilk birkaç öneri deneyiminin kalitesi çok önemli.

## 11. Sonraki Somut Adımlar

1. Onboarding anketinin sorularını netleştirmek (hangi kişilik/tercih boyutları ölçülecek)
2. Basit bir kural tabanlı skorlama modeliyle bir prototip (tek kullanıcı, tek kategori — örn. sadece "yemek") çıkarmak
3. 5-10 kişilik küçük bir arkadaş grubuyla manuel/yarı-otomatik test (Google Form + Sheets ile bile simüle edilebilir) yaparak eşleştirme mantığını doğrulamak
4. Doğrulanan mantığı React Native + basit backend ile gerçek MVP'ye taşımak
