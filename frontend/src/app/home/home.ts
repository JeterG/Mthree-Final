import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { StockChartComponent } from '../stock-chart.component/stock-chart.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, StockChartComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent {
  selectedSymbol: string = 'AAPL';
  symbols = ['AAPL', 'NVDA', 'MSFT', 'TSLA'];

  selectSymbol(symbol: string) {
    this.selectedSymbol = symbol;
  }
}
