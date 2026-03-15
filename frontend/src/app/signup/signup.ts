import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class SignupComponent {

  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  signup(){
    console.log("Signup:", this.email, this.password);
  }

}