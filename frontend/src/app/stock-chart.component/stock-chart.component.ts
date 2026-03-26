import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { ApiService } from '../services/api.services';

Chart.register(...registerables);

interface HoldingToggle {
  symbol: string;
  quantity: number;
  enabled: boolean;
}

interface HypotheticalHolding {
  symbol: string;
  quantity: number;
}

@Component({
  selector: 'app-stock-chart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-chart.component.html',
  styleUrls: ['./stock-chart.component.css'],
})
export class StockChartComponent implements OnChanges, OnDestroy, AfterViewInit {
  @Input() symbol: string = '';
  @Input() data: any[] = [];
  @Input() holdings: any[] = [];

  @ViewChild('chartCanvas', { static: false }) chartRef!: ElementRef<HTMLCanvasElement>;

  quoteData: any;
  chartView: 'price' | 'volume' = 'price';

  stockDetails: any = null;

  get marketCap(): string {
    const fmp = this.stockDetails?.fmpProfile;
    const metrics = this.stockDetails?.metrics;

    let raw: number | null = null;

    if (fmp?.mktCap && Number(fmp.mktCap) > 0) {
      raw = Number(fmp.mktCap);
    } else if (fmp?.marketCap && Number(fmp.marketCap) > 0) {
      raw = Number(fmp.marketCap);
    } else if (metrics?.marketCapitalization && Number(metrics.marketCapitalization) > 0) {
      raw = Number(metrics.marketCapitalization);
    }

    if (!raw || isNaN(raw)) return '';

    // Normalize: if value looks like it's in millions (< 100_000_000 for a large cap)
    // scale it up. AAPL ~$3.6T, TSLA ~$1.2T — raw should be > 1_000_000_000_000
    // FMP returns full dollars, Finnhub returns millions
    let n = raw;
    if (n < 1_000_000_000) {
      // Likely in millions — multiply up
      n = raw * 1_000_000;
    }

    if (n >= 1_000_000_000_000) return `$${(n / 1_000_000_000_000).toFixed(2)}T`;
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    return `$${n.toLocaleString()}`;
  }
  get displayPrice(): number {
  if (this.allHistory.length > 0) {
    return this.allHistory[this.allHistory.length - 1].close;
  }
  return this.quoteData?.currentPrice || 0;
}

  get todayVolume(): string {
    const v = this.quoteData?.volume;
    if (!v) return '';
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return `${v}`;
  }
  activeRange: string = '1Y';
  allHistory: any[] = [];
  chart: any;
  intervalId: any;
  ranges = ['1D', '1W', '1M', '3M', '1Y'];

  chartMode: 'portfolio' | 'projection' = 'portfolio';
  projectionFrequency: '1W' | '1M' | '3M' = '1M';
  projectionHorizon: '1M' | '3M' | '6M' | '1Y' = '3M';

  projectionLoading = false;
  projectionError = '';
  projectionSummary = '';

  holdingToggles: HoldingToggle[] = [];

  // Hypothetical holdings
  hypotheticals: HypotheticalHolding[] = [];
  newHypQuantity = 1;
  addHypError = '';

  // Inline search for hypotheticals
  hypSearchQuery = '';
  hypAllStocks: any[] = [];
  hypFilteredStocks: any[] = [];
  hypDropdownVisible = false;
  hypSelectedStock: any = null;

  private readonly CACHE_PREFIX = 'pt_proj_';

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.chartMode === 'projection') return;
      if (this.data.length > 0) {
        this.allHistory = this.data;
        this.renderPortfolioChart(this.data);
        return;
      }
      if (this.symbol && this.symbol.trim() !== '') {
        this.loadData(this.symbol);
      }
    }, 100);
    // Preload stocks for hypothetical search
    this.loadHypStocks();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data.length > 0) {
      this.allHistory = this.data;
      // Don't re-render if projection is active — it would wipe the projection chart
      if (this.chartMode !== 'projection') {
        setTimeout(() => this.renderPortfolioChart(this.data), 100);
      }
      return;
    }
    if (changes['symbol'] && !changes['symbol'].firstChange && this.symbol) {
      this.loadData(this.symbol);
    }
    if (changes['holdings'] && this.holdings.length > 0) {
      this.syncHoldingToggles();
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.destroyChart();
  }

  // ── Inline search for hypotheticals ─────────────────────────

  loadHypStocks(): void {
    this.api.get<any[]>('/api/market/cached').subscribe({
      next: (stocks) => {
        this.hypAllStocks = stocks;
      },
      error: () => {},
    });
  }

  onHypSearch(): void {
    const q = this.hypSearchQuery.toLowerCase().trim();
    if (!q) {
      this.hypFilteredStocks = [];
      this.hypDropdownVisible = false;
      return;
    }
    this.hypFilteredStocks = this.hypAllStocks
      .filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          (s.companyName && s.companyName.toLowerCase().includes(q)),
      )
      .slice(0, 8);
    this.hypDropdownVisible = this.hypFilteredStocks.length > 0;
  }

  onHypBlur(): void {
    setTimeout(() => {
      this.hypDropdownVisible = false;
    }, 200);
  }

  selectHypStock(stock: any): void {
    this.hypSelectedStock = stock;
    this.hypSearchQuery = stock.symbol;
    this.hypDropdownVisible = false;
    this.addHypError = '';
    // Pre-fill quantity from holdings if this stock is already held
    const existingHolding = this.holdings.find((h) => h.stockSymbol === stock.symbol);
    this.newHypQuantity = existingHolding ? +existingHolding.quantity : 1;
  }

  addHypothetical(): void {
    this.addHypError = '';
    const sym = this.hypSelectedStock?.symbol || this.hypSearchQuery.trim().toUpperCase();
    if (!sym) {
      this.addHypError = 'Search and select a stock first';
      return;
    }
    if (this.newHypQuantity <= 0) {
      this.addHypError = 'Quantity must be > 0';
      return;
    }
    if (this.hypotheticals.some((h) => h.symbol === sym)) {
      this.addHypError = `${sym} already added`;
      return;
    }

    this.hypotheticals.push({ symbol: sym, quantity: this.newHypQuantity });
    this.hypSearchQuery = '';
    this.hypSelectedStock = null;
    this.newHypQuantity = 1;
    this.onProjectionChange();
  }

  removeHypothetical(sym: string): void {
    this.hypotheticals = this.hypotheticals.filter((h) => h.symbol !== sym);
    this.onProjectionChange();
  }

  // ── Holdings toggles ─────────────────────────────────────────

  syncHoldingToggles(): void {
    const existing = new Set(this.holdingToggles.map((t) => t.symbol));
    for (const h of this.holdings) {
      if (!existing.has(h.stockSymbol)) {
        this.holdingToggles.push({ symbol: h.stockSymbol, quantity: +h.quantity, enabled: true });
      }
    }
    this.holdingToggles = this.holdingToggles.filter((t) =>
      this.holdings.some((h) => h.stockSymbol === t.symbol),
    );
  }

  

  toggleHolding(toggle: HoldingToggle): void {
    toggle.enabled = !toggle.enabled;
    this.onProjectionChange();
  }

  // ── Mode toggle ──────────────────────────────────────────────

  setMode(mode: 'portfolio' | 'projection'): void {
    this.chartMode = mode;
    this.destroyChart();
    setTimeout(() => {
      if (mode === 'portfolio') {
        this.renderPortfolioChart(this.allHistory.length ? this.allHistory : this.data);
      } else {
        // Render transaction history immediately as a placeholder while projection loads
        const histData = this.data.length ? this.data : this.allHistory;
        if (histData.length) {
          // Temporarily allow rendering even in projection mode for the placeholder
          this.chartMode = 'portfolio';
          this.renderPortfolioChart(histData);
          this.chartMode = 'projection';
        }
        this.runProjection();
      }
    }, 150);
  }

  setChartView(view: 'price' | 'volume'): void {
    this.chartView = view;
    this.destroyChart();
    const filtered = this.filterByRange(this.allHistory, this.activeRange);
    setTimeout(() => {
      if (view === 'volume') this.renderVolumeChart(filtered);
      else this.renderPortfolioChart(filtered);
    }, 100);
  }

  onProjectionChange(): void {
    this.destroyChart();
    this.projectionSummary = '';
    this.projectionError = '';
    setTimeout(() => this.runProjection(), 150);
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  // ── Projection engine ─────────────────────────────────────────

  runProjection(): void {
    const activeHoldings = this.holdingToggles
      .filter((t) => t.enabled)
      .map((t) => ({ symbol: t.symbol, quantity: t.quantity }));

    const allTargets = [
      ...activeHoldings,
      ...this.hypotheticals.map((h) => ({ symbol: h.symbol, quantity: h.quantity })),
    ];

    if (!allTargets.length) {
      this.projectionError = 'Enable at least one holding or add a hypothetical stock';
      this.cdr.detectChanges();
      return;
    }

    this.projectionLoading = true;
    this.projectionError = '';
    this.projectionSummary = '';
    this.cdr.detectChanges();

    let completed = 0;
    const historyMap: { [symbol: string]: any[] } = {};

    for (const target of allTargets) {
      this.api.get<any[]>(`/api/market/history/${target.symbol}`).subscribe({
        next: (history) => {
          historyMap[target.symbol] = history;
          completed++;
          if (completed === allTargets.length)
            this.buildAndRenderProjection(allTargets, historyMap);
        },
        error: () => {
          historyMap[target.symbol] = [];
          completed++;
          if (completed === allTargets.length)
            this.buildAndRenderProjection(allTargets, historyMap);
        },
      });
    }
  }

  buildAndRenderProjection(
    targets: { symbol: string; quantity: number }[],
    historyMap: { [symbol: string]: any[] },
  ): void {
    const bucketDays =
      this.projectionFrequency === '1W' ? 7 : this.projectionFrequency === '1M' ? 30 : 90;
    const horizonDays =
      this.projectionHorizon === '1M'
        ? 30
        : this.projectionHorizon === '3M'
          ? 90
          : this.projectionHorizon === '6M'
            ? 180
            : 365;
    const futureBuckets = Math.ceil(horizonDays / bucketDays);

    const symbolData: {
      symbol: string;
      quantity: number;
      lastPrice: number;
      avgGrowthRate: number;
    }[] = [];

    for (const t of targets) {
      const raw = historyMap[t.symbol] || [];
      if (!raw.length) continue;

      const sorted = [...raw].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      const buckets: number[] = [];

      for (let i = 0; i < sorted.length; i += bucketDays) {
        const bucket = sorted.slice(i, i + bucketDays);
        if (!bucket.length) continue;
        buckets.push(bucket.reduce((sum, d) => sum + +d.close, 0) / bucket.length);
      }

      if (buckets.length < 2) continue;

      const rates: number[] = [];
      for (let i = 1; i < buckets.length; i++) {
        if (buckets[i - 1] > 0) rates.push((buckets[i] - buckets[i - 1]) / buckets[i - 1]);
      }
      const avgGrowthRate = rates.reduce((s, r) => s + r, 0) / rates.length;

      symbolData.push({
        symbol: t.symbol,
        quantity: t.quantity,
        lastPrice: buckets[buckets.length - 1],
        avgGrowthRate,
      });
    }

    if (!symbolData.length) {
      this.projectionLoading = false;
      this.projectionError = 'No history available for selected stocks';
      this.cdr.detectChanges();
      return;
    }

    // Left side: real portfolio value from transaction history
    const portfolioHistory = [...this.data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const histLabels = portfolioHistory.map((d) => d.date.split('T')[0]);
    const histValues = portfolioHistory.map((d) => +d.close);

    // Current actual value of selected holdings = lastPrice * quantity (today's value)
    const currentHoldingsValue = symbolData.reduce((sum, s) => sum + s.lastPrice * s.quantity, 0);

    // Right side: project forward from today using actual prices * quantities
    const today = new Date();
    const projLabels: string[] = [];
    const projValues: number[] = [];
    const lastPrices: { [sym: string]: number } = {};
    for (const s of symbolData) lastPrices[s.symbol] = s.lastPrice;

    for (let i = 0; i < futureBuckets; i++) {
      const futureDate = new Date(today.getTime() + (i + 1) * bucketDays * 24 * 60 * 60 * 1000);
      projLabels.push(futureDate.toISOString().split('T')[0]);
      let total = 0;
      for (const s of symbolData) {
        lastPrices[s.symbol] = lastPrices[s.symbol] * (1 + s.avgGrowthRate);
        total += lastPrices[s.symbol] * s.quantity;
      }
      projValues.push(+total.toFixed(2));
    }

    // Left side: scale transaction history so it ends at currentHoldingsValue
    const rawLastHist = histValues.length ? histValues[histValues.length - 1] : 0;
    const histScale = rawLastHist > 0 ? currentHoldingsValue / rawLastHist : 1;
    const scaledHistValues = histValues.map((v) => +(v * histScale).toFixed(2));

    const lastHist = currentHoldingsValue;
    const lastProj = projValues[projValues.length - 1] ?? lastHist;

    // Colors for individual stock lines
    const stockColors = [
      '#1e88e5', // blue
      '#e53935', // red
      '#fb8c00', // orange
      '#8e24aa', // purple
      '#00897b', // teal
      '#f4511e', // deep orange
      '#6d4c41', // brown
      '#546e7a', // blue-grey
    ];

    const allLabels = [...histLabels, ...projLabels];

    // Solid portfolio history dataset
    const solidData: (number | null)[] = [...scaledHistValues, ...projLabels.map(() => null)];

    // Per-symbol projected dashed lines
    const perSymbolDatasets = symbolData.map((s, idx) => {
      const color = stockColors[idx % stockColors.length];
      // Project this symbol's value (price * quantity) forward
      const symLastPrices = { [s.symbol]: s.lastPrice };
      const symProjValues: (number | null)[] = [];
      for (let i = 0; i < futureBuckets; i++) {
        symLastPrices[s.symbol] = symLastPrices[s.symbol] * (1 + s.avgGrowthRate);
        symProjValues.push(+(symLastPrices[s.symbol] * s.quantity).toFixed(2));
      }
      // Anchor to proportional share of lastHist
      const symCurrentValue = s.lastPrice * s.quantity;
      const symScale = currentHoldingsValue > 0 ? symCurrentValue / currentHoldingsValue : 1;
      const symAnchor = +(lastHist * symScale).toFixed(2);
      const symRawStart = symProjValues[0] ?? symCurrentValue;
      const symAnchored = symProjValues.map((v) =>
        v != null && symRawStart > 0 ? +(symAnchor * (v / symRawStart)).toFixed(2) : null,
      );
      return {
        label: `${s.symbol} (×${s.quantity})`,
        data: [
          ...scaledHistValues.map((_, i) => (i === scaledHistValues.length - 1 ? symAnchor : null)),
          ...symAnchored,
        ] as (number | null)[],
        borderColor: color,
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: color,
        borderWidth: 1.5,
        borderDash: [4, 4],
        spanGaps: false,
      };
    });

    // Combined green dashed projection
    const combinedDashed: (number | null)[] = [
      ...scaledHistValues.map((v, i) => (i === scaledHistValues.length - 1 ? v : null)),
      ...projValues,
    ];

    const pct = lastHist > 0 ? (((lastProj - lastHist) / lastHist) * 100).toFixed(2) : '0.00';
    const sign = +pct >= 0 ? '+' : '';
    const freqLabel =
      this.projectionFrequency === '1W'
        ? 'weekly'
        : this.projectionFrequency === '1M'
          ? 'monthly'
          : 'quarterly';
    const horizonLabel =
      this.projectionHorizon === '1M'
        ? '1 month'
        : this.projectionHorizon === '3M'
          ? '3 months'
          : this.projectionHorizon === '6M'
            ? '6 months'
            : '1 year';
    this.projectionSummary = `Based on ${freqLabel} avg: ${sign}${pct}% over ${horizonLabel} — $${lastHist.toFixed(2)} → $${lastProj.toFixed(2)}`;

    this.projectionLoading = false;
    this.destroyChart();

    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'line',
      data: {
        labels: allLabels,
        datasets: [
          // Solid: transaction history
          {
            label: 'Portfolio History',
            data: solidData,
            borderColor: '#43a047',
            backgroundColor: 'rgba(67,160,71,0.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: '#9e9e9e',
            borderWidth: 2,
            spanGaps: false,
          },
          // Per-symbol dashed lines
          ...perSymbolDatasets,
          // Combined green dashed projection
          {
            label: 'Total Projection',
            data: combinedDashed,
            borderColor: '#43a047',
            backgroundColor: 'rgba(67,160,71,0.06)',
            fill: false,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: '#43a047',
            borderWidth: 2.5,
            borderDash: [8, 3],
            spanGaps: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        onClick: () => {},
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              boxWidth: 20,
              font: { size: 10 },
              padding: 8,
              usePointStyle: true,
              pointStyle: 'line',
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed?.y;
                if (val == null) return '';
                return `${ctx.dataset.label}: $${Number(val).toFixed(2)}`;
              },
            },
          },
        },
        scales: {
          x: { ticks: { maxTicksLimit: 10, font: { size: 10 }, maxRotation: 30 } },
          y: {
            display: true,
            ticks: { callback: (val) => `$${Number(val).toFixed(0)}`, font: { size: 10 } },
          },
        },
      },
    });

    this.cdr.detectChanges();
  }

  // ── Standard chart methods ────────────────────────────────────

  selectRange(range: string): void {
    if (this.chartMode === 'projection') return;
    this.activeRange = range;
    this.destroyChart();
    const filtered = this.filterByRange(this.allHistory, range);
    setTimeout(() => {
      if (this.chartView === 'volume') this.renderVolumeChart(filtered);
      else this.renderPortfolioChart(filtered);
    }, 50);
  }

  loadData(symbol: string): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.fetchQuote(symbol);
    this.fetchChart(symbol);
    this.intervalId = setInterval(() => {
      this.fetchQuote(symbol);
      this.updateChartWithLatestPrice(symbol);
    }, 20000);
  }

  fetchQuote(symbol: string): void {
    this.api.get(`/api/market/quote/${symbol}`).subscribe({
      next: (res: any) => {
        this.quoteData = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Quote error:', err),
    });
    // Fetch market cap and details in parallel
    this.api.get(`/api/market/stocks/${symbol}/details`).subscribe({
      next: (res: any) => {
        this.stockDetails = res;
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  fetchChart(symbol: string): void {
    this.api.get<any[]>(`/api/market/history/${symbol}`).subscribe({
      next: (res) => {
        this.allHistory = res;
        const filtered = this.filterByRange(res, this.activeRange);
        if (this.chartView === 'volume') this.renderVolumeChart(filtered);
        else this.renderPortfolioChart(filtered);
      },
      error: (err) => console.error('Chart fetch error:', err),
    });
  }

  filterByRange(data: any[], range: string): any[] {
    if (!data.length) return [];
    const now = new Date();
    let cutoff: Date;
    switch (range) {
      case '1D':
        return data.slice(-1);
      case '1W':
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1M':
        cutoff = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case '3M':
        cutoff = new Date(now.setMonth(now.getMonth() - 3));
        break;
      default:
        return data;
    }
    return data.filter((s) => new Date(s.date) >= cutoff);
  }

updateChartWithLatestPrice(symbol: string): void {
  if (!this.chart) return;

  this.api.get<any>(`/api/market/quote/${symbol}`).subscribe({
    next: (stock) => {
      const now = new Date().toISOString();
      const price = stock.currentPrice;

      // Add new data point
      this.allHistory.push({
        date: now,
        close: price,
        open: price,
        high: price,
        low: price,
      });

      this.chart.data.labels.push(new Date().toLocaleDateString());
      this.chart.data.datasets[0].data.push(price);

      // Recalculate bounds
      const prices = this.chart.data.datasets[0].data as number[];
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const pad = (maxPrice - minPrice) * 0.08 || 1;

      this.chart.options.scales.y.min = minPrice - pad;
      this.chart.options.scales.y.max = maxPrice + pad;

      // Limit points
      if (this.chart.data.labels.length > 365) {
        this.chart.data.labels.shift();
        this.chart.data.datasets[0].data.shift();
      }

      this.chart.update();
    },
    error: (err) => console.error('Live update error:', err),
  });
}

  renderPortfolioChart(data: any[]): void {
    if (this.chartMode === 'projection') return;
    if (!this.chartRef?.nativeElement || !data.length) return;

    const labels = data.map((s) => s.date.split('T')[0]);
    const prices = data.map((s) => s.close);
    const isGreen = prices[prices.length - 1] >= prices[0];
    const color = isGreen ? '#43a047' : '#e53935';
    const bgColor = isGreen ? 'rgba(67,160,71,0.1)' : 'rgba(229,57,53,0.1)';
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const pricePad = (maxPrice - minPrice) * 0.08 || 1;

    if (this.chart) {
      this.destroyChart();
    }

    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Price',
            data: prices,
            borderColor: color,
            backgroundColor: bgColor,
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: color,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'nearest', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            callbacks: {
              label: (ctx: any) => `$${(ctx.parsed?.y ?? 0).toFixed(2)}`,
            },
          },
        },
        scales: {
          x: { ticks: { maxTicksLimit: 6, font: { size: 10 } }, grid: { display: false } },
          y: {
            position: 'right',
            min: minPrice - pricePad,
            max: maxPrice + pricePad,
            ticks: {
              font: { size: 10 },
              callback: (val: any) => `$${Number(val).toFixed(0)}`,
            },
            grid: { color: 'rgba(0,0,0,0.05)' },
          },
        },
      },
    });
  }

  renderVolumeChart(data: any[]): void {
    if (!this.chartRef?.nativeElement || !data.length) return;

    const labels = data.map((s) => s.date.split('T')[0]);
    const volumes = data.map((s) => s.volume ?? 0);
    const maxVol = Math.max(...volumes.filter((v: number) => v > 0)) || 1;

    if (this.chart) {
      this.destroyChart();
    }

    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Volume',
            data: volumes,
            backgroundColor: 'rgba(0,188,212,0.4)',
            borderColor: 'rgba(0,188,212,0.8)',
            borderWidth: 1,
            barPercentage: 0.9,
            categoryPercentage: 1.0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                const v = ctx.parsed?.y ?? 0;
                if (v >= 1_000_000_000) return `Vol: ${(v / 1_000_000_000).toFixed(1)}B`;
                if (v >= 1_000_000) return `Vol: ${(v / 1_000_000).toFixed(1)}M`;
                if (v >= 1_000) return `Vol: ${(v / 1_000).toFixed(0)}K`;
                return `Vol: ${v}`;
              },
            },
          },
        },
        scales: {
          x: { ticks: { maxTicksLimit: 6, font: { size: 10 } }, grid: { display: false } },
          y: {
            position: 'left',
            min: 0,
            max: maxVol * 1.15,
            title: {
              display: true,
              text: 'Volume',
              font: { size: 10 },
              color: 'rgba(0,188,212,0.9)',
            },
            ticks: {
              font: { size: 9 },
              color: 'rgba(0,188,212,0.9)',
              maxTicksLimit: 5,
              callback: (val: any) => {
                const v = Number(val);
                if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
                if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`;
                if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
                return `${v}`;
              },
            },
            grid: { color: 'rgba(0,0,0,0.05)' },
          },
        },
      },
    });
  }

  renderChart = this.renderPortfolioChart;
}
