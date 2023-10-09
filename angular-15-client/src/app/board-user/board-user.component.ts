/* The `BoardUserComponent` class is a component in an Angular application that handles user
interactions and transactions related to a user's account. */
import { Component, OnInit } from '@angular/core';
import { UserService } from '../_services/user.service';
import { StorageService } from '../_services/storage.service';
import { LoaderService } from '../loader.service';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { getForwarderSOL, getWalletSOL } from '../contracts/contractABIs';
import { from } from 'rxjs';
const alchemy = require("alchemy-sdk");
import Swal from 'sweetalert2';
import { Contract, ethers, providers } from "ethers";
import { FormControl, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'app-board-user',
  templateUrl: './board-user.component.html',
  styleUrls: ['./board-user.component.css']
})
export class BoardUserComponent implements OnInit {
  content?: string;
  depositForm: any = {
    ethValue: null,
  };
  TransferForm: any = {
    ethValueTransfer: null,
    User: null,
  };
  public isSwalVisible: boolean = false;
  public walletConnected: boolean = false;
  public walletId: string = '';
  public walletBalance: string = '';
  private contractInst: any;
  private walletContractInstance: any;
  private forwarderAddress: string = '';
  private ethersProvider: any;
  public activated: boolean = false;
  public errorMessage: string = '';
  public depositedAmount: any;
  ethersContract: Contract;

  constructor(private userService: UserService, private StorageService: StorageService, private loadingService: LoaderService,
  ) {

    const provider = "https://sepolia.infura.io/v3/acaa2699bfc84be092239f5676e3192a" //HAVE TO ADD .ENV FILE 
    const wssProvider = "wss://sepolia.infura.io/ws/v3/acaa2699bfc84be092239f5676e3192a"
    this.ethersProvider = ethers.providers.InfuraProvider.getWebSocketProvider("sepolia", "acaa2699bfc84be092239f5676e3192a");
    this.ethersContract = new ethers.Contract(getWalletSOL().address, getWalletSOL().abi, this.userService.signer);
  }

  ngOnInit(): void {
    this.checkWalletConnected();
    console.log("check Forwarder here");
    this.userService.getUserBoard().subscribe({
      next: data => {
        this.content = data;
      },
      error: err => {
        if (err.error) {
          try {
            const res = JSON.parse(err.error);
            this.content = res.message;
          } catch {
            this.content = `Error with status: ${err.status} - ${err.statusText}`;
          }
        } else {
          this.content = `Error with status: ${err.status}`;
        }
      }
    });
    if (this.StorageService.getUser().forwarderAddr === '0x0') {
      this.activated = false;
      console.log(this.activated);
    }
    else this.activated = true;
  }

/**
 * The function `checkWalletConnected` checks if a wallet is connected and returns a boolean value
 * indicating the status.
 * @returns The function `checkWalletConnected` returns a boolean value. If the wallet is connected, it
 * returns `true`. Otherwise, it returns `false`.
 */
  async checkWalletConnected() {
    //TODO get signer from user service and then send transaction to contract i think in data like deploy 
    //https://docs.infura.io/tutorials/ethereum/send-a-transaction/use-ethers.js-infuraprovider-or-web3provider
    //
    if (await this.userService.ethersConnectWallet()) {
      console.log("walletConnected");
      return true;
    }
    else return false;

  }
/**
 * The `deployForwarder` function deploys a forwarder contract and updates the forwarder address.
 */
  async deployForwarder() {
    this.loadingService.setLoading(true);
    let tx = await this.ethersContract.connect(this.userService.signer).functions['createForwarder']();
    let receipt = await tx.wait();
    console.log("done"); // variable changes html for loading
    //console.log("receipt", receipt);
    this.forwarderAddress = ethers.utils.defaultAbiCoder.decode(['address'], receipt.logs[0].data).toString();
    console.log(ethers.utils.defaultAbiCoder.decode(['address'], receipt.logs[0].data));
    this.updateForwarder();
  }
  /* The `updateUser()` function is responsible for updating the user's information after a deposit is
  made. */
  
  updateUser() {
    const ethValue = this.StorageService.getUser().depositedBalance +
      Number(this.depositForm.ethValue);
    console.log(ethValue);
    console.log("update User");
    this.userService.getUserUpdate(this.StorageService.getUser().username).subscribe({
      next: data => {
        console.log(data.depositedBalance, "data from getUserUpdatedBalance");
        this.StorageService.updateUser(data.forwarderAddr, data.depositedBalance);

      },
      error: err => {
        console.log(err);

      }
    })
  }
  /**
   * The function `updateForwarder` updates the forwarder address and user balance, and displays
   * success or error messages accordingly.
   * @returns the value of the variable "updated".
   */
  
  async updateForwarder() {
    let updated = false;
    console.log('ID' + this.forwarderAddress);
    this.userService.update(this.forwarderAddress, this.StorageService.getUser().depositedBalance, this.StorageService.getUser().id).subscribe({
      next: (data: any) => {
        console.log(data);
        updated = true;
        this.activated = true;
        this.StorageService.updateUser(this.forwarderAddress, this.StorageService.getUser().depositedBalance);
        this.loadingService.setLoading(false);
        Swal.fire({
          title: 'Forwarder Deployed!',
          html: 'We are Refreshing this page for you!',
          timer: 5000,
          timerProgressBar: true,
        }).then(() => { this.userService.addTransactionMonitor(this.forwarderAddress) });
      },
      error: (err: { error: { message: any; }; }) => {
        // console.log(err.error.message);
        Swal.fire({
          icon: 'error',
          title: 'Something went wrong!',
          text: err.error.message,
          footer: '<a href="https://docs.ethers.org/v5/troubleshooting/errors/">Why do I have this issue?</a>'
        })
      }
    });
    return updated;
  }
/**
 * The function `transferToUser()` is used to transfer a specified amount of ETH from one user to
 * another, with error handling for insufficient balance or user not found.
 */
  transferToUser() {
    this.loadingService.setLoading(true);
    if (parseFloat(this.TransferForm.ethValueTransfer) > parseFloat(this.StorageService.getUser().depositedBalance)) {
      Swal.fire({
        icon: 'error',
        title: 'Something went wrong!',
        text: "Not enough Balance!",
      })
    } else {
      console.log("User: " + this.TransferForm.User);
      console.log("EthValueTransfer: " + this.TransferForm.ethValueTransfer);

      this.userService.getUserUpdate(this.TransferForm.User).subscribe({
        next: data => {
          console.log(data, "data from DataFrom transferUpdateLookupusername");
          let fullValue = parseFloat(data.depositedBalance) + this.TransferForm.ethValueTransfer;
          console.log(fullValue + "username" + data.username);
          this.userService.userTransfer(data.username, fullValue.toString()).subscribe({
            next: data => {
              console.log("updateSuccessful" + data);
              let userNewBalance=parseFloat(this.StorageService.getUser().depositedBalance)-parseFloat(this.TransferForm.ethValueTransfer);
              this.userService.userTransfer(this.StorageService.getUser().username,userNewBalance.toString()).subscribe({
                next:data=>{
                  console.log("updatedOld");
                  
                }
              });
            }
          });
        },
        error: err => {
          console.log(err);
          Swal.fire({
            icon: 'error',
            title: 'Something went wrong!',
            text: "User Not Found!",
          })

        }
      })
    }
  }/**
   * The `onSubmit` function is an asynchronous function that handles form submission, sends a
   * transaction, and displays success or error messages.
   */
  
  async onSubmit(): Promise<void> {
    this.loadingService.setLoading(true);

    try {
      let tx = await this.userService.signer.sendTransaction({
        to: this.StorageService.getUser().forwarderAddr,
        value: ethers.utils.parseUnits(this.depositForm.ethValue.toString(), "ether"),
      });
      this.loadingService.setLoading(false);
      Swal.fire({
        icon: 'success',
        title: 'Transaction signed!',
        text: 'waiting for transaction to be validated!',
        footer: '<a href="">buy me a coffee?</a>'
      }).then(() => {
        this.loadingService.setLoading(true);
      })
    }
    catch (err: any) {
      console.log(err.code);
      console.log(err.message);
      this.loadingService.setLoading(false);
      this.errorMessage = err.code;
      Swal.fire({
        icon: 'error',
        title: 'Something went wrong!',
        text: this.errorMessage,
        footer: '<a href="https://docs.ethers.org/v5/troubleshooting/errors/">Why do I have this issue?</a>'
      })
    }

  }
}