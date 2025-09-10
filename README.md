# Battle Ropes AR - WebXR Fitness Game

Ein immersives AR-Fitnessspiel für Meta Quest 3, das realistische Battle Rope Training mit physics-basierter Seilsimulation ermöglicht.

## 🎯 Features

- **WebXR AR**: Läuft nativ im Meta Quest 3 Browser
- **Physics-basierte Seile**: Realistische Seilsimulation mit Verlet Integration
- **Hand Tracking**: Präzise Controller-Erkennung für beide Hände
- **Fitness Tracking**: Score-System basierend auf Amplitude, Konsistenz und Timing

## 🚀 Installation & Setup

### Für Meta Quest 3:

1. **Server starten** (für lokale Entwicklung):
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (falls verfügbar)
   npx serve .
   ```

2. **Quest 3 Browser öffnen**:
   - Öffne den Browser auf deiner Quest 3
   - Navigiere zu: `http://[DEINE-IP]:8000`
   - Beispiel: `http://192.168.1.100:8000`

3. **AR Session starten**:
   - Klicke auf "Start Battle Ropes AR"
   - Erlaube WebXR-Zugriff
   - Bewege deine Controller für Seil-Interaktion

## 📁 Projektstruktur

```
claudeRopes/
├── index.html              # Haupt HTML-Datei
├── js/
│   └── battleRopes.js      # WebXR & Three.js Hauptlogik
└── README.md              # Diese Datei
```

## 🔧 Entwicklung

### Aktuelle Phase: **Phase 1 - WebXR Foundation** ✅

**Implementiert:**
- ✅ HTML-Grundstruktur mit WebXR Session Management
- ✅ Three.js Setup für 3D Rendering  
- ✅ Controller Input Handling (Position/Rotation/Buttons)
- ✅ AR Environment Setup (Passthrough Mode)

### Nächste Schritte:

**Phase 2 - Physics Engine & Rope System:**
```
Schritt 2.1: Implementiere Verlet Physics Engine
- Particle System für Seilknoten
- Constraint-basierte Verbindungen
- Kollisionserkennung mit Boden/Objekten

Schritt 2.2: Battle Rope Simulation
- Duale Seile (links/rechts Hand)
- Hand-Position zu Seil-Anregung Mapping
- Realistische Dämpfung und Schwerkraft
```

## 🎮 Steuerung

- **Quest 3 Controller**: Beide Hände simulieren Battle Rope Griffe
- **Bewegungen**: Alternierend, Doppelwellen, Power Slams
- **Feedback**: Visuelle und haptische Rückmeldung

## 🛠️ Technische Details

**WebXR Features:**
- `immersive-ar` Session Type
- `local-floor` Reference Space
- Controller Position/Rotation Tracking
- Hand Velocity Berechnung

**Three.js Setup:**
- Transparenter Hintergrund für AR
- Shadow Mapping für realistische Beleuchtung
- 90fps Target für Quest 3

## 📱 Browser-Kompatibilität

- ✅ Meta Quest 3 Browser (Chromium-basiert)
- ✅ Meta Quest 2 Browser
- ⚠️ Desktop Browser (für Entwicklung, ohne AR)

## 🐛 Troubleshooting

**"WebXR Not Supported":**
- Stelle sicher, dass du den Quest Browser verwendest
- Aktiviere WebXR in den Browser-Einstellungen

**Controller nicht erkannt:**
- Prüfe Bluetooth-Verbindung
- Starte Quest neu falls nötig

**Performance Issues:**
- Schließe andere Browser-Tabs
- Reduziere Grafik-Qualität in den Einstellungen