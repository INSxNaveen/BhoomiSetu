import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  username = '';
  password = '';
  showPassword = false;
  rememberMe = true;
  loading = false;
  errorMessage = '';
  successMessage = '';
  showAdminHelper = false;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['registered'] === 'true') {
        this.successMessage = 'Registration successful! Please sign in with your registered username and password.';
        if (params['username']) {
          this.username = params['username'];
        }
      }
    });
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  toggleAdminHelper() {
    this.showAdminHelper = !this.showAdminHelper;
  }

  fillAdminCredentials() {
    this.username = 'super.admin';
    this.password = 'Admin@123';
    this.showAdminHelper = true;
  }

  goToHome() {
    this.router.navigate(['/']);
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  onLogin() {
    if (!this.username.trim() || !this.password) {
      this.errorMessage = 'Please enter your username and password.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.login(this.username.trim(), this.password).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          const role = res.data.user.role;
          if (role === 'SuperAdmin') {
            this.router.navigate(['/admin/dashboard']);
          } else if (role === 'CentralAdmin') {
            this.router.navigate(['/central/dashboard']);
          } else if (role === 'StateAdmin') {
            this.router.navigate(['/state/dashboard']);
          } else if (role === 'DistrictAdmin') {
            this.router.navigate(['/district/dashboard']);
          } else if (role === 'ProjectAgency') {
            this.router.navigate(['/agency/dashboard']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        } else {
          this.errorMessage = res.message || 'Authentication failed. Please check your credentials.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Invalid username or password. If you are a new user, please register first.';
      }
    });
  }
}
