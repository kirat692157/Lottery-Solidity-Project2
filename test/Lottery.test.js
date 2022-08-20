// require in assert for testing
const assert = require('assert');
// require in the ganache client to use it's provider to deploy our contract on the local network
// https://github.com/trufflesuite/ganache#:~:text=Contributing%20%E2%80%A2%20Related-,Features,to%20make%20development%20a%20breeze.
const ganache = require('ganache-cli');
// web3, which is a interface to comunicate with the network.
const Web3 = require('web3'); // contructor or class function, therfore it's capital
const web3 = new Web3(ganache.provider());
// We import our compile file here to get the bytecode and interface
const {interface,bytecode} = require('../compile'); 


let accounts; // Variable that holds the list of ganache accounts
let lottery; // Variable that acts as an instance for our contract

// This is used to run a piece of code everytime we start a new test
beforeEach(async ()=>{
    // This gets a list of all the accounts that ganacahe created for us to test with
    accounts = await web3.eth.getAccounts();
    // deploying the code 
    lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data:bytecode })
    .send({from:accounts[0], gas:1000000});
    /*  The compiler gives a JSON file, we want to parse it before we deploy it
        The deploy line deploys a new contract, which creats a transaction object, which has our bytecode, and args
        The Send line sends a trasnaction that creates this contract    
    */
});

describe('lottery contract', ()=>{
    it('deployment successful', ()=>{
        assert.ok(lottery.options.address);
    });
    it('able to enter one player', async ()=>{
        await lottery.methods.enter().send({
            from:accounts[0],
            value: web3.utils.toWei('0.001','ether')
        });
        let players = await lottery.methods.getPlayers().call({
            from:accounts[0]
        });
        assert.equal(players[0] , accounts[0]);
        
        assert.equal(1,players.length);

    });

    it('able to enter more players',async ()=>{
        await lottery.methods.enter().send({
            from:accounts[0],
            value: web3.utils.toWei('0.001','ether')
        });
        await lottery.methods.enter().send({
            from:accounts[1],
            value: web3.utils.toWei('0.001','ether')
        });
        await lottery.methods.enter().send({
            from:accounts[2],
            value: web3.utils.toWei('0.001','ether')
        });
        let players = await lottery.methods.getPlayers().call({
            from:accounts[0]
        });   
        assert.equal(players[0] , accounts[0]);
        assert.equal(players[1] , accounts[1]);
        assert.equal(players[2] , accounts[2]);
        assert.equal(3,players.length);
    });

    it('requires a min amout of ether to enter', async()=>{
        try{
            await lottery.methods.enter().send({
                from:accounts[0],
                value: web3.utils.toWei('0.0001','ether')
            });
            assert(false);
        } catch (err) {
            assert(err);
        }

    });

    it('Manager only', async()=>{
        try{
            await lottery.methods.pickwinner().send({
                from:accounts[1]
            });
            assert(false);
        } catch(err) {
            assert(err);
        }
    });

    it('End to End', async()=>{
        await lottery.methods.enter().send({
            from:accounts[0],
            value: web3.utils.toWei('0.001','ether')
        });
        // used to get the amount of ether in wei a given account controls can also be used to get balance of contract accounts
        const initialBalance = await web3.eth.getBalance(accounts[0]); 
        await lottery.methods.pickWinner().send({
            from:accounts[0]
        });
        let players = await lottery.methods.getPlayers().call({
            from:accounts[0]
        });   
        const finalBalance = await web3.eth.getBalance(accounts[0]); 
        const difference = finalBalance - initialBalance;
        assert(difference < web3.utils.toWei('0.1','ether'));
        assert.equal(players.length,0);
    });

});
