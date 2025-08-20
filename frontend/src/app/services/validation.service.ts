import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  static emailValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.value;
    if (!email) return null;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? null : { invalidEmail: true };
  }

  static phoneValidator(control: AbstractControl): ValidationErrors | null {
    const phone = control.value;
    if (!phone) return null;
    
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone) ? null : { invalidPhone: true };
  }

  static passwordValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    if (!password) return null;

    const errors: ValidationErrors = {};
    
    if (password.length < 8) {
      errors['minLength'] = true;
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors['lowercase'] = true;
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors['uppercase'] = true;
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors['number'] = true;
    }
    
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors['specialChar'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  static confirmPasswordValidator(passwordField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.parent?.get(passwordField)?.value;
      const confirmPassword = control.value;
      
      if (!password || !confirmPassword) return null;
      
      return password === confirmPassword ? null : { passwordMismatch: true };
    };
  }

  static getPasswordErrorMessage(errors: ValidationErrors): string {
    if (errors['required']) return 'Password is required';
    if (errors['minLength']) return 'Password must be at least 8 characters long';
    if (errors['lowercase']) return 'Password must contain at least one lowercase letter';
    if (errors['uppercase']) return 'Password must contain at least one uppercase letter';
    if (errors['number']) return 'Password must contain at least one number';
    if (errors['specialChar']) return 'Password must contain at least one special character (@$!%*?&)';
    return '';
  }
}
