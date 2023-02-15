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
    // enter() 에서 입력한 secret 값에 대해 해시한 값이 commit시 등록한 해시값과 일치하는지 확인
    bytes32 commit = createCommitment(secret);
    require(commit == commitments[msg.sender], "commit not matches");
    // 일치한다면 이를 seed 값에 이어서 해시한다.
    seed = keccak256(abi.encodePacked(seed, secret));
    players.push(msg.sender);
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