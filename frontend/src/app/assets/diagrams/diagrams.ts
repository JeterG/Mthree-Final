import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-diagrams',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diagrams.html',
  styleUrls: ['./diagrams.css'],
  encapsulation: ViewEncapsulation.None,
})
export class DiagramsComponent {}
