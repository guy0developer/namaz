export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const city = url.searchParams.get("city");
  const date = url.searchParams.get("date"); // YYYY-MM-DD
  if (!city) {
    return new Response(JSON.stringify({ error: "city param is required" }), {
      status: 400,
      headers: { "content-type": "application/json", "access-control-allow-origin": "*" }
    });
  }
  try {
    const methodsRes = await fetch("https://api.aladhan.com/v1/methods", { cf: { cacheTtl: 86400 } });
    const methodsJson = await methodsRes.json();
    let diyanetId = null;
    if (methodsJson && methodsJson.data) {
      for (const [id, m] of Object.entries(methodsJson.data)) {
        const name = (m.name || "").toLowerCase();
        if (name.includes("diyanet")) { diyanetId = id; break; }
      }
    }
    if (!diyanetId) diyanetId = 13;

    const d = date ? new Date(date) : new Date();
    const dd = String(d.getDate()).padStart(2,"0");
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const yyyy = d.getFullYear();
    const datePath = `${dd}-${mm}-${yyyy}`;

    const apiUrl = new URL(`https://api.aladhan.com/v1/timingsByCity/${datePath}`);
    apiUrl.searchParams.set("city", city);
    apiUrl.searchParams.set("country", "Turkey");
    apiUrl.searchParams.set("method", diyanetId);
    apiUrl.searchParams.set("school", "1");
    apiUrl.searchParams.set("timezonestring", "Europe/Istanbul");

    const res = await fetch(apiUrl, { cf: { cacheTtl: 1800 } });
    const j = await res.json();
    if (!res.ok || j.code !== 200) throw new Error(`Upstream error: ${res.status} ${j.status}`);

    const out = {
      city,
      date: j.data.date,
      meta: j.data.meta,
      timings: j.data.timings
    };
    return new Response(JSON.stringify(out), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=300, s-maxage=1800",
        "access-control-allow-origin": "*"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json", "access-control-allow-origin": "*" }
    });
  }
}
