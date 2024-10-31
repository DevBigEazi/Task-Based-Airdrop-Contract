import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const rqTokenAddress = "0x7E4Ed970F2b07d725496b4d32be28666C6fb0c2f";

const TaskBasedAirdropModule = buildModule("taskBasedAirdropModule", (m) => {
  const taskBasedAirdrop = m.contract("TaskBasedAirdrop", [rqTokenAddress]);

  return { taskBasedAirdrop };
});

export default TaskBasedAirdropModule;
