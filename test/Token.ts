import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Token Test", function () {
  async function deployTokenFixture() {
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const Token = await hre.ethers.getContractFactory("MyTokenTask");
    const token = await Token.deploy(owner.address);
    await token.waitForDeployment();

    return { token, owner, otherAccount };
  }

  describe("Deployment", () => {
    it("Should deploy with the correct token name and symbol", async function () {
      const { token } = await loadFixture(deployTokenFixture);

      expect(await token.name()).to.equal("MyTask");
      expect(await token.symbol()).to.equal("MTK");
    });

    it("Should set the right owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      expect(await token.owner()).to.equal(owner.address);
    });
  });

  describe("Balance Test", function() {
    it("should check the balance of an account", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);

      const balance = await token.balanceOf(owner.address);
      expect(balance).to.equal(0n); // Initial balance should be 0
    });
  });

  describe("Mint & Burn Implementation", function() {
    it("should mint tokens", async function () {
      const { token, owner, otherAccount } = await loadFixture(deployTokenFixture);
      
      const mintAmount = 10000n;  
      await token.connect(owner).mint(otherAccount.address, mintAmount);

      const newBalance = await token.balanceOf(otherAccount.address);
      expect(newBalance).to.equal(mintAmount); 
    });

    it("should not allow non-owner to mint tokens", async function () {
      const { token, otherAccount } = await loadFixture(deployTokenFixture);
      
      const mintAmount = 10000n;  
      await expect(
        token.connect(otherAccount).mint(otherAccount.address, mintAmount)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });

    it("should burn tokens", async function () {
      const { token, owner, otherAccount } = await loadFixture(deployTokenFixture);
      
      // First mint some tokens to burn
      const mintAmount = 1000n;
      await token.connect(owner).mint(otherAccount.address, mintAmount);
      
      // Now burn some tokens
      const burnAmount = 500n;
      await token.connect(otherAccount).burn(burnAmount);

      // Check the new balance
      const newBalance = await token.balanceOf(otherAccount.address);
      expect(newBalance).to.equal(mintAmount - burnAmount);
    });
  });

  describe("Ownership Transfer Test", function () {
    it("Should transfer ownership correctly", async function () {
        const { token, owner, otherAccount } = await loadFixture(deployTokenFixture);
        
        await token.connect(owner).transferOwnership(otherAccount.address);
        expect(await token.owner()).to.equal(otherAccount.address);
        
        // Try to mint with old owner - should fail
        const mintAmount = 1000n;
        await expect(
          token.connect(owner).mint(owner.address, mintAmount)
        ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });

    it("Should not allow non-owner to transfer ownership", async function () {
        const { token, otherAccount } = await loadFixture(deployTokenFixture);
        
        await expect(
            token.connect(otherAccount).transferOwnership(otherAccount.address)
        ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
  });
});