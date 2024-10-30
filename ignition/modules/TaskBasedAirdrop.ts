import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TaskBasedAirdropModule = buildModule("taskBasedAirdropModule", (m) => {
  const taskBasedAirdrop = m.contract("taskBasedAirdrop");

  return { taskBasedAirdrop };
});

export default TaskBasedAirdropModule;
