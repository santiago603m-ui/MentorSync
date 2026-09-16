import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.css']
})
export class SplashScreenComponent implements OnInit {
  visible = signal(true);
  fadingOut = signal(false);

  ngOnInit() {
    const yaVisto = localStorage.getItem('splash_seen');
    if (yaVisto) {
      this.visible.set(false);
      return;
    }

    setTimeout(() => {
      this.fadingOut.set(true);
      setTimeout(() => {
        this.visible.set(false);
        localStorage.setItem('splash_seen', 'true');
      }, 600);
    }, 3000);
  }
}