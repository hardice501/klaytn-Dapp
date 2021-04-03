import Caver from "caver-js";
import {Spinner} from 'spin.js';

const config = {
  rpcURL: 'https://api.baobab.klaytn.net:8651'
}
const cav = new Caver(config.rpcURL);
const agContract = new cav.klay.Contract(DEPLOYED_ABI, DEPLOYED_ADDRESS);

//홈페이지 열기 -> 초기 화면 세팅 + start 함수 호출
//로그인 클릭 -> #loginModel로 이동 -> keystore file과 비밀번호 창 띄우기
//chooseFile 클릭 -> handleImport() 호출 -> keystore 넣으면 유효한 파일인지 확인 -> 올바르면 #input-password focus(password 바뀔때마다 handlePassword() 호출)
//제출 클릭 -> handleLogin() 호출 -> type 확인 및 decrypt -> 비밀번호 일치시 integrateWallet() 호출 -> wallet 인스턴스를 caver에 추가 및 세션 스토리지에 value를 저장 -> changUI 호출
//hide : #loginModal, #login   ||  show : #owner, #contractBalance, #address, #logout 
//송금 버튼 클릭 -> deposit() 호출
const App = {
  auth: {
    accessType: 'keystore',
    keystore: '',
    password: '',
    sign:'',
    proofs:''
  },
  
  //start function 사이트 접속 시 가장 먼저 호출됨.
  start: async function () {
    console.log("start");
    const walletFromSession = sessionStorage.getItem('walletInstance');//이전의 로그인 기록을 가져옴
    if (walletFromSession) {
      console.log("start walletFromSession");
      try {
        console.log("start walletFromSession try");
        cav.klay.accounts.wallet.add(JSON.parse(walletFromSession));
        this.changeUI(JSON.parse(walletFromSession));
      } catch (e) {      
        console.log("start walletFromSession catch");
        sessionStorage.removeItem('walletInstance');
      }
    }
  },

  handleImport: async function () {
    console.log("handleImport");
    const fileReader = new FileReader();
    fileReader.readAsbinaryString(event.target.files[0]);//파일의 메타 정보를 담고 있습니다.
    // 'FileReader'는 파일의 내용을 읽어오는 데에 사용됩니다.
    // 'onload' 핸들러와 'readAsText' 메서드를 사용할 것입니다.
    // * FileReader.onload
    // - 이 이벤트는 읽기 작업이 완료될 때마다 발생합니다.
    // * FileReader.readAsText()
    // - 내용을 읽어오기 시작합니다.
    fileReader.onload = (event) => {//onload 함수는 읽어온 파일의 내용을 event.target.result로 출력합니다.     
      try {     
        if (!this.checkValidKeystore(event.target.result)) {
          $('#message').text('유효하지 않은 keystore 파일입니다.');
          return;
        }
        this.auth.keystore = event.target.result;
        $('#message').text('keystore 통과. 비밀번호를 입력하세요.');
        document.querySelector('#input-password').focus();    
      } catch (event) {
        $('#message').text('유효하지 않은 keystore 파일입니다.');
        return;
      }
    }   
  },
  handlesigninput: async function(){
    console.log(this.auth.sign);
    const fileReader = new FileReader();
    fileReader.readAsBinaryString(event.target.files[0]);
    // 'FileReader'는 파일의 내용을 읽어오는 데에 사용됩니다.
    // 'onload' 핸들러와 'readAsText' 메서드를 사용할 것입니다.
    // * FileReader.onload
    // - 이 이벤트는 읽기 작업이 완료될 때마다 발생합니다.
    // * FileReader.readAsText()
    // - 내용을 읽어오기 시작합니다.
    fileReader.onload = (event) => {//onload 함수는 읽어온 파일의 내용을 event.target.result로 출력합니다.     
      try {
        //proof = event.target.result;
        this.auth.sign = event.target.result; 
        $('#filemessage').text(this.auth.sign);
        console.log("sign");
        console.log(this.auth.sign);
      } catch (event) {
        $('#message').text('유효하지 않은 sign 파일입니다.');
        return;
      }
    }
    //this.auth.sign = event.target.result; 
    //$('#filemessage').append('<br>' + '<p>' + this.auth.sign + '<p>');
  },
  handlePassword: async function () {
    console.log("handlePassword");
    this.auth.password = event.target.value;
  },

  handleLogin: async function () {
    console.log("handleLogin");
    if (this.auth.accessType === 'keystore') { 
      try {
        const privateKey = cav.klay.accounts.decrypt(this.auth.keystore, this.auth.password).privateKey;
        console.log("비밀번호 일치");
        this.integrateWallet(privateKey);
      } catch (e) {      
        $('#message').text('비밀번호가 일치하지 않습니다.');
      }
    }
  },
  showproofs: async function(){
    console.log("showproofs");
    agContract.methods.download().call().then((result) => {
      console.log(result);
      this.auth.proofs = result;
      $('#proofmessage').text(this.auth.proofs);
      console.log(this.auth.proofs);
    })
    .catch((error) => {
      console.log(error);
    })
  },
  handleLogout: async function () {
    console.log("handleLogout");
    this.removeWallet();
    location.reload();
  },

  generateNumbers: async function () {

  },

  submitAnswer: async function () {

  },

  deposit: async function () {
    var spinner = this.showSpinner();
    const walletInstance = this.getWallet();

    if (walletInstance) {
      if (await this.callOwner() !== walletInstance.address) return; 
      else {
        var amount = $('#amount').val();
        if (amount) {
          agContract.methods.deposit().send({
            from: walletInstance.address,
            gas: '200000',
            value: cav.utils.toPeb(amount, "KLAY")
          })        
          .once('transactionHash', (txHash) => {
            console.log(`txHash: ${txHash}`);
          })
          .once('receipt', (receipt) => {
            console.log(`(#${receipt.blockNumber})`, receipt); //Received receipt! It means your transaction(calling plus function) is in klaytn block                          
            spinner.stop();  
            alert(amount + " KLAY를 컨트랙에 송금했습니다.");               
            location.reload();      
          })
          .once('error', (error) => {
            alert(error.message);
          }); 
        }
        return;    
      }
    }
  },
  download: async function(){
    $('#download').attr({ 
      "download": "download.txt", 
      "href": "~/Downloads/txt;charset=utf8;base64," + window.btoa(JSON.stringify(this.auth.proofs)) });

  },
  signsubmit: async function () {
    const walletInstance = this.getWallet();
    console.log('signsubmit');
    agContract.methods['upload(string)'](this.auth.sign).call().then(console.log);
    var signdata = new String(this.auth.sign);
    console.log(signdata);
    agContract.methods['upload(string)'](this.auth.sign).send({
      from: walletInstance.address,
      gas: '300000'
    }).once('transactionHash', (txHash) => {
      console.log(`txHash: ${txHash}`);
    })
    .once('receipt', (receipt) => {
      console.log(receipt); //Received receipt! It means your transaction(calling plus function) is in klaytn block                          
          
    })
    .once('error', (error) => {
      alert(error.message);
    }); 
    console.log('ok!!');

  },
  hex_to_ascii: async function (str1){
	var hex  = str1.toString();
	var str = '';
	for (var n = 2; n < hex.length; n += 2) {
		str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
	}
	return str;
 },
  callOwner: async function () {
    return await agContract.methods.owner().call();
  },

  callContractBalance: async function () {
    return await agContract.methods.getBalance().call();
  },

  getWallet: function () {
    if (cav.klay.accounts.wallet.length) {
      return cav.klay.accounts.wallet[0];
    }
  },

  checkValidKeystore: function (keystore) {
    const parsedKeystore = JSON.parse(keystore);
    const isValidKeystore = parsedKeystore.version &&
      parsedKeystore.id &&
      parsedKeystore.address &&
      parsedKeystore.crypto;  

    return isValidKeystore;
  },

  integrateWallet: function (privateKey) {
    const walletInstance = cav.klay.accounts.privateKeyToAccount(privateKey);//API로 생성한 wallet 인스턴스를 walletInstance 변수에 저장합니다.
    cav.klay.accounts.wallet.add(walletInstance)//트랜잭션을 보내려면 wallet 인스턴스를 caver에 추가해야 합니다.
    sessionStorage.setItem('walletInstance', JSON.stringify(walletInstance));
    //브라우저의 세션 스토리지에 value를 저장하는 데에 사용하는 브라우저 API입니다. 
    //튜토리얼 애플리케이션 페이지를 새로 고쳐도 사용자의 로그인 상태를 유지하기 위해 wallet 인스턴스를 JSON 문자열로 세션 스토리지에 저장하는 과정입니다.

    this.changeUI(walletInstance);  
  },

  reset: function () {
    this.auth = {
      keystore: '',
      password: ''
    };
  },

  changeUI: async function (walletInstance) {
    console.log("changeUI");
    $('#loginModal').modal('hide');
    $("#login").hide(); 
    $('#logout').show();
    $('#filemessage').show();
    $('#address').append('<br>' + '<p>' + '내 계정 주소: ' + walletInstance.address + '</p>'+this.auth.sign);   
    $('#contractBalance').append('<p>' + '이벤트 잔액: ' + cav.utils.fromPeb(await this.callContractBalance(), "KLAY") + ' KLAY' + '</p>');     

    if (await this.callOwner() === walletInstance.address) {
      $("#owner").show();
      $("#sign").show();
      $("#sign-submit").show();
    }     
  },

  removeWallet: function () {
    cav.klay.accounts.wallet.clear();
    sessionStorage.removeItem('walletInstance');
    this.reset();
  },

  showTimer: function () {

  },

  showSpinner: function () {
    var target = document.getElementById('spin');
    return new Spinner(opts).spin(target);
  },

  receiveKlay: function () {

  }
};

window.App = App;

window.addEventListener("load", function () { 
  App.start();
});

var opts = {
  lines: 10, // The number of lines to draw
  length: 30, // The length of each line
  width: 17, // The line thickness
  radius: 45, // The radius of the inner circle
  scale: 1, // Scales overall size of the spinner
  corners: 1, // Corner roundness (0..1)
  color: '#5bc0de', // CSS color or array of colors
  fadeColor: 'transparent', // CSS color or array of colors
  speed: 1, // Rounds per second
  rotate: 0, // The rotation offset
  animation: 'spinner-line-fade-quick', // The CSS animation name for the lines
  direction: 1, // 1: clockwise, -1: counterclockwise
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  className: 'spinner', // The CSS class to assign to the spinner
  top: '50%', // Top position relative to parent
  left: '50%', // Left position relative to parent
  shadow: '0 0 1px transparent', // Box-shadow for the lines
  position: 'absolute' // Element positioning
};