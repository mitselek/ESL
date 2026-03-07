/**
 * Exceli ja DB korrektuuriandmete ühtne mudel + lahtrihaaval diff.
 *
 * Uus Excel (03.03.2026) — 8 sheeti:
 *   Alus (template), Millal saame sinna maale, Sööge langud,
 *   Ei või õnneta elada, Kohus koju minna, Petis peiu, Palju veini, Laulu võim
 *
 * DB — 8 review't: p-01, p-05, p-07, p-08, p-09, p-10, p-11, p-12
 */

// ─── Ühtne interfeiss ───────────────────────────────────────────────

export type Verdict = 'õige' | 'olemas' | 'viga' | 'ettepanek' | 'puudub' | null;

export interface ReviewCell {
	param_name: string;
	scope: 'per_voice' | 'whole_piece';
	voice: string | null;
	verdict: Verdict;
	remarks: string | null;
	/** Excelis "-" — kontrollitud, pole asjakohane. Äpis puudub selline olek. */
	not_applicable: boolean;
}

export interface ReviewDataset {
	piece_title: string;
	piece_id: string;
	source: 'excel' | 'db';
	cells: ReviewCell[];
}

// ─── Template kaardistus ────────────────────────────────────────────

/**
 * UUS Exceli template (Alus sheet, 03.03.2026).
 *
 * Oluline muutus: mitu kategooriat, mis vanas templates olid per_voice,
 * on nüüd whole_piece. Uued kategooriad: Võtmed, Helistik, Taktimõõt, Muud märgid.
 * Uus hääl: Soolo.
 */
export const NEW_TEMPLATE = {
	per_voice: [
		'Noodikõrgused', 'Pausid', 'Rütmid', 'Sõnad', 'Strihhid',
		'Pidekaared', 'Legatokaared', 'Fermaadid', 'Jagunemised',
		'Dünaamika tähised', 'Dünaamika sõnadega', 'Muud märgid',
	],
	whole_piece: [
		'Pealkiri', 'Helilooja', 'Sõnade autor', 'Helistik', 'Taktimõõt',
		'Võtmed', 'Häälte paigutus süsteemides', 'Häälerühmade tähised süsteemi ees',
		'Kordusmärgid', 'Kordusmärgid sõnadega', 'Tempo tähis loo alguses',
		'Tempo, dünaamika jm tähised loo sees', 'Vormiosade tähised',
		'Täpsustavad tekstid loo sees', 'Täpsustavad tekstid noodi all',
	],
	voices: ['S', 'A', 'T', 'B', 'Soolo'],
} as const;

/** DB param_templates → Excel nime mapping */
export const DB_TO_EXCEL_NAME: Record<string, string> = {
	'Sõnad (tekst)': 'Sõnad',
	'Häälerühmade paigutus süsteemides': 'Häälte paigutus süsteemides',
};

/** Excel nimi → DB nimi (pöördmapping) */
export const EXCEL_TO_DB_NAME: Record<string, string> = {
	'Sõnad': 'Sõnad (tekst)',
	'Häälte paigutus süsteemides': 'Häälerühmade paigutus süsteemides',
};

/** Excel sheet nimi → piece_id */
export const SHEET_TO_PIECE: Record<string, string> = {
	'Millal saame sinna maale': 'p-07',
	'Sööge, langud': 'p-08',
	'Ei või õnneta elada': 'p-11',
	'Kohus koju minna': 'p-12',
	'Petis peiu': 'p-09',
	'Palju veini': 'p-10',
	'Laulu võim': 'p-01',
};

// ─── Exceli lahtri parser ───────────────────────────────────────────

function parseExcelCell(raw: string | null | undefined): Pick<ReviewCell, 'verdict' | 'remarks' | 'not_applicable'> {
	if (raw == null || raw.toString().trim() === '') {
		return { verdict: null, remarks: null, not_applicable: false };
	}
	const text = raw.toString().trim();
	if (text === '-') {
		return { verdict: 'puudub', remarks: null, not_applicable: true };
	}
	const lower = text.toLowerCase();
	if (lower === 'õige' || lower === 'õiged' || lower === 'korras') {
		return { verdict: 'õige', remarks: null, not_applicable: false };
	}
	if (lower === 'olemas' || lower === 'olemas, õige' || lower === 'olemas, õiged' || lower.startsWith('olemas,') || lower.startsWith('õige,') || lower.startsWith('õige ') || lower.startsWith('olemas ')) {
		return { verdict: 'olemas', remarks: text, not_applicable: false };
	}
	if (lower.startsWith('vead:') || lower.startsWith('viga:') || lower.startsWith('viga ') || lower.startsWith('v:') || lower.startsWith('vale ')) {
		return { verdict: 'viga', remarks: text, not_applicable: false };
	}
	if (lower.startsWith('ettepanek:') || lower.startsWith('ettepanek ') || lower.startsWith('puudu')) {
		return { verdict: 'ettepanek', remarks: text, not_applicable: false };
	}
	// "Viga on kirjas X lahtris" → viide, aga sisuline verdict on viga
	if (lower.includes('viga on kirjas') || lower.includes('viga kirjas')) {
		return { verdict: 'viga', remarks: text, not_applicable: false };
	}
	// Muu sisuline tekst → ettepanek
	return { verdict: 'ettepanek', remarks: text, not_applicable: false };
}

// ─── EXCEL ANDMED ───────────────────────────────────────────────────

// Helper: loo ReviewCell
function cell(param_name: string, scope: 'per_voice' | 'whole_piece', voice: string | null, raw: string | null | undefined): ReviewCell {
	return { param_name, scope, voice, ...parseExcelCell(raw) };
}

// ── p-07: Millal saame sinna maale (VANA template) ──

export const EXCEL_P07: ReviewDataset = {
	piece_title: 'Millal meie sinna saame', piece_id: 'p-07', source: 'excel',
	cells: [
		// per_voice
		cell('Noodikõrgused', 'per_voice', 'S', 'õige'), cell('Noodikõrgused', 'per_voice', 'A', 'Ettepanek: takt 8 ja 15, fis-i diees puudu. See on hea meeldetuletus võtmemärgist ja lihtsustab oluliselt noodi lugemist ja harmoonia tajumist.'), cell('Noodikõrgused', 'per_voice', 'T', 'õige'), cell('Noodikõrgused', 'per_voice', 'B', 'õige'),
		cell('Pausid', 'per_voice', 'S', 'õige'), cell('Pausid', 'per_voice', 'A', 'õige'), cell('Pausid', 'per_voice', 'T', 'õige'), cell('Pausid', 'per_voice', 'B', 'õige'),
		cell('Rütmid', 'per_voice', 'S', 'õige'), cell('Rütmid', 'per_voice', 'A', 'õige'), cell('Rütmid', 'per_voice', 'T', 'Ettepanek: Takt 5 ja 13, rütmi-punktid on halvasti loetavad. Parem asukoht oleks rütmi kohal (nagu naishäältes), hetkel jäävad liiga joone peale ja märkamatuks, ebaloogiline koht, kus neid lugeda.'), cell('Rütmid', 'per_voice', 'B', 'õige'),
		cell('Sõnad', 'per_voice', 'S', 'Vead: takt 15 S ja A tekst sõna "mil-lal" on kirjas suure algustähega, võiks olla väikese algustähega. (Sama loogika, nagu taktis 7) \nTaktid 13-16 naishäälte tekst visuaalselt madalamal, kui T oma. Võiks olla ühel kõrgusel, nagu taktides 5-8.'), cell('Sõnad', 'per_voice', 'A', 'Sopraniga sama tekst, samad ettepanekud.'), cell('Sõnad', 'per_voice', 'T', 'Vead: takt 13 sõnas "mei-e" silbituskriips puudu. Igas salmis on samas kohas silbituskriips sõnades puudu.\nTakt 13 "kus aga" sõnade vahe liiga väike, teksti halb lugeda.'), cell('Sõnad', 'per_voice', 'B', 'vead: takt 3 vale tekst, õige on 2x järjest "tim-pa, tim-pa". Sama on takt 7, takt 11, takt 15.'),
		cell('Strihhid', 'per_voice', 'S', null), cell('Strihhid', 'per_voice', 'A', 'Takt 6 ja 14. Legato on kirjas S+A rea kohal ja ei ole vajadust seda aldi hääles dubleerida (nagu fermaat loo viimases taktis)'), cell('Strihhid', 'per_voice', 'T', 'olemas'), cell('Strihhid', 'per_voice', 'B', 'olemas'),
		cell('Pidekaared', 'per_voice', 'S', 'olemas'), cell('Pidekaared', 'per_voice', 'A', 'olemas'), cell('Pidekaared', 'per_voice', 'T', 'olemas'), cell('Pidekaared', 'per_voice', 'B', 'olemas'),
		cell('Legatokaared', 'per_voice', 'S', '-'), cell('Legatokaared', 'per_voice', 'A', '-'), cell('Legatokaared', 'per_voice', 'T', 'olemas'), cell('Legatokaared', 'per_voice', 'B', '-'),
		cell('Fermaadid', 'per_voice', 'S', 'olemas'), cell('Fermaadid', 'per_voice', 'A', 'on loetav ja arusaadav'), cell('Fermaadid', 'per_voice', 'T', 'olemas'), cell('Fermaadid', 'per_voice', 'B', 'olemas'),
		cell('Jagunemised', 'per_voice', 'S', '-'), cell('Jagunemised', 'per_voice', 'A', '-'), cell('Jagunemised', 'per_voice', 'T', '-'), cell('Jagunemised', 'per_voice', 'B', '-'),
		cell('Häälte paigutus süsteemides', 'per_voice', 'S', 'paigutus on hea ja noot seega hästi loetav.'), cell('Häälte paigutus süsteemides', 'per_voice', 'A', 'paigutus on hea ja noot seega hästi loetav.'), cell('Häälte paigutus süsteemides', 'per_voice', 'T', 'Ettepanek on kirjas B lahtris'), cell('Häälte paigutus süsteemides', 'per_voice', 'B', 'ettepanek: A-osas on väga hea, et T ja B on noteeritud eraldi reale (erinevad rollid, erinevad rütmid, erinev tekst, erinevad dünaamikad). B-osas on neil sarnane roll, rütm ja sõnad on samad – siin noteeriksin T+B ühele reale. Annab paremini ülevaate ka tekkivatest harmooniatest (kus on T+B unisonis, millised intervallid häälte vahel tekivad).'),
		cell('Häälerühmade tähised süsteemi ees', 'per_voice', 'S', 'Ettepanek: Häälerühma tähis süsteemi ees on arusaamatu ("W"). Võiks kasutada üldtuntud tähiseid, nagu S ja A.'), cell('Häälerühmade tähised süsteemi ees', 'per_voice', 'A', 'Ettepanek on kirjas S lahtris'),
		cell('Kordusmärgid', 'per_voice', 'S', 'õige'), cell('Kordusmärgid', 'per_voice', 'A', 'õige'), cell('Kordusmärgid', 'per_voice', 'T', 'õige'), cell('Kordusmärgid', 'per_voice', 'B', 'õige'),
		cell('Kordusmärgid sõnadega', 'per_voice', 'S', '-'), cell('Kordusmärgid sõnadega', 'per_voice', 'A', '-'), cell('Kordusmärgid sõnadega', 'per_voice', 'T', '-'), cell('Kordusmärgid sõnadega', 'per_voice', 'B', '-'),
		cell('Vormiosade tähised', 'per_voice', 'S', 'olemas'), cell('Vormiosade tähised', 'per_voice', 'A', 'olemas'), cell('Vormiosade tähised', 'per_voice', 'T', 'olemas'), cell('Vormiosade tähised', 'per_voice', 'B', 'olemas'),
		cell('Dünaamika tähised', 'per_voice', 'S', 'olemas'), cell('Dünaamika tähised', 'per_voice', 'A', 'Takt 6 ja 14. Forte on kirjas S+A rea kohal ja ei ole vajadust seda aldi hääles dubleerida. (nagu forte tähis taktides 21 ja 25)'), cell('Dünaamika tähised', 'per_voice', 'T', 'olemas'), cell('Dünaamika tähised', 'per_voice', 'B', 'olemas'),
		cell('Dünaamika sõnadega', 'per_voice', 'S', '-'), cell('Dünaamika sõnadega', 'per_voice', 'A', '-'), cell('Dünaamika sõnadega', 'per_voice', 'T', 'olemas'), cell('Dünaamika sõnadega', 'per_voice', 'B', 'olemas'),
		// whole_piece
		cell('Pealkiri', 'whole_piece', null, 'Õige'), cell('Helilooja', 'whole_piece', null, 'Puudu. Originaalnoodis ka ei ole, aga kuna tegemist on eraldi noodiga, mitte terve kogumikuga, siis võiks olla kirjas ka helilooja nimi'), cell('Sõnade autor', 'whole_piece', null, 'olemas (Tõstamaa)'), cell('Tempo tähis loo alguses', 'whole_piece', null, 'olemas, õige'), cell('Tempo, dünaamika jm tähised loo sees', 'whole_piece', null, 'olemas, õige'), cell('Täpsustavad tekstid loo sees', 'whole_piece', null, '-'), cell('Täpsustavad tekstid noodi all', 'whole_piece', null, '-'),
	],
};

// ── p-08: Sööge, langud (UUS template) ──

export const EXCEL_P08: ReviewDataset = {
	piece_title: 'Sööge langud', piece_id: 'p-08', source: 'excel',
	cells: [
		// per_voice
		cell('Noodikõrgused', 'per_voice', 'S', 'Viga: takt 13, 1.löögi viimane 16-ndik on hetkel si-noot. Õige on  do-noot (c2).'), cell('Noodikõrgused', 'per_voice', 'A', 'õige'), cell('Noodikõrgused', 'per_voice', 'T', 'õige'), cell('Noodikõrgused', 'per_voice', 'B', 'õige'),
		cell('Pausid', 'per_voice', 'S', 'õige'), cell('Pausid', 'per_voice', 'A', 'õige'), cell('Pausid', 'per_voice', 'T', 'õige'), cell('Pausid', 'per_voice', 'B', 'õige'),
		cell('Rütmid', 'per_voice', 'S', 'õige'), cell('Rütmid', 'per_voice', 'A', 'õige'), cell('Rütmid', 'per_voice', 'T', 'õige'), cell('Rütmid', 'per_voice', 'B', 'õige'),
		cell('Sõnad', 'per_voice', 'S', 'Ettepanek: takt 39, kõikidel häälerühmadel suurem vahe sõnade "oleme" ja "hoolsad" vahele. Hetkel liiga koos ja raske lugeda. Sõnas "hoolsad" -sad silp silbituskriipsust veidi eemale nihutada. Hetkel on silp kriipsuga liiga koos ja raske lugeda. \nTakti 43-44 on samuti sõnad liiga koos, aga siin ei saa teisiti teha, sest muidu läheb noot pikemaks. Praegune süsteemide asetus on hea. \nTakt 71-81, kõikides häälerühmades sõnade "maha" ja "siis" vahele suurem vahe. Hetkel liiga koos ja raske lugeda. \nViga: takt 45, kõikidel häälerühmadel esimese sõna "kavalad" viimases silbis on a-täht puudu. \nTAkt 75, kõikides häälerühmades sõna "maha" suure algustähega. Õige on väikese algustähega. \n\nTakt 10, takt 14, hüüumärk puudu (hetkel on koma). \nTAkt 47, väike algustäht. Õige on suur algustäht.\nTakt 50, vale sõna. Õige on "meie".\nTakt 79, suur algustäht. Õige on väikese algustähega.'), cell('Sõnad', 'per_voice', 'A', 'Viga: takt 47, väike algustäht. Õige on suur algustäht. \nTakt 50 vale sõna. Õige on "meie".\nTakt 80, suur algustäht. Õige on väikese algustähega.'), cell('Sõnad', 'per_voice', 'T', 'Viga: takt 5, takt 9, sõna "söö-ge" on suure algustähega. Õige on väikese algustähega. \nTakt 12, hüüumärk puudu. Praegu on kirjas koma, õige on selle asemel hüüumärk.\nTakt 62, viimase sõna järel on koma puudu.\nTakt 47, sõna järelt on koma puudu.\nTakt 48, vale sõna. Õige on "mei-e".\nTakt 62, takti lõpust koma puudu. \n\n\nTakt 31-32, hüüumärk ja suur algustäht on õige parandus võrreldes originaaliga. \nTakt 58, takti lõpus koma on õige.'), cell('Sõnad', 'per_voice', 'B', 'Viga: takt 5, takt 9, sõna "söö-ge" on suure algustähega. Õige on väikese algustähega. \nTakt 12, hüüumärk puudu. Praegu on kirjas koma, õige on selle asemel hüüumärk.\nTakt 62, viimase sõna järel on koma puudu.'),
		cell('Strihhid', 'per_voice', 'S', 'Viga: takt 85-86, kõikides häälerühmades rõhkude asukoht silbil "sai-" on vales kohas (taktis 85). Õige on rõhk takti 86 esimesel 8-ndikul.'), cell('Strihhid', 'per_voice', 'A', 'Viga on kirjas S lahtris.'), cell('Strihhid', 'per_voice', 'T', 'Viga on kirjas S lahtris.'), cell('Strihhid', 'per_voice', 'B', 'Viga on kirjas S lahtris.'),
		cell('Pidekaared', 'per_voice', 'S', 'Viga: Takt 21, pidekaar sõnal "ärge". Õige on ilma pidekaareta.'), cell('Pidekaared', 'per_voice', 'A', 'olemas, õige'), cell('Pidekaared', 'per_voice', 'T', 'Viga: Takt 21, pidekaar sõnal "ärge". Õige on ilma pidekaareta.'), cell('Pidekaared', 'per_voice', 'B', 'olemas, õige'),
		cell('Legatokaared', 'per_voice', 'S', 'olemas, õige'), cell('Legatokaared', 'per_voice', 'A', 'Takt 66, väga hea tähelepanek, et originaalis oli siin legatokaar puudu. :)'), cell('Legatokaared', 'per_voice', 'T', 'olemas, õige'), cell('Legatokaared', 'per_voice', 'B', 'olemas, õige'),
		cell('Fermaadid', 'per_voice', 'S', 'Vead: Takt 38, takt 42, kõikides häälerühmades fermaat ei ole kohakuti hingamiskomaga. Õige on see, kui koma on visuaalselt täpselt fermaadi all.\nTakt 70, fermaatide alt hingamiskoma puudu'), cell('Fermaadid', 'per_voice', 'A', 'Viga on kirjas S lahtris.'), cell('Fermaadid', 'per_voice', 'T', 'Viga on kirjas S lahtris.'), cell('Fermaadid', 'per_voice', 'B', 'Viga on kirjas S lahtris.'),
		cell('Jagunemised', 'per_voice', 'S', '-'), cell('Jagunemised', 'per_voice', 'A', '-'), cell('Jagunemised', 'per_voice', 'T', 'olemas, õige'), cell('Jagunemised', 'per_voice', 'B', '-'),
		cell('Dünaamika tähised', 'per_voice', 'S', 'olemas, õige'), cell('Dünaamika tähised', 'per_voice', 'A', 'Viga: takt 21, forte tähis puudu.'), cell('Dünaamika tähised', 'per_voice', 'T', 'olemas, õige'), cell('Dünaamika tähised', 'per_voice', 'B', 'olemas, õige'),
		cell('Dünaamika sõnadega', 'per_voice', 'S', 'olemas, õige'), cell('Dünaamika sõnadega', 'per_voice', 'A', 'olemas, õige'), cell('Dünaamika sõnadega', 'per_voice', 'T', 'olemas, õige'), cell('Dünaamika sõnadega', 'per_voice', 'B', 'olemas, õige'),
		cell('Muud märgid', 'per_voice', 'S', '-'), cell('Muud märgid', 'per_voice', 'A', 'Viga: takt 55, takt 63, takt 75, noole asukoht ja asend vale. Õige on see, kui nool paikneb noodipeast all pool, diagonaalis nii et noodi pea juhib tähelepanu aldi partiile. Sellega antakse märku, et meloodialiin liigub selle koha peal mööda aldipartiid.'), cell('Muud märgid', 'per_voice', 'T', '-'), cell('Muud märgid', 'per_voice', 'B', 'Viga: takt 59, noole asukoht ja asend vale. Õige on see, kui nool paikneb noodipeast all pool, diagonaalis nii et noodi pea juhib tähelepanu bassi partiile. Sellega antakse märku, et meloodialiin liigub selle koha peal mööda bassipartiid.'),
		// whole_piece
		cell('Pealkiri', 'whole_piece', null, 'õige'), cell('Helilooja', 'whole_piece', null, 'õige \nSoovi korral võib lisada ka helilooja sünni-surmadaatumid, aga ei pea'), cell('Sõnade autor', 'whole_piece', null, 'Ettepanek: kirjutaksin pealkirja alla sulgudesse "Kihnu", sest see on kogumikust välja võetu noot ja nii ei ole teada, et tegemist on "Kihnu" loo ja tekstiga. Selliselt on "tekstiautor" ka kirjas.'), cell('Helistik', 'whole_piece', null, 'õige'), cell('Taktimõõt', 'whole_piece', null, 'õiged'),
		cell('Häälte paigutus süsteemides', 'whole_piece', null, 'Korras. Noot on loogiliselt jälgitav ja loetav.'), cell('Häälerühmade tähised süsteemi ees', 'whole_piece', null, 'olemas, õiged\nSoovi korral võib ka aldi esimese süsteemi ees kirjutada eesti keeles, aga ei pea.'), cell('Kordusmärgid', 'whole_piece', null, '-'), cell('Kordusmärgid sõnadega', 'whole_piece', null, '-'), cell('Tempo tähis loo alguses', 'whole_piece', null, 'olemas, õige'), cell('Tempo, dünaamika jm tähised loo sees', 'whole_piece', null, 'Viga: takt 63. Puudu on tempotähis (sõnadega): poco a poco accelerando.\nTakt 73. Tempo kirjeldus on vale takti kohal. Õige on poco a poco accelerando al fine takti 73 kohal (hetkel on takti 71 kohal, mis tekitab kiirenduse takt varem)'), cell('Vormiosade tähised', 'whole_piece', null, 'Viga:  kasti sees olevad numbrid on segadust tekitavad. Tavaliselt on nendes kastides kirjas taktinumbrid. Praegu noodis olevad numbrid ei vasta taktinumbritele, see tekitab partii õppimisel segadust ja ei aita ka vormiliselt nooti lugeda. Originaalnoodis sedalaadi vormitähised puuduvad ja mina võtaksin need ka uuesti trükitud noodist ära.'), cell('Täpsustavad tekstid loo sees', 'whole_piece', null, '-'), cell('Täpsustavad tekstid noodi all', 'whole_piece', null, 'Ettepanek: Viimane takt, kirjas on loo valmimisaasta, aga see info võiks olla viimase süsteemi all. Hetkel mõjub see nagu B häälerühmale mõeldud juhis. Puudu on teine aastaarv, õige on "1959/1994"'),
	],
};

// ── p-11: Ei või õnneta elada (UUS template, 5 häält) ──

export const EXCEL_P11: ReviewDataset = {
	piece_title: 'Ei või õnneta elada', piece_id: 'p-11', source: 'excel',
	cells: [
		cell('Noodikõrgused', 'per_voice', 'S', 'õige'), cell('Noodikõrgused', 'per_voice', 'A', 'õige'), cell('Noodikõrgused', 'per_voice', 'T', 'õige'), cell('Noodikõrgused', 'per_voice', 'B', 'õige'), cell('Noodikõrgused', 'per_voice', 'soolo', 'õige'),
		cell('Pausid', 'per_voice', 'S', '-'), cell('Pausid', 'per_voice', 'A', '-'), cell('Pausid', 'per_voice', 'T', '-'), cell('Pausid', 'per_voice', 'B', '-'), cell('Pausid', 'per_voice', 'soolo', '-'),
		cell('Rütmid', 'per_voice', 'S', 'õige'), cell('Rütmid', 'per_voice', 'A', 'õige'), cell('Rütmid', 'per_voice', 'T', 'õige'), cell('Rütmid', 'per_voice', 'B', 'õige'), cell('Rütmid', 'per_voice', 'soolo', 'õige'),
		cell('Sõnad', 'per_voice', 'S', 'Ettepanek: takt 13, takt 17, sõnade vahel liiga väike vahe. Raske teksti lugeda.'), cell('Sõnad', 'per_voice', 'A', 'õige'), cell('Sõnad', 'per_voice', 'T', 'õige'), cell('Sõnad', 'per_voice', 'B', 'õige'), cell('Sõnad', 'per_voice', 'soolo', 'Viga:  takt 35 topelt L-häälik. Õige on "kü-la".\nTakt 50, takt 54, sõnade vahel liiga väike vahe. Teksti raske lugeda.'),
		cell('Strihhid', 'per_voice', 'S', 'olemas, õige'), cell('Strihhid', 'per_voice', 'A', 'olemas, õige'), cell('Strihhid', 'per_voice', 'T', 'olemas, õige'), cell('Strihhid', 'per_voice', 'B', 'olemas, õige'), cell('Strihhid', 'per_voice', 'soolo', '-'),
		cell('Pidekaared', 'per_voice', 'S', 'V: Takt 13, takt 17, pidekaar on üleliigne. Sõnas "kü-la" on 2 silpi, pidekaar annab mõista, et on 1 silp. Mõistan, et punktiirpide eesmärk on edasi anda laulmistunnetust, aga seda õpetab dirigent proovis ja seda noodis dubleerida ei ole vaja. Pidekaared annavad infot rütmi kohta.'), cell('Pidekaared', 'per_voice', 'A', 'olemas, õige'), cell('Pidekaared', 'per_voice', 'T', 'olemas, õige'), cell('Pidekaared', 'per_voice', 'B', 'olemas, õige'), cell('Pidekaared', 'per_voice', 'soolo', 'V: takt 33, pidekaar on üleliigne.  Sõnas "jää-gu" on 2 silpi, pidekaar annab mõista, et on 1 silp.'),
		cell('Legatokaared', 'per_voice', 'S', 'olemas, õige'), cell('Legatokaared', 'per_voice', 'A', 'olemas, õige'), cell('Legatokaared', 'per_voice', 'T', 'olemas, õige'), cell('Legatokaared', 'per_voice', 'B', 'olemas, õige'), cell('Legatokaared', 'per_voice', 'soolo', 'olemas, õige'),
		cell('Fermaadid', 'per_voice', 'S', '-'), cell('Fermaadid', 'per_voice', 'A', '-'), cell('Fermaadid', 'per_voice', 'T', '-'), cell('Fermaadid', 'per_voice', 'B', '-'), cell('Fermaadid', 'per_voice', 'soolo', '-'),
		cell('Jagunemised', 'per_voice', 'S', '-'), cell('Jagunemised', 'per_voice', 'A', '-'), cell('Jagunemised', 'per_voice', 'T', '-'), cell('Jagunemised', 'per_voice', 'B', '-'), cell('Jagunemised', 'per_voice', 'soolo', '-'),
		cell('Dünaamika tähised', 'per_voice', 'S', 'Ettepanek:  takt 87, kõikides häältes, cresc kahvel algab originaalnoodis takt 86 lõpust.'), cell('Dünaamika tähised', 'per_voice', 'A', 'Ettepanek on S lahtris.'), cell('Dünaamika tähised', 'per_voice', 'T', 'Ettepanek on S lahtris'), cell('Dünaamika tähised', 'per_voice', 'B', 'Ettepanek on S lahtris'), cell('Dünaamika tähised', 'per_voice', 'soolo', 'olemas, õige'),
		cell('Dünaamika sõnadega', 'per_voice', 'S', 'olemas, õige'), cell('Dünaamika sõnadega', 'per_voice', 'A', 'olemas, õige'), cell('Dünaamika sõnadega', 'per_voice', 'T', 'olemas, õige'), cell('Dünaamika sõnadega', 'per_voice', 'B', 'olemas, õige'), cell('Dünaamika sõnadega', 'per_voice', 'soolo', '-'),
		cell('Muud märgid', 'per_voice', 'S', '-'), cell('Muud märgid', 'per_voice', 'A', '-'), cell('Muud märgid', 'per_voice', 'T', '-'), cell('Muud märgid', 'per_voice', 'B', '-'), cell('Muud märgid', 'per_voice', 'soolo', '-'),
		// whole_piece
		cell('Pealkiri', 'whole_piece', null, 'olemas, õige'), cell('Helilooja', 'whole_piece', null, 'olemas, õige\nEttepanek: soovi korral võib lisada eludaatumid, aga ei pea'), cell('Sõnade autor', 'whole_piece', null, 'Ettepanek: kirjutaksin pealkirja alla sulgudesse "Kihnu"'), cell('Helistik', 'whole_piece', null, 'õige'), cell('Taktimõõt', 'whole_piece', null, 'õige'),
		cell('Häälte paigutus süsteemides', 'whole_piece', null, 'Ettepanek: Solisti rida ei ole süsteemide alguses kriipsuga kooriinstrumendi süsteemiga koos, aga peaks olema'), cell('Häälerühmade tähised süsteemi ees', 'whole_piece', null, 'Olemas, õige'), cell('Kordusmärgid', 'whole_piece', null, '-'), cell('Kordusmärgid sõnadega', 'whole_piece', null, '-'), cell('Tempo tähis loo alguses', 'whole_piece', null, 'olemas, õige'), cell('Tempo, dünaamika jm tähised loo sees', 'whole_piece', null, '-'),
		cell('Vormiosade tähised', 'whole_piece', null, 'Taktinumbrid süsteemi keskel on hea lisandus. Vajalik on aga ühe ja sama süsteemsuse kasutamine terves loos. Takt 64, number on üleliigne. Takt 69, 89, 97, 105 takti number on puudu.'), cell('Täpsustavad tekstid loo sees', 'whole_piece', null, '-'), cell('Täpsustavad tekstid noodi all', 'whole_piece', null, '-'),
	],
};

// ── p-12: Kohus koju minna ──

export const EXCEL_P12: ReviewDataset = {
	piece_title: 'Kohus koju minna', piece_id: 'p-12', source: 'excel',
	cells: [
		cell('Noodikõrgused', 'per_voice', 'S', 'õige'), cell('Noodikõrgused', 'per_voice', 'A', 'õige'), cell('Noodikõrgused', 'per_voice', 'T', 'õige'), cell('Noodikõrgused', 'per_voice', 'B', 'Viga: takt 11-12, seal peab olema ainult e-noot.'),
		cell('Pausid', 'per_voice', 'S', 'õige, olemas'), cell('Pausid', 'per_voice', 'A', 'õige, olemas'), cell('Pausid', 'per_voice', 'T', 'õige, olemas'), cell('Pausid', 'per_voice', 'B', 'õige, olemas'),
		cell('Rütmid', 'per_voice', 'S', 'õige'), cell('Rütmid', 'per_voice', 'A', 'õige'), cell('Rütmid', 'per_voice', 'T', 'õige'), cell('Rütmid', 'per_voice', 'B', 'õige'),
		cell('Sõnad', 'per_voice', 'S', 'Ettepanek: takt 17, sõnade vahe "augud" ja "suured" vahel võiks olla suurem.'), cell('Sõnad', 'per_voice', 'A', 'Ettepanek: Takt 3, 7 ja 19. Mm teksti meeldetuletuse võtaksin ridade algusest ära'), cell('Sõnad', 'per_voice', 'T', 'Ettepanek: takt 3, õigekirjaliselt oleks vist õige "akame, mehed, minema", nii et sõna mehed on mõlemalt poolt komadega eraldatud.'), cell('Sõnad', 'per_voice', 'B', 'Ettepanekud on teistes lahtrites.'),
		cell('Strihhid', 'per_voice', 'S', '-'), cell('Strihhid', 'per_voice', 'A', '-'), cell('Strihhid', 'per_voice', 'T', '-'), cell('Strihhid', 'per_voice', 'B', '-'),
		cell('Pidekaared', 'per_voice', 'S', 'õige'), cell('Pidekaared', 'per_voice', 'A', 'õige'), cell('Pidekaared', 'per_voice', 'T', 'õige'), cell('Pidekaared', 'per_voice', 'B', 'õige'),
		cell('Legatokaared', 'per_voice', 'S', '-'), cell('Legatokaared', 'per_voice', 'A', '-'), cell('Legatokaared', 'per_voice', 'T', '-'), cell('Legatokaared', 'per_voice', 'B', '-'),
		cell('Fermaadid', 'per_voice', 'S', '-'), cell('Fermaadid', 'per_voice', 'A', '-'), cell('Fermaadid', 'per_voice', 'T', '-'), cell('Fermaadid', 'per_voice', 'B', '-'),
		cell('Jagunemised', 'per_voice', 'S', '-'), cell('Jagunemised', 'per_voice', 'A', '-'), cell('Jagunemised', 'per_voice', 'T', '-'), cell('Jagunemised', 'per_voice', 'B', '-'),
		cell('Dünaamika tähised', 'per_voice', 'S', 'õige'), cell('Dünaamika tähised', 'per_voice', 'A', 'Viga:  viimases taktis on decresc kahvel puudu.'), cell('Dünaamika tähised', 'per_voice', 'T', 'õige'), cell('Dünaamika tähised', 'per_voice', 'B', 'õige'),
		cell('Dünaamika sõnadega', 'per_voice', 'S', '-'), cell('Dünaamika sõnadega', 'per_voice', 'A', '-'), cell('Dünaamika sõnadega', 'per_voice', 'T', '-'), cell('Dünaamika sõnadega', 'per_voice', 'B', '-'),
		cell('Muud märgid', 'per_voice', 'S', '-'), cell('Muud märgid', 'per_voice', 'A', '-'), cell('Muud märgid', 'per_voice', 'T', '-'), cell('Muud märgid', 'per_voice', 'B', '-'),
		// whole_piece
		cell('Pealkiri', 'whole_piece', null, 'õige'), cell('Helilooja', 'whole_piece', null, 'Ettepanek: helilooja nimi on puudu. Mina lisaksin, sest tegemist on üksiku noodiga, mitte kogumikuga.'), cell('Sõnade autor', 'whole_piece', null, 'olemas, teksti päritolu pealkirja all'), cell('Helistik', 'whole_piece', null, 'õige'), cell('Taktimõõt', 'whole_piece', null, 'õige'),
		cell('Häälte paigutus süsteemides', 'whole_piece', null, 'Ettepanek: noteeriksin loo koorifaktuuris S+A ühele reale ja T+B teisele reale.'), cell('Häälerühmade tähised süsteemi ees', 'whole_piece', null, 'õige, olemas'), cell('Kordusmärgid', 'whole_piece', null, '-'), cell('Kordusmärgid sõnadega', 'whole_piece', null, '-'), cell('Tempo tähis loo alguses', 'whole_piece', null, 'õige'),
		cell('Tempo, dünaamika jm tähised loo sees', 'whole_piece', null, 'Viga: kirjas on poole kiirem tempo. Õige on 60.'), cell('Vormiosade tähised', 'whole_piece', null, '-'), cell('Täpsustavad tekstid loo sees', 'whole_piece', null, '-'), cell('Täpsustavad tekstid noodi all', 'whole_piece', null, '-'),
	],
};

// ── p-09: Petis peiu ──

export const EXCEL_P09: ReviewDataset = {
	piece_title: 'Petis peiu', piece_id: 'p-09', source: 'excel',
	cells: [
		cell('Noodikõrgused', 'per_voice', 'S', 'õige'), cell('Noodikõrgused', 'per_voice', 'A', 'õige'), cell('Noodikõrgused', 'per_voice', 'T', 'õige'), cell('Noodikõrgused', 'per_voice', 'B', 'õige'),
		cell('Pausid', 'per_voice', 'S', 'Ettepanek: alates takt 3, kui on tarve takt pausi, siis märgiksin ühe sümbiliga (nagu originaalnoodis)'), cell('Pausid', 'per_voice', 'A', 'Ettepanek: alates takt 1, kui on tarve takt pausi, siis märgiksin ühe sümbiliga (nagu originaalnoodis)'),
		cell('Rütmid', 'per_voice', 'S', 'õige'), cell('Rütmid', 'per_voice', 'A', 'õige'), cell('Rütmid', 'per_voice', 'T', 'õige'), cell('Rütmid', 'per_voice', 'B', 'õige'),
		cell('Sõnad', 'per_voice', 'S', 'Viga: takt 5, 2. salm algab väikese algustähega (hetkel on suurega, õige on "ära")'), cell('Sõnad', 'per_voice', 'A', 'Viga: takt 7, 4. salm algab suure algustähega (hetkel on väikesega, õige on "Lubasid")'), cell('Sõnad', 'per_voice', 'T', 'õige'), cell('Sõnad', 'per_voice', 'B', 'õige'),
		cell('Strihhid', 'per_voice', 'S', 'õige, olemas'), cell('Strihhid', 'per_voice', 'A', 'õige, olemas'), cell('Strihhid', 'per_voice', 'T', 'õige, olemas'), cell('Strihhid', 'per_voice', 'B', 'õige, olemas'),
		cell('Pidekaared', 'per_voice', 'S', 'õige, olemas'), cell('Pidekaared', 'per_voice', 'A', 'õige, olemas'), cell('Pidekaared', 'per_voice', 'T', 'õige, olemas'), cell('Pidekaared', 'per_voice', 'B', 'õige, olemas'),
		cell('Legatokaared', 'per_voice', 'S', 'õige, olemas'), cell('Legatokaared', 'per_voice', 'A', 'õige, olemas'), cell('Legatokaared', 'per_voice', 'T', 'õige, olemas'), cell('Legatokaared', 'per_voice', 'B', 'õige, olemas'),
		cell('Fermaadid', 'per_voice', 'S', '-'), cell('Fermaadid', 'per_voice', 'A', '-'), cell('Fermaadid', 'per_voice', 'T', '-'), cell('Fermaadid', 'per_voice', 'B', '-'),
		cell('Jagunemised', 'per_voice', 'S', '-'), cell('Jagunemised', 'per_voice', 'A', '-'), cell('Jagunemised', 'per_voice', 'T', '-'), cell('Jagunemised', 'per_voice', 'B', '-'),
		cell('Dünaamika tähised', 'per_voice', 'S', 'Viga: takt 1, mf puudu.'), cell('Dünaamika tähised', 'per_voice', 'A', 'Viga: takt 2, mf puudu.'), cell('Dünaamika tähised', 'per_voice', 'T', 'Viga: T+B, takt 4, mf puudu.'), cell('Dünaamika tähised', 'per_voice', 'B', 'Viga kirjas T lahtris'),
		cell('Dünaamika sõnadega', 'per_voice', 'S', '-'), cell('Dünaamika sõnadega', 'per_voice', 'A', '-'), cell('Dünaamika sõnadega', 'per_voice', 'T', '-'), cell('Dünaamika sõnadega', 'per_voice', 'B', '-'),
		cell('Muud märgid', 'per_voice', 'S', 'Takt 11, unisoni märge on siin hea valik'), cell('Muud märgid', 'per_voice', 'A', 'sama, mis S'), cell('Muud märgid', 'per_voice', 'T', 'olemas, õige'), cell('Muud märgid', 'per_voice', 'B', 'olemas, õige'),
		// whole_piece
		cell('Pealkiri', 'whole_piece', null, 'õige, olemas'), cell('Helilooja', 'whole_piece', null, 'Ettepanek:  helilooja nimi on puudu. Mina lisaksin, sest tegemist on üksiku noodiga, mitte kogumikuga.'), cell('Sõnade autor', 'whole_piece', null, 'olemas, teksti päritolu pealkirja all.'), cell('Helistik', 'whole_piece', null, 'õige'), cell('Taktimõõt', 'whole_piece', null, 'õige'),
		cell('Häälte paigutus süsteemides', 'whole_piece', null, 'õige, nooti on hea lugeda'), cell('Häälerühmade tähised süsteemi ees', 'whole_piece', null, 'õige, olemas'), cell('Kordusmärgid', 'whole_piece', null, 'õige, olemas'), cell('Kordusmärgid sõnadega', 'whole_piece', null, '-'), cell('Tempo tähis loo alguses', 'whole_piece', null, 'õige, olemas'),
		cell('Tempo, dünaamika jm tähised loo sees', 'whole_piece', null, '-'), cell('Vormiosade tähised', 'whole_piece', null, '-'), cell('Täpsustavad tekstid loo sees', 'whole_piece', null, '-'), cell('Täpsustavad tekstid noodi all', 'whole_piece', null, '-'),
	],
};

// ── p-10: Palju veini (Võtmed per_voice!) ──

export const EXCEL_P10: ReviewDataset = {
	piece_title: 'Palju veini', piece_id: 'p-10', source: 'excel',
	cells: [
		cell('Noodikõrgused', 'per_voice', 'S', 'õige'), cell('Noodikõrgused', 'per_voice', 'A', 'õige'), cell('Noodikõrgused', 'per_voice', 'T', 'õige'), cell('Noodikõrgused', 'per_voice', 'B', 'õige'),
		cell('Pausid', 'per_voice', 'S', 'õige'), cell('Pausid', 'per_voice', 'A', 'õige'), cell('Pausid', 'per_voice', 'T', 'õige'), cell('Pausid', 'per_voice', 'B', 'õige'),
		cell('Rütmid', 'per_voice', 'S', 'õige'), cell('Rütmid', 'per_voice', 'A', 'õige'), cell('Rütmid', 'per_voice', 'T', 'õige'), cell('Rütmid', 'per_voice', 'B', 'õige'),
		cell('Sõnad', 'per_voice', 'S', 'Viga: takt 5, esimene sõna on vale, õige on "kirs-tu" (hetkel on kirjas "karstu") \nEttepanek: takt 11, originaali järgi on siin punkt, aga peale värsirida tule veel "kaas\'ke" ja mina paneksin siia värsirea järele koma'), cell('Sõnad', 'per_voice', 'A', 'õige'), cell('Sõnad', 'per_voice', 'T', 'õige'), cell('Sõnad', 'per_voice', 'B', 'õige'),
		cell('Strihhid', 'per_voice', 'S', '-'), cell('Strihhid', 'per_voice', 'A', '-'), cell('Strihhid', 'per_voice', 'T', '-'), cell('Strihhid', 'per_voice', 'B', '-'),
		cell('Pidekaared', 'per_voice', 'S', 'õige, olemas'), cell('Pidekaared', 'per_voice', 'A', 'õige, olemas'), cell('Pidekaared', 'per_voice', 'T', 'õige, olemas'), cell('Pidekaared', 'per_voice', 'B', 'õige, olemas'),
		cell('Legatokaared', 'per_voice', 'S', '-'), cell('Legatokaared', 'per_voice', 'A', '-'), cell('Legatokaared', 'per_voice', 'T', '-'), cell('Legatokaared', 'per_voice', 'B', '-'),
		cell('Fermaadid', 'per_voice', 'S', 'Viga: S+A, takt 16, fermaat puudu.'), cell('Fermaadid', 'per_voice', 'A', 'Viga kirjas S lahtris'), cell('Fermaadid', 'per_voice', 'T', 'õige, olemas'), cell('Fermaadid', 'per_voice', 'B', 'õige, olemas'),
		cell('Jagunemised', 'per_voice', 'S', '-'), cell('Jagunemised', 'per_voice', 'A', 'õige, olemas'), cell('Jagunemised', 'per_voice', 'T', '-'), cell('Jagunemised', 'per_voice', 'B', '-'),
		cell('Dünaamika tähised', 'per_voice', 'S', 'õige, olemas'), cell('Dünaamika tähised', 'per_voice', 'A', 'Ettepanek: kui S ja A ühele reale noteerida, siis lisaksin aldi partii algusesse ikkagi p tähise.'), cell('Dünaamika tähised', 'per_voice', 'T', 'õige, olemas'), cell('Dünaamika tähised', 'per_voice', 'B', 'õige, olemas'),
		cell('Dünaamika sõnadega', 'per_voice', 'S', '-'), cell('Dünaamika sõnadega', 'per_voice', 'A', '-'), cell('Dünaamika sõnadega', 'per_voice', 'T', '-'), cell('Dünaamika sõnadega', 'per_voice', 'B', '-'),
		cell('Muud märgid', 'per_voice', 'S', '-'), cell('Muud märgid', 'per_voice', 'A', '-'), cell('Muud märgid', 'per_voice', 'T', '-'), cell('Muud märgid', 'per_voice', 'B', '-'),
		// whole_piece
		cell('Pealkiri', 'whole_piece', null, 'õige'), cell('Helilooja', 'whole_piece', null, 'Ettepanek: helilooja nimi on puudu.'), cell('Sõnade autor', 'whole_piece', null, 'olemas, teksti päritolu pealkirja all.'), cell('Helistik', 'whole_piece', null, 'õige'), cell('Taktimõõt', 'whole_piece', null, 'õige'),
		// Võtmed — Excelis per_voice lahtrid!
		cell('Võtmed', 'per_voice', 'S', 'õige'), cell('Võtmed', 'per_voice', 'A', 'õige'), cell('Võtmed', 'per_voice', 'T', 'Ettepanek: noteeriksin T rea bassivõtmes, sest T on harjunud bassivõtit lugema, aga B tenorivõtit mitte.'), cell('Võtmed', 'per_voice', 'B', 'Ettepanek on kirjas T lahtris'),
		cell('Häälte paigutus süsteemides', 'whole_piece', null, 'Ettepanek: S ja A võiksid olla noteeritud ühele reale, sest siis saab nooti ka harmooniliselt lugeda.'),
		// Häälerühmade tähised — Excelis per_voice!
		cell('Häälerühmade tähised süsteemi ees', 'per_voice', 'S', 'õige'), cell('Häälerühmade tähised süsteemi ees', 'per_voice', 'A', 'õige'), cell('Häälerühmade tähised süsteemi ees', 'per_voice', 'T', 'Ettepanek: kasutaksin originaali tähiseid (mille järgi laulab siin ainult T)'),
		cell('Kordusmärgid', 'whole_piece', null, 'õige, olemas'), cell('Kordusmärgid sõnadega', 'whole_piece', null, '-'), cell('Tempo tähis loo alguses', 'whole_piece', null, 'olemas, õige'),
		cell('Tempo, dünaamika jm tähised loo sees', 'whole_piece', null, '-'), cell('Vormiosade tähised', 'whole_piece', null, '-'), cell('Täpsustavad tekstid loo sees', 'whole_piece', null, '-'),
	],
};

// ── p-01: Laulu võim (T puudu! ainult S, A, B) ──

export const EXCEL_P01: ReviewDataset = {
	piece_title: 'Laulu võim', piece_id: 'p-01', source: 'excel',
	cells: [
		cell('Noodikõrgused', 'per_voice', 'S', 'Viga: takt 10, õige on pidena üks pikk noodikõrgus mõlemas sopranis (hetkel on noodis kopeeritud 8.takti partii)'), cell('Noodikõrgused', 'per_voice', 'A', 'Viga: takt 9, õige on pidena üks pikk noodikõrgus mõlemas aldis (hetkel on noodis kopeeritud 7.takti partii)'), cell('Noodikõrgused', 'per_voice', 'B', 'Õige'),
		cell('Pausid', 'per_voice', 'S', 'õige'), cell('Pausid', 'per_voice', 'A', 'Viga: takt 10, väga nutikas lahendus A noteerimiseks, et ei peaks nii palju kordusi välja kirjutama, aga viga jääb ikkagi sisse, sest aldi pausi 3.voldis ei ole kusagil noodis olemas.'), cell('Pausid', 'per_voice', 'B', 'Ettepanek: takt 1, takt 2. Et lihtsustada noodi lugemist ja mitte kasutada üleliigselt sümboleid, siis noteeriksin pausid 3-löögilisena.'),
		cell('Rütmid', 'per_voice', 'S', 'Viga: takt 10, õige on 3-löögiline noot pidega järgmise noodivältusega kokku.'), cell('Rütmid', 'per_voice', 'A', 'Viga: takt 9, õige on 3-löögiline noot pidega järgmise noodivältusega kokku.'), cell('Rütmid', 'per_voice', 'B', 'Viga: takt 7, takt 8. 3. värsireas on 1.löögil õige rütm ti-ri-ti.\nTakt 14. Lugu lõppeb 8ndik pausiga.'),
		cell('Sõnad', 'per_voice', 'S', 'õige'), cell('Sõnad', 'per_voice', 'A', 'õige'), cell('Sõnad', 'per_voice', 'B', 'Viga: takt 3. Õige on esimene sõna väikese algustähega "pisut"'),
		cell('Strihhid', 'per_voice', 'S', '-'), cell('Strihhid', 'per_voice', 'A', '-'), cell('Strihhid', 'per_voice', 'T', '-'), cell('Strihhid', 'per_voice', 'B', '-'),
		cell('Pidekaared', 'per_voice', 'S', 'Viga: 5.takt, pidekaar takti algusest puudu (noot jääb 1.-2. voldist pidesse)'), cell('Pidekaared', 'per_voice', 'A', 'õige'), cell('Pidekaared', 'per_voice', 'B', 'Viga: takt 6, 1.-2. voldi pidekaar on puudu.'),
		cell('Legatokaared', 'per_voice', 'S', 'Ettepanek: takt 8, kui 4.volt eraldi välja kirjutada, siis peab legatokaar ka sellesse takti ulatuma.\nTakt 10. Kui rütm on õige, siis selles taktis legatokaart ei ole.'), cell('Legatokaared', 'per_voice', 'A', 'Ettepanek: takt 9. Kui rütm on õige, siis seles taktis legatokaart ei ole.'), cell('Legatokaared', 'per_voice', 'B', '-'),
		cell('Fermaadid', 'per_voice', 'S', '-'), cell('Fermaadid', 'per_voice', 'A', '-'), cell('Fermaadid', 'per_voice', 'T', '-'), cell('Fermaadid', 'per_voice', 'B', '-'),
		cell('Jagunemised', 'per_voice', 'S', 'Olemas, vead noodikõrgustes ja rütmides'), cell('Jagunemised', 'per_voice', 'A', 'olemas, vead noodikõrgustes ja rütmides'), cell('Jagunemised', 'per_voice', 'B', 'õige, olemas\ntakt 1, div märge on vajalik'),
		cell('Dünaamika tähised', 'per_voice', 'S', 'õige, olemas'), cell('Dünaamika tähised', 'per_voice', 'A', 'Viga: takt 6, kuna korduses on 3.lõpp puudu, siis on puudu ka sub f\nTakt 8, kuna korduses on 4.lõpp puudu, siis on puudu ka p'), cell('Dünaamika tähised', 'per_voice', 'B', 'Viga: takt 7, sub f  on puudu.\nTakt 9, p on puudu'),
		cell('Dünaamika sõnadega', 'per_voice', 'S', 'õige, olemas'), cell('Dünaamika sõnadega', 'per_voice', 'A', '-'), cell('Dünaamika sõnadega', 'per_voice', 'B', 'Viga: takt 8 "(kajaefekt)" on puudu'),
		cell('Muud märgid', 'per_voice', 'S', '-'), cell('Muud märgid', 'per_voice', 'A', '-'), cell('Muud märgid', 'per_voice', 'B', '-'),
		// whole_piece
		cell('Pealkiri', 'whole_piece', null, 'õige, olemas'), cell('Helilooja', 'whole_piece', null, 'õige, olemas'), cell('Sõnade autor', 'whole_piece', null, 'õige, olemas'), cell('Helistik', 'whole_piece', null, 'õige'),
		cell('Taktimõõt', 'whole_piece', null, 'Väga hea lahendus! Lihtsam lugeda, kui originaali.\nEttepanek: Tundub, et taktimõõtude vaheldumine on valitud seetõttu, et saaks lühemalt erinevaid korduse volte kirja panna.'),
		cell('Võtmed', 'whole_piece', null, 'õiged'),
		cell('Häälte paigutus süsteemides', 'whole_piece', null, 'õige, noot hästi loetav'), cell('Häälerühmade tähised süsteemi ees', 'whole_piece', null, 'õiged, olemas'),
		cell('Kordusmärgid', 'whole_piece', null, 'Ettepanek: vajalik on erinevate voltide välja-noteerimine, sest muidu ei saa pidekaari ja dünaamikaid kirja panna.'), cell('Kordusmärgid sõnadega', 'whole_piece', null, '-'), cell('Tempo tähis loo alguses', 'whole_piece', null, 'õige'),
		cell('Tempo, dünaamika jm tähised loo sees', 'whole_piece', null, '-'), cell('Vormiosade tähised', 'whole_piece', null, '-'), cell('Täpsustavad tekstid loo sees', 'whole_piece', null, 'Bassi divisi taktis 1 on olemas.'),
	],
};

/** Kõik Exceli datasetid */
export const ALL_EXCEL: ReviewDataset[] = [EXCEL_P01, EXCEL_P07, EXCEL_P08, EXCEL_P09, EXCEL_P10, EXCEL_P11, EXCEL_P12];

// ─── DIFF ───────────────────────────────────────────────────────────

export interface CellDiff {
	param_name: string;
	scope: 'per_voice' | 'whole_piece';
	voice: string | null;
	excel: Pick<ReviewCell, 'verdict' | 'remarks' | 'not_applicable'> | null;
	db: Pick<ReviewCell, 'verdict' | 'remarks'> | null;
	status: 'match' | 'verdict_differs' | 'excel_only' | 'db_only' | 'excel_na_db_missing';
}

function normalizeVerdict(v: Verdict): string {
	if (v === 'olemas') return 'õige';
	if (v === 'puudub' || v === null) return 'missing';
	return v;
}

function normalizeParamName(name: string): string {
	return (EXCEL_TO_DB_NAME[name] ?? name).toLowerCase();
}

function normalizeVoice(v: string | null): string {
	return (v ?? '').toLowerCase();
}

export function diffReviewData(excel: ReviewDataset, db: ReviewDataset): CellDiff[] {
	const dbMap = new Map<string, ReviewCell>();
	for (const c of db.cells) {
		dbMap.set(`${normalizeParamName(c.param_name)}|${normalizeVoice(c.voice)}`, c);
	}

	const seen = new Set<string>();
	const diffs: CellDiff[] = [];

	for (const ec of excel.cells) {
		const key = `${normalizeParamName(ec.param_name)}|${normalizeVoice(ec.voice)}`;
		seen.add(key);
		const dc = dbMap.get(key);

		if (!dc) {
			diffs.push({
				param_name: ec.param_name, scope: ec.scope, voice: ec.voice,
				excel: { verdict: ec.verdict, remarks: ec.remarks, not_applicable: ec.not_applicable },
				db: null,
				status: ec.not_applicable ? 'excel_na_db_missing' : 'excel_only',
			});
		} else {
			const exV = normalizeVerdict(ec.verdict);
			const dbV = normalizeVerdict(dc.verdict);
			diffs.push({
				param_name: ec.param_name, scope: ec.scope, voice: ec.voice,
				excel: { verdict: ec.verdict, remarks: ec.remarks, not_applicable: ec.not_applicable },
				db: { verdict: dc.verdict, remarks: dc.remarks },
				status: exV === dbV ? 'match' : 'verdict_differs',
			});
		}
	}

	for (const [key, dc] of dbMap) {
		if (!seen.has(key)) {
			diffs.push({
				param_name: dc.param_name, scope: dc.scope, voice: dc.voice,
				excel: null, db: { verdict: dc.verdict, remarks: dc.remarks },
				status: 'db_only',
			});
		}
	}

	return diffs;
}

// ─── Statistika ─────────────────────────────────────────────────────

export interface DiffSummary {
	piece_id: string;
	piece_title: string;
	match: number;
	verdict_differs: number;
	excel_only: number;
	excel_na_db_missing: number;
	db_only: number;
	excel_cells: number;
	db_cells: number;
}

export function summarizeDiff(excel: ReviewDataset, db: ReviewDataset): DiffSummary {
	const diffs = diffReviewData(excel, db);
	const counts: Record<string, number> = {};
	for (const d of diffs) counts[d.status] = (counts[d.status] ?? 0) + 1;
	return {
		piece_id: excel.piece_id,
		piece_title: excel.piece_title,
		match: counts['match'] ?? 0,
		verdict_differs: counts['verdict_differs'] ?? 0,
		excel_only: counts['excel_only'] ?? 0,
		excel_na_db_missing: counts['excel_na_db_missing'] ?? 0,
		db_only: counts['db_only'] ?? 0,
		excel_cells: excel.cells.length,
		db_cells: db.cells.length,
	};
}
