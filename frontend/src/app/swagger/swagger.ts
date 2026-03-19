import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ViewEncapsulation } from '@angular/core';
import { SwaggerUIBundle, SwaggerUIStandalonePreset } from 'swagger-ui-dist';

@Component({
  selector: 'app-swagger',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'swagger.html',
  encapsulation: ViewEncapsulation.None, // Required to override Swagger's internal CSS
  styles: [
    `
      @import 'swagger-ui-dist/swagger-ui.css';

      /* Hide the Info section (Title, Description, URL) */
      .swagger-ui .info {
        display: none;
      }

      /* Hide the Schemes/Servers selection dropdown */
      .swagger-ui .scheme-container {
        display: none;
      }

      /* Optional: Hide the "Models" section at the very bottom if you don't want it */
      .swagger-ui .models {
        display: none;
      }

      /* Remove top padding so it starts exactly at the first Controller */
      .swagger-ui {
        padding-top: 0;
      }
    `,
  ],
})
export class SwaggerComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    SwaggerUIBundle({
      url: 'http://localhost:8080/v3/api-docs',
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [(SwaggerUIBundle as any).presets.apis, SwaggerUIStandalonePreset],
      // BaseLayout removes the top 'Swagger' search header
      layout: 'BaseLayout',
    });
  }
}
