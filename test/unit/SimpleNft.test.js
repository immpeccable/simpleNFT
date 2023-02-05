const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");
const { ethers, network, deployments } = require("hardhat");
const { assert, expect } = require("chai");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Tests for simple nft", function () {
      let deployer,
        vrfCoordinatorMock,
        simpleNft,
        chainId = network.config.chainId;
      beforeEach(async function () {
        let accounts = await ethers.getSigners();
        deployer = accounts[0];
        await deployments.fixture(["all"]);
        vrfCoordinatorMock = await ethers.getContract(
          "VRFCoordinatorV2Mock",
          deployer
        );
        simpleNft = await ethers.getContract("SimpleNft", deployer);
      });

      describe("constructor", function () {
        it("should initialize successfully", async function () {
          const tokenCounter = await simpleNft.getTokenCounter();
          const subId = await simpleNft.getSubscriptionId();
          assert.equal("0", tokenCounter.toString());
          assert.equal(subId.toString(), "1");
        });
      });
      describe("requestNft", function () {
        it("should emit nft requested event", async function () {
          expect(await simpleNft.requestNft()).to.emit("NftRequested");
        });
        it("should update s_requests mapping accordingly", async function () {
          const tx = await simpleNft.requestNft();
          const txReceipt = await tx.wait(1);
          const requestId = txReceipt.events[1].args.requestId;
          const requester = await simpleNft.getRequester(requestId);
          assert.equal(requester, txReceipt.events[1].args.requester);
        });
      });
    });
