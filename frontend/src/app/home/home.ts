import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { StockChartComponent } from '../stock-chart.component/stock-chart.component';
import { ChangeDetectorRef } from '@angular/core';
import { TimezoneService } from '../home/timezone.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, StockChartComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  selectedSymbol: string = 'AAPL';
  symbols = ['AAPL', 'NVDA', 'MSFT', 'TSLA'];

  isMarketOpen: boolean = false;
  marketStatus: string = '';
  countdown: string = '';
  marketTimeDisplay: string = ''; // 🔥 NEW

  intervalId: any;

  currentTimezone: string = 'America/New_York';
  timezoneSub!: Subscription;

  constructor(
    private cdr: ChangeDetectorRef,
    private timezoneService: TimezoneService
  ) {}

  selectSymbol(symbol: string) {
    this.selectedSymbol = symbol;
  }

  ngOnInit(): void {
    // 🔥 Subscribe to timezone changes
    this.timezoneSub = this.timezoneService.timezone$.subscribe((tz) => {
      console.log('timezone updated:', tz);
      this.currentTimezone = tz;

      this.updateMarketTime(this.currentTimezone);
      this.cdr.detectChanges();
    });

    this.startMarketTimer();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.timezoneSub?.unsubscribe();
  }

  startMarketTimer() {
    this.updateMarketTime(this.currentTimezone);

    this.intervalId = setInterval(() => {
      this.updateMarketTime(this.currentTimezone);
      this.cdr.detectChanges();
    }, 1000);
  }

  updateMarketTime(userTimezone: string) {
    const now = new Date();

    // Market logic always in ET
    const nowET = new Date(
      now.toLocaleString('en-US', { timeZone: 'America/New_York' })
    );

    const day = nowET.getDay();

    // 🟡 WEEKEND
    if (day === 0 || day === 6) {
      this.marketStatus = 'Market closed (Weekend)';
      this.isMarketOpen = false;

      const nextMonday = new Date(nowET);
      const daysUntilMonday = (8 - day) % 7;
      nextMonday.setDate(nowET.getDate() + daysUntilMonday);
      nextMonday.setHours(9, 30, 0, 0);

      const diff = nextMonday.getTime() - nowET.getTime();
      this.countdown = this.formatTime(diff);

      // 🔥 Display local time
      const targetUser = new Date(
        nextMonday.toLocaleString('en-US', { timeZone: userTimezone })
      );

      this.marketTimeDisplay = targetUser.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      return;
    }

    const openET = new Date(nowET);
    openET.setHours(9, 30, 0, 0);

    const closeET = new Date(nowET);
    closeET.setHours(16, 0, 0, 0);

    let targetTime: Date;

    if (nowET < openET) {
      this.marketStatus = 'Market opens in';
      this.isMarketOpen = false;
      targetTime = openET;

    } else if (nowET >= openET && nowET < closeET) {
      this.marketStatus = 'Market closes in';
      this.isMarketOpen = true;
      targetTime = closeET;

    } else {
      this.marketStatus = 'Market opens in';
      this.isMarketOpen = false;

      const nextOpen = new Date(openET);
      nextOpen.setDate(nextOpen.getDate() + 1);
      targetTime = nextOpen;
    }

    const diff = targetTime.getTime() - nowET.getTime();
    this.countdown = this.formatTime(diff);

    // 🔥 Convert to user timezone for display
    const targetUser = new Date(
      targetTime.toLocaleString('en-US', { timeZone: userTimezone })
    );

    this.marketTimeDisplay = targetUser.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
  }
}