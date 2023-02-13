# 목차
- [학습 목적](#학습-목적)
# Gambling-DApp

# 학습 목적

- DApp을 만들어 봄으로써 전체적인 코드 작성 및 개발의 흐름 파악
- 컨트랙트들 간의 상호 작용 이해
- 랜덤값 생성에 대한 이해
- truffle, remix 등 다양한 개발툴에 대한 이해
- 다양한 개발 패턴들 숙달
- 테스트 코드 작성 능력 습득

## 특징

블록체인을 활용한 겜블링 DApp

- 게임 중개자 필요 x
- 플레이 방식 공개
- 플레이 내역 공개

→ 외부 규제 및 무조건적인 신뢰 불필요

## 이점

- 직접적인 예치 및 인출
  - 결제 중개자 x
  - 결체 처리 기간을 기다릴 필요 x
- 낮은 비용
  - 운영자 및 중개자 필요 x
- 서비스 운영자에 대한 신뢰 불필요
- 익명성
  - 이름, 이메일등 x

# Lottery 컨트랙트

## 변수

```solidity
address public owner;
```

- owner가 존재한다.

```solidity
address payable[] public players;
```

- 플레이어들은 이더를 들고 참여한다.

```solidity
uint256 public lotteryId;
mapping(uint256 => address) public lotteryHistory;
```

- 이긴자를 기록해주기 위한 변수
  - 처음 lotteryId는 0번이 된다.
  - 해당 lotteryId에 대해 어떤 주소가 Winner였는지 기록해주기 위한 변수

## 생성자

```solidity
constructor(){
    owner = msg.sender;
}
```

- 해당 컨트랙트를 배포하는 사람이 owner이 된다.

## modifier

```solidity
modifier onlyOwner {
    require(msg.sender == owner);
    _;
}
```

- 해당 함수를 호출한 쪽이 Owner인지 확인한다.

## 함수

### getBalance() :  해당 컨트랙트가 가지고 있는 총 ETH balance의 양을 반환한다

```solidity
function getBalance() public view returns (uint256) {
    return address(this).balance;
}
```

- address(this) : 컨트랙트 자체를 뜻한다.

### getPlayers() : 참여한 모든 플레이어를 리턴한다

```solidity
function getPlayers() public view returns (address payable[] memory){
    return players;
}
```

- players는 address payable 타입의 배열이므로 Return 시 address payable[] memory여야 한다.
- memory: players 값은 storage에 저장되어 있는 값이므로 해당 값을 읽어 return 하고자 할 경우엔 memory 타입이어야 한다.
  - storage에 있는 내용을 memory에 복사를해서 리턴해준다.

### enter() : 플레이어들이 이더를 들고 참여할 때 호출하는 함수

```solidity
function enter() public payable{
    require(msg.value >= .01 ether,"msg.value should be greater than or equal to 0.01 ether");
    players.push(payable(msg.sender));
}
```

- 이더를 받는 함수이기에 payable 함수이다.
  - 0.01 이더 씩 들고오는 것으로 구현
- push 시 payable 타입으로 명시적 변환하여 대입한다.

### pickWinner() : 이긴 사람을 뽑고 기록하고 이더를 보내주는 함수

```solidity
// pickWinner()는 아무나 호출하면 안되기에 modifier로 onlyOwner만 호출할 수 있도록 설정하였다.
  function pickWinner() public onlyOwner{
    uint256 index = getRandomNumber() % players.length;

    lotteryHistory[lotteryId] = players[index];
    lotteryId++;

    (bool success, ) = players[index].call{value: address(this).balance}("");
    require(success, "Failed to send Ether");

    players = new address payable[](0);
  }
  modifier onlyOwner {
    require(msg.sender == owner);
    _;
  }
}
```

- uint256 index = getRandomNumber() % players.length;
  - 랜덤값을 참여한 players들의 수로 나눈 나머지 -> 참여한 players 중에 랜덤하게 뽑는다는 의미
- lotteryHistory[lotteryId] = players[index];
lotteryId++;
  - 매번 이긴자를 기록하기 위함
  - lotteryHistory[lotteryId]는 address 타입이고 저장하려는 players는 address payable 타입이다.
    - 이렇게 저장은 되지만 반대의 상황은 저장이 되지않는다.
      - address payable > address 보다 확장된 값이기 때문에 가능하다.
  - 모든 상태값을 변경하는 구문은 이더를 전송하는 구문 앞에 적어주는게 좋다.
    - 다른 컨트랙트와 인터렉션 하는 구문이 앞에 있게되면 악의적은 컨트랙트로 인해  `Re-Entrancy Attack` 을 당할 수 있다.
- (bool success, ) = players[index].call{value: address(this).balance}("");
    require(success, "Failed to send Ether");
  - 랜덤하게 뽑힌 player에게 컨트랙트의 모든 ETH를 전송한다.
    - 요즘 가장 많이 사용하는 이더 전송 구문 = 안전하다
  - 두개의 값을 리턴하나 두번째 값은 사용하지 않기에 무시해준다.
    - bool 값은 이더전송의 성공 실패 유무
- players = new address payable[](0);
  - 다음 회차를 위해 players 배열을 초기화한다. (리셋시켜주는 구문 : 해당 배열에 대해 length를 0으로 바꿔주겠다는 의미)

## 랜덤한 값을 뽑아주는 함수

- 컨트랙트 변수 및 블록 상태값을 이용한 PRNG(Pseudo Random Number Generator)는 같은 트랜잭션 내에서 값이 동일하다
  - 블록체인은 deterministic(결정론적)하기 때문이다.
  - 블록체인 특성상 같은 트랜잭션 내에서 랜덤값이 다를 수 없다.
- 공격자가 공격하려고 보낸 트랜잭션과 같은 트랜잭션에서 처리되기 때문에, 블록의 정보가 공격자와도 동일한 상태기에 난수도 같은 번호가 나오게된다.

### getRandomNumber() : 랜덤한 값을 뽑아주는 함수 1

```solidity
function getRandomNumber() public view returns (uint256){
    return uint256(keccak256(abi.encodePacked(owner, block.timestamp)));
}
```

- abi.encodePacked(owner, block.timestamp) : owner와 block.timestamp 각가을 bytes로 converting한 값을 concat한 값
- abi.encode() : converting 시 부족한 값을 0으로 모두 채워놓는다.
- abi.encodePacked() : 실제 차지하는 공간에 대해서만 채워준다.
- concat한 값을 keccak256 해시 알고리즘으로 해시한 값
- 해시한 값을 uint256으로 converting한 값
- => 랜덤한 값

### getRandomNumberV2() : 랜덤한 값을 뽑아주는 함수 2

```solidity
function getRandomNumberV2() public view returns (uint256) {
    return uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp, players)));
}
```

- block.difficulty : 블록의 난이도
- block.timestamp: 블록의 생성 시간
- players : 플레이어

→ 모두 합쳐 해시된 값을 uint256으로 바꿔준다.

### getRandomNumberV3(): 랜덤한 값을 뽑아주는 함수 3

```solidity
function getRandomNumberV3() public view returns (uint256) {
    return uint256(keccak256(abi.encodePacked(blockhash(block.number -1 ), block.timestamp)));
}
```

- blockhash(block.number -1) : 이전 블록의 블록 해시
- block.timestamp : 현재 블록의 생성 시간

→ 모두 합쳐 해시된 값을 uint256으로 바꿔준다.

## Lottery Contract 전체 코드

```solidity
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
```

## 배포 - Remix

```solidity
[vm]from: 0x5B3...eddC4to: Lottery.(constructor)value: 0 weidata: 0x608...10033logs: 0hash: 0x729...4881f
status true Transaction mined and execution succeed
transaction hash 0x729e48ee424aebec54e7fad8ed1a913d8b474352273e60573102b05f49e4881f
from 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4
to Lottery.(constructor)
gas 1065396 gas
transaction cost 926431 gas 
execution cost 926431 gas 
input 0x608...10033
decoded input {}
decoded output  - 
logs []
val 0 wei
```

## 실행(시나리오)

1. 0x5B3..가 배포한다(배포자 == Onwer)
    - getBalance : 컨트랙트에 입력된 총 잔액을 가져온다

        ```solidity
        [Output]
        0
        ```

    - getPlayers : 참여중인 참여자들의 주소를 가져온다.

        ```solidity
        [Output]
        address[]
        ```

2. 첫번째 참여자(0xAb8..)가 0.01 ETH를 내고 게임에 참여한다. (잔고 99.98ETH = 100ETH - 0.01ETH)
    - enter : 0.01 이더를 컨트랙트에 보낸다.
    - getBalance : 컨트랙트에 입력된 총 잔액을 가져온다

        ```solidity
        [Output]
        10000000000000000
        ```

    - getPlayers : 참여중인 참여자들의 주소를 가져온다.

        ```solidity
        [Output]
        address[]: 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2
        ```

3. 두번째 참여자(0x4B2..)가 0.01 ETH를 내고 게임에 참여한다. (잔고 99.98ETH = 100ETH - 0.01ETH)
    - enter : 0.01 이더를 컨트랙트에 보낸다.
    - getBalance : 컨트랙트에 입력된 총 잔액을 가져온다

        ```solidity
        [Output]
        20000000000000000
        ```

    - getPlayers : 참여중인 참여자들의 주소를 가져온다.

        ```solidity
        [Output]
        address[]: 
        0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2,
        0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db
        ```

4. 세번째 참여자(0x787..)가 0.01 ETH를 내고 게임에 참여한다. (잔고 99.98ETH = 100ETH - 0.01ETH)
    - enter : 0.01 이더를 컨트랙트에 보낸다.
    - getBalance : 컨트랙트에 입력된 총 잔액을 가져온다

        ```solidity
        [Output]
        30000000000000000
        ```

    - getPlayers : 참여중인 참여자들의 주소를 가져온다.

        ```solidity
        [Output]
        address[]: 
        0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2,
        0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db,
        0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB
        ```

5. 네번째 참여자(0x617..)가 0.01 ETH를 내고 게임에 참여한다. (잔고 99.98ETH = 100ETH - 0.01ETH)
    - enter : 0.01 이더를 컨트랙트에 보낸다.
    - getBalance : 컨트랙트에 입력된 총 잔액을 가져온다

        ```solidity
        [Output]
        40000000000000000
        ```

    - getPlayers : 참여중인 참여자들의 주소를 가져온다.

        ```solidity
        [Output]
        address[]: 
        0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2,
        0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db,
        0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB,
        0x617F2E2fD72FD9D5503197092aC168c91465E7f2
        ```

6. Owner(0x5B3..)가 승리자를 뽑아내는 함수를 호출한다.
    - pickWinner : 승리자를 선정하고 해당 승리자에게 모든 잔액인 0.04이더를 송금한다.
    - lotteryHistory : 승리자를 불러온다.

        ```solidity
        [Input]
        0
        [Output]
        address : 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2
        
        ```

    - 첫번째 참여자(0xAb…)에게 0.04이더가 들어가 있는 것을 확인할 수 있다.

    ![Untitled](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/3bb2aef6-4f03-48af-9f48-8e84a97d5ab7/Untitled.png)

# Re-entrancy Attack

## 이더 전송 구문 비교

- **transfer()**
  - 2300 gas만 사용할 수 있도록 제한되어 있기에 낮은 gas제한으로 복잡한 로직 수행이 불가능하다.
    - 그로인해 re-entrancy attack으로 부터 안전하여 이더 전송 시 권장하였음
    - re-entrancy attack은 재진입을 시도하기에 더 많은 가스를 소비하기 때문
  - transfer() 실패 시 revert
    - 구문을 호출하는 쪽에서 특별한 조치를 취해주지 않아도 되었음
  - EVM이 업데이트 되면서 더이상 2300gas로는 이더 전송이 힘들어졌다.
    - 그로인해 종종 Out of gas 에러가 나며 이더 전송이 실패하는 경우가 생겼다.
    - 이제는 더이상 권장하지 않음
  - ex.

        ```solidity
        payable(to).transfer(1 ether);
        ```

- send()
  - transfer()와 마찬가지로 2300 gas를 소모하여 이더 전송 시 권장되던 함수
    - transfer()와 같은 이유로 이제 권장하지 않는다.
  - send() 실패 시 false 리턴
    - 호출하는 컨트랙트에서 실패 처리를 잘 해줘야한다
  - ex.

        ```solidity
        bool success = payable(to).send(1 ether);
        require(success, "Failed to send ETH");
        ```

- call()
  - 컨트랙트 간 상호작용을 위해 디자인된 함수
    - 이더 전송 외에 다른 컨트랙트 함수 호출까지도 가능하다
  - 이더 전송 시 권장되는 함수
  - transfer(), send()와는 달리 gas 지정이 없으면 되는데까지 gas를 사용한다.
    - 이를 악용하면 re-entrancy attack이 가능하다
  - call() 실패 시 false 리턴
  - 이더 전송 예시

        ```solidity
        (bool success, ) = payable(to).call{value: 1 ether}("");
        require(success, "Failed to send ETH");
        ```

    - (””) : call 함수의 데이터 부분을 빈 값으로 설정한다
  - 상대 컨트랙트 호출 예시

        ```solidity
        (bool success, bytes memory data) = payable(to).call{value: value}(abi.encodeWithSignature("foo(string, uint256)", "call foo", 123));
        ```

    - (abi.encodeWithSignature("foo(string, uint256)", "call foo", 123))
      - 데이터 부분에 Function signature를 작성해준다.

## fallback() & receive()

- 이더를 전송 받는 컨트랙트는 fallback() 혹은 receive() 함수 중에 하나를 꼭 가지고 있어야 한다.
  - receive() : 컨트랙트에 이더가 전송될 때 아무런 data 없이 호출될 경우에 호출됨
  - fallback() : 다른 컨트랙트에서 호출할 때 해당 컨트랙트에 호출하고자 하는 함수가 없는 경우에 호출된다.
  - 이더를 받을 때 receive() 함수가 없을 경우에 fallback() 함수가 호출된다.

## Re-entrancy Attack

- 다른 컨트랙트와의 상호 작용 구문 실행 시, 다른 컨트랙트의 fallback(), receive()함수가 호출되며 거기서 다시 caller 컨트랙트를 호출하여, caller 컨트랙트의 그 이하 로직이 미처 실행되기 전에 다시 caller 컨트랙트가 호출되면서 caller 컨트랙트에서 예상치 못한 상태 값 변경이 이뤄지도록 하는 공격
- 악의적인 컨트랙트의 fallback() 혹은 receive() 함수에서 caller 컨트랙트를 반복적으로 호출하며 caller 컨트랙트에 있는 모든 돈을 인출해가는 공격이다.
  - 해당 돈이 인출 되었다. 라는 상태 값이 변하기 전에 재진입하여 다시 인출하는 방식으로 반복하는 행위 등
- 방지하기 위해서는 다른 컨트랙트와 상호 작용 구문 앞에 상태값 변경 로직이 와야한다.
  - Checks-Effects-Interactions 패턴
    - Checks : 확인할 부분 모두 확인
    - Effects : 변경할 상태 값을 모두 변경하고
    - Interactions : 상호 작용한다.

# Commit & Reveal 패턴

- 참여자는 commit 기간 동안 자기만 아는 secret 값을 생성 후 이를 해시하여 컨트랙트에  commit한다.
- commit 기간이 끝나면, 공개(reveal) 기간 동안 secret 값을 공개하며, 공개된 secret 값을 통해 seed 값이 계속 업데이트된다.
- 공개 기간이 끝나면 seed 값이 완성되는데 이는 안전한 랜덤값이다.

# CommitRevealLottery 컨트랙트

## 변수

```solidity
uint256 public commitCloses;
```

- commit 종료 블록 넘버

```solidity
uint256 public revealCloses;
```

- reveal 종료 블록 넘버

```solidity
uint256 public constant DURATION = 4;
```

- commit 및 reveal 진행 기간 (4 blocks)

```solidity
address public winner;
```

- 이번 회차 승리자

```solidity
bytes32 seed;
```

- 매 회차때 reveal 시 얻는 secret 값에 의해 업데이트되는 랜덤값

```solidity
mapping (address => bytes32) public commitments;
```

- 참여자가 제시한 commit 값

## 생성자

```solidity
constructor() {
    commitCloses = block.number + DURATION;
    revealCloses = commitCloses + DURATION;
}
```

- 생성자에서 첫 회차의 commit, reveal 기간을 정한다.
  - commitCloses : 이번 블록 부터 4개의 블록이 생성된 뒤에 commit을 close하기 위함
  - revealCloses : commitCloses 블록부터 4개 뒤에 생성된 값

## 함수

### enter() : 참여자가 secret 값을 생성한 후  0.01 이상의 ETH와 함께 commit 값을 등록

```solidity
// 참여자는 외부에서 secret 값을 생성한 후 해시하여 commit 값 생성 후, 0.01 이상의 ETH와 함께 commit 값을 등록
  function enter(bytes32 commitment) public payable {
    require(msg.value >= .01 ether, "msg.value should be greater than or equal to 0.01 ether");
    // commit이 종료되는 블록 넘버 이전까지 참여 가능
    require(block.number < commitCloses, "commit duration is over");
    // 각 참여자마다의 commit 값 저장
    commitments[msg.sender] = commitment;
  }
```

### createCommitment() : commit 값을 생성하여 반환한다

```solidity
function createCommitment(uint256 secret) public view returns (bytes32){
    // 함수를 콜한 주소와 입력한 secret 값을 해시한 값을 리턴한다.
    return keccak256(abi.encodePacked(msg.sender, secret));
}
```

### reveal() : commit 시 참여했던 자가 그 당시 사용한 secret 값과 해당 secret 값이 같은지 확인한다

```solidity
// commit 시 참여했던 자가 그 당시 사용한 secret 값을 공개하며 이를 이용해 랜덤값 생성
  function reveal(uint256 secret) public {
    // commit 기간 종료 후부터 reveal 기간 종료 전까지만 가능하다.
    require(block.number >= commitCloses, "commit duration is not closed yet");
    require(block.number < revealCloses, "reveal duration is already closed");
    require(!isAlreadyRevealed(), "You already revealed");
    // enter() 에서 입력한 secret 값에 대해 해시한 값이 commit시 등록한 해시값과 일치하는지 확인
    bytes32 commit = createCommitment(secret);
    require(commit == commitments[msg.sender], "commit not matches");
    // 일치한다면 이를 seed 값에 이어서 해시한다.
    seed = keccak256(abi.encodePacked(seed, secret));
    players.push(msg.sender);
  }
```

### isAlreadyRevealed() : 이미 참여중인 플레이어인지 확인한다

```solidity
function isAlreadyRevealed() public view returns (bool){
    for (uint256 i=0;i < players.length; i++){
      if (msg.sender == players[i]){
        return true;
      }
    }
    return false;
}
```

### pickWinner() : winner를 선정한다

```solidity
// reveal 단계에서 결정된 랜덤값인 seed를 통해 참여한 players 중 winner 선정
  // 충분한 참여 기간이 지난 후에 호출이 가능하므로 onlyOwner일 필요가 없다.
function pickWinner() public {
    require(block.number >= revealCloses, "Not yet to pick winner");
    // winner가 세팅되기 전인지 미리 확인한다.
    require(winner == address(0), "winner is already set");

    // 랜덤한 값 % 참여한 플레이어의 수 = winner 선정 완료
    winner = players[uint256(seed) % players.length];

    // winner 기록
    lotteryHistory[lotteryId] = winner;
    lotteryId++;
}
```

### withdrawPrize() : winner인 사용자가 해당 함수를 호출하면 컨트랙트에 쌓인 모든 ETH를 획득한다

```solidity
// 함수 호출자가 winner일 경우 컨트랙트에 쌓인 모든 ETH를 획득한다.
  function withdrawPrize() public {
    require(msg.sender == winner, "You're not the winner");

    // 다음 회차를 위해 관련 데이터 초기화 및 commit, reveal 기간 재설정
    delete winner;

    for (uint256 i =0;i< players.length; i++){
      // 각각의 사용자들이 커밋했던 값들을 모두 지워준다.
      delete commitments[players[i]];
    }
    delete players;
    delete seed;

    // re-entrancy attack 방지를 위해 call() 호출 전에 상태값 변경
    commitCloses = block.number + DURATION;
    revealCloses = commitCloses + DURATION;
    //msg.sender는 이더를 받아야하기 때문에 payable()로 치환한다.
    (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
    require(success, "Failed to send Ether to winner");
  }
```

## CommitRevealLottery  전체 코드

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

contract CommitRevealLottery{
  uint256 public commitCloses;
  uint256 public revealCloses;
  uint256 public constant DURATION =4;

  uint256 public lotteryId;
  address[] public players;
  address public winner;
  bytes32 seed;
  mapping (address =>bytes32) public commitments;
  mapping (uint256 => address) public lotteryHistory;

  constructor() {
    commitCloses = block.number + DURATION;
    revealCloses = commitCloses + DURATION;
  }
  
  // 참여자는 외부에서 secret 값을 해시하여 commit 값 생성 후, 0.01 이상의 ETH와 함께 commit 값을 등록
  function enter(bytes32 commitment) public payable {
    require(msg.value >= .01 ether, "msg.value should be greater than or equal to 0.01 ether");
    // commit이 종료되는 블록 넘버 이전까지 참여 가능
    require(block.number < commitCloses, "commit duration is over");
    // 각 참여자마다의 commit 값 저장
    commitments[msg.sender] = commitment;
  }

  // 이 컨트랙트에서의 commit 값 생성 
  function createCommitment(uint256 secret) public view returns (bytes32){
    // 함수를 콜한 주소와 입력한 secret 값을 해시한 값을 리턴한다.
    return keccak256(abi.encodePacked(msg.sender, secret));
  }

// commit 시 참여했던 자가 그 당시 사용한 secret 값을 공개하며 이를 이용해 랜덤값 생성
  function reveal(uint256 secret) public {
    // commit 기간 종료 후부터 reveal 기간 종료 전까지만 가능하다.
    require(block.number >= commitCloses, "commit duration is not closed yet");
    require(block.number < revealCloses, "reveal duration is already closed");
    require(!isAlreadyRevealed(), "You already revealed");
    // enter() 에서 입력한 secret 값에 대해 해시한 값이 commit시 등록한 해시값과 일치하는지 확인
    bytes32 commit = createCommitment(secret);
    require(commit == commitments[msg.sender], "commit not matches");
    // 일치한다면 이를 seed 값에 이어서 해시한다.
    seed = keccak256(abi.encodePacked(seed, secret));
    players.push(msg.sender);
  }

 function isAlreadyRevealed() public view returns (bool){
    for (uint256 i=0;i < players.length; i++){
      if (msg.sender == players[i]){
        return true;
      }
    }
    return false;
  }

  // reveal 단계에서 결정된 랜덤값인 seed를 통해 참여한 players 중 winner 선정
  // 충분한 참여 기간이 지난 후에 호출이 가능하므로 onlyOwner일 필요가 없다.
  function pickWinner() public {
    require(block.number >= revealCloses, "Not yet to pick winner");
    // winner가 세팅되기 전인지 미리 확인한다.
    require(winner == address(0), "winner is already set");

    // 랜덤한 값 % 참여한 플레이어의 수 = winner 선정 완료
    winner = players[uint256(seed) % players.length];

    // winner 기록
    lotteryHistory[lotteryId] = winner;
    lotteryId++;
  }

  // 함수 호출자가 winner일 경우 컨트랙트에 쌓인 모든 ETH를 획득한다.
  function withdrawPrize() public {
    require(msg.sender == winner, "You're not the winner");

    // 다음 회차를 위해 관련 데이터 초기화 및 commit, reveal 기간 재설정
    delete winner;

    for (uint256 i =0;i< players.length; i++){
      // 각각의 사용자들이 커밋했던 값들을 모두 지워준다.
      delete commitments[players[i]];
    }
    delete players;
    delete seed;

    // re-entrancy attack 방지를 위해 call() 호출 전에 상태값 변경
    commitCloses = block.number + DURATION;
    revealCloses = commitCloses + DURATION;
    //msg.sender는 이더를 받아야하기 때문에 payable()로 치환한다.
    (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
    require(success, "Failed to send Ether to winner");
  }

}
```

## 배포(Remix)

```solidity
[vm]from: 0x5B3...eddC4to: CommitRevealLottery.(constructor)value: 0 weidata: 0x608...10033logs: 0hash: 0x84a...2a00f
status true Transaction mined and execution succeed
transaction hash 0x84a186685d8e34522d0c28b347cf890609653d961f29842fb95076d53c52a00f
from 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4
to CommitRevealLottery.(constructor)
gas 1361561 gas
transaction cost 1183966 gas 
execution cost 1183966 gas 
input 0x608...10033
decoded input {}
decoded output  - 
logs []
val 0 wei
```

## 실행

### 초기값 확인

- commitClosers : 4
  - 컨트랙트가 배포되던 0번 블록 + DURATION(4개 블룩) = 4
  - 3번 블록까지 commit한 기간(배포 후 이므로 현재 1번 블록)
- DURATION : 4
- lotteryId : 0
- revealCloses : 8
- Winner : 0x0000000000000000000000000000000000000000

### 시나리오 진행

1. Owner(0x5B3..)이 컨트랙트를 배포한다.
2. 첫번째 참가자(0xAb8…)가 createCommitment함수에 자신만의 시크릿 값을 넣고 랜덤한 값을 발급받는다.

    ```solidity
    [Input]
    secret : 12345
    [Output]
    0xfc8a9c938ba50da41c81b2a941a31d837de63f174078ec4fbeaa96793309a1e9
    ```

    1. 첫번째 참가자가 게임 참가를 위해 랜덤한 값과 0.01 이더를 enter 함수에 넣는다.

        ```solidity
        [Input]
        0xfc8a9c938ba50da41c81b2a941a31d837de63f174078ec4fbeaa96793309a1e9
        ```

    - getBalance : 컨트랙트에 입력된 총 잔액을 가져온다

        ```solidity
        [Output]
        10000000000000000
        ```

    - reveal함수를 사용하여 하여 플레이어를 등록한다.

        ```solidity
        [Input]
        secret : 12345
        ```

    - players에 등록이 된 것을 확인할 수 있다.

        ```solidity
        [Input]
        0
        [Output]
        0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2
        ```

    - Seed 값도 변한것을 알 수 있다.

        ```solidity
        [Input]
        0xa29ed35d868e5623be6a4a4d27aa2f9bb1d1dcc4dbcacf8818629050980a35d9
        ```

3. 두번째 참가자(0x4B2…)가 createCommitment함수에 자신만의 시크릿 값을 넣고 랜덤한 값을 발급받는다.

    ```solidity
    [Input]
    secret : 12346
    [Output]
    0x63c2e622aa612614d01119aa186104624ab8110e28fe5e1c794ad9710292a3ae
    ```

    1. 두번째 참가자가 게임 참가를 위해 랜덤한 값과 0.01 이더를 enter 함수에 넣는다.

        ```solidity
        [Input]
        0x63c2e622aa612614d01119aa186104624ab8110e28fe5e1c794ad9710292a3ae
        ```

    - getBalance : 컨트랙트에 입력된 총 잔액을 가져온다

        ```solidity
        [Output]
        20000000000000000
        ```

    - reveal함수를 사용하여 하여 플레이어를 등록한다.

        ```solidity
        [Input]
        secret : 12346
        ```

    - players에 등록이 된 것을 확인할 수 있다.

        ```solidity
        [Input]
        0
        [Output]
        0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db
        ```

    - Seed 값도 변한것을 알 수 있다.

        ```solidity
        [Input]
        0xb3fd9c957e204c197772c08ee1da810b743da485cf98599c5b2d43a59912917b
        ```

4. 세번째 참가자(0x787…)가 createCommitment함수에 자신만의 시크릿 값을 넣고 랜덤한 값을 발급받는다.

    ```solidity
    [Input]
    secret : 12347
    [Output]
    0xa71cdc84e102623c30a61ef122d25b1830bbdac6a3368fb8df711266062873e1
    ```

    1. 세번째 참가자가 게임 참가를 위해 랜덤한 값과 0.01 이더를 enter 함수에 넣는다.

        ```solidity
        [Input]
        0xa71cdc84e102623c30a61ef122d25b1830bbdac6a3368fb8df711266062873e1
        ```

    - getBalance : 컨트랙트에 입력된 총 잔액을 가져온다

        ```solidity
        [Output]
        30000000000000000
        ```

    - reveal함수를 사용하여 하여 플레이어를 등록한다.

        ```solidity
        [Input]
        secret : 12347
        ```

    - players에 등록이 된 것을 확인할 수 있다.

        ```solidity
        [Input]
        2
        [Output]
        0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB
        ```

    - Seed 값도 변한것을 알 수 있다.

        ```solidity
        [Input]
        0x6c770330d3c0e12a6441195e5800cd814239a3169d526c0d20d24c44a8429d10
        ```

### Winner 구하기

    - 임의 사용자로 pickWinner()를 호출한다.
    - winner 값 확인

        ```solidity
        [Output]
        0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db
        ```

    - lotteryId 값 확인

        ```solidity
        [Output]
        1
        ```

    - lotteryHistory 값 확인

        ```solidity
        [Intput] 
        0
        [Output]
        0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db
        ```

    - 상금을 가져갈 수 있는 Address는 winner인 0x4B… 주소이다.
        - 0x4B.. 주소로 withdrawPrize() 함수를 호출하여 상금을 가져간다.
        - 다음 회차를 위해 동시에 모든 값이 초기화된다.
            - 우승자를 저장하고 있는 변수와 참여자들 등
