require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// index.html, style.css, script.js fayllarını göstər
app.use(express.static(__dirname));

// =====================================================
// Brawl Stars Hesap Dəyər API
// =====================================================

app.post("/api/hesapla", async (req, res) => {
  const { tag } = req.body;

  if (!tag) {
    return res.status(400).json({
      error: "Tag daxil edilməyib",
    });
  }

  const cleanTag = tag.startsWith("#") ? tag.slice(1) : tag;

  try {
    const response = await axios.get(
      `https://api.brawlstars.com/v1/players/%23${cleanTag}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.BRAWL_TOKEN}`,
          Accept: "application/json",
        },
        timeout: 10000,
      }
    );

    const player = response.data;

    let value = 0;

    value += player.trophies * 0.0005;
    value += player.brawlers.length * 0.3;

    const power11 = player.brawlers.filter(
      (b) => b.power === 11
    ).length;

    value += power11 * 0.5;

    res.json({
      success: true,
      name: player.name,
      tag: player.tag,
      value: Number(value.toFixed(2)),
    });

  } catch (err) {
    console.error(err.response?.data || err.message);

    if (err.response) {
      return res.status(err.response.status).json({
        error: err.response.data?.reason || "API xətası",
      });
    }

    return res.status(500).json({
      error: "Server xətası",
    });
  }
});

// Ana səhifə
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// =====================================================
// SERVER START
// =====================================================

app.listen(PORT, () => {
  console.log(`Server işləyir: http://localhost:${PORT}`);
  console.log(
    `Token: ${process.env.BRAWL_TOKEN ? "Yükləndi ✓" : "Tapılmadı ✗"}`
  );
});
