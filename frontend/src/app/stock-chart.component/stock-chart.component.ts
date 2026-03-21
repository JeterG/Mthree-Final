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
import { Chart, registerables } from 'chart.js';
import { ApiService } from '../services/api.services';
ApiService;

Chart.register(...registerables);

// Reusable stock chart component
// Mode 1: Pass a symbol — fetches price history from backend
// Mode 2: Pass raw data array — renders directly without any HTTP calls
// Example symbol mode: <app-stock-chart [symbol]="'AAPL'"></app-stock-chart>
// Example data mode:   <app-stock-chart [data]="transactionsForChart"></app-stock-chart>
@Component({
  selector: 'app-stock-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stock-chart.component.html',
  styleUrls: ['./stock-chart.component.css'],
})
export class StockChartComponent implements OnChanges, OnDestroy, AfterViewInit {
  // Symbol mode — fetches data from backend
  @Input() symbol: string = '';

  // Data mode — renders raw data directly, skips all HTTP calls
  @Input() data: any[] = [];

  @ViewChild('chartCanvas', { static: false }) chartRef!: ElementRef<HTMLCanvasElement>;

  quoteData: any;
  activeRange: string = '1Y';
  allHistory: any[] = [];
  chart: any;
  intervalId: any;

  ranges = ['1D', '1W', '1M', '3M', '1Y'];

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.data.length > 0) {
        this.allHistory = this.data;
        this.renderChart(this.data);
        return;
      }
      if (this.symbol && this.symbol.trim() !== '') {
        this.loadData(this.symbol);
      }
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data.length > 0) {
      this.allHistory = this.data;
      setTimeout(() => this.renderChart(this.data), 100);
      return;
    }
    if (changes['symbol'] && !changes['symbol'].firstChange && this.symbol) {
      this.loadData(this.symbol);
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.chart) this.chart.destroy();
  }

  // Switch range — filter already-fetched history client-side
  selectRange(range: string) {
    this.activeRange = range;
    this.renderChart(this.filterByRange(this.allHistory, range));
  }

  // Load quote and chart, then poll every 20 seconds
  loadData(symbol: string) {
    if (this.intervalId) clearInterval(this.intervalId);

    this.fetchQuote(symbol);
    this.fetchChart(symbol);

    this.intervalId = setInterval(() => {
      this.fetchQuote(symbol);
      this.updateChartWithLatestPrice(symbol);
    }, 20000);
  }

  // Fetch current price from stock_cache
  fetchQuote(symbol: string) {
    this.api.get(`/api/market/quote/${symbol}`).subscribe({
      next: (res: any) => {
        this.quoteData = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Quote error:', err),
    });
  }

  // Fetch 1 year of daily history — store all, then filter by active range
  fetchChart(symbol: string) {
    this.api.get<any[]>(`/api/market/history/${symbol}`).subscribe({
      next: (res) => {
        this.allHistory = res;
        this.renderChart(this.filterByRange(res, this.activeRange));
      },
      error: (err) => console.error('Chart fetch error:', err),
    });
  }

  // Filter history data by selected range — no extra API calls needed
  filterByRange(data: any[], range: string): any[] {
    if (!data.length) return [];
    const now = new Date();
    let cutoff: Date;

    switch (range) {
      case '1D':
        cutoff = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
        break;
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

  // Append latest price to chart every 20 seconds without re-fetching all history
  updateChartWithLatestPrice(symbol: string) {
    if (!this.chart) return;

    this.api.get<any>(`/api/market/quote/${symbol}`).subscribe({
      next: (stock) => {
        const now = new Date().toISOString();
        const price = stock.currentPrice;

        this.allHistory.push({ date: now, close: price, open: price, high: price, low: price });

        this.chart.data.labels.push(new Date().toLocaleDateString());
        this.chart.data.datasets[0].data.push(price);

        if (this.chart.data.labels.length > 365) {
          this.chart.data.labels.shift();
          this.chart.data.datasets[0].data.shift();
        }

        this.chart.update();
      },
      error: (err) => console.error('Live update error:', err),
    });
  }

  // Render or update Chart.js line chart
  renderChart(data: any[]) {
    if (!this.chartRef?.nativeElement || !data.length) return;

    const labels = data.map((s) => s.date.split('T')[0]);
    const prices = data.map((s) => s.close);
    const isGreen = prices[prices.length - 1] >= prices[0];
    const color = isGreen ? 'green' : 'red';
    const bgColor = isGreen ? 'rgba(0,200,0,0.1)' : 'rgba(255,0,0,0.1)';

    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = prices;
      this.chart.data.datasets[0].borderColor = color;
      this.chart.data.datasets[0].backgroundColor = bgColor;
      this.chart.update();
      return;
    }

    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
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
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            callbacks: {
              label: (ctx) => {
                const value = ctx.parsed?.y ?? 0;
                return `$${value.toFixed(2)}`;
              },
            },
          },
        },
        scales: {
          x: { ticks: { maxTicksLimit: 6 } },
          y: { display: false },
        },
      },
    });
  }
}
