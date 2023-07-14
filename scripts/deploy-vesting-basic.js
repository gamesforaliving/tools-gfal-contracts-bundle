// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat")
const {ethers} = require("hardhat");

// Constants
const VESTER_ROLE = "0x64ed6499e2f5a7ea55dfd56da361bf9d48064843bb3891c36f1dabd9ba246135"
const UNLOCK_TIME = 1678705200
const VESTING_SCHEDULE = {
  when: [
    1678705200, // 13 March 2023, 11:00:00 UTC/GMT
    1681383600, // 13 April 2023, 11:00:00 UTC/GMT
    1683975600, // 13 May 2023, 11:00:00 UTC/GMT
    1686654000, // 13 June 2023, 11:00:00 UTC/GMT
    1689246000, // 13 July 2023, 11:00:00 UTC/GMT
    1691924400, // 13 August 2023, 11:00:00 UTC/GMT
    1694602800, // 13 September 2023, 11:00:00 UTC/GMT
    1697194800, // 13 October 2023, 11:00:00 UTC/GMT
    1699873200, // 13 November 2023, 11:00:00 UTC/GMT
    1702465200, // 13 December 2023, 11:00:00 UTC/GMT
    1705143600, // 13 January 2024, 11:00:00 UTC/GMT
    1707822000, // 13 February 2024, 11:00:00 UTC/GMT
  ],
  amount: [
    ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
    ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
    ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
    ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
    ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
    ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
    ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
    ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
    ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
    ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
    ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
    ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
  ]
}

const GFAL_TOKEN = process.env.GFAL_TOKEN

async function main() {
  const vester = new ethers.Wallet(process.env.VESTER_PRIVATE_KEY)

  const VestingBasic = await hre.ethers.getContractFactory("VestingBasic")
  const vestingBasic = await VestingBasic.deploy(GFAL_TOKEN, vester.address, UNLOCK_TIME)

  await vestingBasic.deployed()

  // Executing functions

  let totalVestingAmount = ethers.utils.parseEther(String(0))
  for (let i = 0; i < VESTING_SCHEDULE.amount.length; i++) {
    totalVestingAmount = totalVestingAmount.add(VESTING_SCHEDULE.amount[i])
  }

  await vestingBasic.grantRole(VESTER_ROLE, vester.address)
  await vestingBasic.setVestingSchedule(VESTING_SCHEDULE.when, VESTING_SCHEDULE.amount)

  console.log(
    `VestingBasic deployed to ${vestingBasic.address}`
  )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
