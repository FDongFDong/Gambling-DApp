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
});
