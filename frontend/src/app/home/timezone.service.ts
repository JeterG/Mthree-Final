import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TimezoneService {
  private timezoneSubject = new BehaviorSubject<string>(
    localStorage.getItem('timezone') || 'America/New_York',
  );

  timezone$ = this.timezoneSubject.asObservable();

  setTimezone(tz: string) {
    localStorage.setItem('timezone', tz);
    this.timezoneSubject.next(tz); //  notify all components
  }

  getTimezone() {
    return this.timezoneSubject.value;
  }
}
