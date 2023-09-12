import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import Web3 from 'web3';
import { ethers } from 'ethers';
import { StorageService } from './storage.service';

const API_URL = 'http://localhost:8080/api/test/';
const AUTH_API = 'http://localhost:8080/api/auth/';
const TRANSACTION_MONITOR_API = 'http://localhost:8060/api/rest/v1/transaction'
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json'})
};
@Injectable({
  providedIn: 'root',
})
export class UserService {


  public contractAddress = "0x52E963CBddCA90626efa7535c33d8219230d5D39";
  public abiContract = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "balance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "balanceRecieved",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "deposit",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getContractBalance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "receiver",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "transactionValue",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "withdrawAllToOwner",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_transactionValue",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "_other",
          "type": "address"
        }
      ],
      "name": "withdrawToOther",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_transactionValue",
          "type": "uint256"
        }
      ],
      "name": "withdrawToOwner",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "stateMutability": "payable",
      "type": "receive"
    }
  ];


  public ethereum;
  private web3;
  signer: any;
  metamaskConnected: boolean = false;
  constructor(private http: HttpClient,private storageService: StorageService) {
    const { ethereum } = <any>window;
    this.ethereum = ethereum;
    const provider = "https://sepolia.infura.io/v3/acaa2699bfc84be092239f5676e3192a";
    var web3Provider = new Web3.providers.HttpProvider(provider);
    this.web3 = new Web3(web3Provider);
  }
  async ethersConnectWallet() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    this.signer = provider.getSigner();
    this.metamaskConnected = true;
    console.log("" + this.metamaskConnected);
    return this.metamaskConnected;

  }
  checkWalletConnected() {
    console.log(this.signer + "providers");
    // throw new Error('Method not implemented.');
  }
  public connectWallet = async () => {
    try {
      if (!this.ethereum) return alert("Please install meta mask");
      const accounts = await this.ethereum.request({ method: 'eth_requestAccounts' });
    }
    catch (e) {
      throw new Error("No thereum object found")
    }
  }

  update(forwarderAddr: string, depositedBalance: string, id: string): Observable<any> {
    console.log('updateing');
    return this.http.put(
      AUTH_API + 'signout/' + id,//this is an update route SOMEHOW
      { forwarderAddr},
      httpOptions
    );
  }
  addTransactionMonitor(forwarderAddr: string) {
    let body = {
      "type": "TO_ADDRESS",
      "transactionIdentifierValue": forwarderAddr.toLowerCase(),
      "nodeName": "default",
      "statuses": ["CONFIRMED"]
    }
    this.http.post(TRANSACTION_MONITOR_API, body,httpOptions).toPromise().then((data) => {console.log(data);});

  }
  updateBalance(depositedBalance: string, forwarderAddr: string, id: string): Observable<any> {
    console.log("updating Balance");
    return this.http.put(
      AUTH_API + 'signout/' + id,
      { depositedBalance },
      httpOptions
    );
  }
  async transactToAddress(from: String, To: String, ethValue: String) {
    const params = [
      {
        from: from,//this.walletId,
        to: To,//this.forwarderAddress,
        value: this.web3.utils.numberToHex(this.web3.utils.toWei(String(ethValue), 'ether')),
      }
    ]
    this.ethereum
      .request({
        method: 'eth_sendTransaction',
        params,
      })
      .then((result: any) => {
        console.log("sepolia.etherscan.io/" + result);
      })
      .catch((error: any) => {
      });

  };


  getPublicContent(): Observable<any> {
    return this.http.get(API_URL + 'all', { responseType: 'text' });
  }

  getUserBoard(): Observable<any> {
    return this.http.get(API_URL + 'user', { responseType: 'text' });
  }
  getUserData(): Observable<any> {
    return this.http.get(API_URL + 'user', { responseType: 'text' });
  }
  getModeratorBoard(): Observable<any> {
    return this.http.get(API_URL + 'mod', { responseType: 'text' });
  }
  userTransfer(username:String,balance:String):Observable<any>{
    console.log("UsernameFromUserTransferPost"+username);
    
    const httpOptionsUsr = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json','x-access-token':this.storageService.getUser().accessToken}),
    };
    return this.http.post(API_URL+'userTransfer',{username,balance},httpOptionsUsr);

  }
  getUserUpdate(username:String ):Observable<any>{
    const httpOptionsUsr = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json','x-access-token':this.storageService.getUser().accessToken}),
    };
    console.log(username);
    
    return this.http.post(API_URL+'userData',{username},httpOptionsUsr);
  }
  getAdminBoard(): Observable<any> {
    return this.http.get(API_URL + 'admin', { responseType: 'text' });
  }
}
