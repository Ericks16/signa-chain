import { ethers, upgrades } from 'hardhat';

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  console.warn(`Deploying with account: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.warn(`Balance: ${ethers.formatEther(balance)} MATIC`);

  const CredentialAnchor = await ethers.getContractFactory('CredentialAnchor');

  const proxy = await upgrades.deployProxy(
    CredentialAnchor,
    [deployer.address],
    { kind: 'uups', initializer: 'initialize' },
  );

  await proxy.waitForDeployment();
  const address = await proxy.getAddress();

  console.warn(`CredentialAnchor proxy deployed at: ${address}`);
  console.warn(`Run: npx hardhat verify --network amoy ${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
