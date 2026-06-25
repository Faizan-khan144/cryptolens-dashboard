const API_BASE = "https://api.coingecko.com/api/v3";

const cryptoTableBody = document.getElementById("cryptoTableBody");
const trendingGrid = document.getElementById("trendingGrid");
const heroStats = document.getElementById("heroStats");
const statsGrid = document.getElementById("statsGrid");
const searchInput = document.getElementById("searchInput");
const refreshBtn = document.getElementById("refreshBtn");
const mobileRefreshBtn = document.getElementById("mobileRefreshBtn");
const toast = document.getElementById("toast");
const tableError = document.getElementById("tableError");
const trendingError = document.getElementById("trendingError");
const statsError = document.getElementById("statsError");
const noResults = document.getElementById("noResults");
const searchTerm = document.getElementById("searchTerm");

let coins = [];

const formatCurrency = value =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);

const formatCompact = value =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2
  }).format(value);

function showToast(message, type = "info") {
  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

function renderHero(data) {
  heroStats.innerHTML = `
    <div class="hero-stat">
      <div class="hero-stat-label">Market Cap</div>
      <div class="hero-stat-value">$${formatCompact(data.total_market_cap.usd)}</div>
    </div>

    <div class="hero-stat">
      <div class="hero-stat-label">24h Volume</div>
      <div class="hero-stat-value">$${formatCompact(data.total_volume.usd)}</div>
    </div>

    <div class="hero-stat">
      <div class="hero-stat-label">BTC Dominance</div>
      <div class="hero-stat-value">${data.market_cap_percentage.btc.toFixed(1)}%</div>
    </div>

    <div class="hero-stat">
      <div class="hero-stat-label">Active Coins</div>
      <div class="hero-stat-value">${formatCompact(data.active_cryptocurrencies)}</div>
    </div>
  `;
}

function renderTable(data) {
  cryptoTableBody.innerHTML = data.map(coin => `
    <tr>
      <td class="td-rank">${coin.market_cap_rank}</td>

      <td>
        <div class="td-name">
          <img class="coin-img" src="${coin.image}" alt="${coin.name}">
          <div>
            <div class="coin-info-name">${coin.name}</div>
            <div class="coin-info-symbol">${coin.symbol}</div>
          </div>
        </div>
      </td>

      <td class="td-price">
        ${formatCurrency(coin.current_price)}
      </td>

      <td class="td-change">
        <span class="badge-change ${
          coin.price_change_percentage_24h >= 0
            ? "badge-gain"
            : "badge-loss"
        }">
          ${coin.price_change_percentage_24h.toFixed(2)}%
        </span>
      </td>

      <td class="td-mcap">
        $${formatCompact(coin.market_cap)}
      </td>

      <td class="td-volume">
        $${formatCompact(coin.total_volume)}
      </td>

      <td class="td-supply">
        ${formatCompact(coin.circulating_supply)}
      </td>
    </tr>
  `).join("");
}

function renderTrending(data) {
  trendingGrid.innerHTML = data.coins.map(item => `
    <div class="trending-card">
      <img
        class="trending-coin-img"
        src="${item.item.small}"
        alt="${item.item.name}"
      >

      <div>
        <div class="trending-coin-name">
          ${item.item.name}
        </div>

        <div class="trending-coin-symbol">
          ${item.item.symbol}
        </div>

        <div class="trending-rank">
          Rank #${item.item.market_cap_rank || "-"}
        </div>
      </div>
    </div>
  `).join("");
}

function renderStats(data) {
  statsGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-card-label">Markets</div>
      <div class="stat-card-value">${formatCompact(data.markets)}</div>
      <div class="stat-card-sub">Global exchanges</div>
    </div>

    <div class="stat-card">
      <div class="stat-card-label">Coins</div>
      <div class="stat-card-value">${formatCompact(data.active_cryptocurrencies)}</div>
      <div class="stat-card-sub">Tracked assets</div>
    </div>

    <div class="stat-card">
      <div class="stat-card-label">BTC Dominance</div>
      <div class="stat-card-value">${data.market_cap_percentage.btc.toFixed(1)}%</div>
      <div class="stat-card-sub">Market share</div>
    </div>

    <div class="stat-card">
      <div class="stat-card-label">ETH Dominance</div>
      <div class="stat-card-value">${data.market_cap_percentage.eth.toFixed(1)}%</div>
      <div class="stat-card-sub">Market share</div>
    </div>
  `;
}

async function loadMarkets() {
  try {
    const res = await fetch(
      `${API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false`
    );

    coins = await res.json();
    renderTable(coins);
    tableError.classList.add("hidden");
  } catch {
    tableError.classList.remove("hidden");
  }
}

async function loadTrending() {
  try {
    const res = await fetch(`${API_BASE}/search/trending`);
    const data = await res.json();

    renderTrending(data);
    trendingError.classList.add("hidden");
  } catch {
    trendingError.classList.remove("hidden");
  }
}

async function loadGlobal() {
  try {
    const res = await fetch(`${API_BASE}/global`);
    const data = await res.json();

    renderHero(data.data);
    renderStats(data.data);

    statsError.classList.add("hidden");
  } catch {
    statsError.classList.remove("hidden");
  }
}

async function loadAll() {
  refreshBtn.classList.add("loading");

  if (mobileRefreshBtn) {
    mobileRefreshBtn.classList.add("loading");
  }

  await Promise.all([
    loadMarkets(),
    loadTrending(),
    loadGlobal()
  ]);

  refreshBtn.classList.remove("loading");

  if (mobileRefreshBtn) {
    mobileRefreshBtn.classList.remove("loading");
  }

  showToast("Market data updated");
}

searchInput.addEventListener("input", e => {
  const value = e.target.value.toLowerCase();

  const filtered = coins.filter(
    coin =>
      coin.name.toLowerCase().includes(value) ||
      coin.symbol.toLowerCase().includes(value)
  );

  renderTable(filtered);

  if (!filtered.length) {
    noResults.classList.remove("hidden");
    searchTerm.textContent = value;
  } else {
    noResults.classList.add("hidden");
  }
});

refreshBtn.addEventListener("click", loadAll);

if (mobileRefreshBtn) {
  mobileRefreshBtn.addEventListener("click", loadAll);
}

const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobileMenu");

hamburger.addEventListener("click", () => {
  mobileMenu.classList.toggle("open");
});

window.addEventListener("scroll", () => {
  const navbar = document.getElementById("navbar");

  if (window.scrollY > 20) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

loadAll();

setInterval(loadAll, 60000);