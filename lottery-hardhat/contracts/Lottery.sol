// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

contract Lottery {
  address public owner;
  // 플레이어들은 이더를 들고 참여한다.
  address payable[] public players;

  uint256 public lotteryId;
  mapping(uint256 => address) public lotteryHistory;

  constructor(){
    // 해당 컨트랙트를 배포하는 사람이 owner이 된다.
    owner = msg.sender;
  }

  // 해당 컨트랙트가 가지고 있는 총 ETH balance의 양을 반환한다.
  function getBalance() public view returns (uint256) {
    // address(this) : 컨트랙트 자체를 뜻한다.
    return address(this).balance;
  }

  // 참여한 모든 플레이어의 주소 배열을 리턴하는 함수
  // players는 address payable 타입의 배열이므로 Return 시 address payable[] memory여야 한다.
  function getPlayers() public view returns (address payable[] memory){
    // memory: players 값은 storage에 저장되어 있는 값이므로 해당 값을 읽어 return 하고자 할 경우엔 memory 타입이어야 한다.
    // storage에 있는 내용을 memory에 복사를해서 리턴해준다.
    return players;
  }

  // 플레이어들이 이더를 들고 참여할 때 호출하는 함수
  // - 그래서 payable 타입의 함수
  // - 0.01이더씩 들고오는 것으로 구현
  function enter() public payable{
    require(msg.value >= .01 ether,"msg.value should be greater than or equal to 0.01 ether");
    // payable 타입으로 명시적 변환하여 대입한다.
    players.push(payable(msg.sender));
  }

  // abi.encodePacked(owner, block.timestamp) : owner와 block.timestamp 각가을 bytes로 converting한 값을 concat한 값
  // abi.encode() : converting 시 부족한 값을 0으로 모두 채워놓는다.
  // abi.encodePacked() : 실제 차지하는 공간에 대해서만 채워준다.
  // concat한 값을 keccak256 해시 알고리즘으로 해시한 값
  // 해시한 값을 uint256으로 converting한 값 
  // => 랜덤한 값
  function getRandomNumber() public view returns (uint256){
    return uint256(keccak256(abi.encodePacked(owner, block.timestamp)));
  }

  function getRandomNumberV2() public view returns (uint256) {
    return uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp, players)));
  }
  function getRandomNumberV3() public view returns (uint256) {
    return uint256(keccak256(abi.encodePacked(blockhash(block.number -1 ), block.timestamp)));
  }


  // pickWinner()는 아무나 호출하면 안되기에 modifier로 onlyOwner만 호출할 수 있도록 설정하였다.
  function pickWinner() public onlyOwner{
    // 랜덤값을 참여한 players들의 수로 나눈 나머지 -> 참여한 players 중에 랜덤하게 뽑는다는 의미
    uint256 index = getRandomNumber() % players.length;

    lotteryHistory[lotteryId] = players[index];
    lotteryId++;

    // 랜덤하게 뽑힌 player에게 컨트랙트의 모든 ETH를 전송한다.
    // 요즘 가장 많이 사용하는 이더 전송 구문 = 안전하다
    (bool success, ) = players[index].call{value: address(this).balance}("");
    require(success, "Failed to send Ether");

    // 다음 회차를 위해 players 배열을 초기화한다. (리셋시켜주는 구문 : 해당 배열에 대해 length를 0으로 바꿔주겠다는 의미)
    players = new address payable[](0);
  }
  modifier onlyOwner {
    require(msg.sender == owner);
    _;
  }
}
