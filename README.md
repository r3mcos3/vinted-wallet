# Vinted Wallet 💰

Een moderne web applicatie voor het bijhouden van Vinted inkoop en verkoop. Perfect voor resellers die hun voorraad en winst willen tracken.

## ✨ Features

- **Authenticatie**: Veilige login/registratie met Supabase Auth
- **Product Management**: Toevoegen, bewerken en verwijderen van producten
- **Multi-size Tracking**: Houdt meerdere maten per product bij met individuele voorraad
- **Image Upload**: Drag & drop foto upload met preview
- **Verkoop Tracking**: Verkoop items per maat en houd bij wat beschikbaar is
- **Statistieken Dashboard**: Real-time overzicht van investering, verdiensten en winst
- **Responsive Design**: Werkt perfect op desktop, tablet en mobiel

## 🎨 Design

Modern Boutique aesthetic met:
- **Fonts**: Outfit (headers) + DM Sans (body)
- **Kleuren**:
  - Cobalt Blauw (#4A7FFF) voor primaire acties
  - Groen (#10B981) voor winst/beschikbaar
  - Rood (#EF4444) voor verlies/uitverkocht
- **Animaties**: Smooth hover effects, fade-ins, en micro-interactions
- **Componenten**: Grote product afbeeldingen, badges, en intuïtieve forms

## 🚀 Setup

### 1. Supabase Database

Je hebt de SQL migration al in Supabase uitgevoerd. Zorg dat je ook de **Storage bucket** hebt aangemaakt:

1. Ga naar **Storage** in je Supabase dashboard
2. Maak een nieuwe bucket: `product-images`
3. Zet deze op **Public**

### 2. Dependencies

Dependencies zijn al geïnstalleerd! Zo niet:

```bash
npm install
```

### 3. Start Development Server

De server draait al op http://localhost:5173!

Om opnieuw te starten:

```bash
npm run dev
```

### 4. Mock Mode (Optioneel)

Wil je de app testen zonder Supabase? Gebruik mock mode met voorbeelddata:

```bash
npm run dev:mock
```

Dit start de app met:
- 8 realistische voorbeeldproducten
- Diverse scenario's (verkocht, deels verkocht, verlies)
- Werkende statistieken en verkoop functionaliteit
- Geen Supabase credentials nodig

Perfect voor:
- Demo's en presentaties
- UI/UX testing
- Development zonder database

## 📱 Gebruik

### 1. Registreren

1. Ga naar http://localhost:5173/register
2. Maak een account aan met email/wachtwoord
3. Je wordt automatisch ingelogd

### 2. Product Toevoegen

1. Klik op **"+ Nieuw Product"**
2. Upload een foto (drag & drop of klik)
3. Vul product details in:
   - Naam
   - Inkoopprijs (wat je betaald hebt)
   - Verkoopprijs (wat je vraagt)
   - Notities (optioneel)
4. Selecteer maten en hoeveelheden:
   - Klik op de maat knoppen (XS, S, M, L, XL, XXL)
   - Vul per maat het aantal in
5. Klik **"Product Toevoegen"**

### 3. Product Verkopen

1. Klik op een product in het overzicht
2. Zie alle maten met beschikbaarheid
3. Klik **"Verkoop"** bij een beschikbare maat
4. Bevestig de verkoop
5. De voorraad wordt automatisch bijgewerkt

### 4. Statistieken Bekijken

1. Klik op **"📊 Statistieken"**
2. Zie overzicht van:
   - Totaal geïnvesteerd
   - Totaal verdiend
   - Netto winst
   - Voorraad waarde
   - Items verkocht/beschikbaar
   - ROI en sell-through rate

## 📂 Project Structuur

```
vinted-wallet/
├── src/
│   ├── components/
│   │   ├── auth/              # Login/Register forms
│   │   ├── products/          # Product components
│   │   ├── stats/             # Stats components (TODO)
│   │   └── common/            # Reusable components
│   ├── pages/                 # Page components
│   ├── hooks/                 # Custom React hooks
│   ├── context/               # React Context
│   ├── lib/                   # Supabase client
│   ├── mocks/                 # Mock data voor development
│   └── styles/                # CSS files
├── supabase/
│   └── migrations/            # Database schema
└── public/                    # Static assets
```

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Routing**: React Router v6
- **Forms**: React Hook Form
- **Styling**: Custom CSS (Modern Boutique design)

## 🔒 Security

- ✅ Wachtwoorden worden automatisch gehasht door Supabase
- ✅ Row Level Security (RLS) op alle database tabellen
- ✅ Users kunnen alleen hun eigen producten zien/bewerken
- ✅ Image uploads zijn beveiligd per user folder
- ✅ JWT tokens voor authenticatie

## 📈 Profit Berekening

De app berekent automatisch:

- **Potentiële winst**: (Verkoopprijs - Inkoopprijs) × Beschikbare items
- **Netto winst**: Totaal verdiend - Investering in verkochte items
- **ROI**: (Netto winst / Totaal geïnvesteerd) × 100%
- **Sell-through rate**: (Verkocht / Totaal) × 100%

## 🎯 Volgende Stappen

Om de app te gebruiken:

1. ✅ Supabase project is opgezet
2. ✅ Database schema is geladen
3. ✅ Storage bucket `product-images` aanmaken
4. 🔄 Registreer een account op http://localhost:5173/register
5. 🔄 Voeg je eerste product toe
6. 🔄 Test de verkoop functionaliteit
7. 🔄 Bekijk de statistieken

## 💡 Tips

- **Foto's**: Gebruik goede productfoto's voor betere presentatie
- **Verkoopprijs**: Vul altijd een verkoopprijs in voor accurate statistieken
- **Maten**: Voeg alle beschikbare maten toe in één keer
- **Notities**: Gebruik notities voor belangrijke details (conditie, kleur varianten, etc.)

## 🐛 Troubleshooting

**App laadt niet?**
- Check of de Supabase credentials kloppen in `.env.local`
- Controleer of de dev server draait (`npm run dev`)

**Kan geen product toevoegen?**
- Zorg dat de Storage bucket `product-images` bestaat en public is
- Check de browser console voor error messages

**Foto upload werkt niet?**
- Controleer of de Storage bucket public is
- Maximale bestandsgrootte is 5MB

---

Veel succes met je Vinted business! 🚀💰
