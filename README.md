# My Browser

HTML, CSS અને JavaScript વડે બનાવેલો Chrome-style browser interface.

## VS Codeમાં ચલાવવાની રીત
1. ZIP extract કરો.
2. VS Codeમાં `my_browser` folder ખોલો.
3. `index.html` ખોલો.
4. સરળ રીત: VS Codeમાં Live Server extension install કરો, પછી `index.html` પર right-click → **Open with Live Server**.
5. અથવા `index.html` પર double-click કરીને browserમાં ખોલો.

## શું ચાલે છે?
- Google search / URL navigation intent
- Multiple tabs (આ જ appના અંદરના tabs)
- Local browsing history
- Local bookmarks
- Download links list
- Dark mode
- Mobile responsive layout
- History, bookmarks અને theme `localStorage`માં સાચવાય છે

## મહત્વની મર્યાદાઓ
- આ full browser engine નથી; તે browser-style website છે.
- ઘણા websites `X-Frame-Options` અથવા CSP `frame-ancestors` દ્વારા iframe embedding રોકે છે. આવી સાઇટ માટે **Open externally** વાપરો.
- આ Downloads feature download manager નથી; તે ખોલેલી link યાદીમાં સાચવે છે. વાસ્તવિક file downloads host browserના controls દ્વારા થાય છે.
- iframeમાં ચાલતી websiteનું internal URL/history વાંચી શકાતું નથી; આ browser securityનું વર્તન છે.
- Private/incognito browsing, extensions, password manager, OS-level downloads અને Chrome જેવી સંપૂર્ણ compatibility સામેલ નથી.
- Unknown text Google Search તરીકે મોકલાય છે. Internet connection જરૂરી છે.

## Project files
- `index.html` — structure
- `style.css` — responsive design અને dark mode
- `app.js` — tabs, navigation, history, bookmarks અને downloads list
