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

  @ViewChild('chartCanvas') chartRef!: ElementRef<HTMLCanvasElement>;
  chart: any;

  intervalId: any;

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

  // Load quote and chart, then poll every 30 seconds
  // History data is daily so no need to poll faster than that
  loadData(symbol: string) {
    if (this.intervalId) clearInterval(this.intervalId);

    this.fetchQuote(symbol);
    this.fetchChart(symbol);

    this.intervalId = setInterval(() => {
      this.fetchQuote(symbol);
    }, 30000); // only poll quote — chart data is daily and won't change
  }

  // Fetch current price from cache via /api/market/quote/{symbol}
  fetchQuote(symbol: string) {
    this.http.get(`http://localhost:8080/api/market/quote/${symbol}`).subscribe({
      next: (res: any) => (this.data = res),
      error: (err) => console.error('Quote error:', err),
    });
  }

  // Fetch 1 year of daily history from /api/market/history/{symbol}
  // Returns list of { date, open, high, low, close }
  fetchChart(symbol: string) {
    this.http.get<any[]>(`http://localhost:8080/api/market/history/${symbol}`).subscribe({
      next: (res) => this.renderChart(res),
      error: (err) => console.error('Chart fetch error:', err),
    });
  }

  // Render or update the Chart.js line chart
  renderChart(data: any[]) {
    if (!this.chartRef?.nativeElement || !data.length) return;

    const labels = data.map((s) => s.date.split('T')[0]);
    const prices = data.map((s) => s.close);
    const isGreen = prices[prices.length - 1] >= prices[0];
    const color = isGreen ? 'green' : 'red';
    const bgColor = isGreen ? 'rgba(0,200,0,0.1)' : 'rgba(255,0,0,0.1)';

    // Update existing chart instead of recreating it
    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = prices;
      this.chart.data.datasets[0].borderColor = color;
      this.chart.data.datasets[0].backgroundColor = bgColor;
      this.chart.update();
      return;
    }

    // Create chart for the first time
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
