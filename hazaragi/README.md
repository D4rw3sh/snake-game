# گنجینهٔ شعرِ هزارگی – Hazaragi-Gedichte

Eine Webseite zum Lesen von Hazaragi-Gedichten (Dari/Hazaragi, von rechts nach links).

**Öffnen:** einfach `index.html` im Browser öffnen – keine Installation nötig, alle Schriften liegen lokal in `fonts/`.

## Funktionen
- **59 Gedichte** in 11 Kategorien (u. a. Liebe, Heimat, Arbeit & Alltag, Kindheit & Spiele, Hochzeit & Feste, Dambura, Exil, Wiegenlieder, Trauer, Natur, Weisheit), darunter lange Versdichtungen (منظومه) wie „یک روزِ قشلاق“
- Filter **„از زبانِ“** – Gedichte aus verschiedenen Perspektiven: Mutter, Vater, Kind, Tochter, Braut, Hirte, Großvater, Migrant in Deutschland …
- Suche (ignoriert Vokalzeichen), Filter nach Kategorie, Favoriten (★)
- Lese-Ansicht wie eine alte Handschrift: Verse als Beyt in zwei Halbversen, Schrift umschaltbar
  (نستعلیق = Kalligrafie-„Qalam“, نسخ, ساده), Schriftgröße, Kopieren, Vor/Zurück (auch mit Pfeiltasten)
- „Vers des Tages“, Zufallsgedicht, Tag/Nacht-Modus, Galerie, kleines Hazaragi-Wörterbuch
- Direktlink zu einem Gedicht: `index.html#poem-bamyan`

## Kulturseiten (jede verlinkt passende Gedichte)
- `#zendagi` – Tagesablauf im Dorf (Melken, Schule in zwei Schichten, Hüten, Gras holen, Feldarbeit), vier Jahreszeiten, Essen
- `#bazi` – Spiele (Dande-Kelak, Bujul, Tushla, Panj-Sang, Eierkampf, Drachen) und Handwerk (Barak, Stickerei, Dambura)
- `#rasm` – Hochzeit Schritt für Schritt (Khwastgari bis Paywazi), Nowruz, Eid, Muharram, Ashar
- `#lebas` – Hazara-Kleidung für Frauen und Männer nach Quellen
- `#mashahir` – bekannte Persönlichkeiten und warum sie wichtig sind
- `#tarikh` – Zeitleiste, Perspektiven (Frauen, Kinder, Bauern, Ältere, Migranten, innere Vielfalt) und Quellenliste

## Struktur
```
index.html        Seite
css/style.css     Design (Pergament, Lapislazuli, Gold)
js/poems.js       ← Gedichte, Kategorien, Wörterbuch, Galerie (hier ergänzen!)
js/culture.js     ← Alltag, Spiele, Hochzeit, Kleidung, Persönlichkeiten, Geschichte, Quellen
js/app.js         Logik
fonts/            Noto Nastaliq Urdu, Amiri, Vazirmatn (SIL Open Font License)
Bilder/           Illustrationen (siehe Bilder/README.md)
```

## Hinweis zu den Texten
Die Gedichte sind **Beispieltexte im Stil der Hazaragi-Volksdichtung** (Dobaiti), damit die Seite
gefüllt ist. Echte überlieferte Gedichte und Namen der Dichter können in `js/poems.js`
ergänzt bzw. die Beispiele ersetzt werden.
