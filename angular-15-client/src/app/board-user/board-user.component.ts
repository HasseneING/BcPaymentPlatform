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
  // private web3: Web3;
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
  hasForwarder() {
  }
  async getWalletId() {//balance?
    //  let balance2 = await this.web3.eth.getBalance(this.walletId).then(res => { this.walletBalance = res });
  }
  async getEvents() {
    // let events = await this.ethersContract.queryFilter("forwarderCreated" , this.ethersProvider.getBlockNumber)
  }
  async deployForwarder() {
    this.loadingService.setLoading(true);
    let tx = await this.ethersContract.connect(this.userService.signer).functions['createForwarder']();
    let receipt = await tx.wait();
    console.log("done"); // variable changes html for loading
    //console.log("receipt", receipt);
    this.forwarderAddress = ethers.utils.defaultAbiCoder.decode(['address'], receipt.logs[0].data).toString();
    //console.log(ethers.utils.defaultAbiCoder.decode(['address'], receipt.logs[0].data));
    this.updateForwarder();

  }
  updateUser() {
    const ethValue = this.StorageService.getUser().depositedBalance + 
    Number(this.depositForm.ethValue);
    console.log(ethValue);
    
    console.log("update User");
   /* this.StorageService.updateUser(
    this.StorageService.getUser().forwarderAddr, 
    ethValue.toString());*/

  }
  async updateForwarder() {
    let updated = false;
    //this.deployForwarder(); //if statement here has to be ethersfunc
    console.log('ID' + this.forwarderAddress);
    this.userService.update(this.forwarderAddress, this.StorageService.getUser().depositedBalance, this.StorageService.getUser().id).subscribe({
      next: (data: any) => {
        console.log(data);
        updated = true;
        this.activated = true;
        this.StorageService.updateUser(this.forwarderAddress,this.StorageService.getUser().depositedBalance);
        this.loadingService.setLoading(false);
        Swal.fire({
          title: 'Auto close alert!',
          html: 'I will close in <b></b> milliseconds.',
          timer: 2000,
          timerProgressBar: true,
        }).then(() => { /*window.location.replace('login')*/ });

        /*REGSTIER THE EVENT USING THE FORWARDER ADDRESS FROM HERE*/
      },
      error: (err: { error: { message: any; }; }) => {
        console.log(err.error.message);
      }
    });
    return updated;
  }
  async onSubmit(): Promise<void> {
    this.loadingService.setLoading(true);
    let params = [{
      from: this.userService.signer.getAddress(),
      to: this.StorageService.getUser().forwarderAddr.toLowerCase(),
      value: this.depositForm.ethValue,
      gasPrice: this.ethersProvider.getGasPrice(),
      gasLimit: ethers.utils.hexlify(100000),
      nonce: this.ethersProvider.getTransactionCount(this.userService.signer.address, 'latest')
    }]
    console.log("Unist" + ethers.utils.parseUnits(this.depositForm.ethValue.toString(), "ether"));

    try {
      let tx = await this.userService.signer.sendTransaction({
        to: this.StorageService.getUser().forwarderAddr,
        value: ethers.utils.parseUnits(this.depositForm.ethValue.toString(), "ether"),
      });
      //let receipt = await tx.wait();
      Swal.fire({
        icon: 'success',
        title: 'Transaction signed!',
        text: 'waiting for transaction to be validated!',
        footer: '<a href="">buy me a coffee?</a>'
      }).then(() => {
        console.log("done");
      })
    }
    catch (err: any) {
      /*sweet alert2*/
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
    this.loadingService.setLoading(false);
    this.userService.update(this.StorageService.getUser().forwarderAddr, this.depositForm.ethValue, this.StorageService.getUser().id).subscribe({
      next: (data: any) => {
        console.log(data);
        this.StorageService.updateUser(this.StorageService.getUser().forwarderAddr,this.depositForm.ethValue);
        /*REGSTIER THE EVENT USING THE FORWARDER ADDRESS FROM HERE*/
      },
      error: (err: { error: { message: any; }; }) => {
        console.log(err.error.message);
      }
    });

    // after tx.wait we need to update deposited value if successful 
    /*From kafka watcher get value if confirmed if failed send error*/
    /*
    https://github.com/eventeum/eventeum
    Provider » Blocks Methods » provider.getBlockWithTransactions
    kafka

    to update deposited balance we need to check for events on the currentBlock - 5 
    check if the "from "field is a forwarder (need to store them) 
    then findby forwarder address and update deposited value 
    */

    /*
    TODO:
      Update Deposited Eth
      Wait For transaction loading
      Errors on front-end
      check wallet connected before payment if not send error 
      Blockchain listener 
      how to monitor on chain events
      eventeum
      listener on the forwarder addresses to check how much ether has been deposited

    */

  }
}