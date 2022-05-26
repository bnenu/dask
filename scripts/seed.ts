import { ethers, artifacts, network } from "hardhat";
import fs from "fs";
import contractAddress from "../config.json";

const contractName = "Dask";

async function main() {
  const [owner, member1, member2, member3, member4] = await ethers.getSigners();

  const contract = await ethers.getContractAt(
    contractName,
    contractAddress[contractName]
  );

  const increaseTime = async (seconds: number) => {
    await network.provider.send("evm_increaseTime", [seconds]);
    await network.provider.send("evm_mine");
  };

  for (let i = 5; i > 0; i--) {
    const opts = { value: ethers.utils.parseEther("0.1") };
    await contract
      .connect(owner)
      .createTask(`Task ${i}`, `hash ${i}`, opts);
    increaseTime(1)
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
