# MentorKlubb – alkalmazásprojekt, 1. lépés

Ez **teljes forrásprojekt**, nem előre lefordított Windows `.exe` vagy Android `.apk`.
A kiindulási alap a MentorKlubb Expedíció **v4.0**; az összes tananyag és kép a `web/` mappában van.

## Mit tartalmaz?
- `web/` – az eredeti főoldal, tananyagok, AI-ZH, 16 angollecke, Expedíció.
- `src-tauri/` – Tauri 2 Windows/Android natív alkalmazáskonfiguráció.
- `src-tauri/icons/` – appikonok.
- `MentorKlubb_Adattar.html` – változatlan nevű közös profilkezelő belépési pont.
- `MentorKlubb_Nativ_Profil.js` – natív profilmentés az alkalmazás adatkönyvtárába, a böngészős localStorage mellett.

## Miért nincs még EXE / APK a ZIP-ben?
Ebben a környezetben nincs telepítve a Windows buildhez szükséges Rust és MSVC,
sem az Android SDK/NDK. Emiatt a végleges binárisokat itt **nem fordítottam le**.
A forrásfájlok, a JSON-konfigurációk, az ikonok és a JavaScript szintaktikai
ellenőrzése elkészült; a natív eszközökkel futó teszt a következő lépés.

## 1. Windows környezet előkészítése
Telepítsd a következőket a saját gépeden:
1. **Node.js LTS**: https://nodejs.org/
2. **Rust**: https://rustup.rs/ – Windows alatt a telepítő felkínálja a C++ eszközök telepítését.
3. **Microsoft Visual Studio Build Tools 2022**: a *Desktop development with C++* workload.
4. **WebView2 Runtime**: Windows 11-en jellemzően már telepítve van.

A telepítések után **új PowerShellt** nyiss a projektmappában, és ellenőrizd:

```powershell
node --version
npm --version
rustc --version
cargo --version
```

## 2. Első alkalmazásindítás Windows alatt

```powershell
npm install
npm run start
```

A külön MentorKlubb-ablaknak kell megjelennie. A hagyományos weboldal nem íródik felül.

## 3. Windows-telepítő készítése (következő fázis)

```powershell
npm run build:windows
```

A kimenet `src-tauri/target/release/bundle/` alá kerül. A pontos kiterjesztés
és csomagformátum a telepítő-beállításoktól függ.

## 4. Android előkészítése (következő fázis)
Telepítsd az Android Studiót: https://developer.android.com/studio
A Tauri Android SDK, Build-Tools, Platform-Tools, Command-line Tools és NDK elemeket kér.
A `JAVA_HOME`, `ANDROID_HOME`, `NDK_HOME` beállítása és Rust Android targetek
telepítése után:

```powershell
npm run init:android
npm run start:android
```

A fejlesztői, telefonon telepíthető és a végleges Android build **nem ugyanaz**.
A kiadáshoz később állandó aláírási kulcs kell, amit nem szabad elveszíteni.

## FONTOS: régi streak, Szikra és Relikvia
A korábbi böngésző mentése **nem kerül át automatikusan** a natív alkalmazásba.
1. A jelenlegi MentorKlubb Expedíció weboldalon készíts **profilbiztonsági mentést** (`.json`).
2. Tartsd meg ezt a fájlt.
3. A natív alkalmazás első indítása után az Expedíció felületén válaszd a
   **Mentés visszatöltése** műveletet.
4. Ellenőrizd a streak, XP, Szikra és Relikvia értékeit.
5. Új verzió telepítésekor ne változtasd meg a Tauri alkalmazásazonosítót:
   `hu.mentorklubb.expedicio`.

**Profilmentés az alkalmazás mappáján kívül:** a natív réteg a játékosprofilt
`expedicio_profile_v1.json` néven az alkalmazás saját adatkönyvtárába tükrözi.
Egy új telepítő így nem a telepítés alá ment. A HTML-oldalak további `localStorage`
adatait a következő migrációs fázisban kezeljük; ezért addig a régi mentéseket
külön is őrizd meg. Mindig készíts külön exportot frissítés előtt.

## Tartalomfrissítések
Az új leckéket később egy alkalmazáson belüli csomagimporttal szeretnénk kezelni.
**Az első fázisban ez még nincs kész:** az app telepítőjében található `web/`
statikus fájlok cseréjéhez új alkalmazás-build szükséges.

## Hibakeresés
Ha a fejlődés nem látszik a natív appban, először **ne kezdj új profilt farmolni**,
hanem használd az eredeti mentés visszatöltését. A natív appba való átállás
és két eszköz szinkronizálása külön feladat; Windows és Android profilja
jelenleg külön-külön tárolódik.
