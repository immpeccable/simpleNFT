const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

const FUND_AMOUNT = ethers.utils.parseUnits("10", 18);
const MINT_FEE = ethers.utils.parseEther("0.01");

module.exports = async function () {
  const deployer = (await getNamedAccounts()).deployer;
  const { deploy, log } = deployments;
  let vrfCoordinatorMock, vrfCoordinatorMockAddress, subscriptionId;
  const catUris = [];
  const chainId = network.config.chainId;

  if (developmentChains.includes(network.name)) {
    vrfCoordinatorMock = await ethers.getContract("VRFCoordinatorV2Mock");
    vrfCoordinatorMockAddress = vrfCoordinatorMock.address;
    const tx = await vrfCoordinatorMock.createSubscription();
    const txReceipt = await tx.wait(1);
    subscriptionId = txReceipt.events[0].args.subId;
    await vrfCoordinatorMock.fundSubscription(subscriptionId, FUND_AMOUNT);
  } else {
    vrfCoordinatorMockAddress = networkConfig[chainId].vrfCoordinatorV2;
    subscriptionId = networkConfig[chainId].subscriptionId;
  }

  const gasLane = networkConfig[chainId].gasLane;
  const callbackGasLimit = networkConfig[chainId].callbackGasLimit;
  const args = [
    "CuteCat",
    "CCT",
    gasLane,
    vrfCoordinatorMockAddress,
    subscriptionId,
    catUris,
    callbackGasLimit,
    MINT_FEE,
  ];

  const simpleNft = await deploy("SimpleNft", {
    from: deployer,
      args: args,
      waitConfirmations: network.config.blockConfirmations || 1
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(simpleNft.address, args);
  } else {
    await vrfCoordinatorMock.addConsumer(
      subscriptionId.toString(),
      simpleNft.address
    );
  }
};

module.exports.tags = ["all", "simple-nft", "main"];
