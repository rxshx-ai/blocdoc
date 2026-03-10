const hre = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("Set CONTRACT_ADDRESS env var");
  }

  const [admin, provider, telemetry] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("HealthcareLogistics", contractAddress);

  const providerRole = await contract.PROVIDER_ROLE();
  const telemetryRole = await contract.TELEMETRY_ROLE();

  const tx1 = await contract.connect(admin).grantRole(providerRole, provider.address);
  await tx1.wait();

  const tx2 = await contract.connect(admin).grantRole(telemetryRole, telemetry.address);
  await tx2.wait();

  console.log("Granted PROVIDER_ROLE to:", provider.address);
  console.log("Granted TELEMETRY_ROLE to:", telemetry.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
