import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.services';
@Component({
  selector: 'app-stock-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stock-page.html',
})
export class StockPageComponent implements OnInit {
  symbol: string = '';
  data: any = null;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cd: ChangeDetectorRef, // 🔥 ADD THIS
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

        this.cd.detectChanges(); // 🔥 FORCE UI UPDATE
      },
      error: (err) => {
        console.error('API ERROR:', err);

        this.data = {};

        this.cd.detectChanges(); // 🔥 ALSO HERE
      },
    });
  }
}
