import fs from "fs";
import fetch from "node-fetch";

const OUTPUT_FILE = "reflector.json";
const FEED_URL = "https://alabamareflector.com/feed/";

async function fetchFeedXML() {
  const headers = {
    "User-Agent": "Mozilla/5.0 (compatible; GitHubFeedBot/1.0; +https://thealabamapost.com)"
  };

  const res = await fetch(FEED_URL, { headers });
  if (!res.ok) throw new Error(`Failed to fetch feed (${res.status})`);
  return await res.text();
}

function parseFeed(xml) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 9).map(match => {
    const item = match[1];
    const get = (tag) =>
      (item.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.[1] || "")
        .replace(/<!\[CDATA\[|\]\]>/g, "")
        .trim();

    const title = get("title") || "Untitled";
    const link = get("link");
    const desc = get("description");
    const imgMatch = desc.match(/<img[^>]+src=["'](.*?)["']/);
    const thumbnail = imgMatch
      ? imgMatch[1]
      : "https://alabamareflector.com/wp-content/uploads/2023/07/Alabama-Reflector-logo.png";

    return {
      title,
      link,
      thumbnail,
      description: desc.replace(/<[^>]*>?/gm, "").substring(0, 250)
    };
  });

  return {
    status: "ok",
    feed: {
      title: "Alabama Reflector",
      link: "https://alabamareflector.com/",
      description: "Clarity today for a better tomorrow",
      image:
        "https://alabamareflector.com/wp-content/uploads/2023/07/Alabama-Reflector-logo.png"
    },
    items
  };
}

async function updateReflector() {
  console.log("📰 Fetching latest posts from Alabama Reflector…");
  try {
    const xml = await fetchFeedXML();
    const data = parseFeed(xml);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
    console.log("✅ reflector.json updated successfully!");
  } catch (err) {
    console.error("❌ Error updating reflector.json:", err.message);
    process.exit(1);
  }
}

updateReflector();