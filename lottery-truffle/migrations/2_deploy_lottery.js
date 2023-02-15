// contract 이름
const Lottery = artifacts.require('Lottery');

module.exports = (deployer) => {
  deployer.deploy(Lottery);
};
