import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
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
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  // 🔹 Tab click
  selectSymbol(symbol: string) {
    this.selectedSymbol = symbol;
    this.loadData(symbol);
  }

  // 🔥 LOAD + POLL
  loadData(symbol: string) {

    // clear previous polling
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.fetchQuote(symbol);
    this.fetchChart(symbol);

    // 🔥 poll every 10s
    this.intervalId = setInterval(() => {
      this.fetchQuote(symbol);
      this.fetchChart(symbol);
    }, 10000);
  }

  // ✅ QUOTE
  fetchQuote(symbol: string) {
    this.http.get(`http://localhost:8080/api/market/${symbol}`)
      .subscribe({
        next: (res: any) => {
          this.data = res;
        },
        error: (err) => {
          console.error('Quote error:', err);
        }
      });
  }

  // ✅ CHART
  fetchChart(symbol: string) {
    this.http.get(`http://localhost:8080/api/market/chart/${symbol}`)
      .subscribe({
        next: (res: any) => {

          if (res.s !== 'ok') {
            console.error('Chart error:', res);
            return;
          }

          this.renderChart(res);
        },
        error: (err) => {
          console.error('Chart fetch error:', err);
        }
      });
  }

  // 🔥 RENDER / UPDATE CHART
  renderChart(data: any) {

    if (!this.chartRef?.nativeElement) return;

    const labels = data.t.map((ts: number) =>
      new Date(ts).toLocaleTimeString()
    );

    const isGreen = data.c[data.c.length - 1] >= data.c[0];

    // 🔥 UPDATE EXISTING CHART
    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = data.c;
      this.chart.update();
      return;
    }

    const ctx = this.chartRef.nativeElement;

    // 🔥 CREATE CHART FIRST TIME
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          data: data.c,
          borderColor: isGreen ? 'green' : 'red',
          backgroundColor: isGreen
            ? 'rgba(0,200,0,0.1)'
            : 'rgba(255,0,0,0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            ticks: {
              maxTicksLimit: 6
            }
          },
          y: {
            display: false
          }
        }
      }
    });
  }
}