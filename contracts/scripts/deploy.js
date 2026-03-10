const hre = require("hardhat");

async function main() {
  const HealthcareLogistics = await hre.ethers.getContractFactory("HealthcareLogistics");
  const contract = await HealthcareLogistics.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("HealthcareLogistics deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
