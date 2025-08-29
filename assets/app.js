
// Utilities
const CITY_KEY = "nv-city";
const citiesUrl = "/assets/cities-tr.json";

const trSlug = s => s.toLowerCase()
 .replaceAll("ç","c").replaceAll("ğ","g").replaceAll("ı","i").replaceAll("ö","o").replaceAll("ş","s").replaceAll("ü","u")
 .replaceAll("â","a").replaceAll("î","i").replaceAll("û","u")
 .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");

const fmt = n => n.toString().padStart(2,"0");
const today = new Date();
const yyyy = today.getFullYear(), mm = fmt(today.getMonth()+1), dd = fmt(today.getDate());
const dateStr = `${yyyy}-${mm}-${dd}`;

const NAMES_TR = {
  Imsak:"İmsak", Fajr:"Sabah", Sunrise:"Güneş", Dhuhr:"Öğle", Asr:"İkindi", Maghrib:"Akşam", Isha:"Yatsı"
};

const order = ["Imsak","Sunrise","Dhuhr","Asr","Maghrib","Isha"];

function parseTimeHHMMToDate(hhmm) {
  const [h,m] = hhmm.split(":").map(x => parseInt(x,10));
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function msToHMS(ms){
  if (ms < 0) ms = 0;
  const sec = Math.floor(ms/1000);
  const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = sec%60;
  return `${fmt(h)}:${fmt(m)}:${fmt(s)}`;
}

async function load(){
  const sel = document.getElementById("city");
  const title = document.getElementById("cityTitle");
  const grid = document.getElementById("grid");
  const nextPrayerEl = document.getElementById("nextPrayer");
  const countdownEl = document.getElementById("countdown");
  const metaEl = document.getElementById("meta");

  // Load city list
  const cities = await fetch(citiesUrl).then(r=>r.json());
  sel.innerHTML = cities.map(c => `<option value="${c.name}">${c.name}</option>`).join("");

  // Determine current city from path or storage (no auto-save; user clicks 'Kaydet')
  const slugFromPath = location.pathname.replace(/^\/|\/$/g,"");
  let currentCity = cities.find(x => x.slug === slugFromPath)?.name || localStorage.getItem(CITY_KEY) || "İstanbul";
  sel.value = currentCity;
  title.textContent = currentCity;

  // If path doesn't match selection, normalize URL but don't save storage until 'Kaydet'
  const currentSlug = cities.find(x => x.name === currentCity)?.slug || trSlug(currentCity);
  if (slugFromPath !== currentSlug) history.replaceState({}, "", `/${currentSlug}/`);

  document.getElementById("saveCity").onclick = () => {
    const name = sel.value;
    localStorage.setItem(CITY_KEY, name);
    const slug = cities.find(x => x.name === name)?.slug || trSlug(name);
    history.pushState({}, "", `/${slug}/`);
    title.textContent = name;
    setCityLdJson(name);
    refresh(name);
  };

  setCityLdJson(currentCity);
  refresh(currentCity);

  async function refresh(cityName){
    grid.innerHTML = `<div class="tile"><div class="k">Yükleniyor...</div><div class="v">—</div></div>`;
    try{
      const url = `/api/namaz?city=${encodeURIComponent(cityName)}&date=${dateStr}`;
      const data = await fetch(url,{headers:{'accept':'application/json'}}).then(r=>r.json());

      // Meta zone & date
      const tz = data.meta.timezone;
      const dateLabel = data.date.gregorian.date;
      function updateMeta(){
        const now = new Date();
        const hh = fmt(now.getHours()); const mi = fmt(now.getMinutes()); const ss = fmt(now.getSeconds());
        metaEl.textContent = `Şu an ${hh}:${mi}:${ss} • ${tz} • ${dateLabel}`;
      }
      updateMeta();

      // Build tiles
      grid.innerHTML = "";
      const entries = order.map(k => [k, data.timings[k]]).filter(([,v]) => v);
      entries.forEach(([k,v]) => {
        const el = document.createElement("div");
        el.className = "tile";
        el.dataset.key = k;
        el.innerHTML = `<div class="k">${NAMES_TR[k]||k}</div><div class="v">${v}</div>`;
        grid.appendChild(el);
      });

      // Current/next prayer
      function computeNext(){
        const now = new Date();
        let nextName = null, nextAt = null, active = null;
        for (const [k,v] of entries){
          const t = parseTimeHHMMToDate(v);
          if (now >= t) active = k;
          if (t > now && !nextAt){ nextName = k; nextAt = t; }
        }
        if (!nextAt){
          nextName = "İmsak";
          const t = new Date(); t.setDate(t.getDate()+1); t.setHours(0,0,0,0);
          nextAt = t;
        }
        for (const node of grid.children) node.classList.remove("active");
        if (active){
          const elAct = [...grid.children].find(n => n.dataset.key === active);
          if (elAct) elAct.classList.add("active");
        }
        nextPrayerEl.textContent = NAMES_TR[nextName] || nextName;
        countdownEl.textContent = msToHMS(nextAt - now);
      }
      computeNext();
      setInterval(() => { computeNext(); updateMeta(); }, 1000);
    }catch(e){
      grid.innerHTML = `<div class="tile"><div class="k">Hata</div><div class="v">Bağlantı sağlanamadı.</div></div>`;
      console.error(e);
    }
  }

  function setCityLdJson(cityName){
    const ld = document.getElementById("ld");
    const obj = JSON.parse(ld.textContent);
    obj.name = `${cityName} Namaz Vakitleri`;
    obj.description = `${cityName} için bugünkü namaz vakitleri (İmsak, Güneş, Öğle, İkindi, Akşam, Yatsı).`;
    obj.spatialCoverage = { "@type":"Place", "name": `${cityName}, Türkiye` };
    obj.dateModified = new Date().toISOString().substring(0,10);
    ld.textContent = JSON.stringify(obj);
    document.title = `${cityName} Namaz Vakitleri — ${obj.dateModified}`;
    document.querySelector('meta[name="description"]').setAttribute('content', obj.description);
    document.querySelector('meta[property="og:title"]').setAttribute('content', `${cityName} Namaz Vakitleri`);
    document.querySelector('meta[property="og:description"]').setAttribute('content', obj.description);
    document.getElementById("cityTitle").textContent = cityName;
  }
}

document.addEventListener("DOMContentLoaded", load);
