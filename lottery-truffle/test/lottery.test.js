// lottery 컨트랙트의 빌드파일을 가져온다.
const Lottery = artifacts.require('Lottery');
const should = require('chai').should();
const truffleAssert = require('truffle-assertions');
contract('Lottery', (accounts) => {
  console.log(accounts);
  let lottery;
  before(async () => {
    lottery = await Lottery.deployed();
    console.log(`lottery address: ${lottery.address}`);
  });

  // 생성자의 값이 예상된 값으로 세팅되었는지 체크
  describe('Constuctor', () => {
    it('Owner should be set to accounts[0]', async () => {
      const owner = await lottery.owner();
      // assert.equal(actual, expected)
      assert.equal(owner, accounts[0]);
      // expect(actual).줄글(expected)
      expect(owner).to.equal(accounts[0]);
      // actual.should.줄글(expected)
      owner.should.equal(accounts[0]);
    });
  });
  describe('Enter', () => {
    it('Should revert if a player enters less than 0.01 ether', async () => {
      const enterAmount = web3.utils.toWei('0.009', 'ether');
      console.log(`enterAmount: ${enterAmount}`);

      await truffleAssert.reverts(
        lottery.enter({ from: accounts[1], value: enterAmount })
      );
    });
    it('Enter 5 Player and check values', async () => {
      const enterAmount = web3.utils.toWei('0.01', 'ether');
      // player1 enter
      await lottery.enter({ from: accounts[1], value: enterAmount });
      // [assert]
      // 0.01 이더가 lottery 컨트랙트에 있는지 확인
      assert.equal(await lottery.getBalance(), enterAmount);
      // Player 배열에 player 1번의 주소가 입력되었는지 확인
      // // array는 equal()로 테스트 할 수 없다.
      // assert.equal(await lottery.getPlayers(), [accounts[1]]);
      assert.deepEqual(await lottery.getPlayers(), [accounts[1]]);

      // [expect]
      // getBalance()는 big number 값을 리턴한다.
      // enterAmount는 "0.01ether"라는 string 값이다.
      // getBalance()도 string 값으로 변경해줘야 비교가 가능하다.
      expect((await lottery.getBalance()).toString()).to.equal(enterAmount);
      expect(await lottery.getPlayers()).to.deep.equal([accounts[1]]);

      // [should]
      (await lottery.getBalance()).toString().should.equal(enterAmount);
      (await lottery.getPlayers()).should.deep.equal([accounts[1]]);

      // player2 enter
      await lottery.enter({ from: accounts[2], value: enterAmount });
      assert.equal(
        await lottery.getBalance(),
        web3.utils.toBN(enterAmount).mul(web3.utils.toBN(2)).toString()
      );
      assert.deepEqual(await lottery.getPlayers(), [accounts[1], accounts[2]]);

      // player3 enter
      await lottery.enter({ from: accounts[3], value: enterAmount });
      assert.equal(
        await lottery.getBalance(),
        web3.utils.toBN(enterAmount).mul(web3.utils.toBN(3)).toString()
      );
      assert.deepEqual(await lottery.getPlayers(), [
        accounts[1],
        accounts[2],
        accounts[3],
      ]);

      // player4 enter
      await lottery.enter({ from: accounts[4], value: enterAmount });
      assert.equal(
        await lottery.getBalance(),
        web3.utils.toBN(enterAmount).mul(web3.utils.toBN(4)).toString()
      );
      assert.deepEqual(await lottery.getPlayers(), [
        accounts[1],
        accounts[2],
        accounts[3],
        accounts[4],
      ]);

      // player5 enter
      await lottery.enter({ from: accounts[5], value: enterAmount });
      assert.equal(
        await lottery.getBalance(),
        web3.utils.toBN(enterAmount).mul(web3.utils.toBN(5)).toString()
      );
      assert.deepEqual(await lottery.getPlayers(), [
        accounts[1],
        accounts[2],
        accounts[3],
        accounts[4],
        accounts[5],
      ]);
    });
  });
  describe('FickWinner', () => {
    it('should revert pickWinner is called by not owner', async () => {
      // owner: accounts[0]
      await truffleAssert.reverts(lottery.pickWinner({ from: accounts[1] }));
    });
    it('PickWinner', async () => {
      console.log('>>> before pickWinner');

      // player들의 ETH Balance를 체크한다.
      const account1ETHBalance_before = await web3.eth.getBalance(accounts[1]);
      console.log(`account1's ETH balance ${account1ETHBalance_before}`);
      console.log(
        `account1's ETH balance to ether: ${
          account1ETHBalance_before / 10 ** 18
        }`
      );
      const account2ETHBalance_before = await web3.eth.getBalance(accounts[2]);
      console.log(`account2's ETH balance ${account2ETHBalance_before}`);
      console.log(
        `account2's ETH balance to ether: ${
          account2ETHBalance_before / 10 ** 18
        }`
      );
      const account3ETHBalance_before = await web3.eth.getBalance(accounts[3]);
      console.log(`account3's ETH balance ${account3ETHBalance_before}`);
      console.log(
        `account3's ETH balance to ether: ${
          account3ETHBalance_before / 10 ** 18
        }`
      );
      const account4ETHBalance_before = await web3.eth.getBalance(accounts[4]);
      console.log(`account4's ETH balance ${account4ETHBalance_before}`);
      console.log(
        `account4's ETH balance to ether: ${
          account4ETHBalance_before / 10 ** 18
        }`
      );
      const account5ETHBalance_before = await web3.eth.getBalance(accounts[5]);
      console.log(`account5's ETH balance ${account5ETHBalance_before}`);
      console.log(
        `account5's ETH balance to ether: ${
          account5ETHBalance_before / 10 ** 18
        }`
      );

      console.log('>>> pickWinner');
      await lottery.pickWinner();
      console.log('>>> after pickWinner');
      const lotteryId = await lottery.lotteryId();
      console.log(`lotteryId: ${lotteryId}`);
      assert.equal(lotteryId, 1);

      const winner = await lottery.lotteryHistory(lotteryId - 1);
      console.log(`winner at lotteryId ${lotteryId - 1}: ${winner}`);

      const account1ETHBalance_after = await web3.eth.getBalance(accounts[1]);
      console.log(`account1's ETH balance ${account1ETHBalance_after}`);
      console.log(
        `account1's ETH balance to ether: ${
          account1ETHBalance_after / 10 ** 18
        }`
      );
      const account2ETHBalance_after = await web3.eth.getBalance(accounts[2]);
      console.log(`account2's ETH balance ${account2ETHBalance_after}`);
      console.log(
        `account2's ETH balance to ether: ${
          account2ETHBalance_after / 10 ** 18
        }`
      );
      const account3ETHBalance_after = await web3.eth.getBalance(accounts[3]);
      console.log(`account3's ETH balance ${account3ETHBalance_after}`);
      console.log(
        `account3's ETH balance to ether: ${
          account3ETHBalance_after / 10 ** 18
        }`
      );
      const account4ETHBalance_after = await web3.eth.getBalance(accounts[4]);
      console.log(`account4's ETH balance ${account4ETHBalance_after}`);
      console.log(
        `account4's ETH balance to ether: ${
          account4ETHBalance_after / 10 ** 18
        }`
      );
      const account5ETHBalance_after = await web3.eth.getBalance(accounts[5]);
      console.log(`account5's ETH balance ${account5ETHBalance_after}`);
      console.log(
        `account5's ETH balance to ether: ${
          account5ETHBalance_after / 10 ** 18
        }`
      );
      console.log(
        `account balance difference: ${web3.utils
          .toBN(account1ETHBalance_after)
          .sub(web3.utils.toBN(account1ETHBalance_before))}`
      );
      console.log(
        `account balance difference: ${web3.utils
          .toBN(account2ETHBalance_after)
          .sub(web3.utils.toBN(account2ETHBalance_before))}`
      );
      console.log(
        `account balance difference: ${web3.utils
          .toBN(account3ETHBalance_after)
          .sub(web3.utils.toBN(account3ETHBalance_before))}`
      );
      console.log(
        `account balance difference: ${web3.utils
          .toBN(account4ETHBalance_after)
          .sub(web3.utils.toBN(account4ETHBalance_before))}`
      );
      console.log(
        `account balance difference: ${web3.utils
          .toBN(account5ETHBalance_after)
          .sub(web3.utils.toBN(account5ETHBalance_before))}`
      );
    });
    it('Calculate winner - getRandomNumber', async () => {
      const lotteryId = await lottery.lotteryId();
      const winner = await lottery.lotteryHistory(lotteryId - 1);
      console.log(`winner: ${winner}`);
      const randomNumber = await lottery.getRandomNumber();
      console.log(`randomNumber: ${randomNumber}`);
      // block timestamp 읽어오기
      const blockNumber = await web3.eth.getBlockNumber();
      console.log(`block number: ${blockNumber}`);
      const currentBlock = await web3.eth.getBlock(blockNumber);
      console.log('current block : ', currentBlock);
      // uint256(keccak256(abi.encodePacked(owner, block.timestamp))); 처럼 만들어주기
      const calculatedRandomNumber = web3.utils
        .toBN(
          web3.utils.keccak256(
            web3.utils.encodePacked(
              {
                value: await lottery.owner(),
                type: 'address',
              },
              { value: currentBlock.timestamp, type: 'uint256' }
            )
          )
        )
        .toString();
      console.log(`calculated random number: ${calculatedRandomNumber}`);
      const calculateWinnerIndex = web3.utils
        .toBN(calculatedRandomNumber)
        .mod(web3.utils.toBN(5))
        .toString();
      console.log(`calculated winner index: ${calculateWinnerIndex}`);
      assert.equal(winner, accounts[Number(calculateWinnerIndex) + 1]);
    });
  });
});
