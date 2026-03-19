import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

// Portfolio Value Over Time chart
// Takes raw transaction data and plots cumulative portfolio value
// Each point = running total after each transaction
// Example: <app-portfolio-chart [transactions]="transactions" [startingBalance]="10000"></app-portfolio-chart>
@Component({
  selector: 'app-portfolio-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portfolio-chart-component.html',
  styleUrls: ['./portfolio-chart-component.css'],
})
export class PortfolioChartComponent implements OnChanges, OnDestroy {
  @Input() transactions: any[] = [];
  @Input() startingBalance: number = 10000;

  // static: false because canvas is inside *ngIf
  @ViewChild('portfolioCanvas', { static: false }) chartRef!: ElementRef<HTMLCanvasElement>;

  chart: any;

  // Reload chart whenever transactions input changes
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transactions']) {
      const current = changes['transactions'].currentValue;
      if (current && current.length > 0) {
        // Delay to allow *ngIf to render the canvas first
        setTimeout(() => this.renderChart(), 100);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.chart) this.chart.destroy();
  }

  // Build cumulative cash balance from transactions
  // BUY reduces cash, SELL increases cash
  buildChartData(): { labels: string[]; values: number[] } {
    const labels: string[] = [];
    const values: number[] = [];

    // Sort transactions by date oldest first
    const sorted = [...this.transactions].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    let runningBalance = 0;

    sorted.forEach((t) => {
      const amount = +t.totalAmount;
      if (t.type === 'BUY') {
        runningBalance += amount;
      } else {
        runningBalance -= amount;
      }
      labels.push(new Date(t.createdAt).toLocaleDateString());
      values.push(+runningBalance.toFixed(2));
    });

    return { labels, values };
  }

  renderChart(): void {
    if (!this.chartRef?.nativeElement) return;

    const { labels, values } = this.buildChartData();
    if (!values.length) return;

    const isGreen = values[values.length - 1] >= this.startingBalance;
    const color = isGreen ? 'green' : 'red';
    const bgColor = isGreen ? 'rgba(0,200,0,0.1)' : 'rgba(255,0,0,0.1)';

    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = values;
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
            data: values,
            borderColor: color,
            backgroundColor: bgColor,
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
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
          y: {
            ticks: {
              callback: (val) => `$${val}`,
            },
          },
        },
      },
    });
  }
}
