import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.services';
import { StockChartComponent } from '../stock-chart.component/stock-chart.component';
@Component({
  selector: 'app-stock-page',
  standalone: true,
  imports: [CommonModule, StockChartComponent],
  templateUrl: './stock-page.html',
  styleUrls: ['./stock-page.css'],
})
export class StockPageComponent implements OnInit {
  symbol: string = '';
  data: any = null;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.symbol = this.route.snapshot.paramMap.get('symbol') || '';
    this.loadStock();
  }

  loadStock() {
    this.data = null;

    this.api.get(`/api/market/stocks/${this.symbol}/details`).subscribe({
      next: (res) => {
        console.log('SUCCESS:', res);

        this.data = res;

        this.cd.detectChanges(); //refreshes ui on change 
      },
      error: (err) => {
        console.error('API ERROR:', err);

        this.data = {}; // is able to safely still load the page but gives N/A values

        this.cd.detectChanges(); 
      },
    });
  }
}
