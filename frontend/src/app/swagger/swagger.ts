import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ViewEncapsulation } from '@angular/core';
import { SwaggerUIBundle, SwaggerUIStandalonePreset } from 'swagger-ui-dist';
import { environment } from '../../environments/environment';
@Component({
  selector: 'app-swagger',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'swagger.html',
  // Required: Set encapsulation to None so your CSS can pierce Swagger's shadow DOM.
  encapsulation: ViewEncapsulation.None,
  styles: [
    `
      /* 1. Standard Swagger UI Styles */

      /* --- Centering the Entire Content --- */
      /* This makes the User Controller and blocks center with the title */
      .swagger-ui {
        width: 100%;
        max-width: 1100px; /* Optional: Sets a reasonable maximum width */
        margin: 0 auto;
        padding-top: 10px;
      }

      /* --- Custom Title Styles --- */

      /* Center the text within the container */
      .swagger-ui .info {
        text-align: center;
        margin-bottom: 30px; /* Space between title and first controller */
      }

      /* Style the title itself */
      .swagger-ui .info .title {
        color: #000000 !important; /* Force Black text */
        font-family: sans-serif;
        font-weight: bold;
        display: inline-block; /* Helps with perfect centering */
        margin: 0 auto !important;
        text-align: center !important;
        width: 100%; /* Spans the container to center */
      }

      /* --- Hiding Unwanted Elements --- */

      /* Hide the black/green Swagger header entirely */
      .swagger-ui .topbar {
        display: none;
      }

      /* Hide all sub-components of the title (version, description, urls) */
      .swagger-ui .info .description,
      .swagger-ui .info .version,
      .swagger-ui .info .main + a,
      .swagger-ui .info h2 + pre,
      .swagger-ui .info .url,
      .swagger-ui .info .block {
        display: none !important;
      }

      /* Hide the Schemes/Servers section (dropdown and Authorize button) */
      .swagger-ui .scheme-container {
        display: none !important;
      }
    `,
  ],
})
export class SwaggerComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    SwaggerUIBundle({
      url: `${environment.apiUrl}/v3/api-docs`,
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [(SwaggerUIBundle as any).presets.apis, SwaggerUIStandalonePreset],
      layout: 'BaseLayout', // Note: BaseLayout works better when topbar is hidden

      // --- Ensures the text matches exactly ---
      onComplete: () => {
        const titleElem = document.querySelector('.swagger-ui .info .title');
        if (titleElem) {
          titleElem.textContent = 'API Documentation';
        }
      },
    });
  }
}
