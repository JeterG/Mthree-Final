import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  data: any;
  selectedSymbol: string = 'AAPL';
  activeRange: string = '1Y';

  // All history data fetched once — filtered client-side by range
  allHistory: any[] = [];

  @ViewChild('chartCanvas') chartRef!: ElementRef<HTMLCanvasElement>;
  chart: any;
  intervalId: any;

  ranges = ['1D', '1W', '1M', '3M', '1Y'];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadData(this.selectedSymbol);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  // Switch to a different symbol
  selectSymbol(symbol: string) {
    this.selectedSymbol = symbol;
    this.loadData(symbol);
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
    this.http.get(`http://localhost:8080/api/market/quote/${symbol}`).subscribe({
      next: (res: any) => (this.data = res),
      error: (err) => console.error('Quote error:', err),
    });
  }

  // Fetch 1 year of daily history — store all, then filter by active range
  fetchChart(symbol: string) {
    this.http.get<any[]>(`http://localhost:8080/api/market/history/${symbol}`).subscribe({
      next: (res) => {
        this.allHistory = res;
        this.renderChart(this.filterByRange(res, this.activeRange));
      },
      error: (err) => console.error('Chart fetch error:', err),
    });
  }

  // Filter history data by selected range
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
        return data; // 1Y — return all
    }

    return data.filter((s) => new Date(s.date) >= cutoff);
  }

  // Append latest price to chart every 20 seconds
  updateChartWithLatestPrice(symbol: string) {
    if (!this.chart) return;

    this.http.get<any>(`http://localhost:8080/api/market/quote/${symbol}`).subscribe({
      next: (stock) => {
        const now = new Date().toLocaleDateString();
        const price = stock.currentPrice;

        this.chart.data.labels.push(now);
        this.chart.data.datasets[0].data.push(price);

        // Keep max 365 points
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
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { maxTicksLimit: 6 } },
          y: { display: false },
        },
      },
    });
  }
}
