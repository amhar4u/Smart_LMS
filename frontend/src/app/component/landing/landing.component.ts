import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule
  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  features = [
    {
      icon: 'school',
      title: 'Interactive Learning',
      description: 'Engage with interactive content and multimedia resources designed to enhance your learning experience.'
    },
    {
      icon: 'people',
      title: 'Collaborative Environment',
      description: 'Connect with peers and instructors in a collaborative online learning environment.'
    },
    {
      icon: 'assessment',
      title: 'Progress Tracking',
      description: 'Monitor your learning progress with detailed analytics and performance insights.'
    },
    {
      icon: 'schedule',
      title: 'Flexible Scheduling',
      description: 'Learn at your own pace with flexible scheduling and 24/7 access to course materials.'
    },
    {
      icon: 'mobile_friendly',
      title: 'Mobile Learning',
      description: 'Access your courses anytime, anywhere with our responsive mobile-friendly platform.'
    },
    {
      icon: 'verified_user',
      title: 'Secure Platform',
      description: 'Your data is protected with industry-standard security measures and privacy controls.'
    }
  ];

  testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Computer Science Student',
      message: 'The Smart LMS platform has transformed my learning experience. The interactive content and progress tracking keep me motivated.',
      avatar: 'SJ'
    },
    {
      name: 'Dr. Michael Chen',
      role: 'Mathematics Professor',
      message: 'As an educator, I find the platform intuitive and powerful. It helps me deliver engaging content to my students effectively.',
      avatar: 'MC'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Business Student',
      message: 'The flexibility of learning on any device has been a game-changer for my busy schedule. Highly recommend!',
      avatar: 'ER'
    }
  ];
}
