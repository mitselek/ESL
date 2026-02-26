# Polly märkmed

[OTSUS] 2026-02-26 — Nootide ülelugemise äpp vajab nõuete dokumenti. Liisa Rahusoo CSV-formaat on referentsandmete allikas.

[MUSTER] 2026-02-26 — CSV struktuur: rida=parameeter, veerg=häälerühm (S/A/T/B). Tulemused: "õige", "Ettepanek: ...", "Viga: ...", tühi=ei kohaldu (-).

[MUSTER] 2026-02-26 — Parameetrid jagunevad kolme tasemesse:
1. Häälerühmaspetsiifilised (noodikõrgused, pausid, rütmid, sõnad, strihhid jne)
2. Kogu noodi kohta (pealkiri, helilooja, tempo jne)
3. Süsteemsed (häälerühmade paigutus, tähised)

[OTSUS] 2026-02-26 — v1 scope kinnitatud (team-lead): ei autentimist, ei koostööd, ei versiooniajalugu. Häälerühmad konfigureeritavad noodi tasandil (SSA, SSAATTBB jne). Parameetrite järjekord kohandatav (Liisa järjekord on vaikeväärtus).

[OTSUS] 2026-02-26 — Äpp on üks, kaks põhivaadet: dashboard (nootide nimekiri+progressiriba+staatused) + noodi süvavaade (PDF+tagasiside vorm+eksport). Kirjavahetuse ajajoon ja mustandid v1-st väljas. Ülelugemise lõpetamine uuendab noodi staatust automaatselt dashboardis.
