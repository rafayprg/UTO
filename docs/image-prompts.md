# Category artwork: Gemini / Antigravity image prompts

Har category ke liye ek image. Site khud pick kar leti hai: file ko `public/images/categories/<file-name>.webp` mein rakho aur dobara build karo. Agar image nahi hai to page pe icon wala panel dikhta hai, site kabhi tootti nahi.

## Har image ke rules (sab prompts pe lagu)

- **Size:** 1600 × 1000 px (16:10, landscape). Agar Gemini sirf 16:9 de to bhi chalega, crop ho jayega.
- **Format:** `.webp`, quality ~80, **300 KB se kam**. (PNG mile to squoosh.app pe free convert karo.)
- **File name:** bilkul neeche likha hua, chhote huroof (lowercase) mein.
- **Text nahi:** image mein koi likhai, logo, brand naam ya number nahi hona chahiye. AI text ghalat likhta hai aur AdSense ko fake brand logos pasand nahi.
- **Asli insaan ke chehre nahi**, stock-photo wale handshake ya robot nahi.
- **Style sab mein ek jaisa** rakho, taa ke site ek brand lage.

### Shared style (har prompt ke end mein yeh paragraph lagao)

> Style: clean editorial still-life photograph, shot from a 30-degree overhead angle on a matte sage-green paper desk surface (#e6f1eb), soft natural daylight from the upper left, gentle long shadows, shallow depth of field. Calm, premium, uncluttered composition with generous empty space on the left third. Colour palette: deep ledger green (#0c6b4e), off-white paper, charcoal ink, one small accent of highlighter yellow (#f2e35b). No text, no letters, no numbers, no logos, no brand names, no people's faces, no hands. Photorealistic, 16:10 landscape, high detail, no watermark.

## Category prompts

| # | File name | Prompt (shared style ke saath) |
|---|---|---|
| 1 | `finance.webp` | A neat flat-lay of a paper payslip with blank lines, a simple desktop calculator, a green fountain pen, a few coins and a folded paper envelope, arranged like a tidy home-office tax evening. |
| 2 | `real-estate.webp` | A small architectural white model house sitting on a blank paper floor plan, a brass house key beside it, a measuring tape partly unrolled, and a tiny green potted plant. |
| 3 | `insurance.webp` | A white toy car and a small white model house side by side under a translucent green umbrella, with a blank paper policy folder and a pen nearby, conveying protection and calm. |
| 4 | `business.webp` | A closed laptop, a small cardboard shipping box with twine, a card payment terminal with a blank screen, and a paper receipt roll, arranged as a small online-shop owner's desk. |
| 5 | `marketing.webp` | A paper bar chart printout with rising green bars (no labels), a few colourful sticky notes with no writing, a megaphone-shaped paperweight and a coffee cup. |
| 6 | `legal.webp` | A stack of crisp blank contract pages with a green ribbon bookmark, a classic fountain pen, a round wax seal stamp and a small brass scale of justice in the background, softly out of focus. |
| 7 | `pdf.webp` | A neat fan of blank paper documents being clipped together with a large green binder clip, a stapler, and a few loose pages, like organising and merging paperwork. |
| 8 | `image.webp` | A designer's desk with paint colour swatch cards fanned out in greens and yellows, a small camera lens, a pair of scissors and paper cut-out shapes. |
| 9 | `media.webp` | A pair of studio headphones, a vintage film reel and a small clapperboard with blank chalk panels, resting on the paper desk. |
| 10 | `dev.webp` | A mechanical keyboard seen at an angle, a small notebook with abstract curly-bracket doodles (no readable code), a green desk lamp and a cup of tea. |
| 11 | `crypto.webp` | A brass combination padlock, a vintage key, and a few small wooden cubes with abstract geometric symbols (no letters or numbers), representing encoding and security. |
| 12 | `youtube.webp` | A compact camera on a mini tripod, a ring light seen from the side, a small microphone and a blank storyboard notebook, like a creator's filming desk. |
| 13 | `text.webp` | An old typewriter with a blank sheet of paper loaded, a few loose index cards with no writing and a highlighter pen in yellow. |
| 14 | `calculator.webp` | A geometry set: a protractor, compass, ruler and set squares neatly arranged, with a small vintage calculator and graph paper with blank grid. |
| 15 | `data.webp` | A spread of graph paper with abstract coloured grid blocks like a spreadsheet (no numbers), a few index cards sorted into neat stacks and a magnifying glass. |

## Bonus images (optional, baad mein)

| File name | Kahan lagegi | Prompt |
|---|---|---|
| `public/images/og-default.webp` (1200 × 630) | WhatsApp/Facebook share preview | A wide workbench desk with a calculator, a paper document, a key and a small plant arranged in a row, lots of empty sage-green space in the middle. + shared style |
| `public/images/home-hero.webp` | Homepage | A tidy workbench toolkit: a calculator, a pen, a ruler, a padlock and a paper document laid out like tools in a toolbox tray, seen from directly above. + shared style |

## Gemini mein kaise karein (step by step)

1. Chrome mein `gemini.google.com` kholo → model mein image banane wala option select karo.
2. Upar wala **category prompt + shared style paragraph** ek saath paste karo.
3. Agar image mein koi likhai aa jaye to bolo: *"Remove all text and letters from the image, keep everything else the same."*
4. Download karo → squoosh.app pe `.webp` banao (quality 80) → naam bilkul table wala rakho.
5. Saari files is folder mein daal do: `C:\Users\user\Desktop\tool site\public\images\categories\`
6. Mujhe batao, main build karke check kar lunga aur deploy kar dunga.
