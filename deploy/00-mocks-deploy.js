const { ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config.js");

const BASE_FEE = ethers.utils.parseEther("0.25");
const GAS_PRICE_LINK = 1e9; // This is the premium. It costs 0.25 LINK for every request.

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const args = [BASE_FEE, GAS_PRICE_LINK];
  const chainId = network.config.chainId;

  if (developmentChains.includes(network.name)) {
    log("Local network is detected: Deploying mocks...");
    await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      log: true,
      args: args,
    });
    log("Mocks deployed!");
    log("----------------------------------------------------------------");
  }
};

module.exports.tags = ["all", "mocks", "main"];
