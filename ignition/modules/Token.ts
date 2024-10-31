import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const initialOwner = "0xa748409456180ccb70FA34e8ee276297B9A2a1cC";
const TokenModule = buildModule("tokenModule", (m) => {
  const token = m.contract("RQToken", [initialOwner]);

  return { token };
});

export default TokenModule;
