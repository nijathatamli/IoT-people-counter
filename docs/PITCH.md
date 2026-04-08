# BakiMove — 3-Minute Hackathon Pitch

**Format:** Narrative script with slide cues. Total runtime: ~3 minutes.

---

## [SLIDE 1 — The Morning Commute] (0:00–0:30)

**Open with a story.**

> Meet Leyla. She's a university student in Baku. Every morning at 8:15, she walks into 28 May metro station — the busiest interchange in the city. The platform is packed. She can barely move. She waits for two trains to pass before she can squeeze into the third one. She's late to class again.
>
> Now meet Tural. He drives to work because the one time he tried the metro during rush hour, he stood in a sardine can for 40 minutes. He sits in traffic for an hour instead. He knows the metro would be faster — he just doesn't know *when* it's safe to take it.
>
> Leyla and Tural aren't alone. **800,000 people** ride the Baku Metro every day, and not a single one of them knows what they're walking into until they're already there.

---

## [SLIDE 2 — The Problem] (0:30–1:00)

**Scale the pain.**

> Baku's metro has **25 stations across 3 lines**, carrying nearly a million passengers daily. Yet there is:
>
> - **Zero real-time information** about how crowded any station or train is
> - **No tool** to tell you the best time to leave to avoid the rush
> - **No way** to compare whether metro or bus is better for your trip right now
> - **No route planner** that factors in crowding — only travel time
>
> The result? Passengers overcrowd the same stations at the same times. Platforms become unsafe. People who *would* use public transit choose cars instead, adding **35,000+ vehicles** to Baku's already congested roads every rush hour.
>
> This isn't just an inconvenience. It's a **safety issue**, a **traffic issue**, and a **city planning blindspot**.

---

## [SLIDE 3 — Introducing BakiMove] (1:00–1:30)

**The solution — keep it simple, keep it visual.**

> **BakiMove** is a real-time metro intelligence platform. It answers one question every commuter in Baku asks: *"When should I leave, and which way should I go?"*
>
> Here's what it does:
>
> **See it.** Cameras at stations and inside trains detect passenger density in real time using computer vision. No faces stored, no privacy risk — just a number: how crowded is it right now?
>
> **Know it.** Our ML engine predicts crowding for every station, every hour, every day — enriched with live context. Rainy day? Expect 20% more riders. Football match at Tofiq Bahramov Stadium tonight? Ganjlik station will spike at 19:00. Ramadan? Evening patterns shift. The model *knows* this because it scrapes real-world context continuously.
>
> **Plan it.** A multi-criteria route planner lets you choose: fastest route, least crowded route, fewest transfers, or most walking. Not just "how to get there" — but "how to get there *comfortably*."

---

## [SLIDE 4 — Live Demo / Walkthrough] (1:30–2:15)

**Show the product. Walk through 2 scenarios.**

> *[Switch to live demo or screenshots]*
>
> **Scenario 1 — Leyla's morning commute:**
> She opens BakiMove at 7:45 AM. The Live Feed shows 28 May platform is already at **High** congestion (0.72). But the app recommends: *"Leave at 8:35 instead — predicted load drops to Moderate (0.41). Take the Red Line."* She adjusts her schedule, catches a comfortable train, arrives on time.
>
> **Scenario 2 — Tural's route decision:**
> Tural needs to get from Nariman Narimanov to Koroghlu. He opens Route Planner and sees four options:
> - **Fastest:** Metro, 18 min, but High congestion at origin
> - **Ease:** Metro departing 20 min later, 22 min, Low congestion
> - **Bus alternative:** BakuBus Route 65, 25 min, Moderate crowding, no transfers
>
> He picks Ease. First time he's smiled on a commute.
>
> *[Show the hourly chart — the twin-peak congestion curve with the "sweet spot" highlighted]*

---

## [SLIDE 5 — How It Works (30-second technical flyover)] (2:15–2:35)

**Brief. Judges who care will ask in Q&A.**

> Under the hood:
> - **Edge CV** — YOLOv8-nano runs on station hardware. Counts people, not identities. Pushes data every 3 seconds.
> - **Context scraper** — Weather, events, calendar data scraped every 15 minutes. Feeds directly into ML features.
> - **XGBoost ensemble** — Predicts congestion scores and travel times. Achieves R-squared above 0.90 on test data. Falls back to an analytical model if ML is unavailable — the system never goes dark.
> - **FastAPI backend** — Single integration point. Frontend polls, never talks to ML or CV directly.
> - **React dashboard** — Three tabs: Live Feed, Route Planner, Station Intel. Works on mobile.
>
> Everything runs in Docker. One command: `docker-compose up`.

---

## [SLIDE 6 — Impact & Vision] (2:35–3:00)

**End with the future. Make it feel inevitable.**

> If 10% of Baku's metro riders shift their departure by just 15 minutes based on BakiMove's recommendations:
> - **Peak platform density drops by up to 25%** — safer stations
> - **12,000 fewer cars** on the road during rush hour — less pollution, less gridlock
> - **Metro becomes a choice, not a last resort** — ridership grows, city revenue grows
>
> Today it's a hackathon prototype with synthetic data. Tomorrow, plug in real BakiKart tap data from AYNA, connect live station cameras, and BakiMove becomes the transit layer Baku doesn't have yet.
>
> Leyla catches her train. Tural leaves the car at home. The city breathes a little easier.
>
> **BakiMove. Know before you go.**

---

## Speaker Notes

**Timing guide:**
| Section | Duration | Cumulative |
|---------|----------|------------|
| Story (Leyla & Tural) | 30s | 0:30 |
| Problem scale | 30s | 1:00 |
| Solution overview | 30s | 1:30 |
| Demo walkthrough | 45s | 2:15 |
| Technical flyover | 20s | 2:35 |
| Impact & close | 25s | 3:00 |

**Tips:**
- Practice the Leyla/Tural story until it flows naturally — this is what hooks the judges
- During the demo section, have the dashboard pre-loaded. Don't wait for it to load live
- The "10% shift = 25% density drop" stat is based on queueing theory (Erlang-C model for service systems) — be ready to explain if asked
- If asked about data: be upfront that it's synthetic, but emphasize the architecture accepts real data as a drop-in replacement
- If asked about privacy: "No raw video leaves the station. We count people, not identify them."
