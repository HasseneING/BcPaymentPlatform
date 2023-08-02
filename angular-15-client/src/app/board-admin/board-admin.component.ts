import { Component, OnInit } from '@angular/core';
import { UserService } from '../_services/user.service';
import { StorageService } from '../_services/storage.service';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { getForwarderSOL, getWalletSOL } from '../contracts/contractABIs';
@Component({
  selector: 'app-board-admin',
  templateUrl: './board-admin.component.html',
  styleUrls: ['./board-admin.component.css']
})
export class BoardAdminComponent implements OnInit {
  content?: string;
  depositForm: any = {
    ethValue: null,
  };
  private web3: Web3;
  public walletConnected: boolean = false;
  public walletId: string = '';
  public walletBalance: string = '';
  private contractInst: any;
  private walletContractInstance: any;
  private forwarderAddress: string = '';
  constructor(private userService: UserService, private StorageService: StorageService) { 
    const provider = "https://sepolia.infura.io/v3/acaa2699bfc84be092239f5676e3192a" //HAVE TO ADD .ENV FILE 
    var web3Provider = new Web3.providers.HttpProvider(provider);
    this.web3 = new Web3(web3Provider);
    this.contractInst = new this.web3.eth.Contract(this.userService.abiContract as AbiItem[], this.userService.contractAddress);
//this.walletContractInstance = new this.web3.eth.Contract(getWalletSOL().abi, getWalletSOL().address); //I NEED ENV FILE

  }

  ngOnInit(): void {
    this.userService.getAdminBoard().subscribe({
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
  }


  async getContractBalance() {
    let contractBalance = this.contractInst.methods.getContractBalance()
      .call();
    return contractBalance;
  }
  connectToWallet = () => {
    //this.loaderService.show();
    this.userService.connectWallet();
    //this.loaderService.hide();
  }

 checkWalletConnected = async () => {
   /* const accounts = await this.userService.checkWalletConnected();
    if (accounts.length > 0) {
      this.walletConnected = true;
      this.web3.eth.defaultAccount = accounts[0];
      this.walletId = accounts[0];
      console.log(this.walletId);
    }*/
  }

  async getWalletId() {//balance?
    let balance2 = await this.web3.eth.getBalance(this.walletId).then(res => { this.walletBalance = res });
  }
  

  async deployForwarder(walletAddress: String) {
    await this.checkWalletConnected();
    
   /* this.walletContractInstance.events.ForwarderCreated()
      .on('data', (event: { returnValues: any; }) => {
        console.log('Forwarder Created Event:', event.returnValues);
      })
      .on('error', (error: any) => {
        console.error('Forwarder Created Error:', error);
      });
*/
////------------------------------------------////

    // let forwarderCall= await this.walletContractInstance.methods.createForwarder().send({from:'0xaB544C4607e6498901c2702EB114d4D34b3650cE',});
    //  console.log(this.forwarderAddress);
    //we dont need to deploy wallet.sol it's already deployed, we create a forwarder from here some how xd
    //A FORWARDER THAT'S GHONNA BE ATTACHED TO THIS USERID USING THE PRIVATE KEY OF WALLET.SOL
    //https://ethereum.stackexchange.com/questions/67232/how-to-wait-until-transaction-is-confirmed-web3-js
    //https://www.web3.university/tracks/create-a-smart-contract/integrate-your-smart-contract-with-a-frontend
    //set up transaction parameters
    const nonce = await this.web3.eth.getTransactionCount(this.walletId);

    const transactionParameters = {
      from: this.walletId, // must match user's active address.
      data: '0xa68a76cc',
      to:  this.walletContractInstance.address,
      //value:this.web3.utils.numberToHex(this.web3.utils.toWei(String(this.depositForm.ethValue), 'ether')),
      nonce: this.web3.utils.toHex(nonce),
      gasPrice: this.web3.utils.toHex(await this.web3.eth.getGasPrice()),
      gasLimit: this.web3.utils.toHex(300000),
      value:'0x0',
    };
    //https://blog.logrocket.com/nested-smart-contracts-creating-contract-within-contract/#deploying-the-nested-contract
    //sign the transaction
    try {
      const txHash = await this.userService.ethereum.request({
        method: "eth_sendTransaction",
        params: [transactionParameters],
      }).then((result: any) => { console.log("https://sepolia.etherscan.io/tx/" + result)
    
      setTimeout(()=>(console.log(this.web3.eth.getTransaction(result))),60000)

    });
    } catch (error: any) {
      console.log("error" + error);
    }
  }

  async updateForwarder() {
    let updated = false;
    this.deployForwarder(this.walletId); //if statement here 
    console.log('ID' + this.forwarderAddress);
    this.userService.update(this.forwarderAddress,"10", this.StorageService.getUser().id).subscribe({
      next: (data: any) => {
        console.log(data);
        updated = true;
      },
      error: (err: { error: { message: any; }; }) => {
        console.log(err.error.message);
      }
    });
    return updated;
  }
  async onSubmit(): Promise<void> {
    this.checkWalletConnected();
    let balance;
    balance = this.getContractBalance().then((res: any) => { console.log(this.web3.utils.fromWei(res, "ether"), "eth") });
    console.log(this.depositForm);
    console.log(this.walletId);
    var accounts = await this.web3.eth.getAccounts().then(console.log);
    //let balance2 = await this.web3.eth.getBalance(this.walletId).then((res: any) => { this.walletBalance = res });
    const transaction = this.web3.utils.toWei(String(this.depositForm.ethValue));
    console.log(transaction, "wei");
    var receiver = this.userService.contractAddress;
    var sender = this.walletId;
    //https://docs.metamask.io/wallet/reference/provider-api/#ethereum-request-args
    if (this.StorageService.getUser().forwarderAddress === '0x0')  {
      console.log("0x0");
      this.updateForwarder()
        .then((res: any) => this.userService
          .transactToAddress(this.walletId, this.StorageService.getUser().forwarderAddress, this.depositForm.ethValue))
    }
    else { 
      console.log("isnt 0x0");
      this.userService.transactToAddress(this.walletId, "0xa11c30ef3ba37bef5c86089bb8f7eb2eb90ab052"/*this.StorageService.getUser().forwarderAddress*/, this.depositForm.ethValue)
    }
  }


}
