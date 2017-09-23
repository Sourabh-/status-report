import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppComponent } from './app.component';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/home/dashboard/dashboard.component';
import { EffortComponent } from './pages/home/effort/effort.component';
import { MasterComponent } from './pages/home/master/master.component';
import { UsersComponent } from './pages/home/users/users.component';

import { DateValidatorDirective } from './services/datevalidator.directive';

import { AmChartsModule } from "@amcharts/amcharts3-angular";
import { Ng2TableModule } from 'ng2-table/ng2-table';
import { PaginationModule, TabsModule } from 'ng2-bootstrap/ng2-bootstrap';

const appRoutes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'home',
    component: HomeComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'effort', component: EffortComponent },
      { path: 'master', component: MasterComponent },
      { path: 'users', component: UsersComponent }
    ]
  },
  { path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  }
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
    DashboardComponent,
    EffortComponent,
    MasterComponent,
    UsersComponent,
    DateValidatorDirective
  ],
  imports: [
    BrowserModule,
    NgbModule.forRoot(),
    RouterModule.forRoot(
      appRoutes
    ),
    ReactiveFormsModule,
    HttpModule,
    FormsModule,
    AmChartsModule,
    Ng2TableModule,
    PaginationModule.forRoot(),
    TabsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
