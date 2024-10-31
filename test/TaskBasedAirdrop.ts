import { seconds } from "@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time/duration";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("TaskBasedAirdrop Test", function () {
  async function TaskBasedAirdropFixture() {
    const [admin, signer1, signer2] = await hre.ethers.getSigners();

    const RQToken = await hre.ethers.getContractFactory("Roqisiq");
    const rqToken = await RQToken.deploy(admin);

    const TaskBasedAirdrop = await hre.ethers.getContractFactory(
      "TaskBasedAirdrop"
    );
    const taskBasedAirdrop = await TaskBasedAirdrop.deploy(
      rqToken.getAddress()
    );

    return {
      rqToken,
      taskBasedAirdrop,
      admin,
      signer1,
      signer2,
    };
  }

  describe("Deployment", () => {
    it("It should check if is deployed", async () => {
      const { taskBasedAirdrop, admin } = await loadFixture(
        TaskBasedAirdropFixture
      );

      expect(await taskBasedAirdrop.admin()).to.equal(admin);
    });

    it("It should deployed by passing Token contract address as constructor param", async () => {
      const { taskBasedAirdrop, rqToken } = await loadFixture(
        TaskBasedAirdropFixture
      );
      expect(await taskBasedAirdrop.RQContract()).to.equal(
        await rqToken.getAddress()
      );
    });
  });

  describe("Tasks Related And Points Redeeming Logics", function () {
    it("It should allow only the admin to add task", async () => {
      const { taskBasedAirdrop, admin } = await loadFixture(
        TaskBasedAirdropFixture
      );

      await taskBasedAirdrop
        .connect(admin)
        .addTask("Follow us on Twitter", 20, seconds(60));

      const task = await taskBasedAirdrop.getTask(0);

      await taskBasedAirdrop.getAllTasks();

      expect(task.description).to.be.equal("Follow us on Twitter");
      expect(task.points).to.be.equal(20);
      //   expect(task.expiredAt).to.be.equal(60);
    });

    it("It should revert if admin is not the one creating the task and if duration is too short", async () => {
      const { taskBasedAirdrop, signer1 } = await loadFixture(
        TaskBasedAirdropFixture
      );

      await expect(
        taskBasedAirdrop
          .connect(signer1)
          .addTask("Follow us on Twitter", 20, 60)
      ).to.be.revertedWith("Unauthorized");
    });

    it("Any connectected account should be able to complete task", async () => {
      const { taskBasedAirdrop, admin, signer1, signer2 } = await loadFixture(
        TaskBasedAirdropFixture
      );

      await taskBasedAirdrop
        .connect(admin)
        .addTask("Follow us on Twitter", 20, 60);

      expect(await taskBasedAirdrop.connect(signer1).completeTask(0))
        .to.emit(taskBasedAirdrop, "TaskCompleted")
        .withArgs(20, 1);
    });

    it("Should redeem points for airdrop", async () => {
      const { rqToken, taskBasedAirdrop, admin, signer1 } = await loadFixture(
        TaskBasedAirdropFixture
      );

      let initialTokenBalance = await rqToken.balanceOf(signer1.address);

      rqToken.mint(taskBasedAirdrop, hre.ethers.parseUnits("20000000000", 18));

      await taskBasedAirdrop
        .connect(admin)
        .addTask("Follow us on Twitter", 50, 60);
      expect(await taskBasedAirdrop.connect(signer1).completeTask(0))
        .to.emit(taskBasedAirdrop, "TaskCompleted")
        .withArgs(50, 1);

      const claimableReward = hre.ethers.parseUnits("20000", 18);

      initialTokenBalance += claimableReward;

      await expect(taskBasedAirdrop.connect(signer1).redeemPointToClaimReward())
        .to.emit(taskBasedAirdrop, "PointsRedeemed")
        .withArgs(signer1.address, claimableReward);
    });
  });

  describe("Getters Function", function () {
    it("It should trigger all the getter functions", async () => {
      const { taskBasedAirdrop, admin, signer1 } = await loadFixture(
        TaskBasedAirdropFixture
      );

      await taskBasedAirdrop
        .connect(admin)
        .addTask("Follow us on Twitter", 20, seconds(60));

      // get user details
      await taskBasedAirdrop.connect(signer1).getUserDetails();

      //contract RQ token balance
      await taskBasedAirdrop.getContractRQTokenBalance();

      // All tasks
      await taskBasedAirdrop.getAllTasks();

      // A task
      await taskBasedAirdrop.getTask(0);
    });
  });
});
