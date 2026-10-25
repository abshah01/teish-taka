# তেইশ টাকা — project handoff (new chat er jonno)

Owner reply language: **Banglish** (Bangla in English letters), short and step by step. Owner often works from phone, now also laptop. Owner is not a developer. No secrets in this file.

## Ki eta
Hand-written letter service for Daffodil International University. Customer fills a form, pays 25 taka (23 letter + 2 for a 2 taka note) by bKash/Nagad, owner hand-writes and hand-delivers. Admin dashboard for the owner. Brand: "তেইশ টাকা", tagline "চিঠি, যা ভালবাসা বাড়ায়".

## Live setup
- Host: Vercel (Hobby), project `teish-taka-zquj`, live at teish-taka-zquj.vercel.app
- Source: GitHub repo `abshah01/teish-taka`, **flat structure, no folders** (owner uploads files by GitHub "Upload files"). Vercel deploys on commit.
- DB: Upstash Redis via Vercel (REST). Env vars: GMAIL_USER, GMAIL_APP_PASS, ADMINS (`id:pass,id2:pass2`), SECRET, plus auto KV_REST_API_URL/KV_REST_API_TOKEN.
- Vercel uses legacy `builds` in vercel.json (flat api-*.js files + static html/png) with routes: /api/order, /api/admin, /api/public, /api/track, /api/review, /track, /review, /privacy, /admin, /.

## Files (all in repo root)
index.html (home + 2-step order form), admin.html (dashboard), track.html, review.html, privacy.html, og.png, api-order.js, api-admin.js, api-public.js, api-track.js, api-review.js, lib.js, vercel.json, package.json (nodemailer).

## Redis keys
orders (hash id->json), visits (hash date->count), settings (json), board + boardfiles, reviews (hash id->json, `ok` = approved), gallery (hash id->dataURL), trx (duplicate TrxID check), rl:/lg: (rate limits).
Settings fields: methods[{n,num,on}], fb, ig, wa, posts, open, closedMsg, base 23, note 2, freeWords 150, blockWords 100, blockPrice 10, notice.

## Done
Vintage/yellow-pink-brown Kumarri-style theme (Atma + Hind Siliguri fonts), animated hero. Two-step form with word count and extra charge for long letters. Admin: login (rate limited, 90 day remember-device with sliding renewal), dashboard stats, orders (status, notes, edit, copy letter, resend email, CSV, search, duplicate TrxID flag, source tag via ?src=), payment methods editor, social links and post embeds, order open/close switch, board (notes/files, small files only), reviews moderation, gallery, settings. Status emails to customer, review link on Delivered, track page, FAQ, privacy page, share preview image.

## Known issues / owner todo
- Status/confirmation emails failed with Gmail 535 "Username and Password not accepted". Fix: GMAIL_USER must be exactly teishtaka@gmail.com, App Password (2-Step on) pasted without spaces, then redeploy. Verify with admin "ইমেইল আবার".
- Upstash free limits (1 MB request, daily commands). Large images/videos cannot be stored in Redis; a real file store (e.g. Vercel Blob) will be needed for the marketplace.
- Vercel Hobby is non-commercial; fees/commission may need a paid plan. Owner should keep a ledger of money owed to sellers.
- Container had no Bangla font, so og.png has no text.

## NEXT FEATURE REQUEST (owner's own words, summarised)
Everything must be editable from admin (add/edit/delete).
1. Home page should be a landing page. A box with a button leads to a separate letter-writing page (not the form directly on home).
2. **Gift shop**: admin-managed products (photo, name, price). Customer selects items, cart shows items, quantities, bill, delivery charge 20 taka, total, then pays.
3. **Used books marketplace**: sellers submit book (photo, price, description) plus their name/phone/email, pay 5 taka listing fee, post shows on site; buyers order; owner delivers. Same for any other item. Buyer and seller must both give name, phone, email. Goes into the same cart/payment.
4. **Borrow (dhar)** section, e.g. sarees: seller and borrower give details; buyer gives delivery address.
5. **Food sellers** can post too, with **5% service charge** on price.
6. **Big orders**: option to pay 50% online and 50% on receipt.

### FINAL DECISIONS (owner answered, these replace the earlier defaults)
1. All customer money goes to owner's bKash/Nagad; owner pays sellers later (keep a ledger in admin: owed to each seller).
2. Delivery charge 20 taka **once per order**, no matter how many items. **Letter-only orders: no delivery charge.** Letter + shop items in one cart: 20 taka once.
3. Seller posts: seller pays the 5 taka listing fee with a TrxID while posting. Post stays **Pending** in admin dashboard. Owner checks payment, then approves; only then it is live.
4. **Dropshipping-style privacy:** seller and buyer never see each other. Only admin sees all names/phones/emails/addresses. Seller sees only a "sold" status on their own post. Customer sees only their own order. Public pages show no contact details.
5. **Borrow (dhar) items (books, sarees, etc.):** the 5 taka post fee is separate and has nothing to do with rent/sale. Borrower pays the item's **new price as deposit (jamanot)**. On return, the **rent is deducted and the rest refunded** to the borrower. So each borrow listing needs: item name, photos, description, new price (deposit), rent price. Admin needs a "returned" action that calculates the refund.
6. **Food sellers:** a seller posts a food item (service charge 5% of price). Customer orders, it comes to admin, owner tells the seller, seller says how long it takes, owner tells the customer. Admin needs a field to store "preparation time / seller message" per order and show it to the customer on the track page (and optionally by email). Long instructions go in the seller's description.
7. **50% online / 50% on receipt** is allowed only when order total is **300 taka or more**. Below 300: full payment only. Remaining 50% is collected at delivery (assume owner collects; confirm).
8. Up to 3 compressed photos per post, built the way suggested earlier. Real file storage (e.g. Vercel Blob) needed because Redis cannot hold many images.
9. **Gift shop:** owner's own products, managed in admin with photo, name, price and stock count. If stock runs out after an order, owner phones the customer. The customer may add another item; if not, the **sold-out item's amount is deducted** from the bill (refund). So admin needs an order-line editor: mark a line unavailable, add a line, recalculate total and show refund due.
10. **Availability:** used items for sale are one-time; once bought they show **sold out**. **Rental/borrow items are never permanently removed**: while someone has it, show **Booked** and nobody else can rent it; after return, admin marks it returned and it goes **live again**.

### Answered later
- Borrow rent is **per day**. Remaining 50% is collected by the **delivery man** at delivery.

### Still open (ask the owner when building)
- Borrow: late return penalty? (rent per day decided)
- Food: allowed kinds and local rules. Owner has been told trade licence/food-safety rules may apply and should check.

## How to continue
Plan phases: (1) landing page + gift shop + cart + delivery + 50% option; (2) used books/items marketplace + seller posts + admin approval + order lines; (3) borrow/rent + food. Owner uploads the latest `teish-taka-flat.zip` and this file in the new chat. Plan: build in 3 phases (1: landing page + gift shop + cart + delivery + 50% option; 2: books/used items marketplace + seller posts; 3: borrow + food). Test each phase live before the next.


## PHASE 1 STATUS (built, needs live test)
New/changed files: index.html (landing, service cards), letter.html (letter form, was on home), shop.html (products + cart + checkout + optional letter + 50% option), style.css (shared CSS, needs `*.css` build in vercel.json), api-shop.js (GET products/img, POST checkout), lib.js (delivery, halfMin, shopOpen, recalc, letterPrice), api-admin.js (plist/pset/pdel/lines, custMsg, refundDone, dueDone, shop emails), api-track.js + track.html (lines, bill, due, refund, custMsg), admin.html (shop manager, order line editor, settings: delivery, halfMin, shopOpen), vercel.json (routes /shop /letter /api/shop).
Redis added: products (hash), pimgs (hash dataURL, 1 photo/product, ~200KB max), stock (hash, atomic HINCRBY). Shop orders live in `orders` with kind:'shop', ids start with S.
Order maths (lib.recalc): total = available items + letter(if not off) + delivery(only if items>0); due = max(0,total-paidOnline); refundDue = max(0,paidOnline-total).
Not yet done: ledger for sellers, Vercel Blob, marketplace, borrow, food. Landing cards for those are "শীঘ্রই আসছে" placeholders (hard-coded in index.html).
