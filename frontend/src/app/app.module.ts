import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { routes } from './app.routes';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    // Vacío, ya que AppComponent es standalone
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(routes),
    AppComponent // <-- Importado aquí en lugar de declarations
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }