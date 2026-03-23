import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { ApiService } from '../services/api.services';

@Component({
  selector: 'app-market-index',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './market-index.html',
  styleUrls: ['./market-index.css'],
})
export class MarketIndexComponent implements OnInit {
  indexes = [
    { name: 'S&P 500', symbol: '^GSPC' },
    { name: 'Nasdaq', symbol: '^IXIC' },
    { name: 'Dow Jones', symbol: '^DJI' },
  ];

  selectedSymbol: string = '^GSPC';
  chart: any;

  // RANGE SUPPORT
  activeRange: string = '1Y';
  ranges = ['1D', '1W', '1M', '3M', '1Y'];

  // Store full history once
  allHistory: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadChart(this.selectedSymbol);
  }

  // Switch index (tabs)
  selectIndex(symbol: string) {
    this.selectedSymbol = symbol;
    this.activeRange = '1Y'; // reset range when switching
    this.loadChart(symbol);
  }

  // Load history ONCE
  loadChart(symbol: string) {
    this.api.get<any[]>(`/api/market/history/${symbol}`).subscribe({
      next: (data) => {
        this.allHistory = data;
        this.renderChart(this.filterByRange(data, this.activeRange));
      },
      error: (err) => console.error('Error:', err),
    });
  }

  // Change range (NO API CALL)
  selectRange(range: string) {
    this.activeRange = range;
    this.renderChart(this.filterByRange(this.allHistory, range));
  }

  // Filter data client-side
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
        return data; // 1Y
    }

    return data.filter((s) => new Date(s.date) >= cutoff);
  }

  // Render chart
  renderChart(data: any[]) {
    if (!data || data.length === 0) return;

    const labels = data.map((d) => d.date.split('T')[0]);
    const prices = data.map((d) => d.close);

    const isGreen = prices[prices.length - 1] >= prices[0];

    const ctx = document.getElementById('mainChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data: prices,
            borderColor: isGreen ? 'green' : 'red',
            backgroundColor: isGreen ? 'rgba(0,200,0,0.1)' : 'rgba(255,0,0,0.1)',
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
          x: { ticks: { maxTicksLimit: 5 } },
          y: { display: false },
        },
      },
    });
  }
}
