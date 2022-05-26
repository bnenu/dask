// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, artifacts } from "hardhat";
import fs from "fs";
import { Dask, Dask__factory } from "../typechain";

type Contract = Dask;

const contractName = "Dask";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const [owner] = await ethers.getSigners();
  const Factory: Dask__factory = await ethers.getContractFactory(contractName);
  const contract = await Factory.deploy(1, 100);

  saveFrontendFiles(contract, contractName);
  saveConfig(contract, contractName);

  console.log(`${contractName} deployed to: `, contract.address);
  console.log("Owner address: ", owner.address);
}

function saveFrontendFiles(contract: Contract, contractName: string) {
  // const fs = require("fs");
  const contractsDir = __dirname + "/../frontend/contracts";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + "/contract-address.json",
    JSON.stringify({ [contractName]: contract.address }, undefined, 2)
  );

  const Artifact = artifacts.readArtifactSync(contractName);

  fs.writeFileSync(
    contractsDir + `/${contractName}.json`,
    JSON.stringify(Artifact, null, 2)
  );
}

function saveConfig(contract: Contract, contractName: string) {
  fs.writeFileSync(
    "./config.json",
    JSON.stringify({ [contractName]: contract.address }, undefined, 2)
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
