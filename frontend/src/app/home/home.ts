import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { TimezoneService } from '../home/timezone.service';
import { ApiService } from '../services/api.services';
import { StockChartComponent } from '../stock-chart.component/stock-chart.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, StockChartComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  selectedSymbol: string = 'SPY';
//4 of the most popular stock index markets
//S&P in particular tracks the 500 largest companies in the US
symbols = [
  { name: 'S&P 500', symbol: 'SPY' },
  { name: 'Nasdaq', symbol: 'QQQ' },
  { name: 'Dow Jones', symbol: 'DIA' },
  { name: 'Russell 2000', symbol: 'IWM' }, 
];
  //hardcoded popular companies used for top movers (losers and winners) 
  topMoverSymbols = [
    'AAPL',
    'TSLA',
    'NVDA',
    'AMZN',
    'META',
    'NFLX',
    'MSFT',
    'GOOGL',
    'AMD',
    'INTC',
    'BA',
    'JPM',
    'XOM',
    'PLTR',
    'COIN',
    'SHOP',
    'SMCI',
    'RIVN',
    'SNOW',
    'UBER',
    'ROKU',
  ];
  topWinners: any[] = [];
  topLosers: any[] = [];

  selectedMoverType: 'winners' | 'losers' = 'winners';

  isMarketOpen: boolean = false;
  marketStatus: string = '';
  countdown: string = '';

  marketTimeDisplay: string = '';
  marketDayDisplay: string = '';

  intervalId: any;

  currentTimezone: string = 'America/New_York';
  timezoneSub!: Subscription;

  investingLevel: number = 0;
  learningLevel: number = 0;
  wealthLevel: number = 0;

  constructor(
    private cdr: ChangeDetectorRef,
    private timezoneService: TimezoneService,
    private api: ApiService,
  ) {}

  selectSymbol(symbol: string) {
    this.selectedSymbol = symbol;
  }

  ngOnInit(): void {
    this.investingLevel = Number(localStorage.getItem('investing')) || 0;
    this.learningLevel = Number(localStorage.getItem('learning')) || 0;
    this.wealthLevel = Number(localStorage.getItem('wealth')) || 0;

    this.timezoneSub = this.timezoneService.timezone$.subscribe((tz) => {
      this.currentTimezone = tz;
      this.updateMarketTime(this.currentTimezone);
      this.cdr.detectChanges();
    });

    this.startMarketTimer();
    this.loadTopMovers();
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
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
      //math for last 48 hours get data, if older then we skip this 
      if (Date.now() - parsed.timestamp < 48 * 60 * 60 * 1000) {
        this.topWinners = parsed.winners;
        this.topLosers = parsed.losers;
        return;
      }
    }

    const results: any[] = [];

    for (const symbol of this.topMoverSymbols) {
      try {
        const data = await this.api.get<any[]>(`/api/market/history/${symbol}`).toPromise();
        if (!data || data.length < 2) continue;

        const recent = data.slice(-28);
        if (recent.length < 2) continue;

        const start = recent[0].close;
        const end = recent[recent.length - 1].close;
        const change = ((end - start) / start) * 100;
        results.push({ symbol, change });
      } catch {
        //skip failed symbols
      }
    }

    results.sort((a, b) => b.change - a.change);
    this.topWinners = results.slice(0, 5);
    this.topLosers = results.slice(-5).reverse();

    localStorage.setItem(
      'topMovers',
      JSON.stringify({
        winners: this.topWinners,
        losers: this.topLosers,
        timestamp: Date.now(),
      }),
    );

    this.cdr.detectChanges();
  }

  updateMarketTime(userTimezone: string) {
    const now = new Date();
    const nowET = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const day = nowET.getDay();
    let targetTime: Date;

    if (day === 0 || day === 6) {
      this.isMarketOpen = false;
      const nextMonday = new Date(nowET);
      nextMonday.setDate(nowET.getDate() + ((8 - day) % 7));
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
      // after market closes for that day 
      } else {
        this.isMarketOpen = false;
        const nextOpen = new Date(openET);
        nextOpen.setDate(nextOpen.getDate() + 1);
        targetTime = nextOpen;
      }
    }

    this.countdown = this.formatTime(targetTime.getTime() - nowET.getTime());

    const targetUser = new Date(targetTime.toLocaleString('en-US', { timeZone: userTimezone }));
    this.marketDayDisplay = targetUser.toLocaleDateString('en-US', { weekday: 'long' });
    this.marketTimeDisplay = targetUser.toLocaleTimeString([], {
      //makes it look like 09:03AM for example 
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatTime(ms: number): string {
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${h}h ${m}m ${s}s`;
  }

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
    return (Math.min(Math.abs(change), 50) / 50) * 85;
  }
}
