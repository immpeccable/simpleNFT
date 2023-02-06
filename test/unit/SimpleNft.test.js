const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");
const { ethers, network, deployments } = require("hardhat");
const { assert, expect } = require("chai");
const MINT_FEE = ethers.utils.parseEther("0.01");

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
          const gaslane = await simpleNft.getGaslane();
          const callbackGasLimit = await simpleNft.getCallbackGasLimit();
          assert.equal("0", tokenCounter.toString());
          assert.equal(subId.toString(), "1");
          assert.equal(gaslane.toString(), networkConfig[chainId].gasLane);
          assert.equal(
            callbackGasLimit.toString(),
            networkConfig[chainId].callbackGasLimit
          );
        });
      });
      describe("requestNft", function () {
        it("should revert when not enough eth is send", async function () {
          await expect(simpleNft.requestNft()).to.be.revertedWith(
            "SimpleNft__NotEnoughEth(0)"
          );
        });
        it("should emit nft requested event and update token counter ", async function () {
          expect(await simpleNft.requestNft({ value: MINT_FEE })).to.emit(
            "NftRequested"
          );
          const tokenCounter = await simpleNft.getTokenCounter();
          assert.equal(tokenCounter.toString(), "1");
        });
        it("should update s_requests mapping accordingly", async function () {
          const tx = await simpleNft.requestNft({ value: MINT_FEE });
          const txReceipt = await tx.wait(1);
          const requestId = txReceipt.events[1].args.requestId;
          const requester = await simpleNft.getRequester(requestId);
          assert.equal(requester, txReceipt.events[1].args.requester);
        });
      });

      describe("fulfill random words", function () {
        it("cat uri", async function () {
          const cat = await simpleNft.getCatUri(0);
          console.log(cat);
        });
      });
    });
