// =====================================================
// HesabimNeQeder — Frontend Script
// Backend API ilə əlaqə qurur, nəticəni UI-da göstərir
// =====================================================

// DOM elementlərini seç
const tagInput   = document.getElementById("tagInput");
const calcBtn    = document.getElementById("calcBtn");
const loading    = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const errorMsg   = document.getElementById("errorMsg");
const resultCard = document.getElementById("resultCard");

// ---- Yardımçı funksiyalar ----

/** Bütün hal kartlarını gizlət */
function resetUI() {
  loading.classList.add("hidden");
  errorState.classList.add("hidden");
  resultCard.classList.add("hidden");
}

/** Xəta mesajı göstər */
function showError(msg) {
  resetUI();
  errorMsg.textContent = msg;
  errorState.classList.remove("hidden");
}

/** Yüklənmə vəziyyətini göstər */
function showLoading() {
  resetUI();
  loading.classList.remove("hidden");
  calcBtn.disabled = true;
}

/** Yüklənmə vəziyyətini gizlət */
function hideLoading() {
  calcBtn.disabled = false;
}

/**
 * Sayı minlik ayırıcısı ilə formatla
 * @param {number} n
 * @returns {string}
 */
function formatNumber(n) {
  return n.toLocaleString("az-AZ");
}

/**
 * Qiymət bölgüsü siyahısını yenilə
 * @param {Array} breakdown - Backend-dən gələn breakdown massivi
 */
function renderBreakdown(breakdown) {
  const list = document.getElementById("breakdownList");
  list.innerHTML = "";

  breakdown.forEach((item) => {
    const li = document.createElement("li");
    li.className = "breakdown-item";
    li.innerHTML = `
      <span class="breakdown-icon">${item.unit}</span>
      <span class="breakdown-name">${item.label}</span>
      <span class="breakdown-count">${formatNumber(item.value)}</span>
      <span class="breakdown-contrib">+${item.contribution.toFixed(2)} ₼</span>
    `;
    list.appendChild(li);
  });
}

/**
 * Nəticə kartını doldur və göstər
 * @param {Object} data - Backend-dən gələn JSON cavabı
 */
function renderResult(data) {
  const { playerInfo, price, breakdown } = data;

  // Oyunçu adı və teq
  document.getElementById("playerName").textContent = playerInfo.name;
  document.getElementById("playerTag").textContent  = playerInfo.tag;

  // Klub adı (varsa)
  const clubEl = document.getElementById("playerClub");
  if (playerInfo.clubName) {
    clubEl.textContent = `🏟 ${playerInfo.clubName}`;
    clubEl.classList.remove("hidden");
  } else {
    clubEl.classList.add("hidden");
  }

  // AZN qiyməti — animasiyalı say
  animateCount("priceValue", 0, price, 1200, 2);

  // Statistika chipləri
  animateCount("statTrophies", 0, playerInfo.trophies,   900, 0);
  animateCount("statBrawlers", 0, playerInfo.brawlerCount, 700, 0);
  animateCount("statPower11",  0, playerInfo.power11Count,  600, 0);
  animateCount("statHyper",    0, playerInfo.hyperchargeCount, 600, 0);

  // Qiymət bölgüsü
  renderBreakdown(breakdown);

  // Kartı göstər
  resultCard.classList.remove("hidden");
}

/**
 * Rəqəm animasiyası
 * @param {string} elId   - Element ID
 * @param {number} from   - Başlanğıc dəyər
 * @param {number} to     - Son dəyər
 * @param {number} ms     - Müddət (millisaniyə)
 * @param {number} decimals - Ondalıq rəqəm sayı
 */
function animateCount(elId, from, to, ms, decimals) {
  const el = document.getElementById(elId);
  if (!el) return;

  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / ms, 1);
    // easeOutExpo əyrilik funksiyası
    const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    const current = from + (to - from) * ease;
    el.textContent = current.toFixed(decimals);
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// ---- Əsas funksiya ----

/**
 * Hesabla butonuna basıldığında çağırılır
 */
async function hesapla() {
  const rawTag = tagInput.value.trim();

  // Boş giriş yoxlaması
  if (!rawTag) {
    showError("Zəhmət olmasa oyunçu teqini daxil edin.");
    tagInput.focus();
    return;
  }

  // Teq format yoxlaması (# ilə birlikdə 4-12 simvol)
  const cleanedTag = rawTag.replace(/^#/, "").toUpperCase();
  if (!/^[0-9A-Z]{4,12}$/.test(cleanedTag)) {
    showError("Teq yalnız böyük hərf və rəqəmlərdən ibarət olmalıdır. Məsələn: #2PQRLUVLQ");
    return;
  }

  showLoading();

  try {
    // Backend-ə POST sorğusu göndər
    const response = await fetch("/api/hesapla", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ tag: `#${cleanedTag}`, game: "brawlstars" }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Backend xəta mesajını göstər
      showError(data.error || "Naməlum xəta baş verdi.");
      return;
    }

    hideLoading();
    renderResult(data);

  } catch (err) {
    // Şəbəkə xətası
    showError("Serverə qoşulmaq mümkün olmadı. İnternet bağlantınızı yoxlayın.");
    console.error("Fetch xətası:", err);
  } finally {
    hideLoading();
  }
}

// ---- Klaviatura dəstəyi ----
tagInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") hesapla();
});

// Teq daxilindəki # simvolunu avtomatik sil
tagInput.addEventListener("input", () => {
  tagInput.value = tagInput.value.replace(/#/g, "").toUpperCase();
});
