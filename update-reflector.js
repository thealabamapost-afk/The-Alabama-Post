// update-reflector.js
// Fetch Alabama Reflector RSS feed and save as reflector.json

const fs = require("fs");
const fetch = require("node-fetch");
const { parseStringPromise } = require("xml2js");

const FEED_URL = "https://twilight-dawn-a4d1.pinoonip23.workers.dev/";
const OUTPUT_FILE = "reflector.json";

async function updateReflector() {
  console.log("📡 Fetching latest posts from Alabama Reflector…");

  try {
    const res = await fetch(FEED_URL);
    if (!res.ok) throw new Error(`Failed to fetch RSS feed: ${res.status}`);
    const xml = await res.text();

    // ✅ Parse XML using xml2js instead of DOMParser
    const parsed = await parseStringPromise(xml, { explicitArray: false });

    const channel = parsed?.rss?.channel;
    if (!channel || !channel.item) {
      throw new Error("No items found in RSS feed");
    }

    const itemsArray = Array.isArray(channel.item)
      ? channel.item
      : [channel.item];

    const items = itemsArray.slice(0, 10).map((item) => {
      const thumb =
        item["media:thumbnail"]?.$?.url ||
        item["media:content"]?.$?.url ||
        "";

      const rawDesc =
        item["content:encoded"] ||
        item.description ||
        "";

      const cleanDesc = rawDesc
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();

      return {
        title: item.title || "",
        link: item.link || "",
        thumbnail: thumb,
        description: cleanDesc.slice(0, 220) + "...",
      };
    });

    const json = {
      status: "ok",
      feed: {
        title: "Alabama Reflector",
        link: "https://alabamareflector.com/",
        description: "Clarity today for a better tomorrow",
        image:
          "https://alabamareflector.com/wp-content/uploads/2023/07/Alabama-Reflector-logo.png",
      },
      items,
      lastUpdated: new Date().toISOString(),
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(json, null, 2));
    console.log(`✅ reflector.json updated successfully with ${items.length} items`);
  } catch (err) {
    console.error("❌ Error updating reflector.json:", err.message);
    process.exit(1);
  }
}

updateReflector();
