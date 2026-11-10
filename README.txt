DERISA'S LAST CARD - app files (keep ALL of them together, in one folder)

  Index.html  Home.html  Game.html  Pvp.html      the 4 pages
  config.js   app.js                              Supabase settings + shared helpers
  manifest.json  sw.js  offline.html  icons/      make it an installable app (PWA)

PUT IT ONLINE (needed so it can be installed as an app; https is required)
  Easiest from a phone: Netlify (app.netlify.com/drop) or Cloudflare Pages (Direct Upload).
  Upload the unzipped folder (or the zip) so that Index.html is at the top.
  You get a link like https://your-name.netlify.app

THEN, in Supabase (Authentication > URL Configuration)
  Site URL: your link.  Redirect URLs: add your link too.

INSTALL ON A PHONE
  Android (Chrome): open your link > menu (3 dots) > "Install app" / "Add to Home screen"
                    (or Home > Settings > Install app).
  iPhone (Safari):  Share button > "Add to Home Screen".

WHEN YOU CHANGE ANY FILE
  Open sw.js and raise VERSION ('dlc-v1' -> 'dlc-v2'), then upload again, so phones update.

Supabase checklist
  1. SQL: part1 -> part2 -> part3 -> part4 -> supabase_storage_cards.sql -> supabase_update_01_levels.sql
  2. Storage: bucket "cards" (folder v1, 54 pictures) and "game-assets" (bots/, ui/trophy.jpg)
  3. Authentication: Email on (min password 6), "Allow anonymous sign-ins" on
  4. Never put a service_role / secret key in any file
