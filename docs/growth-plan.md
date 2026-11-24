# Localtools growth plan: Google ranking + AdSense income

Last updated: 24 Nov 2026

## Pehle sach baat

- **Koi bhi #1 rank ki guarantee nahi de sakta**, na main, na koi SEO agency. Google khud faisla karta hai. Hum sirf woh kaam karte hain jis se chance barhta hai.
- Nayi site ko Google mein jagah banane mein aam tor pe **3–6 mahine** lagte hain.
- Kamai traffic pe hoti hai. Tool sites pe AdSense aam tor pe **$1–5 per 1,000 page views** deta hai (US traffic pe zyada). Yaani $100/mahina ke liye kam az kam 30–50 hazar views/mahina chahiye.
- **Paisay de kar backlinks khareedna ya spam links** (Fiverr ke "1000 backlinks" packages, PBN) Google ki policy ke khilaf hai. Is se site penalty kha sakti hai aur AdSense bhi reject hota hai. Hum sirf asli tareeqay use karenge.

## Phase 1: Foundation (abhi, is hafte)

| Kaam | Kaun | Status |
|---|---|---|
| Sitemap Search Console mein submit | Claude | ✅ Done (24 Nov) |
| Category pages redesign (hero image, "Start here", topic-wise cards) | Claude | ✅ Done, deploy baqi |
| Category images ke prompts | Claude | ✅ `docs/image-prompts.md` |
| 15 category images banana (Gemini/Antigravity) | Rafay | ⏳ |
| GitHub token remote URL se hatana aur revoke karna | Rafay | ⏳ Zaroori |
| **Custom domain** (.com, ~$10–12/saal, **paid**) | Rafay ka faisla | ⏳ AdSense ke liye takreeban zaroori |

## Phase 2: Content quality (hafta 2–4)

Google ka sab se bara khatra: hazaron pages jo ek hi template se bane hain ("scaled content"). Is ka hal:

1. **Behtareen 300 pages pe focus.** Jo pages sab se zyada search hote hain (paycheck, mortgage, sales tax, PDF merge, background remover), un pe asal examples, FAQ aur "kaise kaam karta hai" wala content.
2. **Kamzor pages ko `noindex`** karna (jaise woh city/state combinations jinka koi search nahi hota). Is se poori site ki quality score behtar hoti hai. Search Console ke data se decide karenge (2–3 hafte ka data chahiye).
3. Har category page pe ab topic sections hain, aur internal links barh gaye hain.
4. Search Console mein "Pages → Not indexed" ki report har hafte check karni hai.

## Phase 3: Legit backlinks (mahina 1–3, free)

Yeh sab **free** hain. Har ek pe account Rafay ki apni email se banega (account main nahi bana sakta, aap ki ijazat aur sign-in chahiye):

| Jagah | Kya karna hai |
|---|---|
| **Product Hunt** | "Localtools: 2,700 free private browser tools" launch post |
| **AlternativeTo** | iLovePDF, Smallpdf, remove.bg ke "alternative" ke tor pe list karna |
| **Reddit** (r/InternetIsBeautiful, r/webdev, r/personalfinance) | Sirf jab koi asal sawal ho, wahan madad ke saath link. Spam nahi. |
| **Hacker News** "Show HN" | "Show HN: Privacy-first tools that never upload your files" |
| **GitHub** | Repo public README + "awesome-privacy" / "awesome-selfhosted" lists mein PR |
| **Free tool directories** | SaaSHub, Toolify, There's An AI For That (sirf jo tools fit hon), Indie Hackers |
| **Quora / StackExchange** | Asal jawab + jahan munasib ho tool ka link |
| **Blog guest posts** | Personal finance / freelancer blogs ko free embeddable calculator offer karna |

Har launch post ka draft main likh dunga. Post karna aap ka kaam hoga, ya mujhe har post ki alag ijazat dein.

## Phase 4: AdSense (jab yeh sab ho jaye)

Apply tab karein jab:
- [ ] Custom domain live ho
- [ ] Search Console mein 500+ pages indexed hon
- [ ] Roz 50+ organic visitors aa rahe hon
- [ ] Privacy Policy, About, Contact, Terms, Disclaimer pages live hon (✅ already hain)
- [ ] `ads.txt` root pe ho (approval ke baad AdSense publisher ID milegi, tab main add kar dunga)
- [ ] Cookie consent banner (EU/UK visitors ke liye, AdSense ka zaroori rule)

## Har hafte kya check karna hai

1. Search Console → Performance: clicks, impressions, top queries
2. Search Console → Pages: kitne indexed, kitne "Crawled – not indexed"
3. Jo query impressions de rahi hai lekin click nahi, us page ka title/description behtar karna
