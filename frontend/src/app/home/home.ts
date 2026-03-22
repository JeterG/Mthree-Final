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
  selectedSymbol: string = 'SPY';

symbols = [
  { name: 'S&P 500', symbol: 'SPY' },
  { name: 'Nasdaq', symbol: 'QQQ' },
  { name: 'Dow Jones', symbol: 'DIA' },
];

topMoverSymbols = [
  'AAPL', 'TSLA', 'NVDA', 'AMZN', 'META', 'NFLX',
  'MSFT', 'GOOGL', 'AMD', 'INTC', 'BA',
  'JPM', 'XOM', 'PLTR', 'COIN', 'SHOP',
  'SMCI', 'RIVN', 'SNOW', 'UBER', 'ROKU'
];
topWinners: any[] = [];
topLosers: any[] = [];

selectedMoverType: 'winners' | 'losers' = 'winners';

  isMarketOpen: boolean = false;
  marketStatus: string = '';
  countdown: string = '';

  marketTimeDisplay: string = ''; // ⏰ time
  marketDayDisplay: string = '';  // 📅 day

  intervalId: any;

  currentTimezone: string = 'America/New_York';
  timezoneSub!: Subscription;

  // 🔥 NEW: Gamification Levels
  investingLevel: number = 0;
  learningLevel: number = 0;
  wealthLevel: number = 0;

  constructor(
    private cdr: ChangeDetectorRef,
    private timezoneService: TimezoneService
  ) {}

  selectSymbol(symbol: string) {
    this.selectedSymbol = symbol;
  }

  ngOnInit(): void {
    // 🔥 Load saved levels (optional but recommended)
    this.investingLevel = Number(localStorage.getItem('investing')) || 0;
    this.learningLevel = Number(localStorage.getItem('learning')) || 0;
    this.wealthLevel = Number(localStorage.getItem('wealth')) || 0;

    // 🔥 Timezone subscription
    this.timezoneSub = this.timezoneService.timezone$.subscribe((tz) => {
      console.log('timezone updated:', tz);
      this.currentTimezone = tz;

      this.updateMarketTime(this.currentTimezone);
      this.cdr.detectChanges();
    });

    this.startMarketTimer();
    this.loadTopMovers();
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
async loadTopMovers() {

  const cached = localStorage.getItem('topMovers');

  if (cached) {
    const parsed = JSON.parse(cached);

const now = Date.now();
const cacheAge = now - parsed.timestamp;

// ✅ 48 HOURS CACHE
if (cacheAge < 48 * 60 * 60 * 1000) {
  this.topWinners = parsed.winners;
  this.topLosers = parsed.losers;
  return;
}
  }

  const results: any[] = [];

for (const symbol of this.topMoverSymbols) {
  const res = await fetch(`http://localhost:8080/api/market/history/${symbol}`);
  const data = await res.json();

  if (data.length < 2) continue;

  const recent = data.slice(-28);

  if (recent.length < 2) continue;

  const start = recent[0].close;
  const end = recent[recent.length - 1].close;

  const change = ((end - start) / start) * 100;

  results.push({ symbol, change });
}

  results.sort((a, b) => b.change - a.change);

this.topWinners = results.slice(0, 5);
this.topLosers = results.slice(-5).reverse();

  // ✅ SAVE WITH TIMESTAMP
  localStorage.setItem('topMovers', JSON.stringify({
    winners: this.topWinners,
    losers: this.topLosers,
    timestamp: Date.now()
  }));
}

  updateMarketTime(userTimezone: string) {
    const now = new Date();

    // Always calculate market logic in ET
    const nowET = new Date(
      now.toLocaleString('en-US', { timeZone: 'America/New_York' })
    );

    const day = nowET.getDay();

    let targetTime: Date;

    // 🟡 WEEKEND
    if (day === 0 || day === 6) {
      this.isMarketOpen = false;

      const nextMonday = new Date(nowET);
      const daysUntilMonday = (8 - day) % 7;
      nextMonday.setDate(nowET.getDate() + daysUntilMonday);
      nextMonday.setHours(9, 30, 0, 0);

      targetTime = nextMonday;

    } else {
      const openET = new Date(nowET);
      openET.setHours(9, 30, 0, 0);

      const closeET = new Date(nowET);
      closeET.setHours(16, 0, 0, 0);

      if (nowET < openET) {
        this.isMarketOpen = false;
        targetTime = openET;

      } else if (nowET >= openET && nowET < closeET) {
        this.isMarketOpen = true;
        targetTime = closeET;

      } else {
        this.isMarketOpen = false;

        const nextOpen = new Date(openET);
        nextOpen.setDate(nextOpen.getDate() + 1);
        targetTime = nextOpen;
      }
    }

    // ⏱ Countdown
    const diff = targetTime.getTime() - nowET.getTime();
    this.countdown = this.formatTime(diff);

    // 🌍 Convert to USER timezone
    const targetUser = new Date(
      targetTime.toLocaleString('en-US', { timeZone: userTimezone })
    );

    // 📅 Day
    this.marketDayDisplay = targetUser.toLocaleDateString('en-US', {
      weekday: 'long',
    });

    // ⏰ Time
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

  // 🔥 NEW: Click Handlers

  increaseInvesting() {
    this.investingLevel++;
    localStorage.setItem('investing', this.investingLevel.toString());

    alert(`📈 Investing level +1!\nCurrent investing level: ${this.investingLevel}`);
  }

  increaseLearning() {
    this.learningLevel++;
    localStorage.setItem('learning', this.learningLevel.toString());

    alert(`🧠 Market knowledge level +1!\nCurrent market knowledge level: ${this.learningLevel}`);
  }

  increaseWealth() {
    this.wealthLevel++;
    localStorage.setItem('wealth', this.wealthLevel.toString());

    alert(`💰 Confidence boost level +1!\nCurrent confidence level: ${this.wealthLevel}`);
  }
getBarWidth(change: number): number {
  const max = 50; // max expected % range
  const normalized = Math.min(Math.abs(change), max);

  return (normalized / max) * 85; 
  // 🔥 85% instead of 100% → leaves space for %
}
  
}