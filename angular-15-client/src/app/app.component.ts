import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { StorageService } from './_services/storage.service';
import { AuthService } from './_services/auth.service';
import { EventBusService } from './_shared/event-bus.service';
import Web3 from 'web3';
import { UserService } from './_services/user.service';
import {ethers, providers} from "ethers";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private roles: string[] = [];
  public depositedBalance: any;
  isLoggedIn = false;
  showAdminBoard = false;
  showModeratorBoard = false;
  username?: string;
  //private web3: Web3;
  navbarOpen = false;
  eventBusSub?: Subscription;
  public ethereum:any;
  public metamaskConnected = false;
  private signer: any;

  constructor(
    private storageService: StorageService,
    private authService: AuthService,
    private eventBusService: EventBusService,
    private userService:UserService,
  ) {
    const alchemy_url = "https://eth-sepolia.g.alchemy.com/v2/YGNAUM7D8wTvwFUIV8iyRv0i8N6BTT86";
    //this.web3 = new Web3(alchemy_url);
    const {ethereum} = <any>window;
    this.ethereum = ethereum;
  }

  async ngOnInit(): Promise<void> {
    this.isLoggedIn = this.storageService.isLoggedIn();
    if (this.isLoggedIn) {
      const user = this.storageService.getUser();
      this.roles = user.roles;
      this.metamaskConnected= await this.userService.ethersConnectWallet();
      this.showAdminBoard = this.roles.includes('ROLE_ADMIN');
      this.showModeratorBoard = this.roles.includes('ROLE_MODERATOR');

      this.username = user.username;
      this.depositedBalance= user.depositedBalance;
    }

    this.eventBusSub = this.eventBusService.on('logout', () => {
      this.logout();
    });
  }
 
  toggleNavbar() {
    this.navbarOpen = !this.navbarOpen;
  }
  getUserBalance(){
    
  }
  logout(): void {
    this.authService.logout().subscribe({
      next: res => {
        console.log(res);
        this.storageService.clean();

        window.location.reload();
      },
      error: err => {
        console.log(err);
      }
    });
  }
}
