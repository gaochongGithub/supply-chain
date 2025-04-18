import { ethers, network, run, upgrades } from "hardhat";

export async function verify(
  contractAddress: string | undefined,
  args: string[]
) {
  try {
    /**About "verify:verify":
     *  The first verify is a name in the type of string
     *  The second verify is the task of verify */
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e) {
    console.log(e);
  }
}

export async function deployContract(
  name: string,
  ...args: any
): Promise<string> {
  const factory = await ethers.getContractFactory(name);
  const contract = await factory.deploy(...args);

  console.log(`${name} deploy to ${contract.address}......`);
  console.log("Pending......");
  await contract.deployed();
  console.log(`${name} Deployed`);
  return contract.address;
}

export async function deployUpgradeableContract(
  name: string,
  ...args: any
): Promise<string> {
  const contract = await ethers.getContractFactory(name);
  const instance = await upgrades.deployProxy(contract, [...args]);

  await instance.deployed();
  console.log(`deploy ${name} to ${instance.address}`);
  return instance.address;
}

export async function upgradeContract(name: string, proxyContract: string) {
  const contract = await ethers.getContractFactory(name);
  const instance = await upgrades.upgradeProxy(proxyContract, contract);
  console.log("Contract upgraded");
}
