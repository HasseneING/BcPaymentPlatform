/* The AppComponent class is the root component of the Angular application and handles user
authentication, role-based access control, and updates user information. */
import { Component } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { StorageService } from './_services/storage.service';
import { AuthService } from './_services/auth.service';
import { EventBusService } from './_shared/event-bus.service';
import { LoaderService } from './loader.service';
import Web3 from 'web3';
import Swal from 'sweetalert2';
import { UserService } from './_services/user.service';
import { ethers, providers } from "ethers";
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
/* The AppComponent class is responsible for managing the user interface and functionality of the main
application component, including user authentication, role-based access control, and updating user
information. */
export class AppComponent {
  private roles: string[] = [];
  public depositedBalance: any;
  isLoggedIn = false;
  showAdminBoard = false;
  showModeratorBoard = false;
  username?: string;
  navbarOpen = false;
  eventBusSub?: Subscription;
  public ethereum: any;
  public metamaskConnected = false;
  private signer: any;

  constructor(
    private storageService: StorageService,
    private authService: AuthService,
    private eventBusService: EventBusService,
    private userService: UserService,
    private loadingService:LoaderService,
  ) {
    const alchemy_url = "https://eth-sepolia.g.alchemy.com/v2/YGNAUM7D8wTvwFUIV8iyRv0i8N6BTT86";
    const { ethereum } = <any>window;
    this.ethereum = ethereum;
  }

  async ngOnInit(): Promise<void> {
    interval(5000).subscribe(() => { this.updateUser(); })
    this.isLoggedIn = this.storageService.isLoggedIn();
    if (this.isLoggedIn) {
      const user = this.storageService.getUser();
      this.roles = user.roles;
      this.metamaskConnected = await this.userService.ethersConnectWallet();
      this.showAdminBoard = this.roles.includes('ROLE_ADMIN');
      this.showModeratorBoard = this.roles.includes('ROLE_MODERATOR');
      this.username = user.username;
      this.depositedBalance = user.depositedBalance;
    }

    this.eventBusSub = this.eventBusService.on('logout', () => {
      this.logout();
    });



  }
 /**
  * The function `updateUser()` is used to update the user's balance and display a success message if
  * the balance has been changed.
  */
  updateUser() {
    this.userService.getUserUpdate(this.storageService.getUser().username).subscribe({
      next: data => {
        if (this.storageService.getUser().depositedBalance == data.depositedBalance) {
        }
        else {
          this.storageService.updateUser(data.forwarderAddr, data.depositedBalance);
          console.log("balance Changed");
          this.loadingService.setLoading(false);
          Swal.fire({
            position: 'top-end',
            icon: 'success',
            title: 'Your Balance Has been Updated!',
            showConfirmButton: false,
            timer: 1500
          }).then(() => {
            window.location.reload();
          })

        }

      },
      error: err => {
        console.log(err);
      }
    })
  }
  toggleNavbar() {
    this.navbarOpen = !this.navbarOpen;
  }
  getUserBalance() {
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
