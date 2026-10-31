# گنجینهٔ شعرِ هزارگی – Hazaragi-Gedichte

Eine Webseite zum Lesen von Hazaragi-Gedichten (Dari/Hazaragi, von rechts nach links).

**Öffnen:** einfach `index.html` im Browser öffnen – keine Installation nötig, alle Schriften liegen lokal in `fonts/`.

## Funktionen
- 8 Kategorien: عاشقانه، وطن و هزارستان، غریبی و مهاجرت، دمبوره و بیت، لالایی، سوگ و یاد، طبیعت و فصل‌ها، حکمت و پند
- Suche (ignoriert Vokalzeichen), Filter nach Kategorie, Favoriten (★)
- Lese-Ansicht wie eine alte Handschrift: Verse als Beyt in zwei Halbversen, Schrift umschaltbar
  (نستعلیق = Kalligrafie-„Qalam“, نسخ, ساده), Schriftgröße, Kopieren, Vor/Zurück (auch mit Pfeiltasten)
- „Vers des Tages“, Zufallsgedicht, Tag/Nacht-Modus, Galerie, kleines Hazaragi-Wörterbuch
- Direktlink zu einem Gedicht: `index.html#poem-bamyan`

## Struktur
```
index.html        Seite
css/style.css     Design (Pergament, Lapislazuli, Gold)
js/poems.js       ← Gedichte, Kategorien, Wörterbuch, Galerie (hier ergänzen!)
js/app.js         Logik
fonts/            Noto Nastaliq Urdu, Amiri, Vazirmatn (SIL Open Font License)
Bilder/           Illustrationen (siehe Bilder/README.md)
```

## Hinweis zu den Texten
Die Gedichte sind **Beispieltexte im Stil der Hazaragi-Volksdichtung** (Dobaiti), damit die Seite
gefüllt ist. Echte überlieferte Gedichte und Namen der Dichter können in `js/poems.js`
ergänzt bzw. die Beispiele ersetzt werden.
