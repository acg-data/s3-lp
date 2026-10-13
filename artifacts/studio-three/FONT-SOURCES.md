# Studio Three brand assets

The user explicitly requested the supplied Studio Three logo and the fonts used on studiothree.com. The logo is copied unchanged, with its original transparency and colors, to `public/studio-three-logo.png`.

Typography was verified from rendered CSS on the official homepage and Brickell location page on October 12, 2026. Gotham is the body family. Trade Gothic Next is used for location headings; Trade Gothic Next Condensed is used for homepage class headings and campaign display text. The lander serves the requested font files locally.

| Local file                               | Official source                                                                                                                  |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `gotham-book.woff`                       | https://studiothree.com/wp-content/uploads/2022/09/Gotham-Book.woff                                                              |
| `gotham-medium.woff2`                    | https://studiothree.com/wp-content/uploads/2022/09/Gotham-Medium.woff2                                                           |
| `gotham-bold.woff2`                      | https://studiothree.com/wp-content/uploads/2022/09/Gotham-Bold.woff2                                                             |
| `trade-gothic-next-bold.woff2`           | Adobe Fonts resource declared by the official site: `use.typekit.net/af/e7065f/00000000000000007735ba3f/30/l`, weight 700 normal |
| `trade-gothic-next-condensed-bold.woff2` | Adobe Fonts resource declared by the official site: `use.typekit.net/af/f060c3/00000000000000007735ba43/30/l`, weight 700 normal |

The address and building name are supported by https://studiothree.com/studio/brickell/. Training photographs illustrate the Studio Three experience; they are not labeled as photos of the Brickell building.

The current header and three-modality section use the photographs supplied by the user on October 13, 2026. The originals are retained unchanged for reproducible web asset generation:

| Original in repository | User attachment |
| ---------------------- | --------------- |
| `attached_assets/brickell-header.jpg` | Landing Page Header.jpg |
| `attached_assets/brickell-strength.jpg` | LP Strength.jpg |
| `attached_assets/brickell-pilates.jpg` | LP Pilates.jpg |
| `attached_assets/brickell-yoga.jpg` | LP Yoga.jpg |

The user confirmed Strength, Pilates, and Yoga for Brickell, replacing Interval. Descriptions remain general and consistent with the supplied discipline photographs; no class schedule or membership terms are promised.

The page serves WebP variants in `public/photos/`, generated with `scripts/optimize-lander-images.mjs`. Encoding and resizing preserve the original compositions; framing is handled in CSS. The header has 800/1600/2400px variants, and each discipline has 480/800/1280px variants. The header crop excludes the woman at the far left and keeps the man at the right visible on desktop and mobile.
